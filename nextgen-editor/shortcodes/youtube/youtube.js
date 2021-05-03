window.nextgenEditor.addShortcode('youtube', {
  type: 'block',
  plugin: 'shortcode-core',
  title: 'YouTube',
  button: {
    label: 'YouTube',
    icon: '<svg viewBox="-21 -117 682.66672 682" xmlns="http://www.w3.org/2000/svg"><path d="m626.8125 64.035156c-7.375-27.417968-28.992188-49.03125-56.40625-56.414062-50.082031-13.703125-250.414062-13.703125-250.414062-13.703125s-200.324219 0-250.40625 13.183593c-26.886719 7.375-49.03125 29.519532-56.40625 56.933594-13.179688 50.078125-13.179688 153.933594-13.179688 153.933594s0 104.378906 13.179688 153.933594c7.382812 27.414062 28.992187 49.027344 56.410156 56.410156 50.605468 13.707031 250.410156 13.707031 250.410156 13.707031s200.324219 0 250.40625-13.183593c27.417969-7.378907 49.03125-28.992188 56.414062-56.40625 13.175782-50.082032 13.175782-153.933594 13.175782-153.933594s.527344-104.382813-13.183594-154.460938zm-370.601562 249.878906v-191.890624l166.585937 95.945312zm0 0"/></svg>',
  },
  attributes: {
    url: {
      type: String,
      innerHTML: true,
      title: 'URL',
      widget: 'input-text',
      default: '',
    },
    width: {
      type: String,
      title: 'Width',
      widget: 'input-text',
      default: '',
    },
    height: {
      type: String,
      title: 'Width',
      widget: 'input-text',
      default: '',
    },
    class: {
      type: String,
      title: 'Class',
      widget: 'input-text',
      default: '',
    },
    autoplay: {
      type: Number,
      title: 'Autoplay',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 0,
    },
    cc_load_policy: {
      type: Number,
      title: 'Show Captions',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 0,
    },
    cc_lang_pref: {
      type: String,
      title: 'Captions Language',
      widget: 'input-text',
      default: '',
    },
    color: {
      type: String,
      title: 'Color',
      widget: 'input-text',
      default: 'red',
    },
    controls: {
      type: Number,
      title: 'Show Controls',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 1,
    },
    disablekb: {
      type: Number,
      title: 'Disable Keyboard',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 0,
    },
    enablejsapi: {
      type: Number,
      title: 'Enable API Control',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 0,
    },
    end: {
      type: Number,
      title: 'End Time (in sec)',
      widget: 'input-number',
      default: 0,
    },
    fs: {
      type: Number,
      title: 'Show Full Screen',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 1,
    },
    hl: {
      type: String,
      title: 'Interface Language',
      widget: 'input-text',
      default: '',
    },
    iv_load_policy: {
      type: Number,
      title: 'Show Annotations',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 1,
    },
    list: {
      type: String,
      title: 'List Name',
      widget: 'input-text',
      default: '',
    },
    listType: {
      type: String,
      title: 'List Type',
      widget: {
        type: 'select',
        values: [
          { value: '', label: '' },
          { value: 'playlist', label: 'Playlist' },
          { value: 'user_uploads', label: 'User Uploads' },
        ],
      },
      default: '',
    },
    loop: {
      type: Number,
      title: 'Loop',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 0,
    },
    modestbranding: {
      type: Number,
      title: 'Hide YouTube Logo',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 0,
    },
    origin: {
      type: String,
      title: 'Origin',
      widget: 'input-text',
      default: '',
    },
    playlist: {
      type: String,
      title: 'Playlist',
      widget: 'input-text',
      default: '',
    },
    playsinline: {
      type: Number,
      title: 'Play Inline',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 0,
    },
    rel: {
      type: Number,
      title: 'Show Related',
      widget: {
        type: 'checkbox',
        valueType: Number,
        label: 'Yes',
      },
      default: 1,
    },
    start: {
      type: Number,
      title: 'Start Time (in sec)',
      widget: 'input-number',
      default: 0,
    },
    widget_referrer: {
      type: String,
      title: 'Widget Referrer',
      widget: 'input-text',
      default: '',
    },
  },
  titlebar({ attributes }) {
    let id = '';

    try {
      id = new URL(attributes.url).searchParams.get('v');
    }
    catch (err) {
    }

    return `id: <strong>${id}</strong>`;
  },
  content({ attributes }) {
    let id = '';

    try {
      id = new URL(attributes.url).searchParams.get('v');
    }
    catch (err) {
    }

    return id
      ? `<div style="position:relative;padding-bottom:100%;height:0;padding-bottom:56.2493%;"><iframe src="https://www.youtube.com/embed/${id}" style="position:absolute;width:100%;height:100%;top:0;left:0;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen=""></iframe></div>`
      : '<div style="margin:36px;text-align:center;">Empty URL</div>';
  },
  preserve: {
    block: [
      'iframe',
    ],
  },
});

window.nextgenEditor.addHook('hookMarkdowntoHTML', {
  weight: -50,
  async handler(options, input) {
    let output = input;

    output = output.replace(/\[plugin:youtube\]\((?<url>[^)]*)\)/g, (...matches) => {
      const { url } = matches.pop();
      return `[youtube]${url}[/youtube]`;
    });

    return output;
  },
});
