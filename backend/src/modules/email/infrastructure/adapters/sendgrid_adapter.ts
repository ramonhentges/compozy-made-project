import sgMail from '@sendgrid/mail';
import { IEmailService } from '../../domain/services/email_service';
import { EmailMessage } from '../../domain/value_objects/email_template';

export interface SendGridAdapterConfig {
  apiKey: string;
  defaultFrom?: string;
}

export class SendGridAdapter implements IEmailService {
  constructor(private readonly config: SendGridAdapterConfig) {
    sgMail.setApiKey(config.apiKey);
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    const msg = {
      to: message.to,
      from: message.from || this.config.defaultFrom,
      subject: message.subject,
      html: message.html,
      text: message.text,
    };

    if (!msg.from) {
      throw new Error('From address is required: provide it in the message or set defaultFrom in config');
    }

    await sgMail.send(msg);
  }
}
