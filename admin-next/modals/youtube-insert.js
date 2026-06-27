// YouTube insert modal for the admin-next default markdown editor.
//
// Opened by the editor toolbar button (registered via onApiMarkdownEditorButtons).
// It fetches /youtube/config to learn the insert mode, collects the video URL
// (plus player options in shortcode mode), then resolves { insertContent } so
// the editor drops the markdown in at the cursor. No shortcode-core dependency
// in link mode — that's the whole point of the mode toggle.
const TAG = window.__GRAV_MODAL_TAG;

const DEFAULT_CONFIG = { insert_mode: 'link', shortcode_core: false };

const YES_NO = [
    { label: 'Use plugin default', value: '' },
    { label: 'Enabled (1)', value: '1' },
    { label: 'Disabled (0)', value: '0' },
];

// Shortcode-mode fields. Each maps to a [youtube] attribute.
const FIELD_GROUPS = [
    {
        title: 'Display Options',
        open: true,
        fields: [
            { name: 'width', label: 'Width (px)', type: 'number', placeholder: '640' },
            { name: 'height', label: 'Height (px)', type: 'number', placeholder: '360' },
            { name: 'class', label: 'CSS Class', type: 'text', placeholder: 'custom-class' },
            { name: 'thumbnail', label: 'Custom Thumbnail', type: 'text', placeholder: 'image-name.jpg' },
            { name: 'privacy_enhanced_mode', label: 'Privacy Enhanced Mode', type: 'select', options: YES_NO },
            { name: 'lazy_load', label: 'Lazy Load', type: 'select', options: YES_NO },
        ],
    },
    {
        title: 'Player Parameters',
        fields: [
            { name: 'autoplay', label: 'Autoplay', type: 'select', options: YES_NO },
            { name: 'controls', label: 'Player Controls', type: 'select', options: YES_NO },
            { name: 'loop', label: 'Loop Playback', type: 'select', options: YES_NO },
            { name: 'rel', label: 'Show Related Videos', type: 'select', options: YES_NO },
            { name: 'modestbranding', label: 'Minimal Branding', type: 'select', options: YES_NO },
            { name: 'fs', label: 'Fullscreen Button', type: 'select', options: YES_NO },
            { name: 'cc_load_policy', label: 'Force Captions', type: 'select', options: YES_NO },
        ],
    },
    {
        title: 'Timing',
        fields: [
            { name: 'start', label: 'Start Time (sec)', type: 'number' },
            { name: 'end', label: 'End Time (sec)', type: 'number' },
        ],
    },
];

const ATTRIBUTE_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.name));

class YoutubeInsertModal extends HTMLElement {
    constructor() {
        super();
        this._config = { ...DEFAULT_CONFIG };
    }

    connectedCallback() {
        // Render the link-mode form immediately (no loading flash), then
        // re-render only if the resolved config turns out to be shortcode mode.
        this._render();
        this._loadConfig().then(() => {
            if (this._isShortcode() && this._renderedMode !== 'shortcode') {
                const current = this.querySelector('#yt-url');
                const keepUrl = current ? current.value : '';
                this._render();
                const next = this.querySelector('#yt-url');
                if (next && keepUrl) next.value = keepUrl;
            }
        });
    }

    // ─── API ─────────────────────────────────────────
    _apiUrl(path) {
        return (window.__GRAV_API_SERVER_URL || '') + (window.__GRAV_API_PREFIX || '/api/v1') + path;
    }

    async _loadConfig() {
        try {
            const headers = {};
            const token = window.__GRAV_API_TOKEN;
            if (token) headers['X-API-Token'] = token;
            const resp = await fetch(this._apiUrl('/youtube/config'), { headers });
            if (resp.ok) {
                const json = await resp.json();
                this._config = { ...DEFAULT_CONFIG, ...(json.data || json) };
            }
        } catch (e) {
            // Non-fatal — fall back to link mode.
        }
    }

    _isShortcode() {
        return this._config.insert_mode === 'shortcode';
    }

    // ─── Resolve / cancel ────────────────────────────
    _resolve(insertContent) {
        this.dispatchEvent(new CustomEvent('resolve', { detail: { insertContent } }));
    }

    _cancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    // ─── Render ──────────────────────────────────────
    _render() {
        const shortcode = this._isShortcode();
        this._renderedMode = shortcode ? 'shortcode' : 'link';
        const groups = shortcode
            ? FIELD_GROUPS.map(
                  (group) => `
                <details class="yt-group" ${group.open ? 'open' : ''}>
                    <summary>${group.title}</summary>
                    <div class="yt-grid">
                        ${group.fields.map((f) => this._renderField(f)).join('')}
                    </div>
                </details>`,
              ).join('')
            : '';

        const helper = shortcode
            ? 'Inserts a <code>[youtube]</code> shortcode. Requires the shortcode-core plugin to render.'
            : 'Inserts a <code>[plugin:youtube](url)</code> link that the YouTube plugin renders on its own. No shortcode-core required.';

        this.innerHTML = `
            <style>
                .yt-modal { display:flex; flex-direction:column; height:100%; color:var(--foreground); }
                .yt-body { flex:1 1 auto; overflow-y:auto; padding:20px 24px; }
                .yt-footer { flex:0 0 auto; display:flex; justify-content:flex-end; gap:8px;
                    border-top:1px solid var(--border); padding:14px 24px; }
                .yt-modal label { display:block; margin-bottom:4px; font-size:12px; font-weight:600; color:var(--muted-foreground); }
                .yt-modal input, .yt-modal select {
                    width:100%; height:38px; padding:6px 10px; font-size:14px;
                    border:1px solid var(--input); border-radius:8px;
                    background:var(--muted); color:var(--foreground); box-sizing:border-box;
                }
                .yt-modal input:focus, .yt-modal select:focus { outline:none; border-color:var(--ring); box-shadow:0 0 0 1px var(--ring); }
                .yt-helper { display:block; margin-top:6px; font-size:12px; color:var(--muted-foreground); }
                .yt-error { margin-top:8px; font-size:13px; color:var(--destructive); display:none; }
                .yt-group { border:1px solid var(--border); border-radius:8px; padding:8px 12px; margin-top:14px; }
                .yt-group > summary { cursor:pointer; font-size:13px; font-weight:600; color:var(--foreground); }
                .yt-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-top:10px; }
                .yt-btn { height:36px; padding:0 16px; font-size:14px; font-weight:500; border-radius:8px; cursor:pointer; border:1px solid var(--border); }
                .yt-btn-cancel { background:transparent; color:var(--foreground); }
                .yt-btn-cancel:hover { background:var(--accent); }
                .yt-btn-primary { background:var(--primary); color:var(--primary-foreground); border-color:var(--primary); }
                .yt-btn-primary:hover { filter:brightness(0.95); }
                .yt-modal input[type=number]::-webkit-inner-spin-button { opacity:.5; }
            </style>
            <form class="yt-modal" id="yt-form">
                <div class="yt-body">
                    <div>
                        <label for="yt-url">YouTube Video URL</label>
                        <input type="url" id="yt-url" placeholder="https://www.youtube.com/watch?v=XXXXXXX" required />
                        <span class="yt-helper">${helper}</span>
                        <div class="yt-error" id="yt-error">Please enter a valid YouTube URL.</div>
                    </div>
                    ${groups}
                </div>
                <div class="yt-footer">
                    <button type="button" class="yt-btn yt-btn-cancel" id="yt-cancel">Cancel</button>
                    <button type="submit" class="yt-btn yt-btn-primary" id="yt-insert">Insert</button>
                </div>
            </form>`;

        const form = this.querySelector('#yt-form');
        const url = this.querySelector('#yt-url');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this._insert();
        });
        this.querySelector('#yt-cancel').addEventListener('click', () => this._cancel());
        setTimeout(() => url && url.focus(), 50);
    }

    _renderField(field) {
        const id = `yt-field-${field.name}`;
        if (field.type === 'select') {
            const opts = field.options
                .map((o) => `<option value="${o.value}">${o.label}</option>`)
                .join('');
            return `<div><label for="${id}">${field.label}</label><select id="${id}" data-yt-field="${field.name}">${opts}</select></div>`;
        }
        const type = field.type === 'number' ? 'number' : 'text';
        const ph = field.placeholder ? `placeholder="${field.placeholder}"` : '';
        return `<div><label for="${id}">${field.label}</label><input type="${type}" id="${id}" data-yt-field="${field.name}" ${ph} /></div>`;
    }

    _collectAttributes() {
        const attrs = {};
        ATTRIBUTE_FIELDS.forEach((name) => {
            const input = this.querySelector(`[data-yt-field="${name}"]`);
            if (!input) return;
            const value = (input.value || '').trim();
            if (value !== '') attrs[name] = value;
        });
        return attrs;
    }

    _buildShortcode(url, attrs) {
        const parts = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`);
        const params = parts.length ? ' ' + parts.join(' ') : '';
        return `[youtube${params}]${url}[/youtube]`;
    }

    _insert() {
        const urlInput = this.querySelector('#yt-url');
        const url = (urlInput.value || '').trim();
        if (!url || !this._isValidUrl(url)) {
            const err = this.querySelector('#yt-error');
            if (err) err.style.display = 'block';
            urlInput.focus();
            return;
        }

        const markdown = this._isShortcode()
            ? this._buildShortcode(url, this._collectAttributes())
            : `[plugin:youtube](${url})`;

        this._resolve(markdown);
    }

    _isValidUrl(url) {
        try {
            const host = new URL(url).hostname.toLowerCase();
            return host.includes('youtube.com') || host.includes('youtu.be');
        } catch (e) {
            return false;
        }
    }
}

customElements.define(TAG, YoutubeInsertModal);
