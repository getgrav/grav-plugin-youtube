<?php
namespace Grav\Plugin\Shortcodes;

use Thunder\Shortcode\Shortcode\ShortcodeInterface;

class YoutubeShortcode extends Shortcode
{
    const YOUTUBE_REGEX = '/https?:\/\/(?:(?:www\.)?youtube(?:-nocookie)?\.com\/(?:watch\?v=|playlist|embed\/(?:videoseries)?)|youtu\.be\/)([A-Za-z0-9_-]{11})?(?:[?&](.*))?/';

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

                $options = array(
                    'player_parameters' => array_merge($pluginConfig['player_parameters'],$params),
                    'privacy_enhanced_mode' => $sc->getParameter('privacy_enhanced_mode',$pluginConfig['privacy_enhanced_mode']),
                    'class' => $sc->getParameter('class'),
                    'lazy_load' => $sc->getParameter('lazy_load',$pluginConfig['lazy_load'])
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

                // If there is a custom thumbnail, get the url
                if($custom_thumbnail = $sc->getParameter('thumbnail')) {
                    $page_media = $this->grav['page']->media();

                    if (isset($page_media[$custom_thumbnail])) {
                        // Get the url of the thumbnail.
                        // No resizing takes place (the most appropriate size is not known) so there is a potential performance problem here if the user specifies a very large image!
                        $options['thumbnail'] = $page_media[$custom_thumbnail]->url();
                    }
                }

                /** @var Twig $twig */
                $twig = $this->grav['twig'];

                // build the replacement embed HTML string
                $replace = $twig->processTemplate('partials/youtube.html.twig', $options);

                // do the replacement
                return str_replace($search, $replace, $search);
            }


        });
    }
}