# Grav YouTube Plugin

`YouTube` is a simple [Grav][grav] Plugin that converts markdown links into responsive embeds.

# Installation

Installing the YouTube plugin can be done in one of two ways. Our GPM (Grav Package Manager) installation method enables you to quickly and easily install the plugin with a simple terminal command, while the manual method enables you to do so via a zip file.

## GPM Installation (Preferred)

The simplest way to install this plugin is via the [Grav Package Manager (GPM)](http://learn.getgrav.org/advanced/grav-gpm) through your system's Terminal (also called the command line).  From the root of your Grav install type:

    bin/gpm install youtube

This will install the YouTube plugin into your `/user/plugins` directory within Grav. Its files can be found under `/your/site/grav/user/plugins/youtube`.

## Manual Installation

To install this plugin, just download the zip version of this repository and unzip it under `/your/site/grav/user/plugins`. Then, rename the folder to `youtube`. You can find these files either on [GitHub](https://github.com/getgrav/grav-plugin-youtube) or via [GetGrav.org](http://getgrav.org/downloads/plugins#extras).

You should now have all the plugin files under

    /your/site/grav/user/plugins/youtube

# Config Defaults

```
enabled: true
built_in_css: true
player_parameters:
  autoplay: 0
  cc_load_policy: 0
  color: red
  controls: 1
  disablekb: 0
  enablejsapi: 0
  fs: 1
  hl: ''
  iv_load_policy: 1
  loop: 0
  modestbranding: 0
  origin: ''
  playsinline: 0
  rel: 1
  vq: default
privacy_enhanced_mode: false
```

If you need to change any value, then the best process is to copy the [youtube.yaml](youtube.yaml) file into your `users/config/plugins/` folder (create it if it doesn't exist), and then modify there.  This will override the default settings.

You can also set any of these settings on a per-page basis by adding them under a `youtube:` setting in your page header.  For example:

    ---
    title: YouTube Video
    youtube:
        player_parameters:
            autoplay: 1
    ---
    
    [plugin:youtube](https://www.youtube.com/watch?v=BK8guP9ov2U)

This will display a video and auto-play it.

For more details on the `player_parameters`, please check out the [YouTube official documentation](https://developers.google.com/youtube/player_parameters)

# Usage

To use this plugin you simply need to include a youtube URL in markdown link such as:

```
[plugin:youtube](https://www.youtube.com/watch?v=BK8guP9ov2U)
```

Will be converted into the following embeded HTML:

```
<div class="grav-youtube"><iframe src="https://www.youtube.com/embed/BK8guP9ov2U" frameborder="0" allowfullscreen=""></iframe></div>
```

CSS is also loaded to provide the appropriate responsive layout.

# Shortcode Syntax

As of version `3.0` you can now use an alternative _shortcode_ syntax that supports passing in the player parameter values inline.

**NOTE: `shortcode-core` plugin is required and must be installed and enabled for Shortcode Syntax to work.**  

```
[youtube color=white autoplay=1]https://www.youtube.com/watch?v=BK8guP9ov2U[/youtube]
```

Using the shortcode syntax it is also possible to set a custom thumbnail picture when using lazy_load. 

```
[youtube lazy_load=true thumbnail="name of media.jpg"]https://www.youtube.com/watch?v=BK8guP9ov2U[/youtube]
```


[grav]: http://github.com/getgrav/grav
