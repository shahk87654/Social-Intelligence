import nodemailer from "nodemailer";

export function createMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.REPORT_FROM_EMAIL || user;

  if (!host || !user || !password || !from) {
    throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and REPORT_FROM_EMAIL must be configured.");
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
    }),
    from,
  };
}
