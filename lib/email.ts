/**
 * Email notification utility using Nodemailer + Gmail SMTP
 */

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface ApplicationNotificationData {
  applicantName: string;
  applicationId: string;
  submittedAt: string;
  email: string;
  phoneNumber: string;
  companyOrOrganization: string;
  visitDate1?: string;
  visitDate2?: string;
  visitDate3?: string;
  hasConfirmedDate?: string;
  additionalComments?: string;
}

// ✅ FIX 3: Escape user-provided content before inserting into HTML email.
// Without this, user-entered markup in additionalComments could break
// the email structure or inject unexpected content.
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const [mm, dd, yyyy] = dateStr.split('-');
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const buildVisitDatesRow = (data: ApplicationNotificationData): string => {
  if (data.hasConfirmedDate !== 'yes') {
    return `
      <tr style="background-color: #f9fafb;">
        <td style="padding: 10px 14px; font-weight: bold; color: #374151; width: 40%; border: 1px solid #e5e7eb;">Visit Date(s)</td>
        <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">Not yet confirmed — clearing for future scheduling</td>
      </tr>`;
  }

  const dates = [data.visitDate1, data.visitDate2, data.visitDate3]
    .filter(Boolean)
    .map(formatDate)
    .join('<br/>');

  return `
    <tr style="background-color: #f9fafb;">
      <td style="padding: 10px 14px; font-weight: bold; color: #374151; width: 40%; border: 1px solid #e5e7eb;">Visit Date(s)</td>
      <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${dates}</td>
    </tr>`;
};

const buildCommentsRow = (data: ApplicationNotificationData): string => {
  if (!data.additionalComments?.trim()) return '';
  // Escape before inserting into HTML to prevent markup injection
  const safe = escapeHtml(data.additionalComments);
  return `
    <tr>
      <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Additional Comments</td>
      <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb; white-space: pre-wrap;">${safe}</td>
    </tr>`;
};

export async function sendApplicationNotification(data: ApplicationNotificationData): Promise<void> {
  const subject = `Gate Clearance Application Submitted – ${escapeHtml(data.applicantName)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #111827; border-bottom: 2px solid #111827; padding-bottom: 8px;">
        New Gate Clearance Application Submitted
      </h2>
      <p style="color: #374151; font-size: 15px;">
        A new application has been submitted and is ready for review.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; width: 40%; border: 1px solid #e5e7eb;">Applicant Name</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${escapeHtml(data.applicantName)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Application ID</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb; font-family: monospace;">${escapeHtml(data.applicationId)}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Submitted At</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${new Date(data.submittedAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Email</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${escapeHtml(data.email)}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Phone Number</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${escapeHtml(data.phoneNumber)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Organization</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${escapeHtml(data.companyOrOrganization)}</td>
        </tr>
        ${buildVisitDatesRow(data)}
        ${buildCommentsRow(data)}
      </table>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
        The completed CDCR 2311 form and additional information document have been uploaded to the shared Google Drive folder.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        This is an automated notification from the San Quentin SkunkWorks Gate Clearance System.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Gate Clearance System" <${process.env.GMAIL_USER}>`,
    to: 'clearance@sanquentinskunkworks.org',
   
    subject,
    html,
  });
}
