(function() {
    'use strict';

    const YOUTUBE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-brand-youtube"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4z" /><path d="M10 9l5 3l-5 3z" /></svg>';

    const YES_NO_OPTIONS = [
        { label: 'Use plugin default', value: '' },
        { label: 'Enabled (1)', value: '1' },
        { label: 'Disabled (0)', value: '0' }
    ];

    const URL_FIELD = {
        name: 'url',
        label: 'YouTube Video URL',
        placeholder: 'https://www.youtube.com/watch?v=XXXXXXX'
    };

    const FIELD_GROUPS = [
        {
            title: 'Display Options',
            open: true,
            fields: [
                { name: 'width', label: 'Width (px)', type: 'number', placeholder: '640' },
                { name: 'height', label: 'Height (px)', type: 'number', placeholder: '360' },
                { name: 'class', label: 'CSS Class', type: 'text', placeholder: 'custom-class' },
                { name: 'thumbnail', label: 'Custom Thumbnail', type: 'text', placeholder: 'image-name.jpg' },
                { name: 'privacy_enhanced_mode', label: 'Privacy Enhanced Mode', type: 'select', options: YES_NO_OPTIONS },
                { name: 'lazy_load', label: 'Lazy Load', type: 'select', options: YES_NO_OPTIONS }
            ]
        },
        {
            title: 'Player Parameters',
            fields: [
                { name: 'autoplay', label: 'Autoplay', type: 'select', options: YES_NO_OPTIONS },
                { name: 'controls', label: 'Player Controls', type: 'select', options: YES_NO_OPTIONS },
                { name: 'loop', label: 'Loop Playback', type: 'select', options: YES_NO_OPTIONS },
                { name: 'rel', label: 'Show Related Videos', type: 'select', options: YES_NO_OPTIONS },
                { name: 'modestbranding', label: 'Minimal Branding', type: 'select', options: YES_NO_OPTIONS },
                { name: 'playsinline', label: 'Play Inline', type: 'select', options: YES_NO_OPTIONS },
                { name: 'fs', label: 'Fullscreen Button', type: 'select', options: YES_NO_OPTIONS },
                { name: 'disablekb', label: 'Disable Keyboard', type: 'select', options: YES_NO_OPTIONS },
                { name: 'enablejsapi', label: 'Enable JS API', type: 'select', options: YES_NO_OPTIONS },
                { name: 'cc_load_policy', label: 'Force Captions', type: 'select', options: YES_NO_OPTIONS },
                { name: 'iv_load_policy', label: 'Show Annotations', type: 'select', options: YES_NO_OPTIONS }
            ]
        },
        {
            title: 'Timing',
            fields: [
                { name: 'start', label: 'Start Time (sec)', type: 'number', min: 0 },
                { name: 'end', label: 'End Time (sec)', type: 'number', min: 0 }
            ]
        },
        {
            title: 'Advanced Parameters',
            fields: [
                { name: 'cc_lang_pref', label: 'Captions Language', type: 'text', placeholder: 'en' },
                { name: 'color', label: 'Player Color', type: 'select', options: [
                    { label: 'Use plugin default', value: '' },
                    { label: 'Red', value: 'red' },
                    { label: 'White', value: 'white' }
                ] },
                { name: 'hl', label: 'Interface Language', type: 'text', placeholder: 'en' },
                { name: 'list', label: 'List ID', type: 'text', placeholder: 'PL...' },
                { name: 'listType', label: 'List Type', type: 'select', options: [
                    { label: 'Use plugin default', value: '' },
                    { label: 'Playlist', value: 'playlist' },
                    { label: 'User Uploads', value: 'user_uploads' }
                ] },
                { name: 'playlist', label: 'Playlist IDs', type: 'text', placeholder: 'comma,separated' },
                { name: 'origin', label: 'Origin URL', type: 'text', placeholder: 'https://example.com' },
                { name: 'widget_referrer', label: 'Widget Referrer', type: 'text' },
                { name: 'vq', label: 'Preferred Quality', type: 'select', options: [
                    { label: 'Use plugin default', value: '' },
                    { label: 'Small', value: 'small' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Large', value: 'large' },
                    { label: 'HD 720', value: 'hd720' },
                    { label: 'HD 1080', value: 'hd1080' },
                    { label: 'Highres', value: 'highres' }
                ] }
            ]
        }
    ];

    const ATTRIBUTE_FIELDS = FIELD_GROUPS.flatMap(group => group.fields.map(field => field.name));

    function waitForEditorPro(callback) {
        if (window.EditorPro && window.EditorPro.registerPlugin) {
            callback();
        } else {
            setTimeout(() => waitForEditorPro(callback), 100);
        }
    }

    const Plugin = {
        name: 'youtube-shortcode',
        patchedShowForm: false,
        patchedShowEditForm: false,

        init(editorPro) {
            this.editorPro = editorPro;
            if (!editorPro || !editorPro.toolbar) {
                return;
            }

            this.addToolbarButton();
            this.interceptShowForm();
            this.interceptShowEditForm();
        },

        addToolbarButton() {
            if (this.editorPro.toolbar.querySelector('[data-toolbar-item="youtubeShortcode"]')) {
                return;
            }

            const toolbar = this.editorPro.toolbar;
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-toolbar-item', 'youtubeShortcode');
            button.setAttribute('data-tooltip', 'YouTube Shortcode');
            button.setAttribute('aria-label', 'Insert YouTube Shortcode');
            button.innerHTML = YOUTUBE_ICON;

            const leftSection = toolbar.querySelector('.toolbar-left');
            const afterShortcode = leftSection?.querySelector('[data-toolbar-item="shortcodeBlock"]');
            const afterHtml = leftSection?.querySelector('[data-toolbar-item="htmlBlock"]');
            const insertAfter = afterShortcode || afterHtml;

            if (insertAfter?.parentNode) {
                insertAfter.parentNode.insertBefore(button, insertAfter.nextSibling);
            } else if (leftSection) {
                leftSection.appendChild(button);
            } else {
                toolbar.appendChild(button);
            }

            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.showModal();
            });
        },

        interceptShowForm() {
            if (this.patchedShowForm || typeof this.editorPro.showShortcodeForm !== 'function') {
                return;
            }

            const original = this.editorPro.showShortcodeForm.bind(this.editorPro);
            this.editorPro.showShortcodeForm = (name, ...args) => {
                if ((name || '').toLowerCase() === 'youtube') {
                    this.showModal();
                    return;
                }

                return original(name, ...args);
            };

            this.patchedShowForm = true;
        },

        interceptShowEditForm() {
            if (this.patchedShowEditForm || typeof this.editorPro.showShortcodeEditForm !== 'function') {
                return;
            }

            const original = this.editorPro.showShortcodeEditForm.bind(this.editorPro);
            this.editorPro.showShortcodeEditForm = (shortcode, block, blockId, onUpdateCallback, ...rest) => {
                const name = (shortcode?.name || shortcode?.shortcodeName || '').toLowerCase();
                if (name === 'youtube') {
                    this.showModal({
                        mode: 'edit',
                        shortcode,
                        block,
                        blockId,
                        onUpdateCallback,
                        initialAttributes: { ...(block?.attributes || {}) },
                        initialUrl: this.extractUrl(block)
                    });
                    return;
                }

                return original(shortcode, block, blockId, onUpdateCallback, ...rest);
            };

            this.patchedShowEditForm = true;
        },

        showModal(options = {}) {
            const mode = options.mode || 'create';
            const modalContent = this.buildModalContents(options);
            const title = mode === 'edit' ? 'Edit YouTube Shortcode' : 'Insert YouTube Shortcode';
            const buttons = mode === 'edit'
                ? [
                    { text: 'Delete', style: 'danger', callback: () => this.handleDelete(options) },
                    { text: 'Cancel', style: 'secondary', callback: () => {} },
                    { text: 'Update', style: 'primary', callback: (modalElement) => this.handleUpdate(modalElement, options) }
                ]
                : [
                    { text: 'Cancel', style: 'secondary', callback: () => {} },
                    { text: 'Insert', style: 'primary', callback: (modalElement) => this.handleInsert(modalElement) }
                ];

            this.editorPro.createModal(
                title,
                modalContent,
                (modalElement) => this.focusUrlInput(modalElement),
                null,
                buttons
            );
        },

        buildModalContents(options = {}) {
            const shortcode = options.shortcode || this.getShortcodeConfig();
            const defaults = this.getDefaultAttributes(shortcode);
            const values = { ...defaults, ...(options.initialAttributes || {}) };
            const initialUrl = options.initialUrl || '';

            const css = `
            <style>
                .youtube-shortcode-form {
                    margin: 0;
                    padding: 0;
                    border: 0;
                    background: transparent;
                    box-shadow: none;
                    color: var(--editor-text, #111827);
                }
                .youtube-shortcode-form label {
                    display: block;
                    margin-bottom: 4px;
                    font-weight: 600;
                    font-size: 13px;
                    color: var(--editor-text, #111827);
                }
                .youtube-shortcode-form input,
                .youtube-shortcode-form select {
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid var(--toolbar-border, #d1d5db);
                    border-radius: 4px;
                    background: var(--editor-bg, #ffffff);
                    color: var(--editor-text, #111827);
                    transition: border-color 0.15s ease, box-shadow 0.15s ease;
                }
                .youtube-shortcode-form input::placeholder {
                    color: var(--editor-text, #111827);
                    opacity: 0.35;
                }
                .youtube-shortcode-form input[type="number"] {
                    -moz-appearance: textfield;
                    appearance: textfield;
                    background: var(--editor-bg, #ffffff);
                    color: var(--editor-text, #111827);
                    border: 1px solid var(--toolbar-border, #d1d5db);
                }
                .youtube-shortcode-form input[type="number"]::-webkit-outer-spin-button,
                .youtube-shortcode-form input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .youtube-shortcode-form input:focus,
                .youtube-shortcode-form select:focus {
                    outline: none;
                    border-color: var(--button-active, #3b82f6);
                    box-shadow: 0 0 0 1px rgba(59,130,246,0.2);
                }
                .youtube-field-group {
                    border: 1px solid var(--toolbar-border, #d1d5db);
                    border-radius: 6px;
                    padding: 8px 12px;
                    margin-bottom: 12px;
                    background: var(--editor-bg, #ffffff);
                    box-shadow: none;
                }
                .youtube-field-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                    margin-top: 10px;
                }
                .youtube-field-helper {
                    display: block;
                    margin-top: 4px;
                    font-size: 12px;
                    color: var(--editor-text, #111827);
                    opacity: 0.7;
                }
            </style>`;

            const urlField = `
                <div class="form-group">
                    <label for="youtube-url">${URL_FIELD.label}</label>
                    <input type="url" id="youtube-url" data-youtube-field="url" placeholder="${URL_FIELD.placeholder}" value="${initialUrl}" required />
                    <span class="youtube-field-helper">Paste the full YouTube or youtu.be URL.</span>
                </div>`;

            const groupsMarkup = FIELD_GROUPS.map(group => `
                <details class="youtube-field-group" ${group.open ? 'open' : ''}>
                    <summary>${group.title}</summary>
                    <div class="youtube-field-grid">
                        ${group.fields.map(field => this.renderField(field, values[field.name] || '')).join('')}
                    </div>
                </details>`).join('');

            return `
                ${css}
                <form class="youtube-shortcode-form">
                    ${urlField}
                    ${groupsMarkup}
                </form>`;
        },

        renderField(field, value) {
            const fieldId = `youtube-field-${field.name}`;
            if (field.type === 'select') {
                const options = field.options.map(opt => `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`).join('');
                return `
                    <div class="form-group">
                        <label for="${fieldId}">${field.label}</label>
                        <select id="${fieldId}" data-youtube-field="${field.name}">${options}</select>
                    </div>`;
            }

            const attrs = [];
            if (field.placeholder) attrs.push(`placeholder="${field.placeholder}"`);
            if (typeof field.min !== 'undefined') attrs.push(`min="${field.min}"`);

            const type = field.type === 'number' ? 'number' : 'text';
            return `
                <div class="form-group">
                    <label for="${fieldId}">${field.label}</label>
                    <input type="${type}" id="${fieldId}" data-youtube-field="${field.name}" value="${value}" ${attrs.join(' ')} />
                </div>`;
        },

        focusUrlInput(modalElement) {
            const url = modalElement.querySelector('[data-youtube-field="url"]');
            if (url) {
                setTimeout(() => url.focus(), 50);
            }
        },

        collectAttributes(formElement) {
            const attributes = {};
            ATTRIBUTE_FIELDS.forEach(name => {
                const input = formElement.querySelector(`[data-youtube-field="${name}"]`);
                if (!input) {
                    return;
                }

                let value = input.value;
                if (typeof value === 'string') {
                    value = value.trim();
                }

                if (value === '') {
                    return;
                }

                if (input.type === 'number') {
                    const num = Number(value);
                    if (!Number.isNaN(num)) {
                        attributes[name] = num.toString();
                    }
                    return;
                }

                attributes[name] = value;
            });
            return attributes;
        },

        removeEmpty(attributes) {
            const cleaned = {};
            Object.entries(attributes).forEach(([key, value]) => {
                if (value === null || value === undefined) {
                    return;
                }
                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (trimmed !== '') {
                        cleaned[key] = trimmed;
                    }
                    return;
                }
                cleaned[key] = value;
            });
            return cleaned;
        },

        handleInsert(modalElement) {
            const form = modalElement.querySelector('.youtube-shortcode-form');
            const urlField = form.querySelector('[data-youtube-field="url"]');
            const urlValue = urlField.value.trim();

            if (!urlValue || !this.isValidUrl(urlValue)) {
                alert('Please enter a valid YouTube URL.');
                return;
            }

            const attributes = this.removeEmpty(this.collectAttributes(form));
            const shortcode = this.getShortcodeConfig();
            const shortcodeText = this.editorPro.buildShortcodeString(shortcode, attributes, urlValue);
            this.editorPro.insertShortcode(shortcode, shortcodeText, attributes, urlValue);
            this.editorPro.editor?.commands?.focus?.();
        },

        handleUpdate(modalElement, context) {
            const form = modalElement.querySelector('.youtube-shortcode-form');
            const urlField = form.querySelector('[data-youtube-field="url"]');
            const urlValue = urlField.value.trim();

            if (!urlValue || !this.isValidUrl(urlValue)) {
                alert('Please enter a valid YouTube URL.');
                return;
            }

            const attributes = this.removeEmpty(this.collectAttributes(form));
            const config = context.shortcode || this.getShortcodeConfig();
            const shortcodeText = this.editorPro.buildShortcodeString(config, attributes, urlValue);
            const params = this.editorPro.buildParamsString(attributes);

            if (typeof context.onUpdateCallback === 'function') {
                context.onUpdateCallback({
                    tagName: config.name,
                    params,
                    attributes,
                    content: urlValue,
                    type: 'shortcode',
                    shortcodeConfig: config
                });
                return;
            }

            const blockId = context.blockId;
            const block = context.block;
            if (!block || !blockId) {
                return;
            }

            block.attributes = attributes;
            block.content = urlValue;
            block.original = shortcodeText;
            block.params = params;
            block.shortcodeConfig = config;
            this.editorPro.preservedBlocks.set(blockId, block);

            this.updateBlockDom(blockId, block, config);
            this.syncTipTapNode(blockId, block);
            this.editorPro.applyShortcodeCSS?.(blockId, config, attributes);
            this.editorPro.updateTextarea();
        },

        handleDelete(context) {
            if (context.blockId && typeof this.editorPro.deleteBlock === 'function') {
                this.editorPro.deleteBlock(context.blockId);
            }
        },

        updateBlockDom(blockId, block, config) {
            const element = document.querySelector(`[data-block-id="${blockId}"]`);
            if (!element) {
                return;
            }

            if (block) {
                if (!block.content && typeof block.original === 'string') {
                    const match = block.original.match(/\[youtube[^\]]*\]([\s\S]*?)\[\/youtube\]/i);
                    if (match && match[1]) {
                        block.content = this.stripHtml(match[1]);
                    }
                }

                if (!block.content && block.tagName === 'youtube') {
                    // Fallback: attempt to read from the in-editor DOM
                    const blockElement = document.querySelector(`[data-placeholder-id="${blockId}"]`);
                    if (blockElement) {
                        block.content = blockElement.innerText.trim();
                    }
                }
            }

            const header = element.querySelector('.preserved-block-header span');
            const registry = this.editorPro.shortcodeRegistry || window.EditorPro?.pluginSystem?.shortcodeRegistry;
            const title = registry?.generateTitleBar?.(block.tagName || config.name, block.attributes || {}) || 'YouTube Video';
            if (header) {
                header.innerHTML = title;
            }

            const contentDom = element.querySelector('.preserved-block-content');
            if (contentDom) {
                contentDom.textContent = block.content || '';
                contentDom.setAttribute('data-block-data', JSON.stringify(block));
            }
        },

        syncTipTapNode(blockId, block) {
            const editor = this.editorPro.editor;
            if (!editor) {
                return;
            }

            const { state, view } = editor;
            state.doc.descendants((node, pos) => {
                if (node.type.name === 'preservedBlock' && node.attrs.blockId === blockId) {
                    const tr = state.tr;
                    tr.setNodeMarkup(pos, null, {
                        blockId,
                        blockType: 'shortcode',
                        blockContent: block.content || '',
                        blockData: block
                    });
                    view.dispatch(tr);
                    return false;
                }
                return undefined;
            });
        },

        getShortcodeConfig() {
            if (this.shortcodeConfig) {
                return this.shortcodeConfig;
            }

            const registry = this.editorPro.shortcodeRegistry || window.EditorPro?.pluginSystem?.shortcodeRegistry;
            if (registry?.get) {
                const config = registry.get('youtube');
                if (config) {
                    if (!Array.isArray(config.titleBarAttributes) || config.titleBarAttributes.length === 0) {
                        config.titleBarAttributes = ['width', 'height', 'class'];
                    }
                    this.shortcodeConfig = config;
                    return config;
                }
            }

            const fallbackAttributes = {};
            ATTRIBUTE_FIELDS.forEach(name => {
                fallbackAttributes[name] = { type: 'text', default: '' };
            });

            this.shortcodeConfig = {
                name: 'youtube',
                type: 'block',
                hasContent: true,
                attributes: fallbackAttributes,
                titleBarAttributes: ['width', 'height', 'class']
            };

            return this.shortcodeConfig;
        },

        getDefaultAttributes(shortcode) {
            const defaults = {};
            Object.entries(shortcode.attributes || {}).forEach(([name, config]) => {
                if (config && Object.prototype.hasOwnProperty.call(config, 'default')) {
                    defaults[name] = config.default || '';
                }
            });
            return defaults;
        },

        extractUrl(block) {
            if (!block) {
                return '';
            }

            const extractFromHtml = (source) => {
                if (!source || typeof source !== 'string') {
                    return '';
                }

                const normalized = source.replace(/<br\s*\/?\s*>/gi, '\n');

                let match = normalized.match(/<a[^>]*href="([^"]+)"[^>]*>(?:[^<]*)<\/a>/i);
                if (match && match[1]) {
                    return match[1].trim();
                }

                match = normalized.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
                if (match && match[1]) {
                    return this.stripHtml(match[1]).trim();
                }

                return this.stripHtml(normalized).trim();
            };

            if (block.content && typeof block.content === 'string') {
                const fromContent = extractFromHtml(block.content);
                if (fromContent) {
                    return fromContent;
                }
            }

            if (block.original && typeof block.original === 'string') {
                const shortcodeMatch = block.original.match(/\[youtube[^\]]*\]([\s\S]*?)\[\/youtube\]/i);
                if (shortcodeMatch && shortcodeMatch[1]) {
                    const extracted = extractFromHtml(shortcodeMatch[1]);
                    if (extracted) {
                        return extracted;
                    }
                }
            }

            return '';
        },

        stripHtml(html) {
            if (!html || typeof html !== 'string') {
                return '';
            }

            return html
                .replace(/<\s*br\s*\/?\s*>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/gi, ' ')
                .replace(/&amp;/gi, '&')
                .replace(/&lt;/gi, '<')
                .replace(/&gt;/gi, '>')
                .trim();
        },

        isValidUrl(url) {
            try {
                const parsed = new URL(url);
                const host = parsed.hostname.toLowerCase();
                return host.includes('youtube.com') || host.includes('youtu.be');
            } catch (err) {
                return false;
            }
        }
    };

    waitForEditorPro(() => {
        if (window.EditorPro && window.EditorPro.registerPlugin) {
            window.EditorPro.registerPlugin(Plugin);
        }
    });
})();
