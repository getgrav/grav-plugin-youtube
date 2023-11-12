<?php

namespace Grav\Plugin\Youtube\Twig;


use Grav\Common\Grav;

class YoutubeTwigExtension extends \Twig_Extension
{
    /**
     * Returns extension name.
     *
     * @return string
     */
    public function getName()
    {
        return 'YoutubeTwigExtension';
    }

    /**
     * {@inheritdoc}
     */
    public function getFunctions()
    {
        return [
            new \Twig_SimpleFunction('youtube_embed_url', [$this, 'embedUrl']),
            new \Twig_SimpleFunction('youtube_thumbnail_url', [$this, 'thumbnailUrl']),
        ];
    }

    /**
     * Builds YouTube video embed URL.
     *
     * @param  string  $video_id
     * @param  array   $player_parameters
     * @param  bool    $privacy_enhanced_mode
     * @return string
     */
    public function embedUrl($video_id, array $player_parameters = array(), $privacy_enhanced_mode = FALSE, $lazy_load = FALSE)
    {
        $grav = Grav::instance();

        // build base video embed URL (while respecting privacy enhanced mode setting)
        $url = 'https://www.youtube' . ($privacy_enhanced_mode ? '-nocookie' : '') . '.com/embed/' . ($video_id ? $video_id : 'videoseries');

        // Set the video to autoplay if lazy_load is enabled
        if($lazy_load == true) {
            $player_parameters['autoplay'] = true;
        }

        // filter player parameters to only those not matching YouTube defaults
        $filtered_player_parameters = array();
        foreach ($player_parameters as $key => $value) {
            $parameter_blueprint = $grav['config']->blueprints()->get('plugins.youtube.player_parameters.' . $key);

            // configured value matches YouTube default -> skip parameter
            if (isset($parameter_blueprint['default']) && $parameter_blueprint['default'] == $value) {
                continue;
            }

            //YouTube loop fix for HTML5 player
            if ($key == 'loop' && $value == 1) {
                $filtered_player_parameters['playlist'] = $video_id;
            }
            
            $filtered_player_parameters[$key] = $value;
        }

        // append query string (if any)
        if (!empty($filtered_player_parameters) && ($query_string = http_build_query($filtered_player_parameters))) {
            $url .= '?' . $query_string;
        }

        return $url;
    }

    public function thumbnailUrl($video_id)
    {
        $url = 'https://i.ytimg.com/vi/' . $video_id . '/hqdefault.jpg';

        return $url;
    }
}
