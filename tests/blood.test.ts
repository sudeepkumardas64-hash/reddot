import { describe, expect, it } from "vitest";
import { canDonateTo, compatibleDonorTypes, daysUntilEligible, distanceKm, fuzz } from "../src/lib/blood";

describe("blood logic", () => {
  it("O- is universal donor, AB+ universal recipient", () => {
    for (const t of ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const) expect(canDonateTo("O-", t)).toBe(true);
    expect(compatibleDonorTypes("AB+")).toHaveLength(8);
    expect(canDonateTo("A+", "O+")).toBe(false);
    expect(canDonateTo("B-", "AB-")).toBe(true);
  });
  it("eligibility gap is 90 days", () => {
    expect(daysUntilEligible("", new Date("2026-10-11"))).toBe(0);
    expect(daysUntilEligible("2026-10-01", new Date("2026-10-11T12:00:00"))).toBe(80);
    expect(daysUntilEligible("2026-06-01", new Date("2026-10-11"))).toBe(0);
  });
  it("distance and fuzzing", () => {
    expect(distanceKm(19.076, 72.8777, 18.5204, 73.8567)).toBeGreaterThan(115);
    expect(distanceKm(19.076, 72.8777, 18.5204, 73.8567)).toBeLessThan(125);
    expect(fuzz(19.07612)).toBe(19.08);
  });
});
