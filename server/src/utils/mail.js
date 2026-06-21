const nodemailer = require('nodemailer');

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com'
];

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 60000,
      socketTimeout: 60000,
      greetingTimeout: 30000
    });
  }

  return null;
}

async function sendVerificationOtp(to, otp, name) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║         DEV MODE — VERIFICATION OTP         ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  ${to.padEnd(40)}║`);
    console.log(`║  OTP: ${otp.padEnd(37)}║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    return { sent: true, mode: 'dev' };
  }

  try {
    console.log('SMTP CONFIG:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER
    });

    await transporter.verify();
    console.log('SMTP VERIFIED');

    await transporter.sendMail({
      from: `"Helix" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: 'Your Helix verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
          <h1>Helix</h1>
          <p>Hi ${name},</p>
          <p>Your verification code is:</p>

          <div style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            background: #f5f5f5;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>This code expires in 10 minutes.</p>
        </div>
      `
    });

    console.log('EMAIL SENT SUCCESSFULLY');

    return { sent: true };

  } catch (err) {
    console.error('SMTP ERROR FULL:', err);
    return {
      sent: false,
      error: err.message
    };
  }
}

module.exports = {
  isDisposableEmail,
  sendVerificationOtp
};
