/**
 * jQuery UIx Ranges Bar	1.0.0
 *
 * Copyright 2011, Jonathan Vitela
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.mouse.js
 *	jquery.ui.resizable.js
 *
 * TODO:
 *	- disable/enable widget
 *	- change bar units to percentages
 *	
 */
(function( $, undefined ) {

	$.widget("uix.rangesbar", $.ui.mouse, {
		options: {
			distance:		10,		// for mouse
			maxRanges:		3,
			closeButton:	true,
			rangeLabels:	true,
			max:			1440,	// max posible value
			step:			10,		// step value increment
			labelFormater:	function(val,ui) {
				return (parseInt(val/60)+':'+(val%60)).replace(/[0-9]+/g,function(val){
					return val.length>=2? val : '0'+val;
				});
			},
			style:{
				helper: "ui-selectable-helper ui-widget-header",
				range:{
					body:	"ui-widget-header",
					handle:	"ui-state-default ui-corner-all"
				}
			}
		},
		_create: function() {
			this.style = this.options.style;
			this.helper = $("<div class='ui-rangesbar-helper'></div>").addClass(this.style.helper);

			this.rangesbar = $(this.element).find(".ui-rangesbar");
			this.maxWidth = this.rangesbar.innerWidth();

			this.barPos = this.rangesbar.offset();

			this.ranges = $([]);

			this._mouseInit();
			
			this.remainingRanges = this.options.maxRanges;
		},
		_mouseStart : function(event) {
			if( !this.remainingRanges ) {
				return false;
			}
			// only create ranges within empty space
			var target = $(event.target);
			if( !target.hasClass("ui-rangesbar") ) {
				return false;
			}

			this.oposX = event.clientX - this.barPos.left;

			var options = this.options;
			this.rangesbar.append(this.helper);

			// position helper (lasso)
			this.helper.css({
				"left":		this.oposX,
				"top":		0,
				"height":	'15px'
			});
			return true;
		},
		_mouseDrag: function(event) {
			event.pageX -= this.barPos.left;
			if( event.pageX > this.maxWidth ) {
				event.pageX = this.maxWidth;
			}
			if( event.pageX < 0 ) {
				event.pageX = 0;
			}

			var x1 = this.oposX, 
				x2 = event.pageX;
			if (x1 > x2) { var tmp = x2; x2 = x1; x1 = tmp; }
			this.helper.css({
				left: x1, 
				width: x2-x1
			});
			return false;
		},
		_mouseStop: function(event) {
			this.helper.remove();
			var range = this._createRange(event);
			// internal array
			this.ranges = this.ranges.add( range );
			this.remainingRanges--;
			return false;
		},
		_createRange : function(event) {
			event.pageX -= this.barPos.left;
			if( event.pageX > this.maxWidth ) {
				event.pageX = this.maxWidth;
			}
			if( event.pageX < 0 ) {
				event.pageX = 0;
			}
			
			var x1 = this.oposX,
				x2 = event.pageX;
			if (x1 > x2) { var tmp = x2; x2 = x1; x1 = tmp; }
			
			if( this.options.step ) {
				var step = Math.round(this.options.step*this.maxWidth/this.options.max);
				x1 -= (x1%step);
				x2 -= x1+(x2%step);
			}
			else {
				x2 -= x1;
			}
			// create range widget
			var range = $('<div class="ui-range" tabindex="0"></div>');
			range
				.css({
					"position":	"absolute",
					"left":		x1,
					"top": 		0,
					"width":  	x2,
					"height": 	'15px'
				})
				.resizable({
					handles:		'e,w',
					containment:	'parent',
					grid:			this.options.step? step : null,
					resize:			this.options.rangeLabels? $.proxy(this,'_setRangeVals') : null
				})
				.find(".ui-resizable-handle").addClass(this.options.style.range.handle).end()
				.appendTo( this.rangesbar );

			if( this.options.closeButton ) {
				range
					.focus(function(){ $(this).find("button").show() })
					.blur(function(){ 
						var btn = $(this).find("button");
						if( !btn.hasClass("ui-state-hover") ) btn.hide();
					})
					.click(function(){ $(this).focus(); })

				var closeButton = $("<button></button>")
					.button({
						icons: { primary: "ui-icon-circle-close" },
						text: false
					})
					.hide()
					.appendTo(range)
					.click( $.proxy(this,'_destroyRange') );
			}

			// Body
			range.append('<div class="ui-range-body '+this.options.style.range.body+'"></div>');
			// Labels
			if( this.options.rangeLabels ) {
				range.append('<span class="ui-range-label-left"></span>');
				range.append('<span class="ui-range-label-right"></span>');
			}
			this._setRangeVals(event,range.data("resizable"));
		},
		_destroyRange : function(event,ui){
			var range = $(event.currentTarget).parent(".ui-range");
			this.ranges = this.ranges.not( range );
			range.resizable("destroy");
			range.find("button").button("destroy");
			range.remove();
			this.remainingRanges++;
			this._trigger('destroy.range', event, ui);
		},
		_setRangeVals : function(event,ui) {
			var ops = this.options;
			var singleLabel = false;

			var left = parseInt( ui.element.css("left").replace(/px/g,'') );
			var right = left + parseInt( ui.element.css("width").replace(/px/g,'') );
			
			if( right-left<70 )
				singleLabel = true;

			left = Math.round( left*ops.max/this.maxWidth );
			left = left - (left%ops.step);
			right = Math.round( right*ops.max/this.maxWidth );
			right = right - (right%ops.step);

			ui.range = {'left':left,'right':right};
			ui.element.data("value.range",ui.range);

			if( typeof ops.labelFormater ==="function" ) {
				left = ops.labelFormater(left,this);
				right = ops.labelFormater(right,this);
			}
			if( singleLabel ) {
				ui.element.find(".ui-range-label-left").hide();
				ui.element.find(".ui-range-label-right").text( left+' '+right );
			}
			else {
				ui.element.find(".ui-range-label-left").show().text( left );
				ui.element.find(".ui-range-label-right").show().text( right );
			}

			this._trigger('resize.range', event, ui);
		},
	});
})( jQuery );