
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceEmail,
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Test 1: Try to access the folder
    let folderInfo: any = null;
    let accessError: any = null;
    
    try {
      const folderResponse = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, capabilities, shared',
        supportsAllDrives: true,
      });
      folderInfo = folderResponse.data;
    } catch (err: any) {
      accessError = err;
    }

    // Test 2: Check permissions
    let permissions: any[] = [];
    let serviceAccountPerm: any = null;
    
    if (folderInfo) {
      try {
        const permResponse = await drive.permissions.list({
          fileId: folderId,
          fields: 'permissions(id, emailAddress, role, type)',
          supportsAllDrives: true,
        });
        permissions = permResponse.data.permissions || [];
        serviceAccountPerm = permissions.find(
          (p: any) => p.emailAddress === serviceEmail
        );
      } catch (err: any) {
        console.error('Cannot list permissions:', err.message);
      }
    }

    // Test 3: Try to write
    let canWrite = false;
    let writeError: any = null;
    
    if (folderInfo) {
      try {
        const testContent = 'Test';
        const { Readable } = await import('stream');
        const stream = Readable.from(Buffer.from(testContent));
        
        const testResponse = await drive.files.create({
          requestBody: {
            name: `test_${Date.now()}.txt`,
            parents: [folderId],
            mimeType: 'text/plain',
          },
          media: {
            mimeType: 'text/plain',
            body: stream,
          },
          fields: 'id',
          supportsAllDrives: true,
        });

        canWrite = true;

        // Clean up
        await drive.files.delete({
          fileId: testResponse.data.id!,
          supportsAllDrives: true,
        });
      } catch (err: any) {
        writeError = err.message;
      }
    }

    // Build response
    if (accessError) {
      return NextResponse.json({
        success: false,
        problem: 'CANNOT_ACCESS_FOLDER',
        diagnosis: '❌ Service account cannot access this folder',
        error: accessError.message,
        errorCode: accessError.code,
        folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
        serviceAccountEmail: serviceEmail,
        instructions: [
          'The folder owner needs to:',
          `1. Open: https://drive.google.com/drive/folders/${folderId}`,
          '2. Click "Share" button',
          `3. Add: ${serviceEmail}`,
          '4. Set role: "Editor"',
          '5. Click "Done"',
        ],
      });
    }

    if (!serviceAccountPerm) {
      return NextResponse.json({
        success: false,
        problem: 'NOT_IN_PERMISSIONS',
        diagnosis: '❌ Service account is NOT in the folder permissions',
        folder: {
          name: folderInfo.name,
          shared: folderInfo.shared,
        },
        allPermissions: permissions.map((p: any) => ({
          email: p.emailAddress || 'unknown',
          role: p.role,
        })),
        serviceAccountEmail: serviceEmail,
        instructions: [
          'The folder owner needs to share it with the service account:',
          `1. Open: https://drive.google.com/drive/folders/${folderId}`,
          '2. Click "Share"',
          `3. Add: ${serviceEmail}`,
          '4. Role: "Editor"',
          '5. Click "Done"',
        ],
      });
    }

    if (!canWrite) {
      return NextResponse.json({
        success: false,
        problem: 'CANNOT_WRITE',
        diagnosis: '❌ Service account cannot write to folder',
        serviceAccount: {
          email: serviceEmail,
          role: serviceAccountPerm.role,
        },
        writeError,
        instructions: serviceAccountPerm.role === 'reader' ? [
          'Service account needs Editor access (currently has Viewer):',
          `1. Open: https://drive.google.com/drive/folders/${folderId}`,
          '2. Click "Share"',
          `3. Find: ${serviceEmail}`,
          '4. Change role to "Editor"',
          '5. Click "Done"',
        ] : [
          'Unknown write permission issue',
          'Contact the folder owner to verify service account has proper access',
        ],
      });
    }

    return NextResponse.json({
      success: true,
      diagnosis: '✅ Everything works! Folder is properly shared.',
      folder: {
        name: folderInfo.name,
        id: folderId,
      },
      serviceAccount: {
        email: serviceEmail,
        hasAccess: true,
        role: serviceAccountPerm.role,
      },
      canWrite: true,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}