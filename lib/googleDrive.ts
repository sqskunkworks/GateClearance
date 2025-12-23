import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getDriveClient() {
  const privateKey = Buffer.from(
    process.env.GOOGLE_PRIVATE_KEY_BASE64!,
    'base64'
  ).toString('utf-8');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

export async function uploadPDFToDrive(
  pdfBuffer: Buffer,
  filename: string
): Promise<{ fileId: string; webViewLink: string }> {
  console.log('=== UPLOAD TO DRIVE START ===');
  console.log('🔍 Input parameters:', {
    pdfBufferExists: !!pdfBuffer,
    pdfBufferType: typeof pdfBuffer,
    pdfBufferIsBuffer: Buffer.isBuffer(pdfBuffer),
    pdfBufferLength: pdfBuffer?.length,
    filenameExists: !!filename,
    filename: filename,
  });
  
  try {
    console.log('🔑 Checking environment variables...');
    console.log('Environment check:', {
      hasServiceEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKeyBase64: !!process.env.GOOGLE_PRIVATE_KEY_BASE64,
      hasFolderId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      serviceEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKeyBase64Length: process.env.GOOGLE_PRIVATE_KEY_BASE64?.length,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    });

    console.log('🔧 Creating Drive client...');
    const drive = getDriveClient();
    console.log('✅ Drive client created');
    
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    
    console.log('🌊 Creating stream from buffer...');
    console.log('Buffer before stream:', {
      exists: !!pdfBuffer,
      type: typeof pdfBuffer,
      length: pdfBuffer?.length,
    });
    
    const stream = Readable.from(pdfBuffer);
    console.log('✅ Stream created');

    console.log('☁️ Calling Drive API...');
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: stream,
      },
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });

    console.log('✅ Drive API response received');
    const fileId = response.data.id!;
    const webViewLink = response.data.webViewLink!;
    console.log('📁 File uploaded:', { fileId, webViewLink });

    console.log('=== UPLOAD TO DRIVE COMPLETE ===');
    return { fileId, webViewLink };
    
  } catch (error: unknown) {
    console.error('❌ Upload to Drive failed');
    console.error('Error details:', error);
    
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 403 &&
      'message' in error &&
      typeof (error as { message?: string }).message === 'string' &&
      (error as { message?: string }).message?.includes('Service Accounts do not have storage quota')
    ) {
      throw new Error(
        'Folder is not shared with service account. ' +
        'Visit http://localhost:3000/api/check-sharing for instructions.'
      );
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Throwing error:', message);
    throw new Error(`Failed to upload: ${message}`);
  }
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ 
      fileId,
      supportsAllDrives: true,
    })

  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error('Failed to delete file from Drive');
  }
}
