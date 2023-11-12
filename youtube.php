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
    const YOUTUBE_REGEX = 'https?:\/\/(?:(?:www\.)?youtube(?:-nocookie)?\.com\/(?:watch\?v=|playlist|embed\/(?:videoseries)?)|youtu\.be\/)([A-Za-z0-9_-]{11})?(?:[?&](.*))?';

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

                $options = array(
                    'player_parameters' => $config->get('player_parameters'),
                    'privacy_enhanced_mode' => $config->get('privacy_enhanced_mode'),
                    'lazy_load' => $config->get('lazy_load'),
                );

                if (isset($matches[1])) {
                    $options['video_id'] = $matches[1];
                }

                if (isset($matches[2])) {
                    parse_str($matches[2], $querystring);

                    if (isset($querystring['list'])) {
                        $options['player_parameters']['list'] = $querystring['list'];
                    }

                    if (isset($querystring['t'])) {
                        $options['player_parameters']['start'] = $querystring['t'];
                    }

                    if (isset($querystring['start'])) {
                        $options['player_parameters']['start'] = $querystring['start'];
                    }

                    if (isset($querystring['size'])) {
                        $parts = explode(',', $querystring['size']);
                        if (count($parts) === 2) {
                            $options['video_size'] = true;
                            $options['video_height'] = $parts[0];
                            $options['video_width'] = $parts[1];
                        }
                    }
                }

                if (!isset($options['video_id']) && !isset($options['player_parameters']['list'])) {
                    return $search;
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
}
