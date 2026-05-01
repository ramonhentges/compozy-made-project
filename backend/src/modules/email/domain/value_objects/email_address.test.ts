import { describe, it, expect } from 'vitest';
import { EmailAddress, InvalidEmailAddressError } from './email_address';

describe('EmailAddress', () => {
  describe('create', () => {
    it('should create a valid email address', () => {
      const email = EmailAddress.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should convert email to lowercase', () => {
      const email = EmailAddress.create('TEST@EXAMPLE.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw InvalidEmailAddressError for invalid email', () => {
      expect(() => EmailAddress.create('invalid-email')).toThrow(InvalidEmailAddressError);
    });

    it('should throw InvalidEmailAddressError for empty string', () => {
      expect(() => EmailAddress.create('')).toThrow(InvalidEmailAddressError);
    });

    it('should accept valid complex email addresses', () => {
      const email = EmailAddress.create('user.name+tag@example.co.uk');
      expect(email.value).toBe('user.name+tag@example.co.uk');
    });
  });

  describe('equals', () => {
    it('should return true for same email addresses', () => {
      const email1 = EmailAddress.create('test@example.com');
      const email2 = EmailAddress.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different email addresses', () => {
      const email1 = EmailAddress.create('test1@example.com');
      const email2 = EmailAddress.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should be case insensitive for equality', () => {
      const email1 = EmailAddress.create('Test@Example.COM');
      const email2 = EmailAddress.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('value getter', () => {
    it('should return the email value', () => {
      const email = EmailAddress.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });
  });
});
