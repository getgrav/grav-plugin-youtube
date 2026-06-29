# v4.4.1
## 06/29/2026

1. [](#bugfix)
    * Shortcode attributes that aren't YouTube player options no longer leak into the embed URL
    * Sizing and title attributes now apply to the embed iframe instead of being ignored
    * YouTube embeds now always include a title attribute for accessibility, with an option to customise it

# v4.4.0
## 06/27/2026

1. [](#new)
    * Added the editor button to Admin 2, for both the default markdown editor and the Editor Pro editor
    * Added an "Editor button inserts" setting to choose between a built-in link or a shortcode
1. [](#improved)
    * Built-in link is now the default editor output, so the button works without the shortcode-core plugin
1. [](#bugfix)
    * Fixed a fatal error on Grav 2.0 that left the YouTube embed missing — the Twig extension now targets Twig 3
    * Fixed YouTube embeds blanking the page on Grav 2.0 sites with content-Twig security enabled, by deferring the embed past Markdown and registering YouTube as a trusted iframe host

> Note: the Admin 2 default-editor button needs the API plugin and Admin 2 (admin-next) updates that ship the markdown editor toolbar button hook. Trusted-iframe embedding needs Grav core with the `onXssAllowedIframeHosts` allow-list.

# v4.3.1
## 05/01/2026

1. [](#improved)
    * Added 1.7|2.0 compatibility flags

# v4.3.0
## 11/17/2025

1. [](#new)
    * Added Editor Pro support Shortcode format

# v4.2.0
## 04/20/2023

1. [](#improved)
   * Shortcode ingoring plugin fix [#37](https://github.com/getgrav/grav-plugin-youtube/pull/37)
   * Lazy load the thumbnail image [#47](https://github.com/getgrav/grav-plugin-youtube/pull/47)
   * Create shortcode option for custom thumbnail [#44](https://github.com/getgrav/grav-plugin-youtube/pull/44)

# v4.1.0
## 06/07/2021

1. [](#improved)
   * Mentioned `shortcode-core` as required for shortcode syntax
   * Added new `class` option for shortcode
   * Added a new `.grav-youtube-wrapper` element for simpler targeting
1. [](#bugfix)
   * Fixed padding to remove black bars at top and bottom [#34](https://github.com/getgrav/grav-plugin-youtube/pull/34)


# v4.0.0
## 12/14/2020

1. [](#new)
    * NextGen Editor shortcode support
1. [](#improved)
    * Loop parameter fix for a single video [#36](https://github.com/getgrav/grav-plugin-youtube/pull/36)

# v3.1.0
## 05/20/2020

1. [](#new)
    * Added "Lazy Load" Option [#30](https://github.com/getgrav/grav-plugin-youtube/pull/30)
    * Added option for video size [#29](https://github.com/getgrav/grav-plugin-youtube/pull/29)

# v3.0.1
## 08/20/2018

1. [](#improved)
    * Refactor to remove GravTrait

# v3.0.0
## 08/02/2018

1. [](#new)
    * Added shortcode support

# v2.0.4
## 09/28/2017

1. [](#improved)
    * Always use HTTPS for YouTube [#21](https://github.com/getgrav/grav-plugin-youtube/pull/21)

# v2.0.3
## 12/23/2016

1. [](#bugfix)
    * Fixed a JavaScript issue [#16](https://github.com/getgrav/grav-plugin-youtube/pull/16)

# v2.0.2
## 05/23/2016

1. [](#improved)
    * Supports `youtu.be` based short links
1. [](#bugfix)
    * Fixed for invalid URL with YouTube editor buttons
    * Fixed editor button to work with Admin v1.1

# v2.0.1
## 11/24/2015

1. [](#bugfix)
    * Fixed issue with case sensitivity when including new `YoutubeTwigExtension`

# v2.0.0
## 11/23/2015

1. [](#new)
    * Added player parameters configuration values (@hctom)
    * Added various YouTube options (@hctom)
    * Reworked output to use overridable Twig template (@hctom)
    * Added hebe.json (@hctom)

# v1.1.0
## 10/07/2015

1. [](#new)
    * Added admin editor button

# v1.0.0
## 05/09/2015

1. [](#new)
    * ChangeLog started...
