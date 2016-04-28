(function($){
    $(function(){
        $('body').on('grav-editor-ready', function() {
            var Instance = Grav.default.Forms.Fields.EditorField.Instance;
            Instance.addButton({
                notices: {
                    identifier: 'youtube-video',
                    title: 'YouTube Video',
                    label: '<i class="fa fa-fw fa-youtube"></i>',
                    modes: ['gfm', 'markdown'],
                    action: function({ codemirror, button }) {
                        button.on('click.editor.notice-info', function() {
                            var videoURL = prompt("Enter the YouTube Video URL. E.g. https://www.youtube.com/watch?v=vQ4qK36UenI");

                            if (videoURL) {
                                var text = '[plugin:youtube](' + videoURL + ')';

                                //Add text to the editor
                                var pos     = codemirror.getDoc().getCursor(true);
                                var posend  = codemirror.getDoc().getCursor(false);

                                for (var i=pos.line; i<(posend.line+1);i++) {
                                    codemirror.replaceRange(text+codemirror.getLine(i), { line: i, ch: 0 }, { line: i, ch: codemirror.getLine(i).length });
                                }

                                codemirror.setCursor({ line: posend.line, ch: codemirror.getLine(posend.line).length });
                                codemirror.focus();
                            }
                        });
                    }
                }
            });
        });
    });
})(jQuery);