export const XP_RING_SEGMENTS = 40;

/** Clamps display progress and turns it into a stable number of ring segments. */
export function xpRingSegmentCount(percent: number, segments = XP_RING_SEGMENTS): number {
  if (!Number.isFinite(percent) || segments <= 0) return 0;
  return Math.round((Math.max(0, Math.min(100, percent)) / 100) * segments);
}
