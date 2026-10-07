const nodemailer = require('nodemailer');
const prisma = require('../prisma');

const getSmtpConfig = async () => {
  const settings = await prisma.settings.findMany({
    where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'] } }
  });
  const map = {};
  settings.forEach(s => map[s.key] = s.value);
  return {
    host: map.smtp_host || process.env.SMTP_HOST || '',
    port: parseInt(map.smtp_port || process.env.SMTP_PORT || '587'),
    user: map.smtp_user || process.env.SMTP_USER || '',
    pass: map.smtp_pass || process.env.SMTP_PASS || '',
    from: map.smtp_from || process.env.SMTP_FROM || 'noreply@believoo.com',
  };
};

const createTransporter = async () => {
  const config = await getSmtpConfig();
  if (!config.host || !config.user || !config.pass) {
    console.warn('[EmailService] SMTP not configured. Emails will be logged but not sent.');
    return null;
  }
  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const config = await getSmtpConfig();
  const transporter = await createTransporter();
  
  if (!transporter) {
    console.log(`[EmailService] Would send to ${to}: ${subject}`);
    return { messageId: 'mock-' + Date.now() };
  }

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error.message);
    throw error;
  }
};

const sendVerificationEmail = async (email, token, name) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://we.believoo.com';
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: 'Verify your BelieVoo Cloud account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f0f0f; color: #fff; border-radius: 12px;">
        <h2 style="color: #00f0ff;">Welcome to BelieVoo Cloud, ${name || 'User'}!</h2>
        <p style="color: #ccc;">Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #00f0ff; color: #000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #666; font-size: 12px;">Or copy this link: ${verifyUrl}</p>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
    text: `Welcome to BelieVoo Cloud! Please verify your email by visiting: ${verifyUrl}`,
  });
};

const sendTeamInvitationEmail = async (email, token, inviterName, permissions) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://we.believoo.com';
  const acceptUrl = `${frontendUrl}/team/accept?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to their BelieVoo Cloud team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f0f0f; color: #fff; border-radius: 12px;">
        <h2 style="color: #00f0ff;">Team Invitation</h2>
        <p style="color: #ccc;"><strong>${inviterName}</strong> has invited you to access their cloud account with the following permissions:</p>
        <ul style="color: #00f0ff;">
          ${permissions.map(p => `<li>${p.replace(/_/g, ' ')}</li>`).join('')}
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="background: #00f0ff; color: #000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 12px;">This invitation expires in 7 days.</p>
      </div>
    `,
    text: `${inviterName} invited you to their team. Accept: ${acceptUrl}`,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendTeamInvitationEmail };
