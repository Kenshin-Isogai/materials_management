import { describe, expect, it } from "vitest";

import { formatActionError, resolvePreviewSelection } from "../src/lib/previewState";

describe("previewState helpers", () => {
  it("keeps an explicit null selection instead of falling back to stale preview data", () => {
    const suggested = { entity_id: 7 };

    expect(resolvePreviewSelection({}, 2, suggested)).toBe(suggested);
    expect(resolvePreviewSelection({ 2: null }, 2, suggested)).toBeNull();
  });

  it("formats action errors for consistent in-page messaging", () => {
    expect(formatActionError("Import failed", new Error("row_overrides must be valid JSON"))).toBe(
      "Import failed: row_overrides must be valid JSON"
    );
    expect(formatActionError("Preview failed", "")).toBe("Preview failed");
  });
});
