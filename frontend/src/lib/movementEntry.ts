type MovementEntryLocationFields = {
  from_location: string;
  to_location: string;
};

export function getNextMovementEntryLocations(
  rows: MovementEntryLocationFields[],
): MovementEntryLocationFields {
  const previousRow = [...rows]
    .reverse()
    .find((row) => row.from_location.trim() && row.to_location.trim());

  return {
    from_location: previousRow?.from_location.trim() || "STOCK",
    to_location: previousRow?.to_location.trim() || "",
  };
}
