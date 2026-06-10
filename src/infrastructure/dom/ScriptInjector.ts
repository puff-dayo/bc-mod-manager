/**
 * ScriptInjector
 *
 * Stateless DOM primitives for injecting mod scripts into the page. These build
 * and append `<script>` / `<link>` elements; all orchestration, state and
 * runtime-error attribution stay in `service/ModLoaderService`. In particular,
 * the caller owns any error-attribution window around {@link injectInlineScript}
 * (a classic inline script executes synchronously on append).
 */

type PreloadLoadType = 'module' | 'eval' | 'script';

export class ScriptInjector {
  /**
   * Inject an external `<script src>` (classic or module). `onLoad`/`onError`
   * are wired to the element's load/error events.
   */
  static injectScript(opts: {
    src: string;
    type: 'module' | 'script';
    dataset: Record<string, string>;
    onLoad: () => void;
    onError: (error: unknown) => void;
  }): void {
    const script = document.createElement('script');
    script.src = opts.src;
    script.type = opts.type === 'module' ? 'module' : 'text/javascript';
    script.async = true;
    script.crossOrigin = 'anonymous';
    this.applyDataset(script, opts.dataset);
    script.onload = () => opts.onLoad();
    script.onerror = (error) => opts.onError(error);
    document.head.appendChild(script);
  }

  /**
   * Build and append a classic inline `<script>` whose body is `source`. A
   * classic inline script gets page global-script semantics (direct eval does
   * not) and executes synchronously on append. The `sourceURL` comment keeps
   * stack traces readable even when the body was fetched from a cache URL.
   */
  static injectInlineScript(opts: {
    source: string;
    sourceUrl: string;
    dataset: Record<string, string>;
  }): void {
    const sanitizedSourceUrl = opts.sourceUrl.replace(/[\r\n]/g, '');
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = `${opts.source}\n//# sourceURL=${sanitizedSourceUrl}`;
    this.applyDataset(script, opts.dataset);
    document.head.appendChild(script);
  }

  /**
   * Append a `<link rel=preload|modulepreload>` to warm a mod's source.
   */
  static injectPreloadLink(opts: {
    href: string;
    loadType: PreloadLoadType;
    dataset: Record<string, string>;
  }): void {
    const link = document.createElement('link');
    switch (opts.loadType) {
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
    link.href = opts.href;
    this.applyDataset(link, opts.dataset);
    document.head.appendChild(link);
  }

  /** Remove every injected mod `<script>` element from the page. */
  static removeAllModScripts(): void {
    const modScripts = document.querySelectorAll('script[data-mod-id]');
    modScripts.forEach(script => script.remove());
  }

  private static applyDataset(element: Element, dataset: Record<string, string>): void {
    for (const [key, value] of Object.entries(dataset)) {
      element.setAttribute(key, value);
    }
  }
}
