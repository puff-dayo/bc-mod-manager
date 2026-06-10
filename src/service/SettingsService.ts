import {LocalStorageService} from '@/service/LocalStorageService';
import {LogService} from '@/service/LogService';

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

const DEFAULT_SETTINGS: AppSettings = {
  modCacheEnabled: true,
};

type SettingsListener = (settings: AppSettings) => void;

/**
 * Settings Service
 * Persists user preferences and notifies subscribers when they change.
 */
export class SettingsService {
  private static readonly STORAGE_KEY = 'bmm_settings';
  private static listeners: Set<SettingsListener> = new Set();

  /** Get the full settings object, with defaults filled in for missing keys. */
  static getAll(): AppSettings {
    const stored = LocalStorageService.getItem<Partial<AppSettings>>(this.STORAGE_KEY);
    return {...DEFAULT_SETTINGS, ...(stored || {})};
  }

  static get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.getAll()[key];
  }

  static set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const next = {...this.getAll(), [key]: value};
    LocalStorageService.setItem(this.STORAGE_KEY, next);
    LogService.info(`SettingsService: ${String(key)} set to ${String(value)}`);
    this.notify(next);
  }

  static subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(settings: AppSettings): void {
    this.listeners.forEach(listener => {
      try {
        listener(settings);
      } catch (error) {
        LogService.error('SettingsService: listener threw', error);
      }
    });
  }
}