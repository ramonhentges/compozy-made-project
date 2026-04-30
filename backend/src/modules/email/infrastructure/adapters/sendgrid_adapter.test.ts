import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendGridAdapter } from './sendgrid_adapter';
import { EmailMessage } from '../../domain/value_objects/email_template';

vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

import sgMail from '@sendgrid/mail';

describe('SendGridAdapter', () => {
  let adapter: SendGridAdapter;
  const mockConfig = {
    apiKey: 'test-api-key',
    defaultFrom: 'noreply@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SendGridAdapter(mockConfig);
  });

  describe('sendEmail', () => {
    it('should send an email with provided from address', async () => {
      const message: EmailMessage = {
        to: 'user@example.com',
        from: 'custom@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      };

      await adapter.sendEmail(message);

      expect(sgMail.send).toHaveBeenCalledWith({
        to: 'user@example.com',
        from: 'custom@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });
    });

    it('should use default from address when not provided', async () => {
      const message: EmailMessage = {
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      await adapter.sendEmail(message);

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          from: 'noreply@example.com',
          subject: 'Test Subject',
        })
      );
    });

    it('should set API key on construction', () => {
      expect(sgMail.setApiKey).toHaveBeenCalledWith('test-api-key');
    });

    it('should propagate SendGrid errors', async () => {
      const error = new Error('SendGrid error');
      vi.mocked(sgMail.send).mockRejectedValueOnce(error);

      const message: EmailMessage = {
        to: 'user@example.com',
        subject: 'Test',
      };

      await expect(adapter.sendEmail(message)).rejects.toThrow('SendGrid error');
    });
  });
});
