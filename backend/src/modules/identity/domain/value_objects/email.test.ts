import { describe, it, expect } from 'vitest';
import { Email, InvalidEmailError } from '../value_objects/email';

describe('Email', () => {
  describe('validation', () => {
    it('should accept valid email formats', () => {
      expect(() => Email.create('test@example.com')).not.toThrow();
      expect(() => Email.create('user.name@domain.org')).not.toThrow();
      expect(() => Email.create('user+tag@example.co.uk')).not.toThrow();
    });

    it('should reject invalid email formats', () => {
      expect(() => Email.create('')).toThrow(InvalidEmailError);
      expect(() => Email.create('invalid')).toThrow(InvalidEmailError);
      expect(() => Email.create('invalid@')).toThrow(InvalidEmailError);
      expect(() => Email.create('@domain.com')).toThrow(InvalidEmailError);
      expect(() => Email.create('invalid@domain')).toThrow(InvalidEmailError);
      expect(() => Email.create('invalid@domain.com extra')).toThrow(InvalidEmailError);
      expect(() => Email.create('test@.com')).toThrow(InvalidEmailError);
      expect(() => Email.create('test@domain.')).toThrow(InvalidEmailError);
    });
  });

  describe('equality', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('public constructor', () => {
    it('should accept valid parameters via constructor', () => {
      const email = new Email('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should work with equals() for constructor-created instances', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('value', () => {
    it('should return the email value', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });
  });
});
