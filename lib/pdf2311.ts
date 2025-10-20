import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';

export type AppRecord = {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;   // "MM-DD-YYYY"
  phone_number?: string;
  email?: string;
  company?: string;
  gov_id_type?: 'driver_license' | 'passport';
  gov_id_number?: string;
  id_state?: string;
  id_expiration?: string;   // "MM-DD-YYYY"
  signature_data_url?: string; // "data:image/png;base64,...."
};

export async function loadBlank2311() {
  const p = path.join(process.cwd(), 'public', 'templates', 'CDCR_2311_blank.pdf');
  const bytes = fs.readFileSync(p);
  return PDFDocument.load(bytes);
}

/**
 * Simple coordinate mapping (points from bottom-left).
 * Adjust these to match your template.
 */
const positions = {
  lastName:  { x: 72,  y: 700 },
  firstName: { x: 260, y: 700 },
  dob:       { x: 72,  y: 670 },
  phone:     { x: 260, y: 670 },
  email:     { x: 72,  y: 640 },
  company:   { x: 72,  y: 610 },
  govType:   { x: 72,  y: 580 },
  govNumber: { x: 260, y: 580 },
  idState:   { x: 72,  y: 550 },
  idExp:     { x: 260, y: 550 },
  signature: { x: 72,  y: 480, w: 300, h: 60 },
};

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size = 11) {
  if (!text) return;
  page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
}

function normalizeDob(mmddyyyy?: string) {
  if (!mmddyyyy) return '';
  // If your DB already stores MM-DD-YYYY, just return it.
  return mmddyyyy;
}

export async function fill2311(doc: PDFDocument, data: AppRecord) {
  const [page] = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  drawText(page, font, data.last_name ?? '',  positions.lastName.x,  positions.lastName.y);
  drawText(page, font, data.first_name ?? '', positions.firstName.x, positions.firstName.y);

  drawText(page, font, normalizeDob(data.date_of_birth), positions.dob.x, positions.dob.y);
  drawText(page, font, data.phone_number ?? '',          positions.phone.x, positions.phone.y);

  drawText(page, font, data.email ?? '',                 positions.email.x, positions.email.y);
  drawText(page, font, data.company ?? '',               positions.company.x, positions.company.y);

  drawText(page, font, (data.gov_id_type === 'passport' ? 'Passport' : 'Driver’s License'),
           positions.govType.x, positions.govType.y);
  drawText(page, font, data.gov_id_number ?? '',        positions.govNumber.x, positions.govNumber.y);

  drawText(page, font, data.id_state ?? '',             positions.idState.x, positions.idState.y);
  drawText(page, font, data.id_expiration ?? '',        positions.idExp.x, positions.idExp.y);

  // Signature (supports either full data URL or raw base64)
  if (data.signature_data_url) {
    let base64 = data.signature_data_url;
    const comma = base64.indexOf(',');
    if (comma !== -1) base64 = base64.slice(comma + 1); // strip "data:image/png;base64,"
    const png = Buffer.from(base64, 'base64');
    const pngImage = await doc.embedPng(png);
    const { x, y, w, h } = positions.signature;
    page.drawImage(pngImage, { x, y, width: w, height: h });
  }

  return doc;
}
