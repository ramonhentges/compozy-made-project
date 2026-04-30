import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { SendWelcomeEmailHandler } from './handler';
import { SendGridAdapter } from '../../infrastructure/adapters/sendgrid_adapter';
import { WelcomeTemplate } from '../../infrastructure/templates/welcome_template';

const sendGridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@acme-corp.com';
const fromName = process.env.EMAIL_FROM_NAME || 'Acme Corp';

const describeWithSendGrid = sendGridApiKey ? describe : describe.skip;

describeWithSendGrid('SendWelcomeEmailHandler integration with SendGrid sandbox', () => {
  let handler: SendWelcomeEmailHandler;
  let sendGridAdapter: SendGridAdapter;

  beforeAll(() => {
    sendGridAdapter = new SendGridAdapter({
      apiKey: sendGridApiKey!,
      fromEmail,
      fromName,
    });

    handler = new SendWelcomeEmailHandler({
      emailService: sendGridAdapter,
      fromEmail,
      fromName,
    });
  });

  it('should send welcome email via SendGrid sandbox mode', async () => {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sendGridApiKey!);

    const testEmail = 'test@example.com';

    await expect(
      handler.execute({
        email: testEmail,
        name: 'Test User',
      })
    ).resolves.not.toThrow();
  });

  it('should render welcome template correctly', () => {
    const template = WelcomeTemplate.create({ name: 'John Doe' });

    expect(template.subject).toBe('Welcome to Acme Corp!');
    expect(template.htmlBody).toContain('Welcome, John!');
    expect(template.textBody).toContain('Welcome, John!');
  });

  it('should handle missing name gracefully', () => {
    const template = WelcomeTemplate.create({ name: undefined });

    expect(template.htmlBody).toContain('Welcome, there!');
    expect(template.textBody).toContain('Welcome, there!');
  });
});
