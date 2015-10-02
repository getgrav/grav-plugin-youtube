<?php
/**
 * YouTube
 *
 * This plugin embeds YouTube video from markdown URLs
 *
 * Licensed under MIT, see LICENSE.
 */

namespace Grav\Plugin;

use Grav\Common\Grav;
use Grav\Common\Plugin;
use Grav\Common\Page\Page;
use RocketTheme\Toolbox\Event\Event;

class YoutubePlugin extends Plugin
{
    const YOUTUBE_REGEX = '(?:https?:\/{2}www.youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})';

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
        ];
    }

    /**
     * Initialize configuration.
     */
    public function onPluginsInitialized()
    {
        if ($this->isAdmin()) {
            if ($this->config->get('plugins.youtube.add_editor_button')) {
                $this->grav['assets']->addJs($this->grav['base_url_absolute'] . '/user/plugins/youtube/admin/editor-button/js/button.js');
            }
            $this->active = false;
            return;
        }

        $this->enable([
            'onPageContentRaw' => ['onPageContentRaw', 0],
            'onTwigSiteVariables' => ['onTwigSiteVariables', 0]
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
        $config = $this->mergeConfig($page);

        if ($config->get('enabled')) {
            // Get raw content and substitute all formulas by a unique token
            $raw = $page->getRawContent();

            // build an anonymous function to pass to `parseLinks()`
            $function = function ($matches) {
                $search = $matches[0];

                // double check to make sure we found a valid YouTube video ID
                if (!isset($matches[1])) {
                    return $search;
                }

                // build the replacement embeded HTML string
                $replace = '<div class="grav-youtube"><iframe src="https://www.youtube.com/embed/' . $matches[1] . '?vq=hd1080" frameborder="0" allowfullscreen></iframe></div>';

                // do the replacement
                return str_replace($search, $replace, $search);
            };

            // set the parsed content back into as raw content
            $page->setRawContent($this->parseLinks($raw, $function, $this::YOUTUBE_REGEX));
        }
    }

    /**
     * Set needed variables to display breadcrumbs.
     */
    public function onTwigSiteVariables()
    {
        if ($this->config->get('plugins.youtube.built_in_css')) {
            $this->grav['assets']->add('plugin://youtube/css/youtube.css');
        }
    }
}
