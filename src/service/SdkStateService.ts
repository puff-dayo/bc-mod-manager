import { Observable } from '@/infrastructure/pubsub/Observable';

export interface SdkHijackInfo {
  /** Mods already registered in BC's SDK at the time we detected the hijack. */
  registeredMods: Array<{ name: string; fullName: string }>;
}

/**
 * Tracks whether BC's bundled SDK initialized before ours and we could not
 * safely replace it (because mods had already registered).  Components
 * subscribe here to show a warning in the loading window.
 */
export class SdkStateService {
  private static _hijackInfo: SdkHijackInfo | null = null;
  private static readonly observable = new Observable<SdkHijackInfo | null>({
    emitOnSubscribe: true,
    getSnapshot: () => SdkStateService._hijackInfo,
  });

  static notifyHijacked(info: SdkHijackInfo): void {
    SdkStateService._hijackInfo = info;
    SdkStateService.observable.notify(info);
  }

  static getHijackInfo(): SdkHijackInfo | null {
    return SdkStateService._hijackInfo;
  }

  static isHijacked(): boolean {
    return SdkStateService._hijackInfo !== null;
  }

  static subscribe(listener: (info: SdkHijackInfo | null) => void): () => void {
    return SdkStateService.observable.subscribe(listener);
  }
}