import {Component} from "preact";
import i18n from "@/i18n/i18n.ts";
import {type AppSettings, SettingsService} from "@/service/SettingsService.ts";
import Page from "@/component/ui/Page.tsx";
import PageHeader from "@/component/ui/PageHeader.tsx";
import Panel from "@/component/ui/Panel.tsx";
import Toggle from "@/component/ui/Toggle.tsx";
import Button from "@/component/ui/Button.tsx";
import Icon from "@/component/ui/Icon.tsx";

interface SettingsPageState {
  settings: AppSettings;
}

/**
 * Settings page — exposes the user-configurable application preferences.
 */
export default class SettingsPage extends Component<{}, SettingsPageState> {
  private unsubscribe?: () => void;

  constructor(props: {}) {
    super(props);
    this.state = {settings: SettingsService.getAll()};
  }

  componentDidMount() {
    this.unsubscribe = SettingsService.subscribe(settings => this.setState({settings}));
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }

  private handleToggleModCache = (checked: boolean) => {
    SettingsService.set('modCacheEnabled', checked);
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const {settings} = this.state;

    return (
      <Page size="wide">
        <PageHeader title={i18n('title-settings')} subtitle={i18n('subtitle-settings')}/>

        <Panel title={i18n('settings-section-loading')} body>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="m-0 text-sm font-bold text-bmm-ink">{i18n('settings-mod-cache-label')}</p>
              <p className="m-0 mt-1 text-[0.8125rem] leading-5 text-bmm-muted">
                {i18n('settings-mod-cache-description')}
              </p>
            </div>
            <Toggle
              checked={settings.modCacheEnabled}
              onChange={this.handleToggleModCache}
              label={i18n('settings-mod-cache-label')}
            />
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-bmm-border pt-3.5">
            <p className="m-0 text-[0.8125rem] text-bmm-muted">{i18n('settings-note-reload')}</p>
            <Button variant="neutral" size="sm" icon={<Icon name="refresh"/>} onClick={this.handleReload}>
              {i18n('loading-button-reload')}
            </Button>
          </div>
        </Panel>
      </Page>
    );
  }
}