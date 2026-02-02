import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';

interface SummaryData {
  // Personal
  firstName: string;
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
  formerInmate: string;
  onParole: string;
  passportScan?: File;
  wardenLetter?: File;
  
  // Meta
  applicationId: string;
  submittedAt: string;
}

const LABELS: Record<string, string> = {
  // Gender options
  male: 'Male',
  female: 'Female',
  nonbinary: 'Nonbinary',
  prefer_not_to_say: 'Prefer not to say',
  other: 'Other',
  
  // Engaged directly options
  no_first_time: 'No, this is my first time directly engaging with incarcerated people',
  personal_connection: 'Yes, I have a personal connection (e.g., family/friends)',
  volunteer: 'Yes, through volunteer work',
  professional: 'Yes, in a professional capacity (e.g., work, advocacy, research, media)',
  
  // Justice reform options
  active: 'Yes, I am actively engaged in justice reform',
  limited: 'Yes, but only in a limited capacity',
  never: 'No, I have never been involved',
  thought_about: 'No, but I have thought about it',
  
  // Reform future options
  already_involved_continue: "Yes, I'm already involved and plan to continue",
  considering: "Yes, I've thought about it but haven't taken action yet",
  maybe: 'Maybe, depending on what I learn from this visit',
  one_time: 'No, this is just a one-time visit for me',
  
  // ID types
  driver_license: "Driver's License",
  passport: 'Passport',
  
  // SSN methods
  direct: 'Provided directly through form',
  call: 'Confirmed via phone call with Executive Director',
  split: 'Split method (first 5 digits in form, last 4 via other method)',
  
  // Yes/No
  yes: 'Yes',
  no: 'No',
};

function formatLabel(value: string): string {
  return LABELS[value] || value;
}

export async function generateSummaryPDF(data: SummaryData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let currentPage = pdfDoc.addPage([612, 792]); // US Letter size
  
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
  
  // Helper to check if we need a new page
  const checkNewPage = () => {
    if (y < margin + 50) {
      currentPage = pdfDoc.addPage([612, 792]);
      y = height - margin;
    }
  };
  
  // Helper function to add text with auto-pagination
  const addText = (text: string, x: number, options: { 
    bold?: boolean; 
    size?: number;
    maxWidth?: number;
  } = {}) => {
    const currentFont = options.bold ? fontBold : font;
    const currentSize = options.size || textSize;
    const maxWidth = options.maxWidth || width - 2 * margin;
    
    checkNewPage();
    
    // Word wrap if needed
    const words = text.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = currentFont.widthOfTextAtSize(testLine, currentSize);
      
      if (testWidth > maxWidth && currentLine) {
        checkNewPage();
        
        currentPage.drawText(currentLine, {
          x,
          y,
          size: currentSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      checkNewPage();
      
      currentPage.drawText(currentLine, {
        x,
        y,
        size: currentSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });
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
  
  // Title
  addText('APPLICATION INFORMATION SUMMARY', margin, { 
    bold: true, 
    size: titleSize 
  });
  
  currentPage.drawLine({
    start: { x: margin, y: y + 4 },
    end: { x: width - margin, y: y + 4 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  y -= sectionSpacing;
  
  // Header info
  addField('Applicant Name', `${data.firstName} ${data.lastName}`);
  addField('Application ID', data.applicationId);
  addField('Date Submitted', new Date(data.submittedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  }));
  
  // Personal Information
  addSection('PERSONAL INFORMATION');
  addField('First Name', data.firstName);
  addField('Last Name', data.lastName);
  addField('Other Names', data.otherNames);
  addField('Date of Birth', data.dateOfBirth);
  addField('Gender', formatLabel(data.gender));
  
  // Contact Information
  addSection('CONTACT INFORMATION');
  addField('Email', data.email);
  addField('Phone Number', data.phoneNumber);
  addField('Preferred Visit Date', data.visitDate);
  addField('Company/Organization', data.companyOrOrganization);
  addField('Purpose of Visit', data.purposeOfVisit);
  
  // Experience & Expectations
  addSection('EXPERIENCE & EXPECTATIONS');
  addField('Previous Engagement with Incarcerated People', formatLabel(data.engagedDirectly));
  addField('Perceptions of Incarcerated People', data.perceptions);
  addField('Expectations for Visit', data.expectations);
  addField('Prior Justice Reform Involvement', formatLabel(data.justiceReformBefore));
  addField('What Interests You Most', data.interestsMost);
  addField('Future Reform Engagement', formatLabel(data.reformFuture));
  addField('Additional Notes', data.additionalNotes);
  
  // Acknowledgments
  addSection('ACKNOWLEDGMENTS');
  addText('Read and Agreed to Rules: Yes', margin);
  y -= lineHeight;
  
  // Security Clearance
  addSection('SECURITY CLEARANCE');
  addField('Government ID Type', formatLabel(data.governmentIdType));
  if (data.idState) {
    addField('ID State', data.idState);
  }
  addField('ID Expiration Date', data.idExpiration);
  addField('SSN Method', formatLabel(data.ssnMethod));
  addField('Former Inmate', formatLabel(data.formerInmate));
  addField('Currently on Parole', formatLabel(data.onParole));
  addField('Passport Scan Uploaded', data.passportScan ? 'Yes' : 'No');
  addField('Clearance Letter Uploaded', data.wardenLetter ? 'Yes' : 'No');
  addText('Confirmed Information Accuracy: Yes', margin);
  y -= lineHeight;
  addText('Consented to Data Use: Yes', margin);
  
  // Footer (on last page)
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