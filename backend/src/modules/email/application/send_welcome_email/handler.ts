import { SendWelcomeEmailCommand } from './command';
import { ISendWelcomeEmailUseCase } from './port';
import { IEmailService } from '../../domain/services/email_service';
import { EmailMessage } from '../../domain/value_objects/email_template';
import { WelcomeTemplate } from '../../infrastructure/templates/welcome_template';

export interface SendWelcomeEmailDeps {
  emailService: IEmailService;
  fromEmail: string;
  fromName: string;
}

export class SendWelcomeEmailHandler implements ISendWelcomeEmailUseCase {
  private readonly emailService: IEmailService;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(deps: SendWelcomeEmailDeps) {
    this.emailService = deps.emailService;
    this.fromEmail = deps.fromEmail;
    this.fromName = deps.fromName;
  }

  async execute(command: SendWelcomeEmailCommand): Promise<void> {
    const template = WelcomeTemplate.create({
      name: command.name,
    });

    const message: EmailMessage = {
      to: command.email,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
    };

    await this.emailService.sendEmail(message);
  }
}
