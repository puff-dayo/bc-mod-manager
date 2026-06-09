import {Component} from "preact";
import {type ModConfig, ModService} from "../../service/ModService";
import {type FusamAddon} from "../../service/RegistryDataService";
import i18n, {currentLanguage} from "../../i18n/i18n.ts";
import CustomExtensionModal from "../../component/CustomExtensionModal";
import Alert from "../../component/ui/Alert";
import Badge, {type BadgeVariant} from "../../component/ui/Badge";
import Button from "../../component/ui/Button";
import EmptyState from "../../component/ui/EmptyState";
import Icon from "../../component/ui/Icon";
import Input from "../../component/ui/Input";
import List from "../../component/ui/List";
import ListRow from "../../component/ui/ListRow";
import Page from "../../component/ui/Page";
import PageHeader from "../../component/ui/PageHeader";
import Select from "../../component/ui/Select";
import StatCard from "../../component/ui/StatCard";
import StatsGrid from "../../component/ui/StatsGrid";
import Toolbar from "../../component/ui/Toolbar";
import ToolbarPrimary from "../../component/ui/ToolbarPrimary";

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
}

export default class ModManagerPage extends Component<{}, ModManagerState> {
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
    };
  }

  componentDidMount() {
    this.loadMods();
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
      filtered = filtered.filter(m =>
        (typeof m.addon.name == 'string'
          ? m.addon.name.toLowerCase().includes(query)
          : m.addon.name['en']?.includes(query)) ||
        m.addon.description.toLowerCase().includes(query) ||
        m.addon.author.toLowerCase().includes(query) ||
        m.addon.id.toLowerCase().includes(query) ||
        m.addon.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  render() {
    const {error, expandedModId, showCustomExtensionModal} = this.state;
    const filteredMods = this.getFilteredMods();
    const enabledCount = ModService.getEnabledCount();
    const totalCount = this.state.availableMods.length;

    return (
      <Page size="wide">
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
                const modName = typeof mod.addon.name === 'string'
                  ? mod.addon.name
                  : (mod.addon.name[currentLanguage().toLowerCase()] || mod.addon.name['en'] || 'Unknown Mod');

                // Get selected version: from config if installed, from pendingVersions if not, or default
                const selectedVersion = isEnabled
                  ? (mod.config?.selectedVersion || mod.addon.versions[0]?.distribution || '')
                  : (this.state.pendingVersions.get(uniqueId) || mod.addon.versions[0]?.distribution || '');

                const isExpanded = expandedModId === uniqueId;

                return (
                  <ListRow key={uniqueId}>
                    {/* Mod Header */}
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      {mod.addon.icon && (
                        <img
                          src={mod.addon.icon}
                          alt={modName}
                          className="h-12 w-12 flex-none rounded-lg border border-bmm-border bg-bmm-surface-muted object-cover shadow-bmm-control"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-[0.96875rem] font-bold leading-snug text-bmm-ink">{modName}</h3>
                          {mod.addon.tags && mod.addon.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {mod.addon.tags.slice(0, 3).map(tag => (
                                <Badge key={tag}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Author and ID */}
                        <div className="mb-2 text-[0.8125rem] text-bmm-muted">
                          <span className="font-medium">by {mod.addon.author}</span>
                          <span className="mx-2">•</span>
                          <span>ID: {mod.addon.id}</span>
                        </div>

                        {/* Description */}
                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-bmm-muted">
                          {mod.addon.description}
                        </p>

                        {/* Controls Row */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Status Badge */}
                          {isEnabled && (
                            <Badge variant="success">
                              {i18n('label-installed')}
                            </Badge>
                          )}

                          {/* Version Selector - Always show if versions available */}
                          {mod.addon.versions.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[0.8125rem] text-bmm-muted">{i18n('label-selected-version')}:</span>
                              <Select
                                value={selectedVersion}
                                onChange={(e) => this.handleVersionChange(
                                  mod.addon.id,
                                  mod.registryId,
                                  (e.target as HTMLSelectElement).value,
                                  isEnabled
                                )}
                                compact
                              >
                                {mod.addon.versions.map(v => (
                                  <option key={v.distribution} value={v.distribution}>
                                    {v.distribution}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          )}

                          {/* Expand/Collapse Button */}
                          <Button
                            onClick={() => this.toggleExpanded(uniqueId)}
                            variant="ghost"
                            size="sm"
                            icon={<Icon name="chevron" open={isExpanded}/>}
                          >
                            {isExpanded ? i18n('button-less') : i18n('button-more')}
                          </Button>

                          {/* Install/Remove Button */}
                          <div className="ml-auto">
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
                          <div className="mt-4 rounded-lg border border-bmm-border bg-bmm-surface-raised p-3.5 shadow-bmm-control">
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
