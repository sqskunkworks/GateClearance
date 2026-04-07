import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { uploadPDFToDrive } from '@/lib/googleDrive';

// ============================================
// TYPES
// ============================================

export type UploadDocumentType =
  | 'warden_letter'
  | 'passport_scan'
  | 'clearance_letter'
  | 'supporting_document';

export interface UploadResult {
  success: boolean;
  filename?: string;
  sizeBytes?: number;
  error?: string;
}

export interface UploadOptions {
  applicationId: string;
  userId: string;
  file: File;
  documentType: UploadDocumentType;
  // e.g. 'Kanchana_Smith' — used to build filename
  namePrefix: string;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const DOCUMENT_TYPE_LABELS: Record<UploadDocumentType, string> = {
  warden_letter: 'warden letter',
  passport_scan: 'passport scan',
  clearance_letter: 'clearance letter',
  supporting_document: 'supporting document',
};

// ============================================
// VALIDATION
// ============================================

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be a PDF, JPG, or PNG',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File must be less than 5MB',
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty — please select a valid file',
    };
  }

  return { valid: true };
}

// ============================================
// FILENAME BUILDER
// ============================================

function buildFilename(namePrefix: string, documentType: UploadDocumentType, mimeType: string): string {
  const ext = mimeType.includes('pdf') ? 'pdf'
    : mimeType.includes('png') ? 'png'
    : 'jpg';
  return `${namePrefix}_${documentType}.${ext}`;
}

// ============================================
// SUPABASE CLIENT
// ============================================

function getServiceSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================
// CORE UPLOAD FUNCTION
// ============================================

/**
 * Validates, uploads a file to Google Drive, and stores metadata in the
 * documents table. Existing documents of the same type for this application
 * are replaced (upsert pattern).
 *
 * Use this instead of copy-pasting upload logic across route files.
 *
 * @example
 * const result = await uploadDocument({
 *   applicationId,
 *   userId: user.id,
 *   file: wardenLetterFile,
 *   documentType: 'warden_letter',
 *   namePrefix: 'Kanchana_Smith',
 * });
 * if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
 */
export async function uploadDocument(options: UploadOptions): Promise<UploadResult> {
  const { applicationId, userId, file, documentType, namePrefix } = options;

  // ── 1. Validate ─────────────────────────────────────────────
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const label = DOCUMENT_TYPE_LABELS[documentType];
  const filename = buildFilename(namePrefix, documentType, file.type);

  try {
    // ── 2. Upload to Google Drive ──────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadPDFToDrive(buffer, filename);

    // ── 3. Upsert documents table ──────────────────────────────
    // Delete any existing document of this type for this application
    // so re-uploads cleanly replace the old record
    const supabase = getServiceSupabase();

    await supabase
      .from('documents')
      .delete()
      .eq('application_id', applicationId)
      .ilike('filename', `%${documentType}%`);

    const { error: insertError } = await supabase.from('documents').insert({
      application_id: applicationId,
      filename,
      url: ' ', // Drive URL managed externally
      mime_type: file.type,
      size_bytes: buffer.length,
      uploaded_by_user_id: userId,
    });

    if (insertError) {
      console.error(`Failed to store ${label} metadata:`, insertError);
      return {
        success: false,
        error: `File uploaded but metadata storage failed: ${insertError.message}`,
      };
    }

    console.log(`✓ ${label} uploaded: ${filename}`);
    return { success: true, filename, sizeBytes: buffer.length };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${label} upload failed:`, error);
    return {
      success: false,
      error: `Failed to upload ${label}: ${message}`,
    };
  }
}

// ============================================
// CONVENIENCE: CHECK IF DOCUMENT EXISTS
// ============================================

/**
 * Checks whether a document of a given type has already been uploaded
 * for this application. Used by submit routes to support resumed drafts
 * without requiring re-upload.
 */
export async function documentExists(
  applicationId: string,
  documentType: UploadDocumentType
): Promise<boolean> {
  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from('documents')
      .select('id')
      .eq('application_id', applicationId)
      .ilike('filename', `%${documentType}%`)
      .single();
    return !!data;
  } catch {
    return false;
  }
}