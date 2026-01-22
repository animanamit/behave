import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("px-2", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle conditional classes", () => {
    const result = cn("px-2", false && "py-1", "text-sm");
    expect(result).toBe("px-2 text-sm");
  });

  it("should merge Tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toContain("px-4"); // px-4 should override px-2
  });

  it("should handle array inputs", () => {
    const result = cn(["px-2", "py-1"]);
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("should filter out undefined and null values", () => {
    const result = cn("px-2", undefined, null, "py-1");
    expect(result).toBe("px-2 py-1");
  });
});
