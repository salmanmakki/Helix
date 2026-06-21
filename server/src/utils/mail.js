const nodemailer = require('nodemailer');

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'throwaway.email', 'sharklasers.com', 'trashmail.com', 'yopmail.com',
  'maildrop.cc', 'getairmail.com', 'temp-mail.org', 'fakeinbox.com',
  'mailnator.com', 'dispostable.com', 'mailnesia.com', 'tempinbox.com',
  'spamgourmet.com', 'mytemp.email', 'tempemail.net', 'mail.tm',
  'tempr.email', 'emailondeck.com', 'burner.kiwi', 'mohmal.com',
  'guerrillamail.org', 'guerrillamail.net', 'guerrillamail.biz',
  'guerrillamailblock.com', 'grr.la', 'dodgeit.com', 'mailmetrash.com',
  'mailexpire.com', 'sneakemail.com', 'spambox.us', 'tempomail.com',
  'throwawayemail.com', 'temporaryforwarding.com', 'tempmail.net',
  'tempail.com', 'tempmailo.com', 'fakemailgenerator.com', 'mailcatch.com',
  'mintemail.com', 'mytrashmail.com', 'pookmail.com', 'spamfree24.org',
  'trash2009.com', 'trashymail.net', 'tyldd.com', 'wegwerfmail.de',
  'wh4f.org', 'zippymail.info', 'spam.la', 'spamsoap.com',
  'thankyou2010.com', 'trash-me.net', 'trash2009.com', 'mt2009.com',
  'trashymail.com', 'slopsbox.com', 'sogetthis.com', 'filzmail.com',
  'recyclemail.dk', 'spambog.com', 'maileater.com', 'mailexpire.com',
  'mailmoat.com', 'mailnull.com', 'mailshell.com', 'mailline.net',
  'mailin8r.com', 'maileater.com', 'emailias.com', 'eyah.com.ua',
  'flashmail.com', 'friendlymail.co.uk', 'hotpop.com', 'inboxalias.com',
  'inoutbox.com', 'jetable.org', 'junque.com', 'kaspop.com',
  'mail-tester.com', 'mail.by', 'mailhaven.com', 'mailpothole.com',
  'mailshiv.com', 'myspamless.com', 'nervmich.net', 'netmails.net',
  'netzidiot.de', 'neverbox.com', 'nobulk.com', 'nomail.xl.cx',
  'nospam4.us', 'nospamfor.us', 'nxt.ru', 'oneoffemail.com',
  'opayq.com', 'pcusers.otherinbox.com', 'poofy.org', 'privacy.net',
  'punkass.com', 'receivemail.co.uk', 'reuse.com', 'runbox.com',
  'safetymail.info', 'satch.xyz', 'secretemail.de', 'sendspamhere.com',
  'shiftmail.com', 'slickr.co', 'sneakemail.com', 'sogetthis.com',
  'solvemail.info', 'spam4.me', 'spamail.de', 'spamarrest.com',
  'spamcero.com', 'spamcon.org', 'spamcorptastic.com', 'spamcowboy.com',
  'spamex.com', 'spamfree24.com', 'spamfree24.eu', 'spamfree24.info',
  'spamfree24.net', 'spamfree24.org', 'spamgourmet.com', 'spamhole.com',
  'spaminator.de', 'spamkill.info', 'spaml.com', 'spamoff.de',
  'spamslicer.com', 'spamstack.net', 'spamthis.co.uk', 'spamtrail.com',
  'speed.1s.fr', 'supergreatmail.com', 'teewars.org', 'teleworm.com',
  'tempalias.com', 'tempemail.co', 'tempemail.com', 'tempinbox.co.uk',
  'temporarioemail.com.br', 'temporaryemail.net', 'temporaryemail.us',
  'temporaryforwarding.com', 'temporaryinbox.com', 'thanksnospam.info',
  'thankyou2010.com', 'thisisnotmyrealemail.com', 'throwaway.email',
  'throwawayemailaddress.com', 'tittibit.net', 'toomail.biz',
  'trash2009.com', 'trash-2009.com', 'trashemail.de', 'trashmail.at',
  'trashmail.com', 'trashmail.me', 'trashmail.net', 'trashmail.org',
  'trashymail.com', 'trashymail.net', 'tyldd.com', 'uggsrock.com',
  'uniqmail.com', 'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'wh4f.org', 'whyspam.me', 'willselfdestruct.com', 'winemaven.info',
  'wronghead.com', 'wuzup.net', 'xagloo.com', 'xemaps.com',
  'xents.com', 'xmaily.com', 'xoxy.net', 'yep.it', 'yogamaven.com',
  'yopmail.com', 'ypmail.webarnak.fr.eu.org', 'yuurok.com', 'zehnminutenmail.de',
  'zippymail.info', 'zoaxe.com', 'zoemail.org'
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
      connectionTimeout: 10000, // 10s to establish connection
      socketTimeout: 15000,     // 15s for socket inactivity
      greetingTimeout: 10000    // 10s for SMTP greeting
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
    console.log(`║  OTP:  ${otp.padEnd(36)}║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    return { sent: true, mode: 'dev' };
  }

  try {
    await transporter.sendMail({
      from: `"Helix" <${process.env.SMTP_FROM || 'noreply@helixprep.com'}>`,
      to,
      subject: 'Your Helix verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">Helix</h1>
          <p>Hi ${name},</p>
          <p>Enter this code to verify your email address and activate your account:</p>
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; text-align: center; padding: 24px; background: #f5f5f5; margin: 16px 0; font-family: monospace;">${otp}</div>
          <p style="color: #666; font-size: 13px;">This code expires in 10 minutes.</p>
          <p style="color: #666; font-size: 13px;">If you didn't create an account, you can ignore this email.</p>
        </div>
      `
    });
    return { sent: true };
  } catch (err) {
    console.error(`[SMTP] Failed to send OTP to ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  isDisposableEmail,
  sendVerificationOtp
};
