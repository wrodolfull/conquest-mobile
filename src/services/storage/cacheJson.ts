export function parseCachedJson<T>(payload: string, validate: (value: unknown) => value is T): T | undefined {
  try {
    const value: unknown = JSON.parse(payload);
    return validate(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
