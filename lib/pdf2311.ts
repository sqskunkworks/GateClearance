import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';

export type AppRecord = {
  first_name?: string;
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

export async function loadBlank2311() {
  const p = path.join(process.cwd(), 'public', 'templates', 'CDCR_2311_blank.pdf');
  console.log('  → Looking for PDF at:', p);
  console.log('  → File exists?', fs.existsSync(p));
  
  if (!fs.existsSync(p)) {
    const dir = path.join(process.cwd(), 'public', 'templates');
    console.log('  → Directory exists?', fs.existsSync(dir));
    if (fs.existsSync(dir)) {
      console.log('  → Files in directory:', fs.readdirSync(dir));
    }
    throw new Error(`PDF template not found at ${p}`);
  }
  
  const bytes = fs.readFileSync(p);
  console.log('  → File size:', bytes.length, 'bytes');
  const doc = await PDFDocument.load(bytes);
  console.log('  → PDF loaded, pages:', doc.getPageCount());
  return doc;
}

const positions = {
  signature: { x: 276, y: 64, w: 400, h: 30 },
};

function formatPhoneSegments(phone?: string): { area: string; prefix: string; line: string } | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  
  console.log('  Digits extracted:', digits);
  console.log('  Digit count:', digits.length);
  
  // Handle 11-digit numbers (with country code 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    console.log('  → Detected 11-digit number with country code');
    return {
      area: digits.slice(1, 4),    // Skip the '1', take next 3
      prefix: digits.slice(4, 7),
      line: digits.slice(7)
    };
  }
  
  // Handle 10-digit numbers
  if (digits.length === 10) {
    console.log('  → Detected 10-digit number');
    return {
      area: digits.slice(0, 3),
      prefix: digits.slice(3, 6),
      line: digits.slice(6)
    };
  }
  
  console.log('  ⚠️ Unexpected phone format - length:', digits.length);
  return null;
}

function formatSSNSegments(ssn?: string): { part1: string; part2: string; part3: string } | null {
  if (!ssn) return null;
  const digits = ssn.replace(/\D/g, '');
  if (digits.length === 9) {
    return {
      part1: digits.slice(0, 3),
      part2: digits.slice(3, 5),
      part3: digits.slice(5)
    };
  }
  return null;
}

export async function fill2311(doc: PDFDocument, data: AppRecord) {
  const [page] = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();

  console.log('\n===== FILLING PDF FORM FIELDS =====');
  console.log('📊 Input data summary:');
  console.log('  - Name:', data.first_name, data.last_name);
  console.log('  - SSN provided:', !!data.ssn_full, '(length:', data.ssn_full?.length || 0, ')');
  console.log('  - Phone provided:', !!data.phone_number, '(value:', data.phone_number, ')');
  console.log('  - Gender:', data.gender);

  // Fill text fields using form fields
  try {
    const nameField = form.getTextField('Legal Last Name First Name and Middle Initial');
    const fullName = `${data.last_name || ''}, ${data.first_name || ''}`;
    nameField.setText(fullName);
    console.log('✓ Name field filled:', fullName);
  } catch (e) {
    console.log('❌ Could not fill name field:', e);
  }

  try {
    const otherNamesField = form.getTextField('Other names you have been known by');
    otherNamesField.setText(data.other_names || '');
    console.log('✓ Other names filled');
  } catch (e) {}

  try {
    const dobField = form.getTextField('Date of Birth Month Day Year');
    dobField.setText(data.date_of_birth || '');
    console.log('✓ DOB filled:', data.date_of_birth);
  } catch (e) {}

  // SSN - split into 3 fields with detailed logging
  console.log('\n→ Processing SSN...');
  console.log('  Raw SSN value:', data.ssn_full);
  const ssnSegments = formatSSNSegments(data.ssn_full);
  console.log('  Parsed segments:', ssnSegments);
  
  if (ssnSegments) {
    try {
      form.getTextField('Social Security Number1').setText(ssnSegments.part1);
      form.getTextField('Social Security Number2').setText(ssnSegments.part2);
      form.getTextField('Social Security Number3').setText(ssnSegments.part3);
      console.log('✅ SSN fields filled successfully:', 
        ssnSegments.part1, '-', ssnSegments.part2, '-', ssnSegments.part3);
    } catch (e) {
      console.log('❌ Could not fill SSN fields:', e);
    }
  } else {
    console.log('⚠️ SSN segments could not be parsed - skipping SSN fields');
  }

  // Phone - split into 2 fields with detailed logging
  console.log('\n→ Processing Phone...');
  console.log('  Raw phone value:', data.phone_number);
  const phoneSegments = formatPhoneSegments(data.phone_number);
  console.log('  Parsed segments:', phoneSegments);
  
  if (phoneSegments) {
    try {
      const areaCodeValue = phoneSegments.area;
      const restValue = phoneSegments.prefix + phoneSegments.line;
      
      console.log('  → Setting Contact Number1 (area code):', areaCodeValue);
      form.getTextField('Contact Number1').setText(areaCodeValue);
      
      console.log('  → Setting Contact Number2 (rest):', restValue);
      form.getTextField('Contact Number2').setText(restValue);
      
      console.log('✅ Phone fields filled successfully:', 
        areaCodeValue, '-', restValue);
    } catch (e) {
      console.log('❌ Could not fill phone fields:', e);
      console.log('   Error details:', e instanceof Error ? e.message : String(e));
    }
  } else {
    console.log('⚠️ Phone segments could not be parsed - skipping phone fields');
  }

  // ID info
  try {
    form.getTextField('State ID or Drivers License').setText(data.gov_id_number || '');
    console.log('✓ Gov ID filled');
  } catch (e) {}

  try {
    form.getTextField('State').setText(data.id_state || '');
    console.log('✓ State filled');
  } catch (e) {}

  try {
    if (data.gov_id_type === 'passport') {
      form.getTextField('Passport if no State IDDrivers License').setText(data.gov_id_number || '');
      console.log('✓ Passport filled');
    }
  } catch (e) {}

  // Radio groups
  console.log('\n→ Processing Radio Groups...');
  
  // Group1: Gender
  try {
    const genderGroup = form.getRadioGroup('Group1');
    if (data.gender === 'male') {
      genderGroup.select('Male');
      console.log('✓ Gender: Male');
    } else if (data.gender === 'female') {
      genderGroup.select('Female');
      console.log('✓ Gender: Female');
    } else if (data.gender === 'nonbinary') {
      genderGroup.select('Non-Binary');
      console.log('✓ Gender: Non-Binary');
    }
  } catch (e) {
    console.log('❌ Could not set gender:', e);
  }

  // Group2: Visited inmate
  try {
    const visitedGroup = form.getRadioGroup('Group2');
    if (data.visited_inmate === true) {
      visitedGroup.select('Yes');
      console.log('✓ Visited inmate: Yes');
    } else if (data.visited_inmate === false) {
      visitedGroup.select('No');
      console.log('✓ Visited inmate: No');
    }
  } catch (e) {
    console.log('❌ Could not set visited inmate:', e);
  }

  // Group3: Former inmate
  try {
    const formerInmateGroup = form.getRadioGroup('Group3');
    if (data.former_inmate === true) {
      formerInmateGroup.select('Yes');
      console.log('✓ Former inmate: Yes');
    } else if (data.former_inmate === false) {
      formerInmateGroup.select('No');
      console.log('✓ Former inmate: No');
    }
  } catch (e) {
    console.log('❌ Could not set former inmate:', e);
  }

  // Group4: Restricted access
  try {
    const restrictedGroup = form.getRadioGroup('Group4');
    if (data.restricted_access === true) {
      restrictedGroup.select('Yes');
      console.log('✓ Restricted access: Yes');
    } else if (data.restricted_access === false) {
      restrictedGroup.select('No');
      console.log('✓ Restricted access: No');
    }
  } catch (e) {
    console.log('❌ Could not set restricted access:', e);
  }

  // Group5: Felony conviction
  try {
    const felonyGroup = form.getRadioGroup('Group5');
    if (data.felony_conviction === true) {
      felonyGroup.select('Yes');
      console.log('✓ Felony conviction: Yes');
    } else if (data.felony_conviction === false) {
      felonyGroup.select('No');
      console.log('✓ Felony conviction: No');
    }
  } catch (e) {
    console.log('❌ Could not set felony conviction:', e);
  }

  // Group6: Probation/Parole
  try {
    const probationGroup = form.getRadioGroup('Group6');
    if (data.on_probation_parole === true) {
      probationGroup.select('Yes');
      console.log('✓ On probation/parole: Yes');
    } else if (data.on_probation_parole === false) {
      probationGroup.select('No');
      console.log('✓ On probation/parole: No');
    }
  } catch (e) {
    console.log('❌ Could not set probation/parole:', e);
  }

  // Group7: Pending charges
  try {
    const pendingGroup = form.getRadioGroup('Group7');
    if (data.pending_charges === true) {
      pendingGroup.select('Yes');
      console.log('✓ Pending charges: Yes');
    } else if (data.pending_charges === false) {
      pendingGroup.select('No');
      console.log('✓ Pending charges: No');
    }
  } catch (e) {
    console.log('❌ Could not set pending charges:', e);
  }

  // Group9: Authorization type
  try {
    const authGroup = form.getRadioGroup('Group9');
    authGroup.select('Gate Clearance');
    console.log('✓ Authorization: Gate Clearance');
  } catch (e) {
    console.log('❌ Could not set authorization type:', e);
  }

  // Signature
  console.log('\n→ Processing Signature...');
  if (data.signature_data_url) {
    try {
      let base64 = data.signature_data_url;
      const comma = base64.indexOf(',');
      if (comma !== -1) base64 = base64.slice(comma + 1);
      const png = Buffer.from(base64, 'base64');
      const pngImage = await doc.embedPng(png);
      const { x, y, w, h } = positions.signature;
      page.drawImage(pngImage, { x, y, width: w, height: h });
      console.log('✅ Signature embedded successfully');
    } catch (sigError) {
      console.error('❌ Failed to embed signature:', sigError);
    }
  } else {
    console.log('⚠️ No signature provided');
  }

  console.log('===== PDF FORM FILLING COMPLETE =====\n');

  return doc;
}