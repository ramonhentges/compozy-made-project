import { describe, it, expect } from "vitest";
import packageJson from "../../package.json";

describe("Dependencies", () => {
  it("should have zustand in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("zustand");
  });

  it("should have zod in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("zod");
  });

  it("should have @tanstack/react-form in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("@tanstack/react-form");
  });

  it("should have react-hook-form in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("react-hook-form");
  });

  it("should have @hookform/resolvers in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("@hookform/resolvers");
  });

  it("should have class-variance-authority in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("class-variance-authority");
  });

  it("should have clsx in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("clsx");
  });

  it("should have tailwind-merge in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("tailwind-merge");
  });

  it("should have lucide-react in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("lucide-react");
  });

  it("should have @radix-ui/react-slot in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("@radix-ui/react-slot");
  });

  it("should have @radix-ui/react-label in dependencies", () => {
    expect(packageJson.dependencies).toHaveProperty("@radix-ui/react-label");
  });
});

describe("UI Components", () => {
  it("should have button component", async () => {
    const { Button } = await import("@/components/ui/button");
    expect(Button).toBeDefined();
  });

  it("should have input component", async () => {
    const { Input } = await import("@/components/ui/input");
    expect(Input).toBeDefined();
  });

  it("should have label component", async () => {
    const { Label } = await import("@/components/ui/label");
    expect(Label).toBeDefined();
  });

  it("should have card components", async () => {
    const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } = await import(
      "@/components/ui/card"
    );
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardTitle).toBeDefined();
    expect(CardDescription).toBeDefined();
    expect(CardContent).toBeDefined();
    expect(CardFooter).toBeDefined();
  });

  it("should have form components", async () => {
    const { Form, FormField, FormLabel, FormControl, FormMessage } = await import(
      "@/components/ui/form"
    );
    expect(Form).toBeDefined();
    expect(FormField).toBeDefined();
    expect(FormLabel).toBeDefined();
    expect(FormControl).toBeDefined();
    expect(FormMessage).toBeDefined();
  });

  it("should have cn utility", async () => {
    const { cn } = await import("@/lib/utils");
    expect(cn).toBeDefined();
    expect(typeof cn).toBe("function");
  });

  it("should merge classes correctly with cn utility", async () => {
    const { cn } = await import("@/lib/utils");
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });
});