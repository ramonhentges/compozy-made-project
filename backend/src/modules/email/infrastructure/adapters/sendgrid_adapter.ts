import sgMail from '@sendgrid/mail';
import { IEmailService } from '../../domain/services/email_service';
import { EmailMessage } from '../../domain/value_objects/email_template';

export interface SendGridAdapterConfig {
  apiKey: string;
  defaultFrom?: string;
  sandboxMode?: boolean;
}

export class SendGridAdapter implements IEmailService {
  constructor(private readonly config: SendGridAdapterConfig) {
    sgMail.setApiKey(config.apiKey);
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    const from = message.from || this.config.defaultFrom;

    if (!from) {
      throw new Error('From address is required: provide it in the message or set defaultFrom in config');
    }

    const msg = {
      to: message.to,
      from,
      subject: message.subject,
      html: message.html,
      text: message.text,
      mailSettings: this.config.sandboxMode ? { sandboxMode: { enable: true } } : undefined,
    };

    await sgMail.send(msg as Parameters<typeof sgMail.send>[0]);
  }
}
