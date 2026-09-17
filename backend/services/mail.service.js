const nodemailer = require('nodemailer');

const smtpPort = Number(process.env.SMTP_PORT || 587);

// transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: smtpPort,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send board invitation email
const sendBoardInviteEmail = async ({ recipient, inviterName, boardTitle, inviteUrl }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const configurationError = new Error('SMTP_USER or SMTP_PASS is missing');
    configurationError.code = 'ESMTPCONFIG';
    throw configurationError;
  }

  const sender = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER.trim();
  const destination = recipient?.trim();

  if (!destination) {
    const recipientError = new Error('Invitation recipient email is required');
    recipientError.code = 'EINVALIDRECIPIENT';
    throw recipientError;
  }

  return transporter.sendMail({
    from: sender,
    to: destination,
    subject: `${inviterName} invited you to a board`,
    text: `${inviterName} invited you to join "${boardTitle}". Accept the invitation here: ${inviteUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202124">
        <h2>${inviterName} invited you to join ${boardTitle}</h2>
        <p>Use the button below to accept this board invitation.</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 18px;background:#5798f5;color:#fff;text-decoration:none;border-radius:6px">Accept invitation</a>
        <p style="margin-top:24px;color:#6b7280">This invitation expires in 7 days.</p>
      </div>
    `,
  });
};


// Send password reset email
const sendPasswordResetEmail = async ({ recipient, resetUrl }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const configurationError = new Error('SMTP_USER or SMTP_PASS is missing');
    configurationError.code = 'ESMTPCONFIG';
    throw configurationError;
  }

  const sender = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER.trim();
  return transporter.sendMail({
    from: sender,
    to: recipient.trim(),
    subject: 'Reset your password',
    text: `Reset your password here: ${resetUrl}. This link expires in 30 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202124">
        <h2>Reset your password</h2>
        <p>Click the button below to create a new password.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#5798f5;color:#fff;text-decoration:none;border-radius:6px">Reset password</a>
        <p style="margin-top:24px;color:#6b7280">This link expires in 30 minutes and can be used only once.</p>
      </div>
    `,
  });
};

module.exports = {
  sendBoardInviteEmail,
  sendPasswordResetEmail,
};
