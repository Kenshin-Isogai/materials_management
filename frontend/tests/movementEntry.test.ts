import { describe, expect, it } from "vitest";

import { getNextMovementEntryLocations } from "../src/lib/movementEntry";

describe("movementEntry helpers", () => {
  it("inherits locations from the latest completed row", () => {
    expect(
      getNextMovementEntryLocations([
        { from_location: "STOCK", to_location: "LAB-A" },
        { from_location: "STOCK", to_location: "" },
      ]),
    ).toEqual({
      from_location: "STOCK",
      to_location: "LAB-A",
    });
  });

  it("falls back to the default movement locations when no completed row exists", () => {
    expect(
      getNextMovementEntryLocations([
        { from_location: "STOCK", to_location: "" },
        { from_location: "", to_location: "" },
      ]),
    ).toEqual({
      from_location: "STOCK",
      to_location: "",
    });
  });
});
