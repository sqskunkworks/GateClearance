import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Boss email who should see the files
const BOSS_EMAIL = 'boss@sqskunkworks.com'; // ← UPDATE THIS!

function getDriveClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set');
  }
  
  if (!process.env.GOOGLE_PRIVATE_KEY_BASE64) {
    throw new Error('GOOGLE_PRIVATE_KEY_BASE64 is not set');
  }

  let privateKey: string;
  
  try {
    privateKey = Buffer.from(
      process.env.GOOGLE_PRIVATE_KEY_BASE64,
      'base64'
    ).toString('utf-8');
  } catch (error) {
    throw new Error('Failed to decode GOOGLE_PRIVATE_KEY_BASE64');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
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
  try {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    const stream = Readable.from(pdfBuffer);

    // Upload file
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

    // Share with boss
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          type: 'user',
          role: 'reader', // Boss can view/download but not edit
          emailAddress: BOSS_EMAIL,
        },
        supportsAllDrives: true,
      });
      console.log(`✓ File shared with ${BOSS_EMAIL}`);
    } catch (shareError) {
      console.warn('Failed to share file with boss:', shareError);
      // Don't fail upload if sharing fails
    }

    return { fileId, webViewLink };
  } catch (error: unknown) {
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
    throw new Error(`Failed to upload: ${message}`);
  }
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ 
      fileId,
      supportsAllDrives: true,
    });
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error('Failed to delete file from Drive');
  }
}