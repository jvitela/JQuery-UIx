(function($) {

$.widget("uix.contentslider", {
	options: {
/**
 * TODO: More options
		ajaxOptions,
		idPrefix,
		cache,
		cookie,
		disabled,
 */
		menuFill	: true,		// if false menu height is not resized to fill the widget's height
		menuRight	: false,	// wheter the menu element is to be positioned, left or right
		height		: 250,
		width		: { menu:20, content:80, percentage:true },
		event		: 'click', //mouseover
		icons : {
				header: "ui-icon-triangle-1-e",
				headerSelected: null
		},
		selected : 0, // selected slide
		rotate : {
			interval:0,
			continuing:false
		},
		_fx : [
			{ name:'bounce',opts:{},speed:'normal'},
			{ name:'drop',opts:{},speed:'normal'},
			{ name:'explode',opts:{},speed:'normal'},
			{ name:'slide',opts:{},speed:'normal'},

			{ name:'fold',opts:{},speed:'normal' },
			{ name:'pulsate',opts:{},speed:'fast'},
			{ name:'highlight',opts:{},speed:'normal'},
			{ name:'shake',opts:{},speed:'fast'},

			{ name:'blind',opts:{},speed:'normal' },
			{ name:'clip',opts:{},speed:'normal' },
			{ name:'puff',opts:{},speed:'normal'},
			{ name:'scale',opts:{percent: 100},speed:'normal' },
			{ name:'animate',init:{width:1, height:1}, opts:{width:'auto',height:'auto'},speed:'normal' },
			{ name:'animate',init:{width:1}, opts:{width:'auto'},speed:'normal' },
			{ name:'fadein',opts:{},speed:'slow'}
		]
	},

	_init: function() 
	{
		// init hooks
		this.idxSelected = this.options.selected;
		this.rotateOpts = {
			interval : this.options.rotate.interval,
			continuing : this.options.rotate.continuing
		}
		this.isReady = false;
		this.currAnim = 0;
		this.menu = this.element.children('ul:first');
		this.menuitms = $('li:has(a[href])',this.menu);
		this.content = $('<div></div>'); // create element to encapsulate
		this.element.children('div[id]').appendTo(this.content);
		this.content.appendTo( this.element );
		if( !this.options.menuRight ) {
			this.element.addClass('uix-slider-mirror');
		}

		// Add classes
		this.wrapper = $('<div class="uix-slider-wrapper"></div>');
		this.element.children().appendTo(this.wrapper);
		this.element.append( this.wrapper );
		//this.menu.wrap('<div class="uix-slider-menu-wrapper"></div>');
		this.element.addClass('uix-slider ui-state-default ui-widget ui-corner-all');
		this.content.addClass('uix-slider-content ui-widget-content ui-corner-all');
		this.content.children('Div[id]')
			.addClass('uix-slide-default').hide()
			.eq( this.idxSelected ).addClass('uix-slide-active').appendTo(this.content).show();
		this.menu.addClass('ui-widget-header ui-corner-all uix-slider-menu');
		this.menuitms.addClass('ui-state-default ui-corner-all uix-slider-menu-itm')
			.prepend('<span class="ui-icon '+this.options.icons.header+'"/>')
			.eq( this.idxSelected ).addClass('ui-state-active');
		this.menuitms.children('a').addClass("uix-slider-menu-link");
		if( this.options.icons.headerSelected )
			this.menuitms.children('.ui-icon:eq('+this.idxSelected+')').addClass( this.options.icons.headerSelected );

		if( typeof this.options.fx=="undefined" ) 
			this.options.fx = this.options._fx;
			
		// Set size
		this.resize();

		// Bind events
		this._initEvents();

		if( this.options.rotate.interval > 0 )
			this.rotate( this.options.rotate.interval,this.options.rotate.continuing );
	},

	resize: function()
	{
		var o = this.options;
		var border = this.content.outerHeight() - this.content.innerHeight();
		var units = ( o.width.percentage )?"%":"px";

		if( o.menuFill ) {
			this.menu.height(o.height+"px");
		}
		var mwidth = parseInt(o.width.menu,10);
		var w = mwidth;
		if( o.menuRight ) {
			w -= (o.width.percentage)?1:0;
			this.wrapper.css({
				'width'		:	o.width.content + units,
				'padding-right'	:	w + units
			});
			w = mwidth;
			w -= (o.width.percentage)?1:0;
			this.menu.css({
				'left'		:	o.width.content + units,
				'width'		:	w + units
			});
			w = (o.width.percentage)?100 : o.width.content;
			this.content.css({
				'width'		:	w + units,
				'height'	:	o.height+"px"
			});
		}
		else {
			w -= o.width.percentage?1:0;
			this.wrapper.css({
				'width'			:	o.width.content + units,
				'padding-left'	:	w + units
			});
			this.menu.css({
				'left'		:	o.width.content + units,
				'width'		:	w + units
			});
			w = (o.width.percentage)?100 : o.width.content;
			this.content.css({
				'width'		:	w + units,
				'height'	:	o.height+"px"
			});
		}
	},

	_initEvents: function() 
	{
		var self = this;
		// Hover events
		this.menuitms.hover(
			function(){ $(this).addClass('ui-state-hover'); },	// over
			function(){ $(this).removeClass('ui-state-hover');}	// out
		);

		// Add Effect
		this.menuitms.children('a').bind(this.options.event, function(event, automatic) {
			var link = $(this);
			return self._click(event,link, automatic);
		});

		this.menuitms.children('a')
			.focus(function(){
				$(this).parent().addClass('ui-state-focus');
			})
			.blur(function(){
				$(this).parent().removeClass('ui-state-focus');
			});
		/*this.element.resize(function() {
			self.resize();
		});*/
		this._ready(true);
	},

	_click:	function(event,link,automatic) 
	{
		// avoid reselecting
		if( link.parent().hasClass('ui-state-active') ) return false;

		// Prevent default click actions
		if( this.options.event=="click" || this.options.event=="dobleclick" )
			event.preventDefault(); // prevent default click

		if( this.options.disabled || event.altKey || event.ctrlKey )
			return false;

		if( !this._ready() ) return false;

		this._ready(false);

		this.menuitms.removeClass('ui-state-active');
		link.parent().addClass('ui-state-active');

		if( this.options.icons.headerSelected ) {
			this.menuitms.children('.ui-icon').removeClass( this.options.icons.headerSelected );
			link.parent().children('.ui-icon').addClass( this.options.icons.headerSelected );
		}

		var prev = this.content.children('.uix-slide-active');
		prev.removeClass('uix-slide-active');
		var slide = $( link.attr('href') );
		slide.addClass('uix-slide-active').appendTo(this.content);
		this._startAnim( slide,prev );

		this.idxSelected = link.parent().prevAll().length;
		if( this.rotateOpts.interval>0 && this.rotateOpts.continuing==false && automatic!=true )
			this.rotate(0,false);
		return true;
	},

	_endAnim : function(slide,prev)
	{
		//$(this).prevAll('div').hide();
		prev.hide();
		slide.width('auto');
		slide.height('auto');
		this._ready(true);
		this.content.css('overflow','auto');
	},

	_startAnim: function( slide,prev )
	{
		var o = this.options;

		this.content.css('overflow','hidden');
		//prev.fadeOut('slow');

		if( this.currAnim>=o.fx.length ) 
			this.currAnim = 0;
		var fx = o.fx[ this.currAnim++ ]; 

		if( fx.opts.width=="auto"  ) fx.opts.width = slide.width();
		if( fx.opts.height=="auto" ) fx.opts.height= slide.height();

		var Me = this;
		if( fx.name=="none" ) {
			slide.show();//fx.speed, function(){Me._endAnim(slide,prev)});
			Me._endAnim(slide,prev);
		}
		else if( fx.name=="animate" ) {
			slide.css(fx.init);
			slide.animate(fx.opts, fx.speed, function(){Me._endAnim(slide,prev)});
		}
		else if( fx.name=="fadein" ) {
			slide.fadeIn(fx.speed, function(){Me._endAnim(slide,prev)});
		}
		else {
			slide.show(fx.name, fx.opts, fx.speed, function(){Me._endAnim(slide,prev)});
		}
	},

	_ready : function( isRdy ) {
		if( typeof isRdy!="boolean" ) return this.isReady;
		this.isReady = isRdy;
		if( this.isReady==false ) {
			this.menuitms.addClass('ui-state-disabled');
		}
		else {
			this.menuitms.removeClass('ui-state-disabled');
		}
		return this.isReady;
	},

	next:function() 
	{
		this.selected(this.idxSelected+1);
	},

	prev:function() 
	{
		this.selected(this.idxSelected-1);
	},

	selected:function(n) 
	{
		if( n!="undefined" )
		{
			this.idxSelected = n;
			if( this.idxSelected >= this.menuitms.length ) this.idxSelected = 0;
			if( this.idxSelected < 0 ) this.idxSelected = this.menuitms.length-1;
			this.menuitms.children('a:eq('+this.idxSelected+')').trigger('click',true);
		}
		return this.idxSelected;
	},

	rotate : function( duration, continuing) 
	{
		if( duration=="undefined" ) return;
		var Me = this;
		this.rotateOpts.continuing = continuing;
		if( this.rotateOpts.interval!=null ) {
			clearInterval(this.rotateOpts.interval);
			this.rotateOpts.interval = null;			
		}
		if( duration>0 && this.rotateOpts.interval==null )
		{
			this.rotateOpts.interval = setInterval(function(){
				Me.next();
			},duration)
		}
	},

	destroy: function() 
	{
		// Remove classes
		this.element.removeClass('ui-widget ui-widget-content ui-border-all uix-slider ui-corner-all')
			.css('padding-left','');
		this.content.removeClass('uix-slider-content')
			.children('Div')
			.width('auto').height('auto')
			.removeClass('ui-widget-content ui-corner-all uix-slide-default uix-slide-active');
		this.menu.removeClass('ui-widget-header ui-corner-all uix-slider-menu');
		this.menuitms.unbind()
			.removeClass('ui-state-default ui-corner-all uix-slider-menu-itm ui-state-active')
			.children('.ui-icon').remove();
		this.menuitms.children('a')
			.removeClass("uix-slider-menu-link")
			.unbind();

		// Remove scales 
		this.element.width('auto');
		this.element.height('auto');
		this.menu.width('auto').height('auto');
		this.content.children('.uix-slide-default').width('auto').height('auto');

		if( this.options.menuRight ) {
			this.content.appendTo( this.element );
		}
		this.content.children('div').show();
		this.content.children('Div[id]').appendTo( this.element  );
		this.content.remove();

		// Call parent
		$.widget.prototype.destroy.apply(this, arguments);
	}
});

$.extend($.uix.contentslider, {
	version: "1.1.0",
});

})(jQuery);

