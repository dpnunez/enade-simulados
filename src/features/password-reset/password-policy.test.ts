import { describe, expect, it } from "vitest";

import {
  getPasswordRequirementStates,
  isPasswordCompliant,
} from "./password-policy";

describe("password-policy", () => {
  it("marks every requirement as met for compliant passwords", () => {
    const states = getPasswordRequirementStates("Password-123");

    expect(states.every((state) => state.isMet)).toBe(true);
    expect(isPasswordCompliant("Password-123")).toBe(true);
  });

  it("reports unmet requirements for weak passwords", () => {
    const states = getPasswordRequirementStates("password123");

    expect(states.filter((state) => !state.isMet).map((state) => state.id)).toEqual([
      "uppercase",
      "special",
    ]);
    expect(isPasswordCompliant("password123")).toBe(false);
  });
});
