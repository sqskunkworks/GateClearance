import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface SummaryData {
  // Personal
  firstName: string;
  middleName?: string;
  lastName: string;
  otherNames?: string;
  dateOfBirth: string;
  gender: string;
  
  // Contact
  email: string;
  phoneNumber: string;
  visitDate?: string;
  companyOrOrganization: string;
  purposeOfVisit: string;
  
  // Experience
  engagedDirectly: string;
  perceptions: string;
  expectations: string;
  justiceReformBefore: string;
  interestsMost: string;
  reformFuture: string;
  additionalNotes?: string;
  
  // Security
  governmentIdType: string;
  idState?: string;
  idExpiration: string;
  ssnMethod: string;
  ssnFirstFive?: string;
  isUsCitizen?: string;
  formerInmate: string;
  onParole: string;
  passportScan?: File;
  wardenLetter?: File;
  
  // Meta
  applicationId: string;
  submittedAt: string;
}

const LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  nonbinary: 'Nonbinary',
  prefer_not_to_say: 'Prefer not to say',
  other: 'Other',
  no_first_time: 'No, this is my first time directly engaging with incarcerated people',
  personal_connection: 'Yes, I have a personal connection (e.g., family/friends)',
  volunteer: 'Yes, through volunteer work',
  professional: 'Yes, in a professional capacity (e.g., work, advocacy, research, media)',
  active: 'Yes, I am actively engaged in justice reform',
  limited: 'Yes, but only in a limited capacity',
  never: 'No, I have never been involved',
  thought_about: 'No, but I have thought about it',
  already_involved_continue: "Yes, I'm already involved and plan to continue",
  considering: "Yes, I've thought about it but haven't taken action yet",
  maybe: 'Maybe, depending on what I learn from this visit',
  one_time: 'No, this is just a one-time visit for me',
  driver_license: "Driver's License",
  passport: 'Passport',
  direct: 'Provided directly through form',
  call: 'Confirmed via phone call with Executive Director',
  split: 'Split method (first 5 digits in form, last 4 via other method)',
  yes: 'Yes',
  no: 'No',
};

function formatLabel(value: string): string {
  return LABELS[value] || value;
}

// Strip control characters that WinAnsi cannot encode
// e.g. \r (0x0d) from Windows-style line endings in textarea inputs
function sanitize(str: string): string {
  return str.replace(/[\r\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
}

export async function generateSummaryPDF(data: SummaryData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let currentPage = pdfDoc.addPage([612, 792]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = currentPage.getSize();
  const margin = 50;
  let y = height - margin;

  const lineHeight = 16;
  const sectionSpacing = 24;
  const titleSize = 16;
  const sectionTitleSize = 12;
  const textSize = 10;

  const checkNewPage = () => {
    if (y < margin + 50) {
      currentPage = pdfDoc.addPage([612, 792]);
      y = height - margin;
    }
  };

  const addText = (text: string, x: number, options: {
    bold?: boolean;
    size?: number;
    maxWidth?: number;
  } = {}) => {
    const currentFont = options.bold ? fontBold : font;
    const currentSize = options.size || textSize;
    const maxWidth = options.maxWidth || width - 2 * margin;

    // Sanitize: remove \r and other non-WinAnsi control chars, normalize \n to space for single-line rendering
    const cleanText = sanitize(text).replace(/\n/g, ' ');

    checkNewPage();

    const words = cleanText.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = currentFont.widthOfTextAtSize(testLine, currentSize);

      if (testWidth > maxWidth && currentLine) {
        checkNewPage();
        currentPage.drawText(currentLine, { x, y, size: currentSize, font: currentFont, color: rgb(0, 0, 0) });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      checkNewPage();
      currentPage.drawText(currentLine, { x, y, size: currentSize, font: currentFont, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }
  };

  const addSection = (title: string) => {
    y -= sectionSpacing;
    checkNewPage();
    addText(`--- ${title} ---`, margin, { bold: true, size: sectionTitleSize });
    y -= 8;
  };

  const addField = (label: string, value: string | undefined) => {
    if (!value || value.trim() === '') return;
    checkNewPage();
    addText(`${label}:`, margin, { bold: true });
    addText(value, margin + 10, { maxWidth: width - 2 * margin - 10 });
    y -= 4;
  };

  const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ');

  // Title
  addText('APPLICATION INFORMATION SUMMARY', margin, { bold: true, size: titleSize });
  currentPage.drawLine({
    start: { x: margin, y: y + 4 },
    end: { x: width - margin, y: y + 4 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  y -= sectionSpacing;

  addField('Applicant Name', fullName);
  addField('Application ID', data.applicationId);
  addField('Date Submitted', new Date(data.submittedAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }));

  addSection('PERSONAL INFORMATION');
  addField('First Name', data.firstName);
  addField('Middle Name', data.middleName);
  addField('Last Name', data.lastName);
  addField('Other Names', data.otherNames);
  addField('Date of Birth', data.dateOfBirth);
  addField('Gender', formatLabel(data.gender));

  addSection('CONTACT INFORMATION');
  addField('Email', data.email);
  addField('Phone Number', data.phoneNumber);
  addField('Preferred Visit Date', data.visitDate);
  addField('Company/Organization', data.companyOrOrganization);
  addField('Purpose of Visit', data.purposeOfVisit);

  addSection('EXPERIENCE & EXPECTATIONS');
  addField('Previous Engagement with Incarcerated People', formatLabel(data.engagedDirectly));
  addField('Perceptions of Incarcerated People', data.perceptions);
  addField('Expectations for Visit', data.expectations);
  addField('Prior Justice Reform Involvement', formatLabel(data.justiceReformBefore));
  addField('What Interests You Most', data.interestsMost);
  addField('Future Reform Engagement', formatLabel(data.reformFuture));
  addField('Additional Notes', data.additionalNotes);

  addSection('ACKNOWLEDGMENTS');
  addText('Read and Agreed to Rules: Yes', margin);
  y -= lineHeight;

  addSection('SECURITY CLEARANCE');
  addField('US Citizen', data.isUsCitizen === 'true' ? 'Yes' : data.isUsCitizen === 'false' ? 'No' : undefined);
  addField('Government ID Type', formatLabel(data.governmentIdType));
  if (data.idState) addField('ID State', data.idState);
  addField('ID Expiration Date', data.idExpiration);
  addField('SSN Method', formatLabel(data.ssnMethod));
  addField('SSN (First 5 Digits)', data.ssnFirstFive);
  addField('Former Inmate', formatLabel(data.formerInmate));
  addField('Currently on Parole', formatLabel(data.onParole));
  addField('Passport Scan Uploaded', data.passportScan ? 'Yes' : 'No');
  addField('Clearance Letter Uploaded', data.wardenLetter ? 'Yes' : 'No');
  addText('Confirmed Information Accuracy: Yes', margin);
  y -= lineHeight;
  addText('Consented to Data Use: Yes', margin);

  // Footer
  checkNewPage();
  y -= sectionSpacing;
  currentPage.drawLine({
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}