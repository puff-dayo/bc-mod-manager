/**
 * User-configurable application settings.
 */
export interface AppSettings {
  /**
   * Load mods from the browser's HTTP cache (bmm.user.js-style) and prompt to
   * reload when a newer build is detected. When disabled, mods are fetched fresh
   * on every visit. Mods that opt out of cache busting are always loaded
   * directly regardless of this setting.
   */
  modCacheEnabled: boolean;
}
