import {CollectionRepository} from '@/infrastructure/storage/Repository';
import type {CachedRegistryData} from '@/domain/Registry';

/**
 * Persists fetched registry data (one cache entry per registry). Keyed by
 * `registryId`.
 */
export class RegistryCacheRepository extends CollectionRepository<CachedRegistryData> {
  protected readonly storageKey = 'bmm_registry_cache';

  protected keyOf(cache: CachedRegistryData): string {
    return cache.registryId;
  }
}
