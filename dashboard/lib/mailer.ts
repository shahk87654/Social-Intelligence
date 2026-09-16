import { Resend } from "resend";

export function createMailer() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and REPORT_FROM_EMAIL must be configured.");
  }

  const resend = new Resend(apiKey);
  return {
    sendReport: async (to: string | string[], subject: string, pdf: Buffer, fileName: string, text: string, cc: string[] = []) => {
      const result = await resend.emails.send({
        from,
        to,
        subject,
        text,
        cc: cc.length ? cc : undefined,
        attachments: [{ filename: fileName, content: pdf }],
      });
      if (result.error) throw new Error(result.error.message);
    },
  };
}
