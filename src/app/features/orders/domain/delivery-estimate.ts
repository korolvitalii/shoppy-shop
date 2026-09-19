/**
 * Standard delivery promise: the parcel leaves the warehouse and arrives within this many
 * working days. The backend does not carry the window on the order yet, so the storefront
 * derives it from the order date — keep both sides in step if the promise ever changes.
 */
const MIN_WORKING_DAYS = 3;
const MAX_WORKING_DAYS = 5;

/** The earliest and latest working day a standard-delivery order is expected to arrive. */
export function estimateArrivalWindow(createdAt: string | null | undefined): [Date, Date] | null {
  if (!createdAt) return null;
  const placed = new Date(createdAt);
  if (Number.isNaN(placed.getTime())) return null;
  // Nothing is picked over the weekend, so the count starts on the next working day.
  const from = nextWorkingDay(
    new Date(Date.UTC(placed.getUTCFullYear(), placed.getUTCMonth(), placed.getUTCDate(), 12)),
  );
  return [addWorkingDays(from, MIN_WORKING_DAYS), addWorkingDays(from, MAX_WORKING_DAYS)];
}

function isWorkingDay(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function nextWorkingDay(from: Date): Date {
  const date = new Date(from);
  while (!isWorkingDay(date)) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function addWorkingDays(from: Date, days: number): Date {
  const date = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (isWorkingDay(date)) remaining--;
  }
  return date;
}
