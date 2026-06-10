import { ModalStore } from '@/ui/store/ModalStore';
import { SdkStateService } from '@/service/SdkStateService';

export function showSdkAlert(message: string): void {
  ModalStore.open({
    prompt: message,
    callback: () => {},
    buttons: { submit: 'OK' },
  });
}

export function notifySdkHijacked(mods: Array<{ name: string; fullName: string }>): void {
  SdkStateService.notifyHijacked({ registeredMods: mods });
}