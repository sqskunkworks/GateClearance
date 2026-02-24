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

export async function fill2311(doc: PDFDocument, data: AppRecord) {
  const [page] = doc.getPages();
  await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();

  try {
    const nameField = form.getTextField('Legal Last Name First Name and Middle Initial');
    let fullName = `${data.last_name || ''}, ${data.first_name || ''}`;
    if (data.middle_name) {
      fullName += ` ${data.middle_name}`;
    }
    nameField.setText(fullName);
  } catch {}

  try {
    form.getTextField('Other names you have been known by').setText(data.other_names || '');
  } catch {}

  try {
    form.getTextField('Date of Birth Month Day Year').setText(data.date_of_birth || '');
  } catch {}

  const ssnSegments = formatSSNSegments(data.ssn_full);
  if (ssnSegments) {
    try {
      form.getTextField('Social Security Number1').setText(ssnSegments.part1);
      form.getTextField('Social Security Number2').setText(ssnSegments.part2);
      if (ssnSegments.part3) {
        form.getTextField('Social Security Number3').setText(ssnSegments.part3);
      }
    } catch {}
  }

  const phoneSegments = formatPhoneSegments(data.phone_number);
  if (phoneSegments) {
    try {
      form.getTextField('Contact Number1').setText(phoneSegments.area);
      form.getTextField('Contact Number2').setText(phoneSegments.prefix + phoneSegments.line);
    } catch {}
  }

  try {
    form.getTextField('State ID or Drivers License').setText(data.gov_id_number || '');
  } catch {}

  try {
    form.getTextField('State').setText(data.id_state || '');
  } catch {}

  try {
    if (data.gov_id_type === 'passport') {
      form.getTextField('Passport if no State IDDrivers License').setText(data.gov_id_number || '');
    }
  } catch {}

  try {
    const genderGroup = form.getRadioGroup('Group1');
    if (data.gender === 'male') genderGroup.select('Male');
    else if (data.gender === 'female') genderGroup.select('Female');
    else if (data.gender === 'nonbinary') genderGroup.select('Non-Binary');
  } catch {}

  try {
    const visitedGroup = form.getRadioGroup('Group2');
    if (data.visited_inmate === true) visitedGroup.select('Yes');
    else if (data.visited_inmate === false) visitedGroup.select('No');
  } catch {}

  try {
    const formerInmateGroup = form.getRadioGroup('Group3');
    if (data.former_inmate === true) formerInmateGroup.select('Yes');
    else if (data.former_inmate === false) formerInmateGroup.select('No');
  } catch {}

  try {
    const restrictedGroup = form.getRadioGroup('Group4');
    if (data.restricted_access === true) restrictedGroup.select('Yes');
    else if (data.restricted_access === false) restrictedGroup.select('No');
  } catch {}

  try {
    const felonyGroup = form.getRadioGroup('Group5');
    if (data.felony_conviction === true) felonyGroup.select('Yes');
    else if (data.felony_conviction === false) felonyGroup.select('No');
  } catch {}

  try {
    const probationGroup = form.getRadioGroup('Group6');
    if (data.on_probation_parole === true) probationGroup.select('Yes');
    else if (data.on_probation_parole === false) probationGroup.select('No');
  } catch {}

  try {
    const pendingGroup = form.getRadioGroup('Group7');
    if (data.pending_charges === true) pendingGroup.select('Yes');
    else if (data.pending_charges === false) pendingGroup.select('No');
  } catch {}

  // ✅ FIXED: Group9 has a PDF bug — both options share export value "Gate Clearance".
  // select() checks both widgets, causing State ID Card to also appear checked.
  // Fix: directly set widget appearance states.
  try {
    const authGroup = form.getRadioGroup('Group9');
    const widgets = authGroup.acroField.getWidgets();
    widgets.forEach((widget, index) => {
      if (index === 0) {
        widget.setAppearanceState(PDFName.of('Gate Clearance'));
      } else {
        widget.setAppearanceState(PDFName.of('Off'));
      }
    });
  } catch {}

  // ✅ Date2 = applicant signature date (Date1 = staff division head, Date3 = hiring authority)
  try {
    form.getTextField('Date2').setText(getCurrentDate());
  } catch {}

  if (data.signature_data_url) {
    try {
      let base64 = data.signature_data_url;
      const comma = base64.indexOf(',');
      if (comma !== -1) base64 = base64.slice(comma + 1);
      const png = Buffer.from(base64, 'base64');
      const pngImage = await doc.embedPng(png);
      const { x, y, w, h } = positions.signature;
      page.drawImage(pngImage, { x, y, width: w, height: h });
    } catch {}
  }

  return doc;
}