import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendWelcomeEmailHandler } from './handler';
import { IEmailService } from '../../domain/services/email_service';
import { EmailMessage } from '../../domain/value_objects/email_template';

describe('SendWelcomeEmailHandler', () => {
  const validEmail = 'test@example.com';
  const validName = 'John Doe';
  const fromEmail = 'noreply@acmecorp.com';
  const fromName = 'Acme Corp';

  let mockEmailService: IEmailService;
  let handler: SendWelcomeEmailHandler;

  beforeEach(() => {
    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    };

    handler = new SendWelcomeEmailHandler({
      emailService: mockEmailService,
      fromEmail,
      fromName,
    });
  });

  describe('execute', () => {
    it('should send welcome email with correct parameters', async () => {
      await handler.execute({
        email: validEmail,
        name: validName,
      });

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: validEmail,
          from: `${fromName} <${fromEmail}>`,
          subject: 'Welcome to Acme Corp!',
        })
      );
    });

    it('should include html and text body from template', async () => {
      await handler.execute({
        email: validEmail,
        name: validName,
      });

      const calledWith = mockEmailService.sendEmail.mock.calls[0][0] as EmailMessage;
      expect(calledWith.html).toContain('Welcome, John!');
      expect(calledWith.text).toContain('Welcome, John!');
    });

    it('should handle name with fallback when not provided', async () => {
      await handler.execute({
        email: validEmail,
      });

      const calledWith = mockEmailService.sendEmail.mock.calls[0][0] as EmailMessage;
      expect(calledWith.html).toContain('Welcome, there!');
    });

    it('should propagate errors from email service', async () => {
      mockEmailService.sendEmail = vi.fn().mockRejectedValue(new Error('SendGrid error'));

      await expect(
        handler.execute({
          email: validEmail,
          name: validName,
        })
      ).rejects.toThrow('SendGrid error');
    });
  });
});
