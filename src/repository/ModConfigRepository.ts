import {CollectionRepository} from '@/infrastructure/storage/Repository';
import type {ModConfig} from '@/domain/Mod';

/**
 * Persists the user's mod configurations. Keyed by the composite
 * `${modId}_${registryId}` since a mod is identified by its registry origin.
 */
export class ModConfigRepository extends CollectionRepository<ModConfig> {
  protected readonly storageKey = 'bmm_mod_configs';

  protected keyOf(config: ModConfig): string {
    return `${config.modId}_${config.registryId}`;
  }
}
