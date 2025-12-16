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

  
  if (!fs.existsSync(p)) {
    const dir = path.join(process.cwd(), 'public', 'templates');
  
    if (fs.existsSync(dir)) {
      
    }
    throw new Error(`PDF template not found at ${p}`);
  }
  
  const bytes = fs.readFileSync(p);
 
  const doc = await PDFDocument.load(bytes);

  return doc;
}

const positions = {
  signature: { x: 276, y: 64, w: 400, h: 30 },
};

function formatPhoneSegments(phone?: string): { area: string; prefix: string; line: string } | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  

  
  // Handle 11-digit numbers (with country code 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    
    return {
      area: digits.slice(1, 4),    // Skip the '1', take next 3
      prefix: digits.slice(4, 7),
      line: digits.slice(7)
    };
  }
  
  // Handle 10-digit numbers
  if (digits.length === 10) {
    return {
      area: digits.slice(0, 3),
      prefix: digits.slice(3, 6),
      line: digits.slice(6)
    };
  }
  
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

 

  // Fill text fields using form fields
  try {
    const nameField = form.getTextField('Legal Last Name First Name and Middle Initial');
    const fullName = `${data.last_name || ''}, ${data.first_name || ''}`;
    nameField.setText(fullName);
  
  } catch (e) {

  }

  try {
    const otherNamesField = form.getTextField('Other names you have been known by');
    otherNamesField.setText(data.other_names || '');
 
  } catch (e) {}

  try {
    const dobField = form.getTextField('Date of Birth Month Day Year');
    dobField.setText(data.date_of_birth || '');

  } catch (e) {}


  const ssnSegments = formatSSNSegments(data.ssn_full);

  
  if (ssnSegments) {
    try {
      form.getTextField('Social Security Number1').setText(ssnSegments.part1);
      form.getTextField('Social Security Number2').setText(ssnSegments.part2);
      form.getTextField('Social Security Number3').setText(ssnSegments.part3);

    } catch (e) {
    }
  } else {
    
  }


  const phoneSegments = formatPhoneSegments(data.phone_number);

  
  if (phoneSegments) {
    try {
      const areaCodeValue = phoneSegments.area;
      const restValue = phoneSegments.prefix + phoneSegments.line;
      form.getTextField('Contact Number1').setText(areaCodeValue);
      
      
      form.getTextField('Contact Number2').setText(restValue);
      

    } catch (e) {
  
      
    }
  } else {

  }

  // ID info
  try {
    form.getTextField('State ID or Drivers License').setText(data.gov_id_number || '');

  } catch (e) {}

  try {
    form.getTextField('State').setText(data.id_state || '');
 
  } catch (e) {}

  try {
    if (data.gov_id_type === 'passport') {
      form.getTextField('Passport if no State IDDrivers License').setText(data.gov_id_number || '');

    }
  } catch (e) {}


  
  // Group1: Gender
  try {
    const genderGroup = form.getRadioGroup('Group1');
    if (data.gender === 'male') {
      genderGroup.select('Male');
    } else if (data.gender === 'female') {
      genderGroup.select('Female');

    } else if (data.gender === 'nonbinary') {
      genderGroup.select('Non-Binary');
  
    }
  } catch (e) {
    console.log('Could not set gender:', e);
  }

  // Group2: Visited inmate
  try {
    const visitedGroup = form.getRadioGroup('Group2');
    if (data.visited_inmate === true) {
      visitedGroup.select('Yes');

    } else if (data.visited_inmate === false) {
      visitedGroup.select('No');
    }
  } catch (e) {
    console.log('Could not set visited inmate:', e);
  }

  // Group3: Former inmate
  try {
    const formerInmateGroup = form.getRadioGroup('Group3');
    if (data.former_inmate === true) {
      formerInmateGroup.select('Yes');
 
    } else if (data.former_inmate === false) {
      formerInmateGroup.select('No');

    }
  } catch (e) {
    console.log('Could not set former inmate:', e);
  }

  // Group4: Restricted access
  try {
    const restrictedGroup = form.getRadioGroup('Group4');
    if (data.restricted_access === true) {
      restrictedGroup.select('Yes');

    } else if (data.restricted_access === false) {
      restrictedGroup.select('No');

    }
  } catch (e) {
    console.log('Could not set restricted access:', e);
  }

  // Group5: Felony conviction
  try {
    const felonyGroup = form.getRadioGroup('Group5');
    if (data.felony_conviction === true) {
      felonyGroup.select('Yes');
   
    } else if (data.felony_conviction === false) {
      felonyGroup.select('No');
   
    }
  } catch (e) {
    console.log('Could not set felony conviction:', e);
  }

  // Group6: Probation/Parole
  try {
    const probationGroup = form.getRadioGroup('Group6');
    if (data.on_probation_parole === true) {
      probationGroup.select('Yes');
    } else if (data.on_probation_parole === false) {
      probationGroup.select('No');

    }
  } catch (e) {
    console.log('Could not set probation/parole:', e);
  }

  // Group7: Pending charges
  try {
    const pendingGroup = form.getRadioGroup('Group7');
    if (data.pending_charges === true) {
      pendingGroup.select('Yes');

    } else if (data.pending_charges === false) {
      pendingGroup.select('No');
    }
  } catch (e) {
    console.log('Could not set pending charges:', e);
  }

  // Group9: Authorization type
  try {
    const authGroup = form.getRadioGroup('Group9');
    authGroup.select('Gate Clearance');

  } catch (e) {
  
  }

  // Signature

  if (data.signature_data_url) {
    try {
      let base64 = data.signature_data_url;
      const comma = base64.indexOf(',');
      if (comma !== -1) base64 = base64.slice(comma + 1);
      const png = Buffer.from(base64, 'base64');
      const pngImage = await doc.embedPng(png);
      const { x, y, w, h } = positions.signature;
      page.drawImage(pngImage, { x, y, width: w, height: h });
    } catch (sigError) {
      console.error('Failed to embed signature:', sigError);
    }
  } else {
    console.log('⚠️ No signature provided');
  }


  return doc;
}