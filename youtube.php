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
     * Return a list of subscribed events.
     *
     * @return array    The list of events of the plugin of the form
     *                      'name' => ['method_name', priority].
     */
    public static function getSubscribedEvents()
    {
        return [
            'onPluginsInitialized' => ['onPluginsInitialized', 0],
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
        if ($this->isAdmin()) {
            $this->enable([
                'onTwigSiteVariables' => ['onTwigSiteVariables', 0],
            ]);
            return;
        }

        $this->enable([
            'onPageContentRaw' => ['onPageContentRaw', 0],
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

                // do the replacement
                return str_replace($search, $replace, $search);
            };

            // set the parsed content back into as raw content
            $page->setRawContent($this->parseLinks($raw, $function, $this::YOUTUBE_REGEX));
        }
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
            $this->grav['assets']->add('plugin://youtube/admin/editor-button/js/button.js');
        }
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
        $plugins = $event['plugins'];
        $plugins['js'][] = 'plugin://youtube/editor-pro/youtube-integration.js';
        $event['plugins'] = $plugins;

        return $event;
    }

    public function onEditorProShortcodeRegister(Event $event)
    {
        $shortcodes = $event['shortcodes'];
        $youtubeIcon = '<svg viewBox="-21 -117 682.66672 682" xmlns="http://www.w3.org/2000/svg"><path d="m626.8125 64.035156c-7.375-27.417968-28.992188-49.03125-56.40625-56.414062-50.082031-13.703125-250.414062-13.703125-250.414062-13.703125s-200.324219 0-250.40625 13.183593c-26.886719 7.375-49.03125 29.519532-56.40625 56.933594-13.179688 50.078125-13.179688 153.933594-13.179688 153.933594s0 104.378906 13.179688 153.933594c7.382812 27.414062 28.992187 49.027344 56.410156 56.410156 50.605468 13.707031 250.410156 13.707031 250.410156 13.707031s200.324219 0 250.40625-13.183593c27.417969-7.378907 49.03125-28.992188 56.414062-56.40625 13.175782-50.082032 13.175782-153.933594 13.175782-153.933594s.527344-104.382813-13.183594-154.460938zm-370.601562 249.878906v-191.890624l166.585937 95.945312zm0 0"/></svg>';

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
