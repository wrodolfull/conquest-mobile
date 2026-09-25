/** Space between the top of a Home bottom overlay and its floating map control. */
export const HOME_MAP_CONTROL_GAP = 12;
export const HOME_MAP_CONTROL_FALLBACK_INSET = 112;
export const CONTEXT_CARD_CONTROL_INSET = 280;

export function mapControlBottomInset(homeOverlayHeight: number, hasContextCard: boolean) {
  const homeInset = homeOverlayHeight > 0
    ? homeOverlayHeight + HOME_MAP_CONTROL_GAP
    : HOME_MAP_CONTROL_FALLBACK_INSET;
  return hasContextCard ? Math.max(homeInset, CONTEXT_CARD_CONTROL_INSET) : homeInset;
}
