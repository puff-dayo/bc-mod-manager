/**
 * Render a load duration compactly: sub-second values as "123ms", longer as "1.2s".
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatLocalizedName(
  name: string | Record<string, string>,
  language: string,
  fallback = 'Unknown Mod',
): string {
  if (typeof name === 'string') {
    return name || fallback;
  }

  const normalizedLanguage = language.toLowerCase();
  return name[normalizedLanguage] || name.en || Object.values(name)[0] || fallback;
}

export function formatInitial(value: string, fallback = 'M'): string {
  return value.trim().charAt(0).toUpperCase() || fallback;
}

export function formatSearchText(values: Array<string | null | undefined>): string {
  return values
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * Pretty-print a value as JSON for display, falling back to a string so a
 * circular or otherwise non-serializable value never throws during render.
 */
export function formatData(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
