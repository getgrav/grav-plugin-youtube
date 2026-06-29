<?php
namespace Grav\Plugin\Shortcodes;

use Thunder\Shortcode\Shortcode\ShortcodeInterface;

class YoutubeShortcode extends Shortcode
{
    const YOUTUBE_REGEX = '/(?:https?:\/{2}(?:(?:www.youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=))|(?:youtu\.be\/)))([a-zA-Z0-9_-]{11})/';

    public function init()
    {
        $this->shortcode->getHandlers()->add('youtube', function(ShortcodeInterface $sc) {

            // Get Plugin configuration
            $pluginConfig = $this->config->get('plugins.youtube');

            // Get shortcode content and parameters
            $url = $sc->getContent();
            $params = $sc->getParameters();

            if ($url) {
                preg_match($this::YOUTUBE_REGEX, $url, $matches);
                $search = $matches[0];

                // double check to make sure we found a valid YouTube video ID
                if (!isset($matches[1])) {
                    return $search;
                }


                // If there is a custom thumbnail, get the url
                $custom_thumbnail_url ='';                
                if($custom_thumbnail = $sc->getParameter('thumbnail')) {
                    $page_media = $this->grav['page']->media();

                    if (isset($page_media[$custom_thumbnail])) {
                        // Get the url of the thumbnail.
                        // No resizing takes place (the most appropriate size is not known) so there is a potential performance problem here if the user specifies a very large image!
                        $custom_thumbnail_url = $page_media[$custom_thumbnail]->url();
                    }
                }


                /** @var Twig $twig */
                $twig = $this->grav['twig'];

                // Route each shortcode attribute to its correct destination.
                // Only genuine YouTube player params reach the URL; plugin
                // controls (privacy_enhanced_mode, lazy_load, class, thumbnail)
                // are consumed here; everything else (width, height, title, …)
                // is rendered as an attribute on the <iframe> itself.
                $player = array();
                $iframe_attributes = array();
                foreach ($params as $key => $value) {
                    if (in_array($key, \Grav\Plugin\YoutubePlugin::PLAYER_PARAMS, true)) {
                        $player[$key] = $value;
                    } elseif (in_array($key, \Grav\Plugin\YoutubePlugin::CONTROL_PARAMS, true)) {
                        continue;
                    } else {
                        $iframe_attributes[$key] = $value;
                    }
                }

                $options = array(
                    'player_parameters' => array_merge($pluginConfig['player_parameters'], $player),
                    'iframe_attributes' => $iframe_attributes,
                    'privacy_enhanced_mode' => $sc->getParameter('privacy_enhanced_mode',$pluginConfig['privacy_enhanced_mode']),
                    'video_id' => $matches[1],
                    'class' => $sc->getParameter('class'),
                    'lazy_load' => $sc->getParameter('lazy_load',$pluginConfig['lazy_load']),
                    'thumbnail' => $custom_thumbnail_url,
                );

                // build the replacement embed HTML string
                $replace = $twig->processTemplate('partials/youtube.html.twig', $options);

                // do the replacement
                return str_replace($search, $replace, $search);
            }


        });
    }
}