import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: `"Schoolyard" <${process.env.GMAIL_USER}>`,
    to: to,
    subject,
    html,
  });

  console.log("Email message sent: %s", info.messageId);
}

export async function sendForgetPasswordEmail(
  to: string,
  firstName: string,
  token: string
) {
  const emailHtml = `<p>Hi ${firstName},</p>\
    <p>You've recently requested to change your password on your Schoolyard account. <p>\
    <p>You can reset your Schoolyard account password by clicking on the following link:\
      <a href="${process.env.CORS_ORIGIN}/change-password/${token}">\
      ${process.env.CORS_ORIGIN}/change-password/${token}\
      </a>\
    </p>\
    <p>Best,<br>Schoolyard<br>\
      <a href = "mailto:schoolyardinfo@gmail.com">schoolyardinfo@gmail.com</a>\
    </p>`;

  await sendEmail(to, "Schoolyard Login Password Change", emailHtml);
}
