(function($) {

$.widget("ui.panel", {
	options : {
		title : '',	 // by default use the "title" attribute of the selected element
		titButtons : {
			'colapse':{
				cls:'ui-panel-titlebar-colapse',
				icon:'ui-icon-triangle-1-n', 
				action:function(event,ui){ ui.colapse(); },
				css: {'right':'10px'}
			},
		}
	},

	_createTitBarButton : function( txtName,opts ) {
		var btn = $('<a href=#/>')
			.addClass(
				opts.cls +
				' ui-panel-titlebar-button'+
				' ui-corner-all'
			)
			.hover(
				function() {
					$(this).addClass('ui-state-hover');
				},
				function() {
					$(this).removeClass('ui-state-hover');
				}
			)
			/*.focus(function() {
				$(this).addClass('ui-state-focus');
			})
			.blur(function() {
				$(this).removeClass('ui-state-focus');
			})*/
			.appendTo(this.uiPanelTitlebar);

		var btnTxt = $('<span/>')
			.addClass(
				'ui-icon ' +
				opts.icon
			)
			.text(txtName)
			.appendTo( btn );

		var self = this;
		var fn = opts.action;
		if( typeof fn=="function" ) // Callback
		{
			btn.click(function(event){ 
				event.preventDefault(); 
				return fn(event,self); 
			});
		}
		else if( typeof opts.trigger=="string")  // just trigger an event
		{
			var event_name = opts.trigger;
			btn.click(function(event) {
				event.preventDefault();
				j$( self.element ).trigger(event_name,self);
				return true;
			});
		}
		return btn;
	},

	_init: function() {
		var opts = this.options;
		this.title = opts.title || $(this.element).attr('title');

		// Body
		$(this.element)
			.addClass('ui-widget ui-panel')
			.wrapInner('<div class="ui-widget-content ui-panel-content"></div>');

		this.uiPanelContent = $('.ui-panel-content',this.element);

		this.uiPanelTitlebar = $('<div></div>')
			.addClass(
					'ui-widget-header ' +
					'ui-panel-titlebar ' +
					'ui-corner-all ' +
					'ui-helper-clearfix'
			)
			.prependTo(this.element);

		this.uiPanelTitle = $('<span/>')
				.addClass('ui-panel-title')
				.html( this.title )
				.prependTo(this.uiPanelTitlebar);

		for( var btn in opts.titButtons ) {
			elem = this._createTitBarButton( btn, opts.titButtons[btn] );
			$(elem).css(opts.titButtons[btn].css);
		}

	},

	colapse : function() {
		var elem = this.element;
		var icon = $('.ui-panel-titlebar-colapse .ui-icon',elem);
		if( icon.hasClass('ui-icon-triangle-1-n') ) {
			icon.removeClass('ui-icon-triangle-1-n').addClass('ui-icon-triangle-1-s');
			$(elem).addClass('ui-state-colapsed')
			$('.ui-panel-content',elem).slideUp('normal');
		}
		else {
			icon.removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-n');
			$(elem).removeClass('ui-state-colapsed')
			$('.ui-panel-content',elem).slideDown('normal');
		}
		$(this.element).trigger("colapse",this);
	},

	destroy: function() {
		this.uiPanelTitlebar.remove();
		this.uiPanelContent.children().appendTo(this.element);
		this.uiPanelContent.remove();
	}

});

$.extend($.ui.panel, {
		version: "1.1.0",
});

})(jQuery);
