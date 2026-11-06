import { describe, expect, it } from "vitest";
import {
  convertDashedToCapitalized,
  convertTo24HourFormat,
  getAdjacentDate,
} from "./index";

describe("utils", () => {
  it("capitalizes dashed words", () => {
    expect(convertDashedToCapitalized("home")).toBe("Home");
    expect(convertDashedToCapitalized("eating-out")).toBe("Eating Out");
  });

  it("converts 12-hour times to 24-hour", () => {
    expect(convertTo24HourFormat("12:05 AM")).toBe("00:05");
    expect(convertTo24HourFormat("1:30 PM")).toBe("13:30");
    expect(convertTo24HourFormat("25:00")).toBeNull();
  });

  it("moves to the adjacent date across month boundaries", () => {
    expect(getAdjacentDate("2024-02-28", "next")).toBe("2024-02-29");
    expect(getAdjacentDate("2024-03-01", "prev")).toBe("2024-02-29");
    expect(() => getAdjacentDate("nope", "next")).toThrow();
  });
});
