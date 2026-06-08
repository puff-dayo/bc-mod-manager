import {Component} from 'preact';
import {type CustomExtension, CustomExtensionService} from '../service/CustomExtensionService';
import i18n from '../i18n/i18n';
import Alert from './ui/Alert';
import Badge from './ui/Badge';
import Button from './ui/Button';
import CloseButton from './ui/CloseButton';
import EmptyState from './ui/EmptyState';
import Field from './ui/Field';
import FormGrid from './ui/FormGrid';
import FormPanel from './ui/FormPanel';
import Input from './ui/Input';
import ListRow from './ui/ListRow';
import ModalBackdrop from './ui/ModalBackdrop';
import ModalPanel from './ui/ModalPanel';
import Panel from './ui/Panel';
import Select from './ui/Select';
import Textarea from './ui/Textarea';

interface CustomExtensionModalProps {
  onClose: () => void;
  onExtensionAdded: () => void;
}

interface CustomExtensionModalState {
  extensions: CustomExtension[];
  showAddForm: boolean;
  editingId: string | null;
  formData: {
    name: string;
    author: string;
    description: string;
    sourceUrl: string;
    type: 'script' | 'module';
    icon: string;
    repository: string;
    website: string;
    tags: string;
  };
  error: string | null;
  success: string | null;
}

export default class CustomExtensionModal extends Component<CustomExtensionModalProps, CustomExtensionModalState> {
  constructor(props: CustomExtensionModalProps) {
    super(props);
    this.state = {
      extensions: CustomExtensionService.getAll(),
      showAddForm: false,
      editingId: null,
      formData: this.getEmptyFormData(),
      error: null,
      success: null,
    };
  }

  getEmptyFormData() {
    return {
      name: '',
      author: '',
      description: '',
      sourceUrl: '',
      type: 'script' as 'script' | 'module',
      icon: '',
      repository: '',
      website: '',
      tags: '',
    };
  }

  handleInputChange = (field: keyof CustomExtensionModalState['formData'], value: string) => {
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [field]: value,
      },
    }));
  };

  handleAddNew = () => {
    this.setState({
      showAddForm: true,
      editingId: null,
      formData: this.getEmptyFormData(),
      error: null,
      success: null,
    });
  };

  handleEdit = (extension: CustomExtension) => {
    this.setState({
      showAddForm: true,
      editingId: extension.id,
      formData: {
        name: extension.name,
        author: extension.author,
        description: extension.description,
        sourceUrl: extension.sourceUrl,
        type: extension.type,
        icon: extension.icon || '',
        repository: extension.repository || '',
        website: extension.website || '',
        tags: extension.tags?.join(', ') || '',
      },
      error: null,
      success: null,
    });
  };

  handleSubmit = () => {
    const {formData, editingId} = this.state;

    // Validate
    if (!formData.name.trim()) {
      this.setState({error: i18n('error-extension-name-required'), success: null});
      return;
    }

    if (!formData.sourceUrl.trim()) {
      this.setState({error: i18n('error-extension-source-url-required'), success: null});
      return;
    }

    // Parse tags
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const extensionData = {
      name: formData.name.trim(),
      author: formData.author.trim() || 'Unknown',
      description: formData.description.trim(),
      sourceUrl: formData.sourceUrl.trim(),
      type: formData.type,
      icon: formData.icon.trim() || undefined,
      repository: formData.repository.trim() || undefined,
      website: formData.website.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    let result;
    if (editingId) {
      // Update existing
      result = CustomExtensionService.update(editingId, extensionData);
      if (result) {
        this.setState({
          extensions: CustomExtensionService.getAll(),
          showAddForm: false,
          editingId: null,
          formData: this.getEmptyFormData(),
          error: null,
          success: i18n('success-extension-updated'),
        });
        this.props.onExtensionAdded();
      } else {
        this.setState({error: i18n('error-update-extension-failed'), success: null});
      }
    } else {
      // Add new
      result = CustomExtensionService.add(extensionData);
      if (result) {
        this.setState({
          extensions: CustomExtensionService.getAll(),
          showAddForm: false,
          formData: this.getEmptyFormData(),
          error: null,
          success: i18n('success-extension-added'),
        });
        this.props.onExtensionAdded();
      } else {
        this.setState({error: i18n('error-add-extension-failed'), success: null});
      }
    }
  };

  handleDelete = (id: string) => {
    if (confirm(i18n('confirm-delete-extension'))) {
      const success = CustomExtensionService.remove(id);
      if (success) {
        this.setState({
          extensions: CustomExtensionService.getAll(),
          error: null,
          success: i18n('success-extension-deleted'),
        });
        this.props.onExtensionAdded();
      } else {
        this.setState({error: i18n('error-delete-extension-failed'), success: null});
      }
    }
  };

  handleCancel = () => {
    this.setState({
      showAddForm: false,
      editingId: null,
      formData: this.getEmptyFormData(),
      error: null,
    });
  };

  render() {
    const {extensions, showAddForm, editingId, formData, error, success} = this.state;

    return (
      <ModalBackdrop className="z-50">
        <ModalPanel
          title={i18n('button-manage-custom-extensions')}
          subtitle={i18n('message-custom-extensions-info')}
          actions={<CloseButton
            onClick={this.props.onClose}
            variant="modal"
          />}
          footer={<Button
            onClick={this.props.onClose}
            variant="neutral"
            className="w-full"
          >
            {i18n('button-close')}
          </Button>}
        >
            {/* Messages */}
            {error && (
              <Alert>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                {success}
              </Alert>
            )}

            {/* Add/Edit Form */}
            {showAddForm ? (
              <FormPanel
                className="mb-6"
                title={editingId ? i18n('button-edit') : i18n('title-add-custom-extension')}
              >
                <FormGrid>
                  <Field label={`${i18n('label-extension-name')} *`}>
                    <Input
                      type="text"
                      value={formData.name}
                      onInput={(e) => this.handleInputChange('name', (e.target as HTMLInputElement).value)}
                      placeholder={i18n('placeholder-extension-name')}
                    />
                  </Field>

                  <Field label={i18n('label-extension-author')}>
                    <Input
                      type="text"
                      value={formData.author}
                      onInput={(e) => this.handleInputChange('author', (e.target as HTMLInputElement).value)}
                      placeholder={i18n('placeholder-extension-author')}
                    />
                  </Field>

                  <Field label={i18n('label-extension-description')} full>
                    <Textarea
                      value={formData.description}
                      onInput={(e) => this.handleInputChange('description', (e.target as HTMLTextAreaElement).value)}
                      placeholder={i18n('placeholder-extension-description')}
                      rows={3}
                    />
                  </Field>

                  <Field label={`${i18n('label-extension-source-url')} *`} full>
                    <Input
                      type="text"
                      value={formData.sourceUrl}
                      onInput={(e) => this.handleInputChange('sourceUrl', (e.target as HTMLInputElement).value)}
                      placeholder={i18n('placeholder-extension-source-url')}
                    />
                  </Field>

                  <Field label={i18n('label-extension-type')}>
                    <Select
                      value={formData.type}
                      onChange={(e) => this.handleInputChange('type', (e.target as HTMLSelectElement).value)}
                    >
                      <option value="script">{i18n('option-type-script')}</option>
                      <option value="module">{i18n('option-type-module')}</option>
                    </Select>
                  </Field>

                  <Field label={i18n('label-extension-icon-url')}>
                    <Input
                      type="text"
                      value={formData.icon}
                      onInput={(e) => this.handleInputChange('icon', (e.target as HTMLInputElement).value)}
                      placeholder={i18n('placeholder-extension-icon-url')}
                    />
                  </Field>

                  <Field label={i18n('label-extension-repository-url')}>
                    <Input
                      type="text"
                      value={formData.repository}
                      onInput={(e) => this.handleInputChange('repository', (e.target as HTMLInputElement).value)}
                      placeholder={i18n('placeholder-extension-repository-url')}
                    />
                  </Field>

                  <Field label={i18n('label-extension-website-url')}>
                    <Input
                      type="text"
                      value={formData.website}
                      onInput={(e) => this.handleInputChange('website', (e.target as HTMLInputElement).value)}
                      placeholder={i18n('placeholder-extension-website-url')}
                    />
                  </Field>

                  <Field label={i18n('label-extension-tags')} full>
                    <Input
                      type="text"
                      value={formData.tags}
                      onInput={(e) => this.handleInputChange('tags', (e.target as HTMLInputElement).value)}
                      placeholder={i18n('placeholder-extension-tags')}
                    />
                  </Field>

                  <div className="col-span-full flex gap-2 pt-2">
                    <Button
                      onClick={this.handleSubmit}
                      variant="primary"
                    >
                      {editingId ? i18n('button-save') : i18n('button-add')}
                    </Button>
                    <Button
                      onClick={this.handleCancel}
                      variant="neutral"
                    >
                      {i18n('button-cancel')}
                    </Button>
                  </div>
                </FormGrid>
              </FormPanel>
            ) : (
              <div className="mb-4">
                <Button
                  onClick={this.handleAddNew}
                  variant="primary"
                >
                  + {i18n('button-add-custom-extension')}
                </Button>
              </div>
            )}

            {/* Extensions List */}
          <Panel list title={`${i18n('label-custom-extensions')} (${extensions.length})`}>
              {extensions.length === 0 ? (
                <EmptyState title={i18n('message-no-custom-extensions')}/>
              ) : (
                <div>
                  {extensions.map(ext => (
                    <ListRow key={ext.id}>
                      <div className="flex items-start gap-3">
                        {ext.icon && (
                          <img
                            src={ext.icon}
                            alt={ext.name}
                            className="h-10 w-10 flex-none rounded-lg border border-slate-200 bg-slate-50 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[0.96875rem] font-bold leading-snug text-slate-900">{ext.name}</h4>
                          <p className="text-[0.8125rem] text-slate-500">by {ext.author}</p>
                          {ext.description && (
                            <p className="mt-2 text-sm leading-relaxed text-slate-700">{ext.description}</p>
                          )}
                          <div className="mt-2 break-all text-[0.8125rem] text-slate-500">
                            <span className="font-medium">URL:</span> {ext.sourceUrl}
                          </div>
                          {ext.tags && ext.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {ext.tags.map(tag => (
                                <Badge key={tag}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => this.handleEdit(ext)}
                            variant="primary"
                            size="sm"
                          >
                            {i18n('button-edit')}
                          </Button>
                          <Button
                            onClick={() => this.handleDelete(ext.id)}
                            variant="danger"
                            size="sm"
                          >
                            {i18n('button-delete')}
                          </Button>
                        </div>
                      </div>
                    </ListRow>
                  ))}
                </div>
              )}
          </Panel>
        </ModalPanel>
      </ModalBackdrop>
    );
  }
}
