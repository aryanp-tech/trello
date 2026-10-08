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

// Send board/card invitation email
const sendBoardInviteEmail = async ({ recipient, inviterName, boardTitle, cardTitle, inviteUrl }) => {
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

  const subject = cardTitle
    ? `${inviterName} invited you to collaborate on "${cardTitle}" (${boardTitle})`
    : `${inviterName} invited you to a board`;

  const mainHeading = cardTitle
    ? `${inviterName} invited you to collaborate on "${cardTitle}"`
    : `${inviterName} invited you to join ${boardTitle}`;

  const subText = cardTitle
    ? `You have been invited to work on the card "${cardTitle}" on the board "${boardTitle}". You will be able to edit, comment, and collaborate directly.`
    : `Use the button below to accept this board invitation.`;

  return transporter.sendMail({
    from: sender,
    to: destination,
    subject,
    text: `${mainHeading}. ${subText} Accept here: ${inviteUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202124">
        <h2>${mainHeading}</h2>
        <p>${subText}</p>
        <div style="margin:20px 0;">
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#5798f5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Accept & Collaborate</a>
        </div>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">This invitation expires in 7 days.</p>
      </div>
    `,
  });
};

// Send notification when an existing user is assigned to a card
const sendCardAssignmentEmail = async ({ recipient, assignerName, boardTitle, cardTitle, cardUrl }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  const sender = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER.trim();
  const destination = recipient?.trim();
  if (!destination) return;

  const subject = cardTitle
    ? `${assignerName} added you to card "${cardTitle}" (${boardTitle})`
    : `${assignerName} added you to board ${boardTitle}`;

  return transporter.sendMail({
    from: sender,
    to: destination,
    subject,
    text: `${assignerName} added you to "${cardTitle || boardTitle}". Open: ${cardUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202124">
        <h2>${assignerName} added you to "${cardTitle || boardTitle}"</h2>
        <p>You can now view, edit, and comment on this card.</p>
        <div style="margin:20px 0;">
          <a href="${cardUrl}" style="display:inline-block;padding:12px 20px;background:#5798f5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">View Card</a>
        </div>
      </div>
    `,
  }).catch((err) => console.warn('Card assignment email failed:', err.message));
};


// Send notification when a user is mentioned in a card comment
const sendCardMentionEmail = async ({ recipient, mentionerName, boardTitle, cardTitle, commentText, cardUrl }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  const sender = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER.trim();
  const destination = recipient?.trim();
  if (!destination) return;

  const subject = `${mentionerName} mentioned you in "${cardTitle}" (${boardTitle})`;

  return transporter.sendMail({
    from: sender,
    to: destination,
    subject,
    text: `${mentionerName} mentioned you in a comment on "${cardTitle}" (${boardTitle}):\n\n"${commentText}"\n\nOpen card: ${cardUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202124">
        <h2 style="color:#1e293b;margin-bottom:12px">${mentionerName} mentioned you</h2>
        <p style="font-size:15px;color:#475569;margin-bottom:16px">
          You were mentioned in a comment on <strong>"${cardTitle}"</strong> in board <strong>${boardTitle}</strong>:
        </p>
        <blockquote style="margin:0 0 20px 0;padding:12px 16px;background:#f8fafc;border-left:4px solid #3b82f6;color:#334155;font-style:normal;border-radius:4px">
          ${commentText}
        </blockquote>
        <div style="margin:24px 0;">
          <a href="${cardUrl}" style="display:inline-block;padding:12px 22px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Open Card</a>
        </div>
        <p style="margin-top:24px;color:#94a3b8;font-size:12px">
          If the button doesn't work, copy and paste this link into your browser: <br/>
          <a href="${cardUrl}" style="color:#2563eb">${cardUrl}</a>
        </p>
      </div>
    `,
  }).catch((err) => console.warn('Card mention email failed:', err.message));
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
  sendCardAssignmentEmail,
  sendCardMentionEmail,
  sendPasswordResetEmail,
};

