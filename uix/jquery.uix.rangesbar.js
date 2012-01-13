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
 *
 * TODO:
 *	- disable/enable widget
 *	- create
 *	- destroy
 */
(function( $, undefined ) {
	function leftVal(i,length){
		return (i/(length-1) * 100).toFixed(2)  +'%';
		
	}

	$.widget("uix.rangesbar", $.ui.mouse, {
		options: {
			distance:		10,		// for mouse
			maxRanges:		3,
			closeButton:	true,
			rangeLabels:	true,
			min:			0,
			max:			1440,	// max posible value
			step:			10,		// step value increment
			labels:			12,
			//labelFormatter:	parseInt,
			labelFormatter: function(val) {
				return (parseInt(val/60)+':'+(val%60)).replace(/[0-9]+/g,function(val){
					return val.length>=2? val : '0'+val;
				});
			},
			labelDistance : 4, //2
			style:{
				helper: "ui-selectable-helper",
				range:{
					body:	"ui-widget-header",
					handle:	"ui-state-default ui-corner-all"
				}
			}
		},
		_create: function() {
			var o = this.options;
			
			this.helper = $("<div class='ui-rangesbar-helper'></div>").addClass(o.style.helper);
			if( o.rangeLabels ) {
				this.helper.append('<div class="ui-range-body '+o.style.range.body+'"></div>');
				this.helper.append('<span class="ui-range-label ui-range-label-left"></span>');
				this.helper.append('<span class="ui-range-label ui-range-label-right"></span>');
			}

			this.pos = this.element.offset();

			this.ranges = $([]);
			this._createScale();
			
			o.distance = parseInt( o.step*this._width()/(o.max-o.min) );
			this._mouseInit();
		},
		_mouseStart : function(event) {
			var o = this.options;

			if ( o.disabled ) {
				return false;
			}

			// refresh the size and offset each time
			// this are used within the _pagePosToValue method
			this.elementSize = {
				width: this.element.outerWidth(),
				height: this.element.outerHeight()
			};
			this.elementOffset = this.element.offset();

			// Case we grab a range handle
			if( $(event.target).hasClass("ui-range-handle") ) {
				this.handle = $(event.target).parent();
				var range = this.handle.data("range.rangesbar");
				if( $(event.target).hasClass("ui-range-left") ) {
					this.startPos = range.position.right;
					this.startValue = range.value.right;
				}
				else {
					this.startPos = range.position.left;
					this.startValue = range.value.left;
				}
				return true;
			}
			else {
				this.handle = this.helper;
			}
			
			// only if more ranges can be added
			if( this.ranges.length>=o.maxRanges ) {
				return false;
			}
			
			// only create ranges within empty space
			if( !$(event.target).hasClass("ui-rangesbar") && !$(event.target).hasClass("ui-rangesbar-tic") ) {
				console.log(event.target);
				return false;
			}
			
			// Transform from screen coordinates to data-scale coordinates (whatever set for min,max,step)
			this.startValue = this._pagePosToValue( event.pageX );
			// transform from data-scale coordinates to relative percent
			this.startPos = this._valueToPercent(this.startValue);
			
			// add helper
			this.element.append(this.helper);

			var dta = {
				position: {
					'left':  this.startPos,
					'right': this.startPos
				},
				value: {
					'left':  this.startValue,
					'right': this.startValue
				}
			};
			// position helper (lasso)			
			this.helper
				.css({
					"left":		this.startPos+'%',
					"width":	'1px',
				})
				.data("range.rangesbar",dta);
			return true;
		},
		//_mouseStart : function(event){
		//	return true;
		//},
		_mouseDrag: function(event) {
			// update range data
			var range = this.handle.data("range.rangesbar");

			var normValue = this._pagePosToValue( event.pageX );
			var x1 = this.startValue, x2 = normValue;
			if (x1 > x2) { var tmp = x2; x2 = x1; x1 = tmp; }
			range.value.left = x1;
			range.value.right = x2;
			
			x1 = this.startPos; x2 = this._valueToPercent(normValue);
			if (x1 > x2) { var tmp = x2; x2 = x1; x1 = tmp; }
			range.position.left = x1;
			range.position.right = x2;
			
			// store position in a hash because the jQuery 'css' function always returns pixels
			this.handle
				.css({
					'left': x1+'%',
					'width': (x2-x1)+'%'
				})
				.data("range.rangesbar",range);
			this._setRangeLabels(this.handle);
			return true;
		},
		_mouseStop: function(event) {
			if( this.handle===this.helper ) {
				var range = this.helper.data("range.rangesbar");
				if( range.position.left<range.position.right ) {
					range = this._createRange(range);
					// internal array
					this.ranges = this.ranges.add( range );
				}
				this.helper.remove();
			}
			return false;
		},
		_createRange : function(r) {
			var o = this.options;
			// create range widget
			var range = $('<div class="ui-range" tabindex="0"></div>');
			var Me = this;
			range
				.css({
					"position":	"absolute",
					"left":		r.position.left+'%',
//					"top": 		0,
					"width":  	(r.position.right-r.position.left)+'%'
				})
				.data("range.rangesbar",r)
				.append('<a class="ui-range-handle ui-range-left '+o.style.range.handle+'" href="#"></a>')
				.append('<a class="ui-range-handle ui-range-right '+o.style.range.handle+'" href="#"></a>')
				.appendTo( this.element );
				
			range.find(".ui-range-handle")
				.hover(
					function(){ $(this).addClass("ui-state-hover"); },
					function(){ $(this).removeClass("ui-state-hover"); }
				)
				.focus(function(){ 
					$(this).addClass("ui-state-focus"); 
				})
				.blur(function(){ 
					$(this).removeClass("ui-state-focus"); 
				})
				.mousedown(function(){ 
					$(this).addClass("ui-state-active"); 
				})
				.mouseup(function(){ 
					$(this).removeClass("ui-state-active"); 
				});

			if( o.closeButton ) {
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
			range.append('<div class="ui-range-body '+o.style.range.body+'"></div>');
			// Labels
			if( o.rangeLabels ) {
				//range.append('<span class="ui-range-label ui-range-label-left"></span>');
				//range.append('<span class="ui-range-label ui-range-label-right"></span>');
				range.find(".ui-range-left").append(
					'<span class="ui-rangesbar-tooltip ui-widget-content ui-corner-all ui-range-label ui-range-label-left">'+
						'<span class="ttContent"></span>'+
						'<span class="ui-tooltip-pointer-down ui-widget-content"><span class="ui-tooltip-pointer-down-inner"></span></span>'+
					'</span>');
				range.find(".ui-range-right").append(
					'<span class="ui-rangesbar-tooltip ui-widget-content ui-corner-all ui-range-label ui-range-label-right">'+
						'<span class="ttContent"></span>'+
						'<span class="ui-tooltip-pointer-down ui-widget-content"><span class="ui-tooltip-pointer-down-inner"></span></span>'+
					'</span>');
			}
			this._setRangeLabels(range);
		},
		_destroyRange : function(event,ui){
			var range = $(event.currentTarget).parent(".ui-range");
			this.ranges = this.ranges.not( range );
			//range.resizable("destroy");
			range.find("button").button("destroy");
			range.remove();
			this._trigger('destroy.range', event, ui);
		},
		_setRangeLabels : function(elem) {		
			var o = this.options;
			var range = elem.data("range.rangesbar");
			var singleLabel = false;

			// TODO: Set a limit configurable ??
			if( range.position.right-range.position.left< o.labelDistance )
				singleLabel = true;

			left = o.labelFormatter(range.value.left,this);
			right = o.labelFormatter(range.value.right,this);

			if( singleLabel ) {
				elem.find(".ui-range-label-left").hide();
				elem.find(".ui-range-label-right").show()
					.find(".ttContent").text( left+' '+right );
			}
			else {
				elem.find(".ui-range-label-left").show()
					.find(".ttContent").text( left );
				elem.find(".ui-range-label-right").show()
					.find(".ttContent").text( right );
			}
		},
		// As the container bar may change its size unexpectedly, we always get a fresh value
		_width : function(){
			return this.element.width();
		},
		// returns the step-aligned value that val is closest to, between (inclusive) min and max
		_trimAlignValue: function( val ) {
			if ( val <= this._valueMin() ) {
				return this._valueMin();
			}
			if ( val >= this._valueMax() ) {
				return this._valueMax();
			}
			var step = ( this.options.step > 0 ) ? this.options.step : 1,
				valModStep = (val - this._valueMin()) % step,
				alignValue = val - valModStep;

			if ( Math.abs(valModStep) * 2 >= step ) {
				alignValue += ( valModStep > 0 ) ? step : ( -step );
			}

			// Since JavaScript has problems with large floats, round
			// the final value to 5 digits after the decimal point
			return parseFloat( alignValue.toFixed(5) );
		},
		_valueMin: function() {
			return this.options.min;
		},
		_valueMax: function() {
			return this.options.max;
		},
		_pagePosToValue: function( positionX ) {
			var pixelTotal,
				pixelMouse,
				percentMouse,
				valueTotal,
				valueMouse;

				pixelTotal = this.elementSize.width;
				pixelMouse = positionX - this.elementOffset.left;

			percentMouse = pixelMouse/pixelTotal;
			if( percentMouse<0 ) val=0;
			if( percentMouse>1 ) val=1;
			
			valueTotal = this._valueMax() - this._valueMin();
			valueMouse = this._valueMin() + percentMouse * valueTotal;

			return this._trimAlignValue( valueMouse );
		},
		_valueToPercent : function(value) {
			valueMin = this._valueMin();
			valueMax = this._valueMax();
			return (value-valueMin)/(valueMax-valueMin)*100;
		},
		_createScale : function(){
			var o = this.options;
			var scale = this.element.append('<ol class="ui-rangesbar-scale ui-helper-reset" role="presentation"></ol>').find('.ui-rangesbar-scale:eq(0)');
			var length = parseInt( (o.max-o.min)/o.step );
			var val = o.min;
			for( var i=0; i<length; i++) {				
				var style = (i==length-1 || i==0)?'style="display: none;"' : '' ;
				//var labelStyle = i%o.step?'style="display: none;"' : '' ;
				var labelText = o.labelFormatter(val);
				scale.append('<li style="left:'+ leftVal(i,length-1) +'"><span class="ui-rangesbar-label">'+ labelText +'</span><span class="ui-rangesbar-tic ui-widget-content"'+ style +'></span></li>');
				val+= o.step;
			}
			this.element.find('.ui-rangesbar-label').each(function(){
				$(this).css('marginLeft', -$(this).width()/2);
			});

			//show and hide labels depending on labels pref
			//show the last one if there are more than 1 specified
			if(o.labels > 1) this.element.find('.ui-rangesbar-scale li:last span.ui-rangesbar-label, .ui-rangesbar-scale dd:last span.ui-rangesbar-label').addClass('ui-rangesbar-label-show');

			//set increment
			var increm = Math.max(1, Math.round(length/o.labels));
			//show em based on inc
			for(var j=0; j<length; j+=increm){
				//if((length - j) > increm){//don't show if it's too close to the end label
					this.element.find('.ui-rangesbar-scale li:eq('+ j +') span.ui-rangesbar-label, .ui-rangesbar-scale dd:eq('+ j +') span.ui-rangesbar-label').addClass('ui-rangesbar-label-show');
				//}
			}		
		}
	});
})( jQuery );