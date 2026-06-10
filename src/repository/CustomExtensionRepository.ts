import {CollectionRepository} from '@/infrastructure/storage/Repository';
import type {CustomExtension} from '@/domain/CustomExtension';

/**
 * Persists user-defined custom extensions. Keyed by `id`.
 */
export class CustomExtensionRepository extends CollectionRepository<CustomExtension> {
  protected readonly storageKey = 'bmm_custom_extensions';

  protected keyOf(extension: CustomExtension): string {
    return extension.id;
  }
}
