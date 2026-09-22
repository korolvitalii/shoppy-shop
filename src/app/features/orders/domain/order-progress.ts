import { estimateArrivalWindow } from './delivery-estimate';

const RETURNS_WINDOW_DAYS = 30;

export type OrderStage = 'packing' | 'in-transit' | 'delivered';

export type OrderFilter = 'all' | 'in-transit' | 'delivered' | 'returns';

export interface OrderProgress {
  readonly stage: OrderStage;
  readonly arrival: readonly [Date, Date] | null;
  readonly returnsClose: Date | null;
}

export function deriveOrderProgress(
  createdAt: string | null | undefined,
  now: Date,
): OrderProgress {
  const arrival = estimateArrivalWindow(createdAt);
  if (!arrival) return { stage: 'packing', arrival: null, returnsClose: null };

  const [from, to] = arrival;
  const today = utcDay(now);
  if (today < utcDay(from)) return { stage: 'packing', arrival, returnsClose: null };
  if (today <= utcDay(to)) return { stage: 'in-transit', arrival, returnsClose: null };

  const close = new Date(from);
  close.setUTCDate(close.getUTCDate() + RETURNS_WINDOW_DAYS);
  return { stage: 'delivered', arrival, returnsClose: today <= utcDay(close) ? close : null };
}

export function matchesFilter(progress: OrderProgress, filter: OrderFilter): boolean {
  switch (filter) {
    case 'in-transit':
      return progress.stage !== 'delivered';
    case 'delivered':
      return progress.stage === 'delivered';
    case 'returns':
      return progress.returnsClose !== null;
    case 'all':
      return true;
  }
}

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
