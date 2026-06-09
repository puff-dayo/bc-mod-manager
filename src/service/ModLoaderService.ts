import {ModService} from '@/service/ModService';
import {LogService} from '@/service/LogService';

type ModLoadType = 'script' | 'module' | 'eval';

/**
 * Load status of a single mod, as surfaced to the loading window.
 */
export type ModLoadStatus = 'pending' | 'loading' | 'loaded' | 'error';

/**
 * Progress entry for a single mod.
 */
export interface ModLoadEntry {
  modKey: string;
  modId: string;
  registryId: string;
  name: string;
  status: ModLoadStatus;
}

/**
 * Snapshot of the overall mod loading progress.
 */
export interface ModLoadProgress {
  entries: ModLoadEntry[];
  total: number;
  settled: number;        // loaded + errored
  loaded: number;
  errored: number;
  waitingForGame: boolean; // waiting for the game (Player) to become available
  started: boolean;        // loadAllEnabledMods has been called
  finished: boolean;       // started, no longer waiting, and every mod has settled
}

type ProgressListener = (progress: ModLoadProgress) => void;

/**
 * Mod Loader Service
 * Handles loading and injecting mod scripts into the page
 */
export class ModLoaderService {
  private static loadedMods: Set<string> = new Set();
  private static initialEnabledMods: Set<string> = new Set();
  private static hasDisabledMods: boolean = false;
  private static scheduledPreload: number | null = null;
  private static scheduledLoad: number | null = null;
  private static loadProgress: Map<string, ModLoadEntry> = new Map();
  private static progressListeners: Set<ProgressListener> = new Set();
  private static loadStarted: boolean = false;
  private static waitingForGame: boolean = false;

  /**
   * Initialize the mod loader
   * Loads all enabled mods on startup
   */
  static initialize(): void {
    LogService.info('ModLoaderService: Initializing mod loader');

    // Track initially enabled mods
    const enabledMods = ModService.getAllModsWithDetails().filter(mod => mod.enabled);
    enabledMods.forEach(mod => {
      const modKey = `${mod.modId}_${mod.registryId}`;
      this.initialEnabledMods.add(modKey);
    });

    LogService.info(`ModLoaderService: Initialize succeed`);
  }

  /**
   * Load all enabled mods
   */
  static loadAllEnabledMods(): void {
    this.loadStarted = true;
    // Register the enabled mods up front so the loading window can show them as
    // pending even while we are still waiting for the game to become available.
    this.registerPendingMods();

    if (typeof Player !== "undefined" && !!Player) {
      this.waitingForGame = false;
      this.notifyProgress();
      this.loadAllEnabledModsImpl();
    } else if (!this.scheduledLoad) {
      this.waitingForGame = true;
      this.notifyProgress();
      this.scheduledLoad = setInterval(() => {
        if (typeof Player !== "undefined" && !!Player) {
          clearInterval(this.scheduledLoad!);
          this.scheduledLoad = null;
          this.waitingForGame = false;
          this.notifyProgress();
          this.loadAllEnabledModsImpl();
        }
      }, 5);
    }
  }

  static preloadAllEnabledMods(): void {
    if (document.head !== null) {
      this.preloadAllEnabledModsImpl();
    } else if (!this.scheduledPreload) {
      this.scheduledPreload = setInterval(() => {
        if (document.head !== null) {
          clearInterval(this.scheduledPreload!);
          this.scheduledPreload = null;
          this.preloadAllEnabledModsImpl();
        }
      }, 5);
    }
  }

  /**
   * Load a single mod by injecting its script into the page
   */
  static loadMod(modId: string, type: string, registryId: string, sourceUrl: string | undefined, modName: string, distribution: string = 'unknown'): void {
    const modKey = `${modId}_${registryId}`;

    // Skip if already loaded
    if (this.loadedMods.has(modKey)) {
      LogService.debug(`ModLoaderService: Mod ${modName} (${modKey}) already loaded, skipping`);
      this.trackMod(modKey, modId, registryId, modName, 'loaded');
      return;
    }

    // Skip if no source URL
    if (!sourceUrl) {
      LogService.warn(`ModLoaderService: Mod ${modName} (${modKey}) has no source URL, skipping`);
      this.trackMod(modKey, modId, registryId, modName, 'error');
      return;
    }

    try {
      LogService.info(`ModLoaderService: Loading mod ${modName} from ${sourceUrl}`);

      // Register in FUSAM as loading if available
      this.setFusamStatus(modId, distribution, 'loading');
      this.trackMod(modKey, modId, registryId, modName, 'loading');

      switch (this.normalizeLoadType(type)) {
        case 'module':
          this.injectScriptElement(modId, registryId, sourceUrl, modName, distribution, modKey, 'module');
          break;
        case 'eval':
          this.loadEvalScript(modId, registryId, sourceUrl, modName, distribution, modKey);
          break;
        case 'script':
        default:
          this.injectScriptElement(modId, registryId, sourceUrl, modName, distribution, modKey, 'script');
          break;
      }
    } catch (error) {
      this.handleLoadError(modId, distribution, modName, modKey, error);
    }
  }

  static preloadMod(modId: string, type: string | undefined, registryId: string, sourceUrl: string | undefined, modName: string, distribution: string = 'unknown'): void {
    const modKey = `${modId}_${registryId}`;

    // Skip if already loaded
    if (this.loadedMods.has(modKey)) {
      LogService.debug(`ModLoaderService: Mod ${modName} (${modKey}) already loaded, skipping`);
      return;
    }

    // Skip if no source URL
    if (!sourceUrl) {
      LogService.warn(`ModLoaderService: Mod ${modName} (${modKey}) has no source URL, skipping`);
      return;
    }

    try {
      LogService.info(`ModLoaderService: Preloading mod ${modName} from ${sourceUrl}`);
      const link = document.createElement('link');
      switch (this.normalizeLoadType(type)) {
        case 'module':
          link.rel = 'modulepreload';
          break;
        case 'eval':
          link.rel = 'preload';
          link.as = 'fetch';
          link.crossOrigin = 'anonymous';
          break;
        case 'script':
        default:
          link.rel = 'preload';
          link.as = 'script';
          break;
      }
      link.href = sourceUrl;
      link.setAttribute('data-mod-id', modId);
      link.setAttribute('data-registry-id', registryId);
      link.setAttribute('data-mod-name', modName);
      link.setAttribute('data-distribution', distribution);
      document.head.appendChild(link);
      LogService.debug(`ModLoaderService: Script element created and appended for ${modName}`);
    } catch (error) {
      LogService.error(`ModLoaderService: Error preloading mod ${modName}`, error);
    }
  }

  /**
   * Check if a mod is currently loaded
   */
  static isModLoaded(modId: string, registryId: string): boolean {
    const modKey = `${modId}_${registryId}`;
    return this.loadedMods.has(modKey);
  }

  /**
   * Mark that a mod has been disabled
   * This will trigger a page refresh when the mod manager closes
   */
  static markModDisabled(modId: string, registryId: string): void {
    const modKey = `${modId}_${registryId}`;

    // Only mark as disabled if it was initially enabled
    if (this.initialEnabledMods.has(modKey)) {
      LogService.info(`ModLoaderService: Mod ${modKey} has been disabled, page refresh will be required`);
      this.hasDisabledMods = true;
    }
  }

  /**
   * Check if any mods have been disabled during this session
   */
  static hasModsBeenDisabled(): boolean {
    return this.hasDisabledMods;
  }

  /**
   * Reset the disabled mods flag
   */
  static resetDisabledFlag(): void {
    this.hasDisabledMods = false;
  }

  /**
   * Refresh the page if mods have been disabled
   * Should be called when the mod manager closes
   */
  static refreshIfNeeded(): void {
    if (this.hasDisabledMods) {
      LogService.info('ModLoaderService: Mods have been disabled, refreshing page...');
      window.location.reload();
    } else {
      this.loadAllEnabledMods();
    }
  }

  /**
   * Get statistics about loaded mods
   */
  static getStats(): {
    loadedCount: number;
    enabledCount: number;
    hasDisabledMods: boolean;
  } {
    const enabledCount = ModService.getEnabledCount();
    return {
      loadedCount: this.loadedMods.size,
      enabledCount: enabledCount,
      hasDisabledMods: this.hasDisabledMods,
    };
  }

  /**
   * Get list of loaded mod keys
   */
  static getLoadedMods(): string[] {
    return Array.from(this.loadedMods);
  }

  /**
   * Subscribe to mod loading progress updates.
   * The listener is invoked immediately with the current snapshot and again on
   * every change. Returns an unsubscribe function.
   */
  static subscribeProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    listener(this.getProgress());
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  /**
   * Get a snapshot of the current mod loading progress.
   */
  static getProgress(): ModLoadProgress {
    const entries = Array.from(this.loadProgress.values());
    const loaded = entries.filter(entry => entry.status === 'loaded').length;
    const errored = entries.filter(entry => entry.status === 'error').length;
    const settled = loaded + errored;
    const total = entries.length;
    const finished = this.loadStarted && !this.waitingForGame && settled === total;
    return {
      entries,
      total,
      settled,
      loaded,
      errored,
      waitingForGame: this.waitingForGame,
      started: this.loadStarted,
      finished,
    };
  }

  /**
   * Unload all mods (remove script tags)
   * Note: This may not fully unload mods that have already executed
   */
  static unloadAllMods(): void {
    LogService.info('ModLoaderService: Unloading all mods');

    // Find all mod script elements
    const modScripts = document.querySelectorAll('script[data-mod-id]');
    modScripts.forEach(script => {
      script.remove();
    });

    // Clear loaded mods set
    this.loadedMods.clear();

    LogService.info('ModLoaderService: All mod scripts removed');
  }

  private static preloadAllEnabledModsImpl(): void {
    const modsWithDetails = ModService.getAllModsWithDetails();
    const enabledMods = modsWithDetails.filter(mod => mod.enabled && (mod.type === 'module' || mod.type === 'eval'));
    enabledMods.forEach(mod => {
      this.preloadMod(mod.modId, mod.type, mod.registryId, mod.sourceUrl, mod.name, mod.selectedVersion);
    });
    LogService.info(`ModLoaderService: Preloaded ${enabledMods.length} enabled mods`);
  }

  private static loadAllEnabledModsImpl(): void {
    const modsWithDetails = ModService.getAllModsWithDetails();
    const enabledMods = modsWithDetails.filter(mod => mod.enabled);

    LogService.info(`ModLoaderService: Loading ${enabledMods.length} enabled mods`);

    enabledMods.forEach(mod => {
      this.loadMod(mod.modId, mod.type || 'script', mod.registryId, mod.sourceUrl, mod.name, mod.selectedVersion);
    });
  }

  private static normalizeLoadType(type: string | undefined): ModLoadType {
    if (type === 'module' || type === 'eval') {
      return type;
    }
    return 'script';
  }

  private static async loadEvalScript(
    modId: string,
    registryId: string,
    sourceUrl: string,
    modName: string,
    distribution: string,
    modKey: string,
  ): Promise<void> {
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const source = await response.text();
      this.executeInGlobalScope(modId, registryId, source, sourceUrl, modName, distribution);
      this.handleLoadSuccess(modId, distribution, modName, modKey);
    } catch (error) {
      this.handleLoadError(modId, distribution, modName, modKey, error);
    }
  }

  private static executeInGlobalScope(
    modId: string,
    registryId: string,
    source: string,
    sourceUrl: string,
    modName: string,
    distribution: string,
  ): void {
    const sanitizedSourceUrl = sourceUrl.replace(/[\r\n]/g, '');
    const script = document.createElement('script');
    script.type = 'text/javascript';
    // A classic inline script gets page global-script semantics; direct eval does not.
    script.text = `${source}\n//# sourceURL=${sanitizedSourceUrl}`;
    script.setAttribute('data-mod-id', modId);
    script.setAttribute('data-registry-id', registryId);
    script.setAttribute('data-mod-name', modName);
    script.setAttribute('data-distribution', distribution);
    script.setAttribute('data-load-type', 'eval');
    document.head.appendChild(script);
  }

  private static injectScriptElement(
    modId: string,
    registryId: string,
    sourceUrl: string,
    modName: string,
    distribution: string,
    modKey: string,
    type: Exclude<ModLoadType, 'eval'>,
  ): void {
    // Create script element
    const script = document.createElement('script');
    script.src = sourceUrl;
    script.type = type === 'module' ? 'module' : 'text/javascript';
    script.async = true;
    script.crossOrigin = "anonymous";

    script.setAttribute('data-mod-id', modId);
    script.setAttribute('data-registry-id', registryId);
    script.setAttribute('data-mod-name', modName);
    script.setAttribute('data-distribution', distribution);

    // Add load event listener
    script.onload = () => {
      this.handleLoadSuccess(modId, distribution, modName, modKey);
    };

    // Add error event listener
    script.onerror = (error) => {
      this.handleLoadError(modId, distribution, modName, modKey, error);
    };

    // Inject script into body
    document.head.appendChild(script);

    LogService.debug(`ModLoaderService: Script element created and appended for ${modName}`);
  }

  private static handleLoadSuccess(modId: string, distribution: string, modName: string, modKey: string): void {
    LogService.info(`ModLoaderService: Successfully loaded mod ${modName}`);
    this.loadedMods.add(modKey);
    this.setFusamStatus(modId, distribution, 'loaded');
    this.updateModStatus(modKey, 'loaded');
  }

  private static handleLoadError(modId: string, distribution: string, modName: string, modKey: string, error: unknown): void {
    LogService.error(`ModLoaderService: Failed to load mod ${modName}`, error);
    this.setFusamStatus(modId, distribution, 'error');
    this.updateModStatus(modKey, 'error');
  }

  /**
   * Seed the progress map with all currently enabled mods as "pending".
   * Existing entries are left untouched so already-resolved statuses are kept.
   */
  private static registerPendingMods(): void {
    const enabledMods = ModService.getAllModsWithDetails().filter(mod => mod.enabled);
    let changed = false;
    enabledMods.forEach(mod => {
      const modKey = `${mod.modId}_${mod.registryId}`;
      if (!this.loadProgress.has(modKey)) {
        this.loadProgress.set(modKey, {
          modKey,
          modId: mod.modId,
          registryId: mod.registryId,
          name: mod.name,
          status: 'pending',
        });
        changed = true;
      }
    });
    if (changed) {
      this.notifyProgress();
    }
  }

  /**
   * Create or update a progress entry, notifying listeners only on a real change.
   */
  private static trackMod(modKey: string, modId: string, registryId: string, name: string, status: ModLoadStatus): void {
    const existing = this.loadProgress.get(modKey);
    if (existing) {
      let changed = false;
      if (existing.status !== status) {
        existing.status = status;
        changed = true;
      }
      if (name && existing.name !== name) {
        existing.name = name;
        changed = true;
      }
      if (changed) {
        this.notifyProgress();
      }
      return;
    }
    this.loadProgress.set(modKey, {modKey, modId, registryId, name, status});
    this.notifyProgress();
  }

  /**
   * Update the status of an existing progress entry.
   */
  private static updateModStatus(modKey: string, status: ModLoadStatus): void {
    const existing = this.loadProgress.get(modKey);
    if (!existing || existing.status === status) {
      return;
    }
    existing.status = status;
    this.notifyProgress();
  }

  private static notifyProgress(): void {
    const snapshot = this.getProgress();
    this.progressListeners.forEach(listener => {
      try {
        listener(snapshot);
      } catch (error) {
        LogService.error('ModLoaderService: progress listener threw', error);
      }
    });
  }

  private static setFusamStatus(modId: string, distribution: string, status: FUSAMAddonState['status']): void {
    if (window.FUSAM) {
      window.FUSAM.addons[modId] = {
        distribution: distribution,
        status: status
      };
    }
  }
}
