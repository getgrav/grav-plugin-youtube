(function() {
    'use strict';

    const YOUTUBE_ICON = '<svg viewBox="-21 -117 682.66672 682" xmlns="http://www.w3.org/2000/svg"><path d="m626.8125 64.035156c-7.375-27.417968-28.992188-49.03125-56.40625-56.414062-50.082031-13.703125-250.414062-13.703125-250.414062-13.703125s-200.324219 0-250.40625 13.183593c-26.886719 7.375-49.03125 29.519532-56.40625 56.933594-13.179688 50.078125-13.179688 153.933594-13.179688 153.933594s0 104.378906 13.179688 153.933594c7.382812 27.414062 28.992187 49.027344 56.410156 56.410156 50.605468 13.707031 250.410156 13.707031 250.410156 13.707031s200.324219 0 250.40625-13.183593c27.417969-7.378907 49.03125-28.992188 56.414062-56.40625 13.175782-50.082032 13.175782-153.933594 13.175782-153.933594s.527344-104.382813-13.183594-154.460938zm-370.601562 249.878906v-191.890624l166.585937 95.945312zm0 0"/></svg>';

    const YES_NO_OPTIONS = [
        { label: 'Use plugin default', value: '' },
        { label: 'Enabled (1)', value: '1' },
        { label: 'Disabled (0)', value: '0' }
    ];

    const URL_FIELD = {
        name: 'url',
        label: 'YouTube Video URL',
        type: 'url',
        placeholder: 'https://www.youtube.com/watch?v=XXXXXXX',
        required: true
    };

    const YOUTUBE_FIELD_GROUPS = [
        {
            title: 'Display Options',
            open: true,
            fields: [
                { name: 'width', label: 'Width (px)', type: 'number', placeholder: '640', min: 0 },
                { name: 'height', label: 'Height (px)', type: 'number', placeholder: '360', min: 0 },
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

    const ATTRIBUTE_FIELDS = YOUTUBE_FIELD_GROUPS.reduce((all, group) => {
        group.fields.forEach(field => all.push(field));
        return all;
    }, []);

    function waitForEditorPro(callback) {
        if (window.EditorPro && window.EditorPro.registerPlugin) {
            callback();
        } else {
            setTimeout(() => waitForEditorPro(callback), 100);
        }
    }

    const EditorProYoutubePlugin = {
        name: 'youtube-shortcode',
        attributeFields: ATTRIBUTE_FIELDS,

        init(editorPro) {
            this.editorPro = editorPro;
            if (!editorPro || !editorPro.toolbar) {
                return;
            }

            if (!editorPro.toolbar.querySelector('[data-toolbar-item="youtubeShortcode"]')) {
                this.addToolbarButton();
            }
        },

        addToolbarButton() {
            const toolbar = this.editorPro.toolbar;
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-toolbar-item', 'youtubeShortcode');
            button.setAttribute('data-tooltip', 'YouTube Shortcode');
            button.setAttribute('aria-label', 'Insert YouTube Shortcode');
            button.innerHTML = YOUTUBE_ICON;

            const leftSection = toolbar.querySelector('.toolbar-left');
            const afterShortcode = leftSection ? leftSection.querySelector('[data-toolbar-item="shortcodeBlock"]') : null;
            const afterHtml = leftSection ? leftSection.querySelector('[data-toolbar-item="htmlBlock"]') : null;
            const insertAfter = afterShortcode || afterHtml;

            if (insertAfter && insertAfter.parentNode) {
                insertAfter.parentNode.insertBefore(button, insertAfter.nextSibling);
            } else if (leftSection) {
                leftSection.appendChild(button);
            } else {
                toolbar.appendChild(button);
            }

            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.showYoutubeModal();
            });
        },

        showYoutubeModal() {
            const modalContent = this.buildModalContent();
            this.editorPro.createModal(
                'Insert YouTube Shortcode',
                modalContent,
                (modalElement) => this.focusFirstField(modalElement),
                null,
                [
                    { text: 'Cancel', style: 'secondary', callback: () => {} },
                    { text: 'Insert', style: 'primary', callback: (modalElement) => this.handleInsert(modalElement) }
                ]
            );
        },

        focusFirstField(modalElement) {
            const urlInput = modalElement.querySelector('[data-youtube-field="url"]');
            if (urlInput) {
                setTimeout(() => urlInput.focus(), 50);
            }
        },

        buildModalContent() {
            const styleBlock = `
                <style>
                    .youtube-shortcode-form label {
                        display: block;
                        font-weight: 600;
                        margin-bottom: 4px;
                        font-size: 13px;
                    }
                    .youtube-shortcode-form input,
                    .youtube-shortcode-form select {
                        width: 100%;
                        padding: 6px 8px;
                        border: 1px solid #dcdcdc;
                        border-radius: 4px;
                        font-size: 14px;
                    }
                    .youtube-field-group {
                        margin-bottom: 12px;
                        border: 1px solid #ececec;
                        border-radius: 4px;
                        padding: 8px 12px;
                        background: #fafafa;
                    }
                    .youtube-field-group summary {
                        cursor: pointer;
                        font-weight: 600;
                    }
                    .youtube-field-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 12px;
                        margin-top: 10px;
                    }
                    .youtube-field-grid .form-group {
                        margin: 0;
                    }
                    .youtube-url-field {
                        margin-bottom: 16px;
                    }
                </style>
            `;

            const urlField = `
                <div class="form-group youtube-url-field">
                    <label for="youtube-url">${URL_FIELD.label}</label>
                    <input type="url" id="youtube-url" data-youtube-field="url" placeholder="${URL_FIELD.placeholder}" ${URL_FIELD.required ? 'required' : ''} />
                </div>
            `;

            const groupsMarkup = YOUTUBE_FIELD_GROUPS.map(group => `
                <details class="youtube-field-group" ${group.open ? 'open' : ''}>
                    <summary>${group.title}</summary>
                    <div class="youtube-field-grid">
                        ${group.fields.map(field => this.renderField(field)).join('')}
                    </div>
                </details>
            `).join('');

            return `
                ${styleBlock}
                <form class="youtube-shortcode-form">
                    ${urlField}
                    ${groupsMarkup}
                </form>
            `;
        },

        renderField(field) {
            const fieldId = `youtube-field-${field.name}`;
            if (field.type === 'select' && Array.isArray(field.options)) {
                const options = field.options.map(option => `
                    <option value="${option.value}">${option.label}</option>
                `).join('');

                return `
                    <div class="form-group">
                        <label for="${fieldId}">${field.label}</label>
                        <select id="${fieldId}" data-youtube-field="${field.name}">
                            ${options}
                        </select>
                    </div>
                `;
            }

            const inputType = field.type === 'number' ? 'number' : 'text';
            const attributes = [];
            if (field.placeholder) {
                attributes.push(`placeholder="${field.placeholder}"`);
            }
            if (typeof field.min !== 'undefined') {
                attributes.push(`min="${field.min}"`);
            }

            return `
                <div class="form-group">
                    <label for="${fieldId}">${field.label}</label>
                    <input type="${inputType}" id="${fieldId}" data-youtube-field="${field.name}" ${attributes.join(' ')} />
                </div>
            `;
        },

        handleInsert(modalElement) {
            const form = modalElement.querySelector('.youtube-shortcode-form');
            if (!form) {
                return;
            }

            const urlInput = form.querySelector('[data-youtube-field="url"]');
            const urlValue = urlInput ? urlInput.value.trim() : '';

            if (!urlValue) {
                alert('Please enter a YouTube video URL.');
                return;
            }

            if (!this.isValidYoutubeUrl(urlValue)) {
                alert('Please enter a valid youtube.com or youtu.be URL.');
                return;
            }

            const attributes = this.collectAttributes(form);
            const shortcodeConfig = this.getShortcodeConfig();
            const shortcodeText = this.editorPro.buildShortcodeString(shortcodeConfig, attributes, urlValue);
            this.editorPro.insertShortcode(shortcodeConfig, shortcodeText, attributes, urlValue);

            if (this.editorPro.editor && this.editorPro.editor.commands && typeof this.editorPro.editor.commands.focus === 'function') {
                this.editorPro.editor.commands.focus();
            }
        },

        collectAttributes(formElement) {
            const attributes = {};
            this.attributeFields.forEach(field => {
                const input = formElement.querySelector(`[data-youtube-field="${field.name}"]`);
                if (!input) {
                    return;
                }

                let value = input.value;
                if (typeof value === 'string') {
                    value = value.trim();
                }

                if (field.type === 'select') {
                    value = input.value;
                }

                if (value === '') {
                    return;
                }

                if (field.type === 'number') {
                    const numeric = Number(value);
                    if (!Number.isNaN(numeric)) {
                        attributes[field.name] = numeric.toString();
                    }
                    return;
                }

                attributes[field.name] = value;
            });
            return attributes;
        },

        getShortcodeConfig() {
            if (this.shortcodeConfig) {
                return this.shortcodeConfig;
            }

            const registry = this.editorPro.shortcodeRegistry || (window.EditorPro && window.EditorPro.pluginSystem && window.EditorPro.pluginSystem.shortcodeRegistry);
            if (registry && typeof registry.get === 'function') {
                const config = registry.get('youtube');
                if (config) {
                    this.shortcodeConfig = config;
                    return config;
                }
            }

            const fallbackAttributes = {};
            this.attributeFields.forEach(field => {
                fallbackAttributes[field.name] = { type: 'text', default: '' };
            });

            this.shortcodeConfig = {
                name: 'youtube',
                type: 'block',
                hasContent: true,
                attributes: fallbackAttributes
            };

            return this.shortcodeConfig;
        },

        isValidYoutubeUrl(url) {
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
            window.EditorPro.registerPlugin(EditorProYoutubePlugin);
            console.log('YouTube shortcode integration loaded for Editor Pro');
        }
    });
})();
