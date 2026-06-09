declare interface Bmm {
  shadowRootContainer: HTMLDivElement;
  shadowRoot: ShadowRoot;
  root: HTMLDivElement;
  app: import('@/app.tsx').default;
}

/**
 * Loader version bridge published by the bootstrap userscript (public/bmm.user.js).
 * Absent when running outside the userscript (e.g. the Vite dev server).
 */
declare interface BmmLoaderState {
  loadedVersion: string | null;
  latestVersion: string | null;
  listeners: Array<(latestVersion: string | null) => void>;
}

declare interface Window {
  bmm: Bmm;
  __bmmLoader?: BmmLoaderState;
}
