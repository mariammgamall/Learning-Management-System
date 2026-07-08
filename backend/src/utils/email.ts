import * as nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const isSmtpConfigured =
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS;

    if (isSmtpConfigured) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '2525'),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"LMS Platform" <noreply@lms-platform.com>',
        to,
        subject,
        html,
      });

      console.log(`[Email Sent] MessageID: ${info.messageId} to ${to}`);
      return info;
    } else {
      console.log('==================================================');
      console.log(`[MOCK EMAIL SENT]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body (HTML):\n${html}`);
      console.log('==================================================');
      return { messageId: 'mock-id-' + Date.now() };
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
