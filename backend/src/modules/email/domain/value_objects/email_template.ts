export interface EmailTemplate {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  templateName?: string;
  templateData?: Record<string, unknown>;
}
