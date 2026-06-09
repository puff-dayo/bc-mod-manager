import {Component} from "preact";
import i18n from "@/i18n/i18n.ts";
import classNames from "@/component/ui/classNames.ts";
import Icon from "@/component/ui/Icon.tsx";
import {ModLoaderService, type ModLoadProgress, type ModLoadStatus} from "@/service/ModLoaderService.ts";
import {LoaderVersionService} from "@/service/LoaderVersionService.ts";

// Auto-dismiss the window shortly after loading finishes (unless the build is
// outdated, in which case it stays so the user can act on the warning).
const AUTO_HIDE_DELAY = 1600;
// Hard backstop so a mod whose script never fires load/error can't pin the window open.
const SAFETY_HIDE_DELAY = 60000;

interface ModLoadingWindowState {
  progress: ModLoadProgress;
  outdated: boolean;
  dismissed: boolean;
}

const STATUS_STYLES: Record<ModLoadStatus, string> = {
  pending: 'border-bmm-border bg-bmm-surface-muted text-bmm-muted',
  loading: 'border-blue-200 bg-bmm-accent-soft text-bmm-accent-strong',
  loaded: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-red-200 bg-red-50 text-red-700',
};

const STATUS_LABEL_KEY: Record<ModLoadStatus, string> = {
  pending: 'loading-status-pending',
  loading: 'loading-status-loading',
  loaded: 'loading-status-loaded',
  error: 'loading-status-error',
};

/**
 * Floating window that shows mod loading progress on startup, and warns when the
 * bootstrap userscript booted a stale (cached) build of the mod loader.
 */
export default class ModLoadingWindow extends Component<{}, ModLoadingWindowState> {
  private unsubscribeProgress?: () => void;
  private unsubscribeVersion?: () => void;
  private hideTimer: number | null = null;
  private safetyTimer: number | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      progress: ModLoaderService.getProgress(),
      outdated: LoaderVersionService.isOutdated(),
      dismissed: false,
    };
  }

  componentDidMount() {
    this.unsubscribeProgress = ModLoaderService.subscribeProgress(progress => {
      this.setState({progress});
      this.scheduleAutoHide(progress.finished);
    });

    this.unsubscribeVersion = LoaderVersionService.subscribe(() => {
      const outdated = LoaderVersionService.isOutdated();
      if (outdated) {
        // Keep (or bring back) the window so the warning is always seen, even if the
        // stale build was detected after the progress window had auto-dismissed.
        this.clearHideTimer();
        this.setState({outdated, dismissed: false});
      } else {
        this.setState({outdated});
      }
    });

    this.scheduleAutoHide(this.state.progress.finished);

    this.safetyTimer = window.setTimeout(() => {
      this.safetyTimer = null;
      if (!LoaderVersionService.isOutdated()) {
        this.setState({dismissed: true});
      }
    }, SAFETY_HIDE_DELAY);
  }

  componentWillUnmount() {
    this.unsubscribeProgress?.();
    this.unsubscribeVersion?.();
    this.clearHideTimer();
    if (this.safetyTimer !== null) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }
  }

  private scheduleAutoHide(finished: boolean) {
    if (finished && this.hideTimer === null && !LoaderVersionService.isOutdated()) {
      this.hideTimer = window.setTimeout(() => {
        this.hideTimer = null;
        this.setState({dismissed: true});
      }, AUTO_HIDE_DELAY);
    }
  }

  private clearHideTimer() {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private handleClose = () => {
    this.clearHideTimer();
    this.setState({dismissed: true});
  };

  private handleReload = () => {
    window.location.reload();
  };

  private statusText(): string {
    const {progress, outdated} = this.state;
    if (progress.waitingForGame) {
      return i18n('loading-waiting-game');
    }
    if (progress.total === 0) {
      return outdated ? i18n('loading-outdated-title') : i18n('loading-complete');
    }
    if (progress.finished) {
      return progress.errored > 0
        ? i18n('loading-complete-errors', {count: progress.errored})
        : i18n('loading-complete');
    }
    return i18n('loading-in-progress');
  }

  private renderStatusBadge(status: ModLoadStatus) {
    return (
      <span
        className={classNames(
          'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.6875rem] font-bold leading-none',
          STATUS_STYLES[status],
        )}
      >
        {status === 'loading' && <Icon name="refresh" spin/>}
        {i18n(STATUS_LABEL_KEY[status])}
      </span>
    );
  }

  render() {
    const {progress, outdated, dismissed} = this.state;
    if (dismissed) {
      return null;
    }
    // Nothing worth showing: no mods to load and the build is current.
    if (progress.total === 0 && !outdated) {
      return null;
    }

    const percent = progress.total > 0
      ? Math.round((progress.settled / progress.total) * 100)
      : (outdated ? 100 : 0);

    return (
      <div className="fixed bottom-6 right-6 z-[60] w-[20rem] max-w-[calc(100vw-3rem)]">
        <div
          className="overflow-hidden rounded-lg border border-bmm-border bg-bmm-surface shadow-bmm-panel ring-1 ring-slate-950/5">
          <div
            className="flex items-center justify-between gap-3 border-b border-bmm-border bg-bmm-surface-raised px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {!progress.finished && <Icon name="refresh" spin className="text-bmm-accent"/>}
              <h2 className="m-0 truncate text-sm font-bold text-bmm-ink">{i18n('loading-title')}</h2>
            </div>
            <button
              type="button"
              onClick={this.handleClose}
              title={i18n('button-close')}
              aria-label={i18n('button-close')}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-lg leading-none text-bmm-faint transition-colors hover:bg-bmm-accent-soft hover:text-bmm-accent-strong"
            >
              ×
            </button>
          </div>

          <div className="px-4 py-3">
            {outdated && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="m-0 text-[0.8125rem] font-bold text-amber-800">{i18n('loading-outdated-title')}</p>
                <p className="m-0 mt-1 text-xs leading-5 text-amber-700">{i18n('loading-outdated-detail')}</p>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                >
                  <Icon name="refresh"/>
                  {i18n('loading-button-reload')}
                </button>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-bmm-muted">
              <span className="truncate">{this.statusText()}</span>
              {progress.total > 0 && (
                <span className="shrink-0 tabular-nums">{progress.settled}/{progress.total}</span>
              )}
            </div>

            {progress.total > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bmm-surface-muted">
                <div
                  className={classNames(
                    'h-full rounded-full transition-[width] duration-300',
                    progress.errored > 0 ? 'bg-amber-400' : 'bg-bmm-accent',
                  )}
                  style={{width: `${percent}%`}}
                />
              </div>
            )}

            {progress.total > 0 && (
              <ul className="m-0 mt-3 flex max-h-52 list-none flex-col gap-1 overflow-y-auto p-0 pr-0.5">
                {progress.entries.map(entry => (
                  <li
                    key={entry.modKey}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-bmm-surface-muted"
                  >
                    <span className="truncate text-bmm-ink">{entry.name}</span>
                    {this.renderStatusBadge(entry.status)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }
}