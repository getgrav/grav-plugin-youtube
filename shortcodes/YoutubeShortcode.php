<?php
namespace Grav\Plugin\Shortcodes;

use Thunder\Shortcode\Shortcode\ShortcodeInterface;

class YoutubeShortcode extends Shortcode
{
    const YOUTUBE_REGEX = '/(?:https?:\/{2}(?:(?:www.youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=))|(?:youtu\.be\/)))([a-zA-Z0-9_-]{11})/';

    public function init()
    {
        $this->shortcode->getHandlers()->add('youtube', function(ShortcodeInterface $sc) {

            // Get shortcode content and parameters
            $url = $sc->getContent();
            $params = $sc->getParameters();
            $privacy_mode = $sc->getParameter('privacy_enhanced_mode');

            if ($url) {
                preg_match($this::YOUTUBE_REGEX, $url, $matches);
                $search = $matches[0];

                // double check to make sure we found a valid YouTube video ID
                if (!isset($matches[1])) {
                    return $search;
                }

                /** @var Twig $twig */
                $twig = $this->grav['twig'];

                $options = array(
                    'player_parameters' => $params,
                    'privacy_enhanced_mode' => $privacy_mode,
                    'video_id' => $matches[1],
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