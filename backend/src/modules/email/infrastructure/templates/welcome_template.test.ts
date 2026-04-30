import { describe, it, expect } from 'vitest';
import { WelcomeTemplate } from './welcome_template';

describe('WelcomeTemplate', () => {
  it('should create template with correct structure', () => {
    const template = WelcomeTemplate.create({ name: 'John Doe' });

    expect(template.name).toBe('welcome');
    expect(template.subject).toBe('Welcome to Acme Corp!');
    expect(template.htmlBody).toBeDefined();
    expect(template.textBody).toBeDefined();
  });

  it('should include name in template', () => {
    const template = WelcomeTemplate.create({ name: 'John Doe' });

    expect(template.htmlBody).toContain('Welcome, John!');
    expect(template.textBody).toContain('Welcome, John!');
  });

  it('should handle missing name gracefully', () => {
    const template = WelcomeTemplate.create({ name: undefined });

    expect(template.htmlBody).toContain('Welcome, there!');
    expect(template.textBody).toContain('Welcome, there!');
  });

  it('should include company branding', () => {
    const template = WelcomeTemplate.create({ name: 'Jane' });

    expect(template.htmlBody).toContain('Acme Corp');
    expect(template.textBody).toContain('Acme Corp Team');
  });
});
