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

                $options = array(
                    'player_parameters' => array_merge($pluginConfig['player_parameters'],$params),
                    'privacy_enhanced_mode' => $sc->getParameter('privacy_enhanced_mode',$pluginConfig['privacy_enhanced_mode']),
                    'video_id' => $matches[1],
                    'class' => $sc->getParameter('class'),
                    'lazy_load' => $sc->getParameter('lazy_load',$pluginConfig['lazy_load']),
                    'thumbnail' => $custom_thumbnail_url,
                );

                // check if size was given
                if (isset($params['width']) && isset($params['height'])) {
                    $options['video_size'] = true;
                    $options['video_height'] = $params['width'];
                    $options['video_width'] = $params['height'];
                    unset($params['width']);
                    unset($params['height']);
                }
                
                // build the replacement embed HTML string
                $replace = $twig->processTemplate('partials/youtube.html.twig', $options);

                // do the replacement
                return str_replace($search, $replace, $search);
            }


        });
    }
}