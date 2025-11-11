import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

export async function uploadPDFToDrive(
  pdfBuffer: Buffer,
  filename: string
): Promise<{ fileId: string; webViewLink: string }> {
  try {
    console.log('📤 Uploading PDF to Google Drive:', filename);

    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    const stream = Readable.from(pdfBuffer);

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

    const fileId = response.data.id!;
    const webViewLink = response.data.webViewLink!;

    console.log('✅ PDF uploaded successfully!');
    console.log('   File ID:', fileId);

    return { fileId, webViewLink };
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.code === 403 && error.message.includes('Service Accounts do not have storage quota')) {
      throw new Error(
        'Folder is not shared with service account. ' +
        'Visit http://localhost:3000/api/check-sharing for instructions.'
      );
    }
    
    throw new Error(`Failed to upload: ${error.message}`);
  }
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ 
      fileId,
      supportsAllDrives: true,
    });
    console.log('✅ File deleted');
  } catch (error: any) {
    console.error('❌ Delete failed:', error.message);
    throw error;
  }
}

