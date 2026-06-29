<?php
/**
 * YouTube
 *
 * This plugin embeds YouTube video from markdown URLs
 *
 * Licensed under MIT, see LICENSE.
 */

namespace Grav\Plugin;

use Grav\Common\Data\Data;
use Grav\Common\Plugin;
use Grav\Common\Page\Page;
use Grav\Common\Twig\Twig;
use Grav\Plugin\Youtube\Twig\YoutubeTwigExtension;
use RocketTheme\Toolbox\Event\Event;

class YoutubePlugin extends Plugin
{
    const YOUTUBE_REGEX = '(?:https?:\/{2}(?:(?:www.youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=))|(?:youtu\.be\/)))([a-zA-Z0-9_-]{11})(?:\?size=(\d+),(\d+))?';

    /**
     * Canonical allow-list of genuine YouTube IFrame Player API parameters.
     * Only these keys may be appended to the embed URL query string. A shortcode
     * attribute that isn't here is either a plugin-control key (see
     * CONTROL_PARAMS) or an iframe HTML attribute (width/height/title/…), and
     * must never leak into the URL sent to YouTube.
     *
     * Kept in sync with editor-pro/youtube-integration.js (FIELD_GROUPS).
     *
     * @var string[]
     */
    const PLAYER_PARAMS = [
        'autoplay', 'cc_lang_pref', 'cc_load_policy', 'color', 'controls',
        'disablekb', 'enablejsapi', 'end', 'fs', 'hl', 'iv_load_policy', 'list',
        'listType', 'loop', 'modestbranding', 'mute', 'origin', 'playlist',
        'playsinline', 'rel', 'start', 'widget_referrer', 'vq',
    ];

    /**
     * Shortcode attributes that drive plugin behaviour and are consumed
     * internally — never forwarded to the URL nor rendered as iframe attributes.
     *
     * @var string[]
     */
    const CONTROL_PARAMS = ['privacy_enhanced_mode', 'lazy_load', 'class', 'thumbnail'];

    /**
     * Rendered embeds awaiting injection, keyed by a plain-text placeholder.
     * We swap the `[plugin:youtube](url)` link for a placeholder in
     * onPageContentRaw (pre-Markdown) and inject the real `<iframe>` in
     * onPageContentProcessed (post-Markdown). This keeps the iframe out of the
     * Markdown pass, where Grav 2.0's GFM `tagfilter` would otherwise escape it
     * into inert `&lt;iframe&gt;` text.
     *
     * @var array<string,string>
     */
    protected $pendingEmbeds = [];

    /** @var int Monotonic counter for unique embed placeholders. */
    protected $embedCounter = 0;

    /**
     * Return a list of subscribed events.
     *
     * @return array    The list of events of the plugin of the form
     *                      'name' => ['method_name', priority].
     */
    public static function getSubscribedEvents()
    {
        return [
            'onPluginsInitialized' => ['onPluginsInitialized', 0],
            'onApiRegisterRoutes' => ['onApiRegisterRoutes', 0],
            'onApiMarkdownEditorButtons' => ['onApiMarkdownEditorButtons', 0],
            'onXssAllowedIframeHosts' => ['onXssAllowedIframeHosts', 0],
            'registerNextGenEditorPlugin' => ['registerNextGenEditorPluginShortcodes', 0],
            'registerEditorProPlugin' => ['registerEditorProPlugin', 0],
            'onEditorProShortcodeRegister' => ['onEditorProShortcodeRegister', 0],
        ];
    }

    /**
     * Initialize configuration.
     */
    public function onPluginsInitialized()
    {
        // PSR-4 autoloader for the plugin's classes/ directory. Registered
        // unconditionally so API controllers resolve on the admin-next/API
        // path too, where routes are served from cache and onApiRegisterRoutes
        // doesn't re-fire to require them.
        spl_autoload_register(static function ($class) {
            $prefix = 'Grav\\Plugin\\Youtube\\';
            if (strpos($class, $prefix) !== 0) {
                return;
            }
            $relative = substr($class, strlen($prefix));
            $path = __DIR__ . '/classes/' . str_replace('\\', '/', $relative) . '.php';
            if (is_file($path)) {
                require_once $path;
            }
        });

        if ($this->isAdmin()) {
            $this->enable([
                'onTwigSiteVariables' => ['onTwigSiteVariables', 0],
            ]);
            return;
        }

        $this->enable([
            'onPageContentRaw' => ['onPageContentRaw', 0],
            'onPageContentProcessed' => ['onPageContentProcessed', 0],
            'onTwigExtensions' => ['onTwigExtensions', 0],
            'onTwigSiteVariables' => ['onTwigSiteVariables', 0],
            'onTwigTemplatePaths' => ['onTwigTemplatePaths', 0],
            'onShortcodeHandlers' => ['onShortcodeHandlers', 0],
        ]);
    }

    /**
     * Add content after page content was read into the system.
     *
     * @param  Event  $event An event object, when `onPageContentRaw` is fired.
     */
    public function onPageContentRaw(Event $event)
    {
        /** @var Page $page */
        $page = $event['page'];
        /** @var Twig $twig */
        $twig = $this->grav['twig'];
        /** @var Data $config */
        $config = $this->mergeConfig($page, TRUE);

        if ($config->get('enabled')) {
            // Get raw content and substitute all formulas by a unique token
            $raw = $page->getRawContent();

            // build an anonymous function to pass to `parseLinks()`
            $function = function ($matches) use ($twig, $config) {
                $search = $matches[0];

                // double check to make sure we found a valid YouTube video ID
                if (!isset($matches[1])) {
                    return $search;
                }

                $options = array(
                    'player_parameters' => $config->get('player_parameters'),
                    'privacy_enhanced_mode' => $config->get('privacy_enhanced_mode'),
                    'lazy_load' => $config->get('lazy_load'),
                    'video_id' => $matches[1]
                );

                
                // check if size was given
                if (isset($matches[2]) && isset($matches[3])) {
                    $options['video_size'] = true;
                    $options['video_height'] = $matches[2];
                    $options['video_width'] = $matches[3];
                }

                // build the replacement embed HTML string
                $replace = $twig->processTemplate('partials/youtube.html.twig', $options);

                // Defer injecting the raw <iframe> until after Markdown has run
                // (onPageContentProcessed) so GFM tagfilter can't escape it.
                // Leave a plain-text placeholder Markdown won't touch.
                $token = 'GRAVYOUTUBEEMBED' . $this->embedCounter++ . 'X';
                $this->pendingEmbeds[$token] = $replace;

                return $token;
            };

            // set the parsed content back into as raw content
            $page->setRawContent($this->parseLinks($raw, $function, $this::YOUTUBE_REGEX));
        }
    }

    /**
     * Swap the deferred placeholders for the rendered embeds, now that Markdown
     * (and its tagfilter) has run. The `<p>` wrapper Markdown puts around a
     * lone placeholder is stripped so the embed isn't nested inside a paragraph.
     *
     * @param  Event  $event An event object, when `onPageContentProcessed` is fired.
     */
    public function onPageContentProcessed(Event $event)
    {
        if (empty($this->pendingEmbeds)) {
            return;
        }

        /** @var Page $page */
        $page = $event['page'];
        $content = $page->getRawContent();

        foreach ($this->pendingEmbeds as $token => $html) {
            if (strpos($content, $token) === false) {
                continue;
            }
            // Unwrap a paragraph that holds only this placeholder, then replace
            // any remaining bare occurrences.
            $content = preg_replace('#<p>\s*' . preg_quote($token, '#') . '\s*</p>#', $html, $content);
            $content = str_replace($token, $html, $content);
            unset($this->pendingEmbeds[$token]);
        }

        $page->setRawContent($content);
    }

    /**
     * Add Twig Extensions.
     */
    public function onTwigExtensions()
    {
        require_once __DIR__ . '/classes/Twig/YoutubeTwigExtension.php';
        $this->grav['twig']->twig->addExtension(new YoutubeTwigExtension());
    }

    /**
     * Tell Grav's rendered-output XSS scanner that YouTube embed iframes are
     * trusted. Without this, sites with `security.twig_content.process_enabled`
     * blank any page containing a YouTube embed (the `<iframe>` is otherwise a
     * dangerous tag). Subdomains of these hosts match too (e.g. `www.`).
     */
    public function onXssAllowedIframeHosts(Event $event): void
    {
        $hosts = $event['hosts'];
        $hosts[] = 'youtube.com';
        $hosts[] = 'youtube-nocookie.com';
        $event['hosts'] = $hosts;
    }

    /**
     * Set needed variables to display breadcrumbs.
     */
    public function onTwigSiteVariables()
    {
        if (!$this->isAdmin() && $this->config->get('plugins.youtube.built_in_css')) {
            $this->grav['assets']->add('plugin://youtube/css/youtube.css');
        }

        if (!$this->isAdmin() && $this->config->get('plugins.youtube.built_in_js')) {
            $this->grav['assets']->add('plugin://youtube/js/youtube.js');
        }

        if ($this->isAdmin() && $this->config->get('plugins.youtube.add_editor_button')) {
            // Expose the insert mode synchronously for admin-classic editors
            // (the classic button + the editor-pro integration when running in
            // classic). Admin-next can't receive inline JS, so its editor-pro
            // integration fetches the same values from GET /youtube/config.
            $editorConfig = json_encode([
                'insert_mode'           => $this->effectiveInsertMode(),
                'shortcode_core'        => (bool) $this->config->get('plugins.shortcode-core.enabled', false),
                'privacy_enhanced_mode' => (bool) $this->config->get('plugins.youtube.privacy_enhanced_mode', true),
                'lazy_load'             => (bool) $this->config->get('plugins.youtube.lazy_load', false),
            ]);
            $this->grav['assets']->addInlineJs("window.__YOUTUBE_EDITOR_CONFIG = {$editorConfig};", 1);
            $this->grav['assets']->add('plugin://youtube/admin/editor-button/js/button.js');
        }
    }

    /**
     * Resolve the editor insert mode, degrading "shortcode" to the
     * dependency-free "link" when shortcode-core isn't available to render it.
     *
     * @return string 'link' or 'shortcode'
     */
    protected function effectiveInsertMode(): string
    {
        $mode = $this->config->get('plugins.youtube.editor_insert_mode', 'link');
        if ($mode === 'shortcode' && !$this->config->get('plugins.shortcode-core.enabled', false)) {
            return 'link';
        }

        return $mode === 'shortcode' ? 'shortcode' : 'link';
    }

    /**
     * Register API routes for the admin-next editor integration.
     */
    public function onApiRegisterRoutes(Event $event): void
    {
        $routes = $event['routes'];
        $controller = \Grav\Plugin\Youtube\Api\YoutubeController::class;

        $routes->get('/youtube/config', [$controller, 'config']);
    }

    /**
     * Register the YouTube button on the admin-next default markdown editor
     * toolbar. The button opens a modal (admin-next/modals/youtube-insert.js)
     * that builds the markdown and hands it back for insertion.
     */
    public function onApiMarkdownEditorButtons(Event $event): void
    {
        if (!$this->config->get('plugins.youtube.add_editor_button')) {
            return;
        }

        $icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4z" /><path d="M10 9l5 3l-5 3z" /></svg>';

        $buttons = $event['buttons'];
        $buttons[] = [
            'id'     => 'youtube',
            'plugin' => 'youtube',
            'label'  => 'YouTube Video',
            'icon'   => $icon,
            'modal'  => [
                'component' => 'youtube-insert',
                'title'     => 'Insert YouTube Video',
                // Shortcode mode shows many player options, so give it more room.
                'size'      => $this->effectiveInsertMode() === 'shortcode' ? 'lg' : 'md',
            ],
        ];
        $event['buttons'] = $buttons;
    }

    /**
     * Add current directory to twig lookup paths.
     */
    public function onTwigTemplatePaths()
    {
        $this->grav['twig']->twig_paths[] = __DIR__ . '/templates';
    }

    /**
     * Initialize shortcodes
     */
    public function onShortcodeHandlers()
    {
        $this->grav['shortcode']->registerAllShortcodes(__DIR__.'/shortcodes');
    }

    public function registerNextGenEditorPluginShortcodes($event) {
        $plugins = $event['plugins'];

        // youtube
        $plugins['js'][] = 'plugin://youtube/nextgen-editor/shortcodes/youtube/youtube.js';

        $event['plugins']  = $plugins;
        return $event;
    }

    public function registerEditorProPlugin(Event $event)
    {
        // Respect the "Add editor button" toggle, same as the default-editor
        // and classic-admin buttons.
        if (!$this->config->get('plugins.youtube.add_editor_button')) {
            return $event;
        }

        $plugins = $event['plugins'];
        $plugins['js'][] = 'plugin://youtube/editor-pro/youtube-integration.js';
        $event['plugins'] = $plugins;

        return $event;
    }

    public function onEditorProShortcodeRegister(Event $event)
    {
        // Only advertise the YouTube shortcode to Editor Pro when the button is
        // set to shortcode output (and shortcode-core can render it). In
        // built-in mode the button inserts a [plugin:youtube](url) link, so the
        // shortcode would be dead weight in the picker.
        if ($this->effectiveInsertMode() !== 'shortcode') {
            return;
        }

        $shortcodes = $event['shortcodes'];
        $youtubeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-brand-youtube"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" /><path d="M10 9l5 3l-5 3z" /></svg>';

        $shortcodes[] = [
            'name' => 'youtube',
            'title' => 'YouTube Video',
            'description' => 'Embed a YouTube video via shortcode.',
            'type' => 'block',
            'plugin' => 'youtube',
            'category' => 'media',
            'group' => 'YouTube',
            'icon' => $youtubeIcon,
            'hasContent' => true,
            'attributes' => [
                'width' => ['type' => 'text', 'default' => '', 'title' => 'Width (px)'],
                'height' => ['type' => 'text', 'default' => '', 'title' => 'Height (px)'],
                'title' => ['type' => 'text', 'default' => '', 'title' => 'Title (accessibility)'],
                'class' => ['type' => 'text', 'default' => '', 'title' => 'CSS Class'],
                'thumbnail' => ['type' => 'text', 'default' => '', 'title' => 'Custom Thumbnail'],
                'privacy_enhanced_mode' => ['type' => 'text', 'default' => '', 'title' => 'Privacy Enhanced Mode'],
                'lazy_load' => ['type' => 'text', 'default' => '', 'title' => 'Lazy Load'],
                'autoplay' => ['type' => 'text', 'default' => '', 'title' => 'Autoplay'],
                'cc_load_policy' => ['type' => 'text', 'default' => '', 'title' => 'Show Captions'],
                'cc_lang_pref' => ['type' => 'text', 'default' => '', 'title' => 'Captions Language'],
                'color' => ['type' => 'text', 'default' => '', 'title' => 'Player Color'],
                'controls' => ['type' => 'text', 'default' => '', 'title' => 'Controls'],
                'disablekb' => ['type' => 'text', 'default' => '', 'title' => 'Disable Keyboard'],
                'enablejsapi' => ['type' => 'text', 'default' => '', 'title' => 'Enable JS API'],
                'end' => ['type' => 'number', 'default' => '', 'title' => 'End Time (sec)'],
                'fs' => ['type' => 'text', 'default' => '', 'title' => 'Fullscreen Button'],
                'hl' => ['type' => 'text', 'default' => '', 'title' => 'Interface Language'],
                'iv_load_policy' => ['type' => 'text', 'default' => '', 'title' => 'Show Annotations'],
                'list' => ['type' => 'text', 'default' => '', 'title' => 'List Name'],
                'listType' => ['type' => 'text', 'default' => '', 'title' => 'List Type'],
                'loop' => ['type' => 'text', 'default' => '', 'title' => 'Loop'],
                'modestbranding' => ['type' => 'text', 'default' => '', 'title' => 'Minimal Branding'],
                'origin' => ['type' => 'text', 'default' => '', 'title' => 'Origin'],
                'playlist' => ['type' => 'text', 'default' => '', 'title' => 'Playlist'],
                'playsinline' => ['type' => 'text', 'default' => '', 'title' => 'Plays Inline'],
                'rel' => ['type' => 'text', 'default' => '', 'title' => 'Show Related Videos'],
                'start' => ['type' => 'number', 'default' => '', 'title' => 'Start Time (sec)'],
                'widget_referrer' => ['type' => 'text', 'default' => '', 'title' => 'Widget Referrer'],
                'vq' => ['type' => 'text', 'default' => '', 'title' => 'Quality'],
            ],
            'titleBarAttributes' => ['class', 'width', 'height']
        ];

        $event['shortcodes'] = $shortcodes;
    }
}
