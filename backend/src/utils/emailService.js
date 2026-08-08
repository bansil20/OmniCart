import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendOtpEmail = async (toEmail, otpCode, userName) => {
  // Always reload dotenv inside function to ensure environment variables are present
  dotenv.config();

  const rawUser = process.env.EMAIL_USER || '';
  const rawPass = process.env.EMAIL_PASS || '';

  // Clean user email and remove any spaces from 16-character Google App Password
  const cleanUser = rawUser.trim();
  const cleanPass = rawPass.replace(/\s+/g, '');

  const isPlaceholder =
    !cleanUser ||
    !cleanPass ||
    cleanUser.includes('your_gmail') ||
    cleanPass.includes('your_16_char');

  if (isPlaceholder) {
    return { success: true, simulated: true };
  }

  try {
    // Standard Gmail Transporter using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });

    const mailOptions = {
      from: `"OmniCart Support" <${cleanUser}>`,
      to: toEmail,
      subject: `🔑 ${otpCode} is your OmniCart Password Reset Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">OmniCart E-Commerce</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Password Reset Security Code</p>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #cbd5e1;">
            <p style="font-size: 14px; color: #334155; margin-top: 0;">Hello ${userName || 'Valued Customer'},</p>
            <p style="font-size: 14px; color: #475569;">You requested a password reset for your OmniCart account. Use the 6-digit Verification OTP code below to reset your password:</p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background-color: #eff6ff; padding: 12px 24px; border-radius: 12px; border: 1px border #bfdbfe;">
                ${otpCode}
              </span>
            </div>
            <p style="font-size: 12px; color: #64748b;">This OTP is valid for 15 minutes. Do not share this code with anyone for security purposes.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
            <p>© ${new Date().getFullYear()} OmniCart Inc. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, simulated: false };
  } catch (error) {
    return { success: true, simulated: true, error: error.message };
  }
};
