import { PDFDocument, StandardFonts, PDFName } from 'pdf-lib';
import { CDCR_2311_TEMPLATE_BASE64 } from './assets/templates';

export type AppRecord = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  other_names?: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  company?: string;
  purpose_of_visit?: string;
  gender?: 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say' | 'other';
  ssn_full?: string;
  gov_id_type?: 'driver_license' | 'passport';
  gov_id_number?: string;
  id_state?: string;
  id_expiration?: string;
  signature_data_url?: string;
  former_inmate?: boolean;
  on_probation_parole?: boolean;
  visited_inmate?: boolean;
  restricted_access?: boolean;
  felony_conviction?: boolean;
  pending_charges?: boolean;
};

export async function loadBlank2311(): Promise<PDFDocument> {
  try {
    const cleanBase64 = CDCR_2311_TEMPLATE_BASE64.replace(/\s/g, '');
    const bytes = Buffer.from(cleanBase64, 'base64');
    const doc = await PDFDocument.load(bytes);
    return doc;
  } catch (error) {
    throw new Error(`Failed to load PDF template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Confirmed coordinates against the blank CDCR 2311 PDF
const positions = {
  signature: { x: 180, y: 64, w: 300, h: 30 },
};

function formatPhoneSegments(phone?: string): { area: string; prefix: string; line: string } | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return { area: digits.slice(1, 4), prefix: digits.slice(4, 7), line: digits.slice(7) };
  }
  if (digits.length === 10) {
    return { area: digits.slice(0, 3), prefix: digits.slice(3, 6), line: digits.slice(6) };
  }
  return null;
}

function formatSSNSegments(ssn?: string): { part1: string; part2: string; part3: string } | null {
  if (!ssn) return null;
  const digits = ssn.replace(/\D/g, '');
  if (digits.length === 9) {
    return { part1: digits.slice(0, 3), part2: digits.slice(3, 5), part3: digits.slice(5) };
  }
  if (digits.length === 5) {
    return { part1: digits.slice(0, 3), part2: digits.slice(3, 5), part3: '' };
  }
  return null;
}

function getCurrentDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}-${day}-${year}`;
}

export async function fill2311(doc: PDFDocument, data: AppRecord): Promise<PDFDocument> {
  const [page] = doc.getPages();
  await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();

  // ── Name ──────────────────────────────────────────────────────────────────
  // Field: "Legal Last Name First Name and Middle Initial"
  try {
    let fullName = `${data.last_name || ''}, ${data.first_name || ''}`;
    if (data.middle_name) fullName += ` ${data.middle_name}`;
    form.getTextField('Legal Last Name First Name and Middle Initial').setText(fullName);
  } catch (e) { console.error('[pdf2311] name:', e); }

  // ── Other names ───────────────────────────────────────────────────────────
  // Field: "Other names you have been known by"
  try {
    form.getTextField('Other names you have been known by').setText(data.other_names || '');
  } catch (e) { console.error('[pdf2311] other_names:', e); }

  // ── Date of birth ─────────────────────────────────────────────────────────
  // Field: "Date of Birth Month Day Year"
  try {
    form.getTextField('Date of Birth Month Day Year').setText(data.date_of_birth || '');
  } catch (e) { console.error('[pdf2311] dob:', e); }

  // ── SSN ───────────────────────────────────────────────────────────────────
  // Fields: "Social Security Number1", "Social Security Number2", "Social Security Number3"
  const ssnSegments = formatSSNSegments(data.ssn_full);
  if (ssnSegments) {
    try { form.getTextField('Social Security Number1').setText(ssnSegments.part1); } catch (e) { console.error('[pdf2311] ssn1:', e); }
    try { form.getTextField('Social Security Number2').setText(ssnSegments.part2); } catch (e) { console.error('[pdf2311] ssn2:', e); }
    try { if (ssnSegments.part3) form.getTextField('Social Security Number3').setText(ssnSegments.part3); } catch (e) { console.error('[pdf2311] ssn3:', e); }
  }

  // ── Phone ─────────────────────────────────────────────────────────────────
  // Fields: "Contact Number1" (area code), "Contact Number2" (rest)
  const phoneSegments = formatPhoneSegments(data.phone_number);
  if (phoneSegments) {
    try { form.getTextField('Contact Number1').setText(phoneSegments.area); } catch (e) { console.error('[pdf2311] phone1:', e); }
    try { form.getTextField('Contact Number2').setText(phoneSegments.prefix + phoneSegments.line); } catch (e) { console.error('[pdf2311] phone2:', e); }
  }

  // ── Government ID ─────────────────────────────────────────────────────────
  // Field: "State ID or Drivers License" + "State"
  // OR: "Passport if no State IDDrivers License" (if passport)
  if (data.gov_id_type === 'passport') {
    try { form.getTextField('Passport if no State IDDrivers License').setText(data.gov_id_number || ''); } catch (e) { console.error('[pdf2311] passport:', e); }
  } else {
    try { form.getTextField('State ID or Drivers License').setText(data.gov_id_number || ''); } catch (e) { console.error('[pdf2311] state_id:', e); }
    try { form.getTextField('State').setText(data.id_state || ''); } catch (e) { console.error('[pdf2311] id_state:', e); }
  }
  // Note: id_expiration is collected in the app but the CDCR 2311 PDF has no expiration date field

  // ── Gender ────────────────────────────────────────────────────────────────
  // Field: "Group1" (Male / Female / Non-Binary)
  try {
    const genderGroup = form.getRadioGroup('Group1');
    if (data.gender === 'male') genderGroup.select('Male');
    else if (data.gender === 'female') genderGroup.select('Female');
    else if (data.gender === 'nonbinary') genderGroup.select('Non-Binary');
    // prefer_not_to_say / other: leave unselected — no matching option on the form
  } catch (e) { console.error('[pdf2311] gender:', e); }

  // ── Visited inmate ────────────────────────────────────────────────────────
  // Field: "Group2" (No / Yes)
  try {
    const g = form.getRadioGroup('Group2');
    if (data.visited_inmate === true) g.select('Yes');
    else if (data.visited_inmate === false) g.select('No');
  } catch (e) { console.error('[pdf2311] visited_inmate:', e); }

  // ── Former inmate ─────────────────────────────────────────────────────────
  // Field: "Group3" (No / Yes)
  try {
    const g = form.getRadioGroup('Group3');
    if (data.former_inmate === true) g.select('Yes');
    else if (data.former_inmate === false) g.select('No');
  } catch (e) { console.error('[pdf2311] former_inmate:', e); }

  // ── Restricted access ─────────────────────────────────────────────────────
  // Field: "Group4" (No / Yes)
  try {
    const g = form.getRadioGroup('Group4');
    if (data.restricted_access === true) g.select('Yes');
    else if (data.restricted_access === false) g.select('No');
  } catch (e) { console.error('[pdf2311] restricted_access:', e); }

  // ── Felony conviction ─────────────────────────────────────────────────────
  // Field: "Group5" (No / Yes)
  try {
    const g = form.getRadioGroup('Group5');
    if (data.felony_conviction === true) g.select('Yes');
    else if (data.felony_conviction === false) g.select('No');
  } catch (e) { console.error('[pdf2311] felony:', e); }

  // ── Probation / parole ────────────────────────────────────────────────────
  // Field: "Group6" (No / Yes)
  try {
    const g = form.getRadioGroup('Group6');
    if (data.on_probation_parole === true) g.select('Yes');
    else if (data.on_probation_parole === false) g.select('No');
  } catch (e) { console.error('[pdf2311] probation:', e); }

  // ── Pending charges ───────────────────────────────────────────────────────
  // Field: "Group7" (No / Yes)
  try {
    const g = form.getRadioGroup('Group7');
    if (data.pending_charges === true) g.select('Yes');
    else if (data.pending_charges === false) g.select('No');
  } catch (e) { console.error('[pdf2311] pending_charges:', e); }

  // Note: Group8 = APPROVE / DENY — staff-only field, intentionally left blank

  // ── Authorization type ────────────────────────────────────────────────────
  // Field: "Group9" — PDF bug: both widgets share export value "Gate Clearance"
  // so select() checks both. Fix: set widget appearance states directly.
  try {
    const authGroup = form.getRadioGroup('Group9');
    const widgets = authGroup.acroField.getWidgets();
    widgets.forEach((widget, index) => {
      if (index === 0) widget.setAppearanceState(PDFName.of('Gate Clearance'));
      else widget.setAppearanceState(PDFName.of('Off'));
    });
  } catch (e) { console.error('[pdf2311] auth_type:', e); }

  // ── Signature date ────────────────────────────────────────────────────────
  // Field: "Date2" (Date1 = division head, Date3 = hiring authority)
  try {
    form.getTextField('Date2').setText(getCurrentDate());
  } catch (e) { console.error('[pdf2311] date2:', e); }

  // ── Signature image ───────────────────────────────────────────────────────
  // "Signature of Applicant" is a /Sig field — pdf-lib cannot fill native sig fields.
  // We draw the captured signature PNG at the field's coordinates instead.
  if (data.signature_data_url) {
    try {
      let base64 = data.signature_data_url;
      const comma = base64.indexOf(',');
      if (comma !== -1) base64 = base64.slice(comma + 1);
      if (!base64 || base64.length < 100) throw new Error('Signature data is empty or malformed');
      const png = Buffer.from(base64, 'base64');
      const pngImage = await doc.embedPng(png);
      const { x, y, w, h } = positions.signature;
      page.drawImage(pngImage, { x, y, width: w, height: h });
    } catch (e) { console.error('[pdf2311] signature:', e); }
  }

  return doc;
}