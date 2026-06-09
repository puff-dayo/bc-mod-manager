/**
 * Render a load duration compactly: sub-second values as "123ms", longer as "1.2s".
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}