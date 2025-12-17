/**
 * Placeholder values for draft persistence
 * 
 * These values are used when creating a draft application in Step 1, before the user
 * has filled in fields from later steps (Step 2 contact info, Step 5 security info).
 * 
 * Why placeholders are needed:
 * - Database schema has NOT NULL constraints on certain fields
 * - Users fill the form progressively across 5 steps
 * - Placeholders allow draft creation without all required fields
 * - Real values replace placeholders as users progress through steps
 * 
 * Placeholders are filtered out when loading drafts (user sees empty fields, not placeholders).
 */
export const DRAFT_PLACEHOLDERS = {
    EMAIL: 'pending@example.com',
    PHONE: '0000000000',
    COMPANY: 'PENDING',
    GOV_ID_TYPE: 'driver_license' as const,
    GOV_ID_NUMBER: 'PENDING',
  } as const;
  
  /**
   * Check if a value is still a placeholder (not yet filled by user)
   */
  export function isPlaceholder(value: string | null | undefined, placeholder: string): boolean {
    return !value || value === placeholder;
  }