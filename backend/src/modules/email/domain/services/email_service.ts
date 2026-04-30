import { EmailMessage } from '../value_objects/email_template';

export interface IEmailService {
  sendEmail(message: EmailMessage): Promise<void>;
}
