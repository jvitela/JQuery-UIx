(function($) {
	$.widget("ui.panoram", {
		_init: function() 
		{
			var opts = this.options;
			this._initProperties();
			// create object to track loading
			if( opts.preldImg )
				this.img = opts.preldImg;
			else {
				this.img = new Image();
				this.img.src = this.element.attr('src');
			}

			// Create HTML
			this.uiContainer = $('<div></div>')
				.addClass('ui-helper-reset ui-helper-clearfix ui-panoram-container')
				.attr('tabIndex', '0')
				.css('outline', '0')
				.focus(function() {
					$(this).addClass('ui-panoram-selected');
				})
				.blur(function() {
					$(this).removeClass('ui-panoram-selected');
				})
				.appendTo(this.element.parent());
			this.uiClipper = $('<div></div>')
				.addClass('ui-helper-reset ui-helper-clearfix ui-panoram-clipper')
				.appendTo(this.uiContainer);
			this.element
				.addClass('ui-panoram')
				.appendTo(this.uiClipper);
			this.uiLoader = $('<div></div>')
				.addClass('ui-panoram-loader')
				.appendTo(this.uiContainer);

			this.resize();

			if( opts.loop==true ) {
				this.cloneImg = this.element.clone();
				this.cloneImg.removeAttr('id');
				this.element.after( this.cloneImg );
				//this.cloneImg.css('left', this.cloneImg.width()-1 );
			}

			if( this.img.complete ) {
				this.uiLoader.hide();
				this.position( this.options.position );
				this._initEvents();
			}
			else {
				this.uiClipper.hide();
				this._waitForImages('_initEvents');
			}
		},
		_initProperties : function() 
		{
			var opts = this.options;

			this.vx = 0.0; 
			this.vy = 0.0;
			//this.focused  = false;
			this.dragRdy  = false;
			this.framerate = opts.framerate;
			this.maxVelx  = opts.maxVel.x;
			this.maxVely  = opts.maxVel.y;
			this.instanceReady = true;
		},
		_waitForImages : function( callback ) 
		{
			var self = this;
			var winterval = setInterval(function() {
				if( self.img.complete==true ) 
				{
					self.uiLoader.fadeOut('normal');
					self.uiClipper.fadeIn('normal');
					self.resize();
					// clear interval and setup
					clearInterval( winterval );
					self.position( self.options.position );
					if( typeof callback=="function" ) callback( self );
					if( typeof callback=="string" && typeof self[callback]=="function" ) self[callback]();
				}
			},500);
		},
		_initEvents : function() 
		{
			var self = this;
			this.uiContainer.keydown(function(event) {
				// drag started
				if( self.dragRdy || !self.uiContainer.hasClass('ui-panoram-selected') ) return;

				var speed = self.options.kbSpeed*self.framerate;
				//if( event.keyCode==32 ) // spacebar
				if( event.keyCode==37 ) // left
					self.vx = -speed;
				if( event.keyCode==38 ) // top
					self.vy = -speed;
				if( event.keyCode==39 ) // right
					self.vx = speed;
				if( event.keyCode==40 ) // bottom
					self.vy = speed;
				if( event.keyCode==27 ) // escape
					self.vx = self.vy = 0.0;
			});
			$(window).resize(function( event )
			{
				if( !self.instanceReady ) return;

				self.resize();
				self.position( self.element.position() );
			});
                        this.uiClipper.bind('mousedown mousemove',function(event) {
				// Event validation
				if( event.type=='mousedown' ) {
					self.dragRdy = true;
					$('.ui-panoram').blur();
					self.uiContainer.focus();
				}
				else if( event.type=='mousemove' && !self.dragRdy ) 
					return false;
				// mouse
				var mx = event.pageX;
				var my = event.pageY;
				// container dimensions
				var iw = self.uiContainer.width()/2;
				var ih = self.uiContainer.height()/2;
				// containers position
				var of = self.uiContainer.offset();
				var x = mx-(iw+of.left);
				var y = my-(ih+of.top);
				// calculate velocity
				self.vx = x*self.framerate;
				self.vy = y*self.framerate;
				// validate velocity
				if( self.vx>self.maxVelx  ) self.vx =  self.maxVelx;
				if( self.vx<-self.maxVelx ) self.vx = -self.maxVelx;
				if( self.vy>self.maxVely  ) self.vy =  self.maxVely;
				if( self.vy<-self.maxVely ) self.vy = -self.maxVely;
                                return false;
                        });
			this.uiClipper.bind('mouseup mouseleave',function(event) {
				if( self.dragRdy ) {
					self.dragRdy = false;
					self.vx = self.vy = 0; // stop
				}
				return false;
			});
			// Frame Step
			var interval = setInterval(function() {
				self._moveBlock( self.element, !self.options.loop );

				if( self.options.loop ) 
				{
					self._moveBlock( self.cloneImg, true );

					var blockA = self.element;
					var apos = blockA.position();
					var blockB = self.cloneImg;
					var bpos = blockB.position();

					if( bpos.left<0 ) {
						blockA.css({ left: 0 });
						blockB.css({ left: blockB.width() });
					}
					else if( apos.left>0 ) {
						blockA.css({ left: -blockA.width() });
						blockB.css({ left: 0 });
					}
				}
			}, this.framerate*1000 );
		},
		_moveBlock : function( block, resetVel ) 
		{
			if( this.vx==0 && this.vy==0 ) return; // no need to do anything

			var pos = block.position();
			var x = pos.left - this.vx;
			var y = pos.top - this.vy;

			var limY = this.uiContainer.height()-block.height();
			if( y>0 || y<limY )
			{
				y = (y>0)?0:limY;
				if( resetVel ) this.vy = 0.0; // reset velocity
			}

			var limX = this.uiContainer.width()-block.width();
			if( !this.options.loop && (x>0 || x<limX) ) 
			{
				x = (x>0)?0:limX;
				if( resetVel ) this.vx = 0.0; // reset velocity
			}

			block.css({ left: x, top: y });
		},
		resize : function() {
			if( !this.instanceReady ) return;
			var width=0, height=0, opts=this.options;

			var prnt = this.uiContainer.parent();
			var mbp  = parseInt(prnt.css('padding-left'))+parseInt(prnt.css('padding-right'))+2; // plus 2 for clipper's border
			if( opts.height=='auto' ) height = prnt.innerHeight()-mbp;
			if( opts.height<1 ) height = $("body").innerHeight()-mbp;
			if( opts.width=='auto' ) width = prnt.innerWidth()-mbp;
			if( opts.width<1 ) width = $("body").innerWidth()-mbp;

			if( this.img.complete==true )
			{
				// If container is taller than img, resize them
				if( this.img.height<height )
					height = this.img.height;
				// image width is smaller than container's
				if( this.img.width<width ) 
					width = this.img.width;
			}

			this.uiContainer.height( height ).width( width );
			this.uiClipper.height( height ).width( width );
			this.uiLoader.width( width ).height( height );
		},
		position : function( pos ) 
		{
			if( !this.instanceReady ) return;
			// validate point
			if( pos.left<0 ) pos.left*=-1;
			if( pos.top<0 ) pos.top*=-1;

			var w = this.img.width;
			var h = this.img.height;
			var maxH = this.uiContainer.height();
			var maxW = this.uiContainer.width();

			// calculate top position
			var t = (pos.top=='center')?(maxH-h)/2:-pos.top;
			if( t<(maxH-h) ) t = maxH-h;
			// calculate left position
			var l = (pos.left=='center')?(maxW-w)/2:-pos.left;
			if( l<(maxW-w) ) l = maxW-w;

			if( this.options.loop==true ) 
			{
				// set position
				this.element.css({ left:l,top:t });
				this.cloneImg.css({ left:w+l,top:t });
			}
			else 
			{
				// set position
				this.element.css({ left:l, top:t });
			}
		},
		reload : function( p ) 
		{
			if( !this.instanceReady ) return;

			var opts = $.extend( this.options,p );
			this._initProperties();
			this.resize();

			if( p.image ) {	
				this.uiClipper.hide();
				this.uiLoader.show();
				this.instanceReady = false; // avoid automatic destruction

				this.img = new Image();
				this.img.src = p.image;
				this.element.attr('src',p.image); 

				if( opts.loop==true ) {
					if( !this.cloneImg ) {
						this.cloneImg = this.element.clone();
						this.cloneImg.removeAttr('id');
						this.element.after( this.cloneImg );
					}
					else
						this.element.attr('src',p.image);
				}
				else if( this.cloneImg ) 
					this.cloneImg.remove();

				this.instanceReady = true;
				this._waitForImages();
			}
		},
		destroy : function() 
		{
			if( !this.instanceReady ) return;
			this.element.attr('style','').removeClass('ui-panoram');
			this.uiContainer.before( this.element );
			this.uiContainer.remove();
			this.instanceReady = false;
		}
	});

	$.extend($.ui.panoram, {
		version: "1.0.0",
		defaults: {
			loop      : false,
			height    : 'auto',//200,
			width     : 'auto',//600,
			preldImg  : null,		// a preloaded img supplied
			kbSpeed   : 100,		// speed given to keyboard and control panel, units are in (pixels/framerate)
			position  : { left:'center', top: 'center' },
			framerate : 0.10,		// rate of image update
			maxVel    : { x:15.0, y:7.0 }	// maximum velocity allowed
		}
	});
})(jQuery);


