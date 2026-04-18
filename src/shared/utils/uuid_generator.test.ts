import { describe, it, expect } from 'vitest';
import { generateUuid } from './uuid_generator';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateUuid', () => {
  it('should return a valid UUID v4 string', () => {
    const uuid = generateUuid();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it('should return unique UUIDs on multiple calls', () => {
    const uuid1 = generateUuid();
    const uuid2 = generateUuid();
    const uuid3 = generateUuid();

    expect(uuid1).not.toBe(uuid2);
    expect(uuid2).not.toBe(uuid3);
    expect(uuid1).not.toBe(uuid3);
  });

  it('should return strings of correct length', () => {
    const uuid = generateUuid();
    expect(uuid.length).toBe(36);
  });

  it('should return lowercase hexadecimal characters', () => {
    const uuid = generateUuid();
    expect(uuid).toBe(uuid.toLowerCase());
    expect(UUID_V4_REGEX.test(uuid)).toBe(true);
  });
});