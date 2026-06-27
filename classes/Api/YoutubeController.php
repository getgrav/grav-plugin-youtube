<?php

declare(strict_types=1);

namespace Grav\Plugin\Youtube\Api;

use Grav\Plugin\Api\Controllers\AbstractApiController;
use Grav\Plugin\Api\Response\ApiResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/**
 * Exposes the YouTube plugin settings the admin-next editor button needs.
 *
 * The editor-pro integration script is concatenated and served by the
 * editor-pro plugin, so it cannot receive inline config the way admin-classic
 * does. It fetches this endpoint instead to learn which output style the
 * button should insert and whether shortcode-core is available.
 */
class YoutubeController extends AbstractApiController
{
    private const PERMISSION_READ = 'api.pages.read';

    /**
     * GET /youtube/config
     */
    public function config(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, self::PERMISSION_READ);

        $config = $this->config;
        $shortcodeCore = (bool) $config->get('plugins.shortcode-core.enabled', false);

        // "shortcode" mode only makes sense when shortcode-core can render it;
        // fall back to the dependency-free built-in link otherwise.
        $insertMode = (string) $config->get('plugins.youtube.editor_insert_mode', 'link');
        if ($insertMode === 'shortcode' && !$shortcodeCore) {
            $insertMode = 'link';
        }

        return ApiResponse::create([
            'insert_mode'           => $insertMode,
            'shortcode_core'        => $shortcodeCore,
            'privacy_enhanced_mode' => (bool) $config->get('plugins.youtube.privacy_enhanced_mode', true),
            'lazy_load'             => (bool) $config->get('plugins.youtube.lazy_load', false),
        ]);
    }
}
