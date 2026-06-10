import {Component} from "preact";
import {ModService} from "@/service/ModService";
import {ModLoaderService} from "@/service/ModLoaderService";
import type {ModConfig} from "@/domain/Mod";
import type {FusamAddon} from "@/domain/Registry";
import type {ModLoadEntry, ModLoadStatus} from "@/domain/ModLoad";
import i18n, {currentLanguage} from "@/i18n/i18n.ts";
import {formatDuration, formatInitial, formatLocalizedName, formatSearchText} from "@/component/ui/format";
import CustomExtensionModal from "@/component/CustomExtensionModal";
import Alert from "@/component/ui/Alert";
import Badge, {type BadgeVariant} from "@/component/ui/Badge";
import Button from "@/component/ui/Button";
import EmptyState from "@/component/ui/EmptyState";
import Icon from "@/component/ui/Icon";
import Input from "@/component/ui/Input";
import List from "@/component/ui/List";
import ListRow from "@/component/ui/ListRow";
import Page from "@/component/ui/Page";
import PageHeader from "@/component/ui/PageHeader";
import Select from "@/component/ui/Select";
import StatCard from "@/component/ui/StatCard";
import StatsGrid from "@/component/ui/StatsGrid";
import Toolbar from "@/component/ui/Toolbar";
import ToolbarPrimary from "@/component/ui/ToolbarPrimary";


const LOAD_STATUS_LABEL_KEY: Record<ModLoadStatus, string> = {
  pending: 'loading-status-pending',
  loading: 'loading-status-loading',
  loaded: 'loading-status-loaded',
  error: 'loading-status-error',
};

const LOAD_STATUS_VARIANT: Record<ModLoadStatus, BadgeVariant> = {
  pending: 'neutral',
  loading: 'primary',
  loaded: 'success',
  error: 'danger',
};

interface ModManagerState {
  availableMods: Array<{
    addon: FusamAddon;
    registryId: string;
    registryUrl: string;
    config: ModConfig | null;
  }>;
  filter: 'all' | 'enabled' | 'disabled';
  searchQuery: string;
  error: string | null;
  expandedModId: string | null;
  // Track selected versions for mods that aren't installed yet
  pendingVersions: Map<string, string>; // key: `${modId}_${registryId}`, value: version
  showCustomExtensionModal: boolean;
  // Actual load status per mod, keyed by `${modId}_${registryId}`.
  loadStatus: Map<string, ModLoadEntry>;
}

export default class ModManagerPage extends Component<{}, ModManagerState> {
  private unsubscribeLoadStatus?: () => void;

  constructor(props: {}) {
    super(props);
    this.state = {
      availableMods: [],
      filter: 'all',
      searchQuery: '',
      error: null,
      expandedModId: null,
      pendingVersions: new Map(),
      showCustomExtensionModal: false,
      loadStatus: new Map(),
    };
  }

  componentDidMount() {
    this.loadMods();
    // Keep the per-mod load status live so badges reflect the real outcome,
    // including mods still loading or that crashed after the manager opened.
    this.unsubscribeLoadStatus = ModLoaderService.subscribeProgress(progress => {
      const loadStatus = new Map<string, ModLoadEntry>();
      progress.entries.forEach(entry => loadStatus.set(entry.modKey, entry));
      this.setState({loadStatus});
    });
  }

  componentWillUnmount() {
    this.unsubscribeLoadStatus?.();
  }

  loadMods = () => {
    const availableMods = ModService.getAvailableMods();
    this.setState({availableMods});
  };

  handleInstallMod = (modId: string, registryId: string) => {
    const uniqueKey = `${modId}_${registryId}`;
    const config = ModService.getConfig(modId, registryId);

    if (!config) {
      // Get the selected version from pendingVersions or use default
      const selectedVersion = this.state.pendingVersions.get(uniqueKey);
      const mod = this.state.availableMods.find(
        m => m.addon.id === modId && m.registryId === registryId
      );

      if (mod && mod.addon.versions.length > 0) {
        ModService.saveConfig({
          modId,
          registryId,
          enabled: true,
          selectedVersion: selectedVersion || mod.addon.versions[0].distribution,
        });

        // Clear pending version after install
        const newPendingVersions = new Map(this.state.pendingVersions);
        newPendingVersions.delete(uniqueKey);
        this.setState({pendingVersions: newPendingVersions});
      }
    } else {
      ModService.enableMod(modId, registryId);
    }
    this.loadMods();
  };

  handleVersionChange = (modId: string, registryId: string, version: string, isInstalled: boolean) => {
    const uniqueKey = `${modId}_${registryId}`;

    if (isInstalled) {
      // For installed mods, update the config directly
      ModService.changeVersion(modId, registryId, version);
      this.loadMods();
    } else {
      // For non-installed mods, store in pendingVersions
      const newPendingVersions = new Map(this.state.pendingVersions);
      newPendingVersions.set(uniqueKey, version);
      this.setState({pendingVersions: newPendingVersions});
    }
  };

  handleRemoveMod = (modId: string, registryId: string) => {
    if (confirm('Are you sure you want to remove this mod?')) {
      const uniqueKey = `${modId}_${registryId}`;
      ModService.removeConfig(modId, registryId);

      // Clear pending version if exists
      const newPendingVersions = new Map(this.state.pendingVersions);
      newPendingVersions.delete(uniqueKey);
      this.setState({pendingVersions: newPendingVersions});

      this.loadMods();
    }
  };

  handleFilterChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    this.setState({filter: target.value as 'all' | 'enabled' | 'disabled'});
  };

  handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.setState({searchQuery: target.value});
  };

  toggleExpanded = (modId: string) => {
    this.setState(prevState => ({
      expandedModId: prevState.expandedModId === modId ? null : modId,
    }));
  };

  handleOpenCustomExtensionModal = () => {
    this.setState({showCustomExtensionModal: true});
  };

  handleCloseCustomExtensionModal = () => {
    this.setState({showCustomExtensionModal: false});
  };

  handleCustomExtensionChanged = () => {
    // Reload mods when custom extensions are added/updated/deleted
    this.loadMods();
  };

  getFilteredMods = () => {
    const {availableMods, filter, searchQuery} = this.state;

    let filtered = availableMods;

    // Apply enabled/disabled filter
    if (filter === 'enabled') {
      filtered = filtered.filter(m => m.config?.enabled);
    } else if (filter === 'disabled') {
      filtered = filtered.filter(m => !m.config?.enabled);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => {
        const localizedNames = typeof m.addon.name === 'string'
          ? [m.addon.name]
          : Object.values(m.addon.name);
        const searchableText = formatSearchText([
          ...localizedNames,
          m.addon.description,
          m.addon.author,
          m.addon.id,
          m.registryUrl,
          ...(m.addon.tags || []),
          ...m.addon.versions.map(version => version.distribution),
        ]);

        return searchableText.includes(query);
      });
    }

    return filtered;
  };

  /**
   * Badge showing a mod's actual load outcome (loaded / failed / loading /
   * pending), with the load time and any error surfaced on hover.
   */
  renderLoadBadge = (modKey: string) => {
    const entry = this.state.loadStatus.get(modKey);

    if (!entry) {
      return (
        <Badge variant="neutral" title={i18n('loading-status-not-loaded')}>
          {i18n('loading-status-not-loaded')}
        </Badge>
      );
    }

    const label = i18n(LOAD_STATUS_LABEL_KEY[entry.status]);
    const showDuration = entry.durationMs !== undefined
      && (entry.status === 'loaded' || entry.status === 'error');

    return (
      <Badge variant={LOAD_STATUS_VARIANT[entry.status]} title={entry.error || label}>
        {label}{showDuration ? ` · ${formatDuration(entry.durationMs!)}` : ''}
      </Badge>
    );
  };

  render() {
    const {error, expandedModId, showCustomExtensionModal} = this.state;
    const filteredMods = this.getFilteredMods();
    const enabledCount = ModService.getEnabledCount();
    const totalCount = this.state.availableMods.length;

    const loadEntries = Array.from(this.state.loadStatus.values());
    const loadedCount = loadEntries.filter(entry => entry.status === 'loaded').length;
    const failedCount = loadEntries.filter(entry => entry.status === 'error').length;

    return (
      <Page size="xl">
        <PageHeader
          title={i18n('title-mod-manager')}
          actions={<Button
            onClick={this.handleOpenCustomExtensionModal}
            variant="neutral"
          >
            + {i18n('button-manage-custom-extensions')}
          </Button>}
        />

        {/* Error Message */}
        {error && (
          <Alert>
            {error}
          </Alert>
        )}

        {/* Stats Bar */}
        <StatsGrid>
          <StatCard label={i18n('label-total-mods')} value={totalCount} variant="primary"/>
          <StatCard label={i18n('label-enabled-mods')} value={enabledCount} variant="success"/>
          <StatCard label={i18n('label-disabled-mods')} value={totalCount - enabledCount}/>
          <StatCard label={i18n('label-loaded-mods')} value={loadedCount} variant="success"/>
          {failedCount > 0 && (
            <StatCard label={i18n('label-failed-mods')} value={failedCount} variant="danger"/>
          )}
        </StatsGrid>

        {/* Filters and Search */}
        <Toolbar>
          <ToolbarPrimary>
            <Input
              type="text"
              placeholder={i18n('placeholder-search-mods')}
              value={this.state.searchQuery}
              onInput={this.handleSearchChange}
            />
          </ToolbarPrimary>
          <Select
            value={this.state.filter}
            onChange={this.handleFilterChange}
            className="w-auto min-w-40"
          >
            <option value="all">{i18n('filter-all-mods')}</option>
            <option value="enabled">{i18n('filter-enabled-only')}</option>
            <option value="disabled">{i18n('filter-disabled-only')}</option>
          </Select>
        </Toolbar>

        {/* Mod List */}
        <List>
          {filteredMods.length === 0 ? (
            totalCount === 0 ? (
              <EmptyState
                title={i18n('no-mods-available')}
                description={i18n('no-mods-available-detail')}
              />
            ) : (
              <EmptyState title={i18n('no-mods-match-search')}/>
            )
          ) : (
            <div>
              {filteredMods.map((mod) => {
                const isEnabled = mod.config?.enabled || false;
                const uniqueId = `${mod.addon.id}_${mod.registryId}`;
                const modName = formatLocalizedName(mod.addon.name, currentLanguage());
                const modInitial = formatInitial(modName);

                // Get selected version: from config if installed, from pendingVersions if not, or default
                const selectedVersion = isEnabled
                  ? (mod.config?.selectedVersion || mod.addon.versions[0]?.distribution || '')
                  : (this.state.pendingVersions.get(uniqueId) || mod.addon.versions[0]?.distribution || '');

                const isExpanded = expandedModId === uniqueId;

                return (
                  <ListRow key={uniqueId}>
                    {/* Mod Header */}
                    <div
                      className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,19.5rem)] lg:items-start">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <div
                          className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg border border-bmm-border bg-bmm-surface-muted text-sm font-bold text-bmm-muted shadow-bmm-control"
                          aria-hidden={mod.addon.icon ? undefined : 'true'}
                        >
                          {mod.addon.icon ? (
                            <img
                              src={mod.addon.icon}
                              alt={modName}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : modInitial}
                        </div>

                        {/* Main Content */}
                        <div className="min-w-0 flex-1">
                          {/* Title Row */}
                          <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="min-w-0 text-[0.96875rem] font-bold leading-snug text-bmm-ink">
                              {modName}
                            </h3>
                            {mod.addon.tags && mod.addon.tags.length > 0 && (
                              <div className="flex min-w-0 flex-wrap gap-1">
                                {mod.addon.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} className="max-w-[9rem] overflow-hidden text-ellipsis">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Author and ID */}
                          <div className="mb-2 flex flex-wrap gap-x-2 gap-y-1 text-[0.8125rem] text-bmm-muted">
                            <span className="min-w-0 font-medium">by {mod.addon.author}</span>
                            <span className="text-bmm-faint">•</span>
                            <span className="min-w-0 break-all">ID: {mod.addon.id}</span>
                          </div>

                          {/* Description */}
                          <p className="m-0 line-clamp-2 text-sm leading-relaxed text-bmm-muted">
                            {mod.addon.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col gap-3 lg:items-stretch">
                        <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                          {isEnabled && (
                            <Badge variant="success">
                              {i18n('label-installed')}
                            </Badge>
                          )}
                          {isEnabled && this.renderLoadBadge(uniqueId)}
                          {!isEnabled && (
                            <Badge variant="neutral">
                              {i18n('filter-disabled-only')}
                            </Badge>
                          )}
                        </div>

                        {mod.addon.versions.length > 0 && (
                          <label className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
                            <span className="whitespace-nowrap text-[0.8125rem] font-semibold text-bmm-muted">
                              {i18n('label-selected-version')}:
                            </span>
                            <Select
                              value={selectedVersion}
                              onChange={(e) => this.handleVersionChange(
                                mod.addon.id,
                                mod.registryId,
                                (e.target as HTMLSelectElement).value,
                                isEnabled
                              )}
                              compact
                              className="w-auto max-w-full sm:max-w-[12rem]"
                            >
                              {mod.addon.versions.map(v => (
                                <option key={v.distribution} value={v.distribution}>
                                  {v.distribution}
                                </option>
                              ))}
                            </Select>
                          </label>
                        )}

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <Button
                            onClick={() => this.toggleExpanded(uniqueId)}
                            variant="ghost"
                            size="sm"
                            icon={<Icon name="chevron" open={isExpanded}/>}
                          >
                            {isExpanded ? i18n('button-less') : i18n('button-more')}
                          </Button>
                          {isEnabled ? (
                            <Button
                              onClick={() => this.handleRemoveMod(mod.addon.id, mod.registryId)}
                              variant="danger"
                              size="sm"
                              title="Remove this mod"
                            >
                              {i18n('button-remove-mod')}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => this.handleInstallMod(mod.addon.id, mod.registryId)}
                              variant="primary"
                              size="sm"
                              title="Install this mod"
                            >
                              {i18n('button-install-mod')}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div
                          className="rounded-lg border border-bmm-border bg-bmm-surface-raised p-3.5 shadow-bmm-control lg:col-span-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {mod.addon.repository && (
                              <div>
                                <span className="font-bold text-bmm-ink">{i18n('label-repository')}:</span>
                                <a
                                  href={mod.addon.repository}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 break-all font-semibold text-bmm-accent no-underline hover:text-bmm-accent-strong hover:underline"
                                >
                                  {mod.addon.repository}
                                </a>
                              </div>
                            )}
                            {mod.addon.website && (
                              <div>
                                <span className="font-bold text-bmm-ink">{i18n('label-website')}:</span>
                                <a
                                  href={mod.addon.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 break-all font-semibold text-bmm-accent no-underline hover:text-bmm-accent-strong hover:underline"
                                >
                                  {mod.addon.website}
                                </a>
                              </div>
                            )}
                            {mod.addon.discord && (
                              <div>
                                <span className="font-bold text-bmm-ink">{i18n('label-discord')}:</span>
                                <a
                                  href={mod.addon.discord}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 font-semibold text-bmm-accent no-underline hover:text-bmm-accent-strong hover:underline"
                                >
                                  {i18n('button-join-discord')}
                                </a>
                              </div>
                            )}
                            {mod.addon.type && (
                              <div>
                                <span className="font-bold text-bmm-ink">{i18n('label-type')}:</span>
                                <span className="ml-2 text-[0.8125rem] text-bmm-muted">{mod.addon.type}</span>
                              </div>
                            )}
                            {isEnabled && (() => {
                              const loadEntry = this.state.loadStatus.get(uniqueId);
                              return (
                                <div className="md:col-span-2">
                                  <span className="font-bold text-bmm-ink">{i18n('label-load-status')}:</span>
                                  <span className="ml-2 inline-flex items-center gap-2 align-middle">
                                    {this.renderLoadBadge(uniqueId)}
                                    {loadEntry?.loadType && (
                                      <span className="text-[0.8125rem] text-bmm-muted">{loadEntry.loadType}</span>
                                    )}
                                  </span>
                                  {loadEntry?.status === 'error' && loadEntry.error && (
                                    <p className="m-0 mt-1.5 break-words text-[0.8125rem] leading-5 text-red-600">
                                      {loadEntry.error}
                                    </p>
                                  )}
                                  {loadEntry?.postLoadError && (
                                    <p className="m-0 mt-1.5 break-words text-[0.8125rem] leading-5 text-amber-700">
                                      {i18n('label-post-load-error')}: {loadEntry.postLoadError}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                            <div>
                              <span className="font-bold text-bmm-ink">{i18n('label-registry')}:</span>
                              <span
                                className="ml-2 break-all text-[0.8125rem] text-bmm-muted">{mod.registryUrl}</span>
                            </div>
                            {mod.addon.versions.length > 0 && (
                              <div className="md:col-span-2">
                                <span
                                    className="font-bold text-bmm-ink">{i18n('label-available-versions')}:</span>
                                <div className="mt-1 flex gap-2 flex-wrap">
                                  {mod.addon.versions.map(v => (
                                    <Badge
                                      key={v.distribution}
                                      variant={(v.distribution === selectedVersion ? 'primary' : 'neutral') as BadgeVariant}
                                    >
                                      {v.distribution}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </ListRow>
                );
              })}
            </div>
          )}
        </List>

        {/* Footer Info */}
        {filteredMods.length > 0 && (
          <div className="mt-3.5 text-center text-[0.8125rem] text-bmm-muted">
            {i18n('showing-x-of-y-mods', {x: filteredMods.length, y: totalCount})}
          </div>
        )}

        {/* Custom Extension Modal */}
        {showCustomExtensionModal && (
          <CustomExtensionModal
            onClose={this.handleCloseCustomExtensionModal}
            onExtensionAdded={this.handleCustomExtensionChanged}
          />
        )}
      </Page>
    );
  }
}
