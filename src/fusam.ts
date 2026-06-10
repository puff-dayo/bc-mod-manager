import {LogService} from "@/service/LogService.ts";
import {ModalStore} from "@/ui/store/ModalStore.ts";

window.FUSAM = {
  present: true,
  addons: {},
  registerDebugMethod: (name: string, method: () => string | Promise<string>) => {
    LogService.registerDebugMethod(name, method);
  },
  modals: {
    open: (options: ModalOptions) => {
      ModalStore.open(options);
    },
    openAsync: async (options: Omit<ModalOptions, "callback">) => {
      return new Promise((resolve) => {
        ModalStore.open({
          ...options,
          callback: (action, inputValue) => {
            resolve([action, inputValue === undefined ? null : inputValue]);
          },
        });
      });
    },
  },
}
