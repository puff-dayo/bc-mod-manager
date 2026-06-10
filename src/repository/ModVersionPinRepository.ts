import {KeyValueRepository} from '@/infrastructure/storage/Repository';

/**
 * Persists per-source pinned content hashes (`sourceUrl -> hash`) used by the
 * mod cache to serve a stable `?v=<hash>` URL across visits.
 */
export class ModVersionPinRepository extends KeyValueRepository<string> {
  protected readonly storageKey = 'bmm_mod_loader_versions';
}
