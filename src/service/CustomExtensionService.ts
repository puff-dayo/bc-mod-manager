import {CustomExtensionRepository} from '@/repository/CustomExtensionRepository';
import {Logger} from '@/infrastructure/logging/Logger';
import type {CustomExtension} from '@/domain/CustomExtension';

/**
 * Custom Extension Service
 * Manages user-defined custom extensions (business logic over the repository).
 */
export class CustomExtensionService {
  private static readonly CUSTOM_REGISTRY_ID = '__custom__';
  private static readonly repo = new CustomExtensionRepository();

  /**
   * Get the special registry ID for custom extensions
   */
  static getCustomRegistryId(): string {
    return this.CUSTOM_REGISTRY_ID;
  }

  /**
   * Get all custom extensions
   */
  static getAll(): CustomExtension[] {
    return this.repo.getAll();
  }

  /**
   * Get a custom extension by ID
   */
  static get(id: string): CustomExtension | null {
    return this.repo.findByKey(id);
  }

  /**
   * Add a new custom extension
   */
  static add(extension: Omit<CustomExtension, 'id' | 'createdAt' | 'updatedAt'>): CustomExtension | null {
    try {
      // Validate required fields
      if (!extension.name || !extension.sourceUrl) {
        Logger.error('CustomExtensionService: Name and source URL are required');
        return null;
      }

      // Validate URL format
      if (!this.isValidUrl(extension.sourceUrl)) {
        Logger.error('CustomExtensionService: Invalid source URL format');
        return null;
      }

      const now = Date.now();
      const newExtension: CustomExtension = {
        ...extension,
        id: this.generateId(),
        author: extension.author || 'Unknown',
        description: extension.description || '',
        type: extension.type || 'script',
        createdAt: now,
        updatedAt: now,
      };

      this.repo.upsert(newExtension);

      Logger.info(`CustomExtensionService: Added custom extension: ${newExtension.name}`);
      return newExtension;
    } catch (error) {
      Logger.error('CustomExtensionService: Error adding custom extension', error);
      return null;
    }
  }

  /**
   * Update an existing custom extension
   */
  static update(id: string, updates: Partial<Omit<CustomExtension, 'id' | 'createdAt' | 'updatedAt'>>): CustomExtension | null {
    try {
      const existing = this.repo.findByKey(id);

      if (!existing) {
        Logger.error('CustomExtensionService: Extension not found');
        return null;
      }

      // Validate URL if being updated
      if (updates.sourceUrl && !this.isValidUrl(updates.sourceUrl)) {
        Logger.error('CustomExtensionService: Invalid source URL format');
        return null;
      }

      const updatedExtension: CustomExtension = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      };

      this.repo.upsert(updatedExtension);

      Logger.info(`CustomExtensionService: Updated custom extension: ${updatedExtension.name}`);
      return updatedExtension;
    } catch (error) {
      Logger.error('CustomExtensionService: Error updating custom extension', error);
      return null;
    }
  }

  /**
   * Remove a custom extension
   */
  static remove(id: string): boolean {
    try {
      if (!this.repo.removeByKey(id)) {
        Logger.error('CustomExtensionService: Extension not found');
        return false;
      }

      Logger.info(`CustomExtensionService: Removed custom extension: ${id}`);
      return true;
    } catch (error) {
      Logger.error('CustomExtensionService: Error removing custom extension', error);
      return false;
    }
  }

  /**
   * Convert custom extensions to FusamAddon format for compatibility
   */
  static toFusamAddons(): Array<{
    id: string;
    name: string;
    description: string;
    author: string;
    repository?: string;
    tags?: string[];
    type?: string;
    icon?: string;
    website?: string;
    versions: Array<{
      distribution: string;
      source: string;
    }>;
  }> {
    const extensions = this.getAll();
    return extensions.map(ext => ({
      id: ext.id,
      name: ext.name,
      description: ext.description,
      author: ext.author,
      repository: ext.repository,
      tags: ext.tags || ['custom'],
      type: ext.type,
      icon: ext.icon,
      website: ext.website,
      versions: [
        {
          distribution: 'custom',
          source: ext.sourceUrl,
        },
      ],
    }));
  }

  /**
   * Clear all custom extensions
   */
  static clearAll(): void {
    this.repo.clear();
    Logger.info('CustomExtensionService: Cleared all custom extensions');
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:' || urlObj.protocol === 'file:';
    } catch {
      return false;
    }
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
