import { EmailTemplate } from '../value_objects/email_template';

export class WelcomeTemplate {
  private static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static create(data: { name?: string }): EmailTemplate {
    const rawFirstName = data.name?.split(' ')[0] || 'there';
    const firstName = this.escapeHtml(rawFirstName);

    return {
      name: 'welcome',
      subject: 'Welcome to Acme Corp!',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome, ${firstName}!</h1>
          <p>Thank you for registering with Acme Corp.</p>
          <p>We're excited to have you on board. Get started by exploring our platform.</p>
          <p>Best regards,<br>The Acme Corp Team</p>
        </div>
      `,
      textBody: `Welcome, ${firstName}!\n\nThank you for registering with Acme Corp.\n\nWe're excited to have you on board. Get started by exploring our platform.\n\nBest regards,\nThe Acme Corp Team`,
    };
  }
}
