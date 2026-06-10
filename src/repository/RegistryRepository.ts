import {CollectionRepository} from '@/infrastructure/storage/Repository';
import {LocalStorage} from '@/infrastructure/storage/LocalStorage';
import type {Registry} from '@/domain/Registry';

/**
 * Persists user-added registries (presets are not stored here). Keyed by `id`.
 */
export class RegistryRepository extends CollectionRepository<Registry> {
  protected readonly storageKey = 'bmm_registries';

  protected keyOf(registry: Registry): string {
    return registry.id;
  }

  /**
   * Read user registries, lazily persisting an empty array the first time so the
   * storage key always exists (preserves the original getAllUser behavior).
   */
  override getAll(): Registry[] {
    const stored = LocalStorage.getItem<Registry[]>(this.storageKey);
    if (stored == null) {
      const empty: Registry[] = [];
      LocalStorage.setItem(this.storageKey, empty);
      return empty;
    }
    return stored;
  }
}
