import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../api/auth.schemas";

describe("registerSchema", () => {
  it("happy path: valid register input passes", () => {
    const validInput = {
      email: "test@example.com",
      name: "John Doe",
      password: "password123",
    };
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("error path: invalid email format fails", () => {
    const invalidInput = {
      email: "not-an-email",
      name: "John Doe",
      password: "password123",
    };
    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("edge case: name too short fails", () => {
    const invalidInput = {
      email: "test@example.com",
      name: "J",
      password: "password123",
    };
    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("edge case: name too long fails", () => {
    const invalidInput = {
      email: "test@example.com",
      name: "J".repeat(101),
      password: "password123",
    };
    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("edge case: password too short fails", () => {
    const invalidInput = {
      email: "test@example.com",
      name: "John Doe",
      password: "pass",
    };
    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });

  it("edge case: missing email fails", () => {
    const invalidInput = {
      name: "John Doe",
      password: "password123",
    };
    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("edge case: missing name fails", () => {
    const invalidInput = {
      email: "test@example.com",
      password: "password123",
    };
    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("edge case: missing password fails", () => {
    const invalidInput = {
      email: "test@example.com",
      name: "John Doe",
    };
    const result = registerSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("happy path: valid login input passes", () => {
    const validInput = {
      email: "test@example.com",
      password: "password123",
    };
    const result = loginSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("error path: invalid email format fails", () => {
    const invalidInput = {
      email: "not-an-email",
      password: "password123",
    };
    const result = loginSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("edge case: empty password fails", () => {
    const invalidInput = {
      email: "test@example.com",
      password: "",
    };
    const result = loginSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });

  it("edge case: missing email fails", () => {
    const invalidInput = {
      password: "password123",
    };
    const result = loginSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("edge case: missing password fails", () => {
    const invalidInput = {
      email: "test@example.com",
    };
    const result = loginSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});