import {SettingsRepository} from '@/repository/SettingsRepository';
import {Observable} from '@/infrastructure/pubsub/Observable';
import {Logger} from '@/infrastructure/logging/Logger';
import type {AppSettings} from '@/domain/Settings';

/**
 * Settings Service
 * Reads/writes user preferences (via {@link SettingsRepository}) and notifies
 * subscribers when they change.
 */
export class SettingsService {
  private static readonly repo = new SettingsRepository();
  private static readonly observable = new Observable<AppSettings>({
    emitOnSubscribe: false,
    onListenerError: (error) => Logger.error('SettingsService: listener threw', error),
  });

  /** Get the full settings object, with defaults filled in for missing keys. */
  static getAll(): AppSettings {
    return this.repo.get();
  }

  static get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.getAll()[key];
  }

  static set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const next = {...this.getAll(), [key]: value};
    this.repo.set(next);
    Logger.info(`SettingsService: ${String(key)} set to ${String(value)}`);
    this.observable.notify(next);
  }

  static subscribe(listener: (settings: AppSettings) => void): () => void {
    return this.observable.subscribe(listener);
  }
}
