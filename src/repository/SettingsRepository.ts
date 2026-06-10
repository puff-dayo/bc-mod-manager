import {DocumentRepository} from '@/infrastructure/storage/Repository';
import type {AppSettings} from '@/domain/Settings';

const DEFAULT_SETTINGS: AppSettings = {
  modCacheEnabled: true,
};

/**
 * Persists the application settings document, merged over defaults on read.
 */
export class SettingsRepository extends DocumentRepository<AppSettings> {
  protected readonly storageKey = 'bmm_settings';
  protected readonly defaults = DEFAULT_SETTINGS;
}
