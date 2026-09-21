export type MapLoadingState = 'loading' | 'style-loaded' | 'loaded' | 'error';
export type MapLoadingEvent = 'start' | 'style' | 'finish' | 'error' | 'timeout';
export function nextMapLoadingState(current: MapLoadingState, event: MapLoadingEvent): MapLoadingState {
  if (event === 'start') return 'loading';
  if (event === 'error') return 'error';
  if (event === 'timeout') return current === 'loaded' || current === 'error' ? current : 'error';
  if (event === 'style') return 'style-loaded';
  return current === 'style-loaded' || current === 'loaded' ? 'loaded' : current;
}
/** Removes credentials and URLs before a native error reaches development logs. */
export function safeMapboxDiagnostic(error: unknown): string {
  const record = typeof error === 'object' && error !== null ? error as Record<string, unknown> : undefined;
  const payload = typeof record?.payload === 'object' && record.payload !== null ? record.payload as Record<string, unknown> : undefined;
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : typeof record?.message === 'string' ? record.message : typeof payload?.message === 'string' ? payload.message : 'Native map resource loading error';
  return raw.replace(/\b(?:pk|sk)\.[A-Za-z0-9._-]+/gi, '[REDACTED_TOKEN]').replace(/(?:access_token|token|key)=([^&\s]+)/gi, '$1=[REDACTED]').replace(/https?:\/\/\S+/gi, '[REDACTED_URL]').slice(0, 240);
}
