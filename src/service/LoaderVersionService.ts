/**
 * Loader Version Service
 *
 * Bridges to the `window.__bmmLoader` state published by the bootstrap userscript
 * (public/bmm.user.js). It lets the in-page app tell whether the cached mod-loader
 * build that is currently running is older than the newest build on the server, so
 * the loading window can prompt the user to reload.
 *
 * The bridge is absent when running outside the userscript (e.g. the Vite dev
 * server); in that case the loader is always treated as up to date.
 */
export class LoaderVersionService {
  /**
   * Whether the running loader build is older than the latest known build.
   * Returns false when the bridge is unavailable, when the build is up to date,
   * or when it was freshly loaded (no pinned version to compare against).
   */
  static isOutdated(): boolean {
    const state = window.__bmmLoader;
    if (!state) {
      return false;
    }
    const {loadedVersion, latestVersion} = state;
    return loadedVersion != null && latestVersion != null && loadedVersion !== latestVersion;
  }

  /**
   * Subscribe to loader version changes. The listener fires whenever the latest
   * known version is refreshed by the userscript's background check. Returns an
   * unsubscribe function (a no-op when the bridge is unavailable).
   */
  static subscribe(listener: () => void): () => void {
    const state = window.__bmmLoader;
    if (!state) {
      return () => {};
    }
    state.listeners.push(listener);
    return () => {
      const index = state.listeners.indexOf(listener);
      if (index !== -1) {
        state.listeners.splice(index, 1);
      }
    };
  }
}