/**
 * How a mod's source is injected into the page.
 */
export type ModLoadType = 'script' | 'module' | 'eval';

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
  loadType?: ModLoadType;       // how the mod is injected (script/module/eval)
  distribution?: string;        // selected version/distribution
  startedAt?: number;           // timestamp when the mod started loading
  settledAt?: number;           // timestamp when the mod finished (loaded or errored)
  durationMs?: number;          // settledAt - startedAt (actual load time)
  error?: string;               // failure reason when status === 'error'
  postLoadError?: string;       // a runtime error thrown *after* the mod already loaded
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
  totalDurationMs?: number; // wall-clock span from the first start to the last settle
}
