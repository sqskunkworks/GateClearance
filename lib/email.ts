/**
 * Email notification utility using Nodemailer + Gmail SMTP
 * 
 * Setup required:
 * 1. Add to .env.local:
 *    GMAIL_USER=yourname@sanquentinskunkworks.org
 *    GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 * 
 * 2. Install nodemailer:
 *    npm install nodemailer
 *    npm install --save-dev @types/nodemailer
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
  purposeOfVisit?: string;
  governmentIdType: string;
  formerInmate: boolean;
  onParole: boolean;
}

export async function sendApplicationNotification(data: ApplicationNotificationData): Promise<void> {
  const subject = `New Gate Clearance Application – ${data.applicantName}`;

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
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${data.applicantName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Application ID</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb; font-family: monospace;">${data.applicationId}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Submitted At</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${new Date(data.submittedAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Email</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${data.email}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Phone Number</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${data.phoneNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Organization</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${data.companyOrOrganization}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Purpose of Visit</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${data.purposeOfVisit || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">ID Type</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${data.governmentIdType === 'driver_license' ? "Driver's License" : 'Passport'}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">Former Inmate</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${data.formerInmate ? 'Yes' : 'No'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">On Parole</td>
          <td style="padding: 10px 14px; color: #111827; border: 1px solid #e5e7eb;">${data.onParole ? 'Yes' : 'No'}</td>
        </tr>
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
    to: 'yasmine@sanquentinskunkworks.org',
    subject,
    html,
  });
}