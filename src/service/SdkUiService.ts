import { ModalStore } from '@/ui/store/ModalStore';
import { SdkStateService } from '@/service/SdkStateService';
import { SdkCrashStore } from '@/service/SdkCrashStore';
import { ModLoaderService } from '@/service/ModLoaderService';
import { ModService } from '@/service/ModService';
import {t} from '@/i18n/i18n';

export function showSdkAlert(message: string): void {
  ModalStore.open({
    prompt: message,
    callback: () => {},
    buttons: { submit: t('button-ok') },
  });
}

export function notifySdkHijacked(mods: Array<{ name: string; fullName: string }>): void {
  SdkStateService.notifyHijacked({ registeredMods: mods });
}

export function reportSdkCrash(
  type: 'hook' | 'patch',
  fn: string,
  mod: string,
  err: unknown,
): void {
  const error = err instanceof Error ? err : new Error(String(err));
  const frames = (error.stack ?? '')
    .split('\n')
    .filter(l => l.trim().startsWith('at '))
    .slice(0, 20);

  const loadedKeys = ModLoaderService.getLoadedMods();
  const allMods = ModService.getAllModsWithDetails();
  const loadedMods = loadedKeys.map(key => {
    const found = allMods.find(m => `${m.modId}_${m.registryId}` === key);
    return found ? `${found.name} (${found.selectedVersion ?? key})` : key;
  });

  SdkCrashStore.push({ type, fn, mod, errorMessage: error.message, stackFrames: frames, loadedMods });
}
