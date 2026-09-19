import { Resend } from "resend";
import { getIntegrationKey } from "@/lib/integrations";

export async function createMailer(organizationId?: number) {
  const apiKey = organizationId ? await getIntegrationKey(organizationId, "resend") : process.env.RESEND_API_KEY;
  const from = process.env.REPORT_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("A Resend API key and REPORT_FROM_EMAIL must be configured.");
  }

  const resend = new Resend(apiKey);
  return {
    sendAuthEmail: async (to: string, subject: string, text: string) => {
      const result = await resend.emails.send({ from, to, subject, text });
      if (result.error) throw new Error(result.error.message);
    },
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
