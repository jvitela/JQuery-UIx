/**
 * jQuery UIx List	1.0.0
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
 *	http://dev.aol.com/dhtml_style_guide#listbox
 *
 *	TODO:
 *		- disable/enable widget	OK!
 *		- add/delete rows		
 *		- checkable list items
 *		- search
 */
(function( $, undefined ) {

$.widget("uix.list", $.ui.mouse, {
	options: {
		multiselect:	false,
		disabled:		false,
		// header can be set to custom text, node or jquery
		header:			false,
		// used by ui.mouse
		distance: 0,
		// Styles can be redefined here
		style : {
			disabled:		"ui-list-disabled ui-state-disabled",
			item: {
				element:	"ui-list-item ui-state-default",
				selected:	"ui-selected ui-state-active",
				focus:		"ui-state-focus",
				hover:		"ui-state-hover"
			},
			group : {
				element: 	"ui-list-group",
				title:		"ui-list-group-title ui-widget-header",
				content:	"ui-list-group-content",
			},
			// element
			list : {
				wrapper:	"ui-widget-content",
				noHeader:	"ui-corner-all",
				withHeader:	"ui-corner-bl ui-corner-br",
				element:	"ui-list-body ui-widget-content",
			},
			wrapper : {
				element: "ui-widget ui-list",
				focus:	"ui-state-focus ui-corner-all"
			},
			header: "ui-widget-header ui-corner-tl ui-corner-tr"
		}
	},
	_create: function() {
		this.selectedIdx	= -1;
		this.lastSelIdx		= -1;
		this.focusedIdx		= 0;

		this.shift	= false;
		this.ctrl	= false;
		this.dir	= 0;

		var style = this.options.style;
		var wrapper = $("<div></div>").addClass( style.wrapper.element ).attr("tabindex",0);
		if( this.options.disabled )
			wrapper.addClass(style.disabled);
		var content = $("<div></div>").addClass( style.list.wrapper );
		content = this.element.wrap( content ).parent(); // wrapInner
		wrapper = content.wrap( wrapper ).parent();
		this.element.addClass(style.list.element);
		if( this.options.header==false ) {
			content.addClass(style.list.noHeader);
		}
		else {
			header = $("<div></div>").addClass(style.header).append( this.options.header );
			content
				.addClass( style.list.withHeader )
				.css("border-top","0px")
				.before( header );
		}
		wrapper
			.focus($.proxy(function(){ 
				wrapper.addClass(style.wrapper.focus); 
				this._focus(true);
			},this))
			.blur($.proxy(function(){
				wrapper.removeClass(style.wrapper.focus); 
				this._focus(false);
			},this))
			.keydown( $.proxy(this,'_onKeyPress') )
			.keyup( $.proxy(this,'_getKeys') );

		this.refresh();
		this._mouseInit();
	},
	_mouseStart : function(event) {
		if( this.options.disabled ) return false;
		if( event.target.tagName!="LI" ) 
			event.target = $(event.target).parents("li").get(0);
		var currIdx	= this.items.index(event.target);
		if( currIdx<0 ) {
			return;
		}
		if( this.ctrl ) {
			this._toggle(currIdx);
		}
		else {
			this._focus(currIdx);
			this._sel(currIdx);
		}
		this.element.parents(".ui-list").focus();
	},
	_mouseDrag: function(event) {
		// do not select if ctrl key is pressed
		if( this.options.multiselect && !this.ctrl ) {
			if( event.target.tagName!="LI" )
				event.target = $(event.target).parents("li").get(0);
			if( !event.target ) {
				return;
			}
			var currIdx	= this.items.index(event.target);			
			if( currIdx<0 )
				return;
			this.shift = true;
			this._focus(currIdx);
			this._sel(currIdx);
		}
	},
	_mouseStop: function(event) {
		this.shift = false;
		this.element.trigger("listselectionchange");
	},
	_getKeys : function(event) {
		if( this.options.disabled ) return false;
		if( this.options.multiselect ) {
			this.shift = event.shiftKey;
			this.ctrl = event.ctrlKey;
		}
		this.dir = event.which;
	},
	_onKeyPress : function(event) {
		if( this.options.disabled ) return false;
		this._getKeys(event);
		//  9 tab
		// 38 up
		// 40 down
		// 37 left
		// 39 right
		// 32 space
		// 33 page Up
		// 34 page Down
		var key = this.dir;
		var $el = $(event.currentTarget);
		//console.log(key);

		// SPACE
		if( key==32 ) {
			this._toggle( this._focus() );
		}
		// PAGE UP
		else if( key==33 ) {
			event.preventDefault(); // avoid scroll
			this._focus( this._sel(0) );
		}
		// PAGE DOWN
		else if( key==34 ) {
			event.preventDefault(); // avoid scroll
			this._focus( this._sel( this.items.length-1) );
		}
		// UP, LEFT
		else if( key==37 || key==38 ) {
			event.preventDefault(); // avoid scroll
			if( this.ctrl )
				this._focus(this._focus()-1);
			else
				this._focus( this._sel( this._focus()-1));
		}
		// DOWN, RIGHT
		else if( key==39 || key==40 ) {
			event.preventDefault(); // avoid scroll
			if( this.ctrl )
				this._focus(this._focus()+1);
			else
				this._focus(this._sel(this._focus()+(this.lastSelIdx<0?0:1)));
		}
        else {
            return true; // true to allow event propagation
        }
        this.element.trigger("listselectionchange");
        return true;		
		//console.log(event.which);
		//console.log(event.shiftKey);
	},
	_focus : function(idx) {
		if( this.options.disabled ) return false;
		var style = this.options.style;
		// Getter
		if( arguments.length<1 ) return this.focusedIdx;
		// SETTER/UNSETTER
		if( typeof idx=="boolean" ) {
			// SET
			if( idx==false ) {
				this.items.eq(this.focusedIdx).removeClass(style.item.focus);
			}
			// UNSET
			else if( idx==true ) {
				this.items.eq(this.focusedIdx).addClass(style.item.focus);
			}
			return;
		}
		// validate index
		if( idx<0 ) idx=0;
		else if( idx>=this.items.length ) idx = this.items.length-1;
		// Setter
		// remove previous focus
		this.items.eq(this.focusedIdx).removeClass(style.item.focus);
		// set new focus
		this.items.eq(idx).addClass(style.item.focus);
		this.focusedIdx = idx;
		// this is for multiple selection
		if( !this.shift )
			this.lastSelIdx = idx;

		return idx;
	},
	_sel : function(idx) {
		if( this.options.disabled ) return false;
		var style = this.options.style;
		// Getter
		if( arguments.length<1 ) return this.selectedIdx;
		// validate index
		if( idx<0 ) idx=0;
		else if( idx>=this.items.length ) idx = this.items.length-1;
		// Setter
		// unselect previous
		this.items.removeClass(style.item.selected);
		if( this.shift ) {
			if( this.lastSelIdx==-1 ) this.lastSelIdx=0;
			if( idx<this.lastSelIdx ) {
				this.items.slice(idx,this.lastSelIdx+1).addClass(style.item.selected);
			}
			else {
				this.items.slice(this.lastSelIdx,idx+1).addClass(style.item.selected);
			}
		}
		else
			this.lastSelIdx = idx;

		this.items.eq(idx).addClass(style.item.selected);
		this.selectedIdx = idx;

		return idx;
	},
	_toggle : function(idx) {
		if( this.options.disabled ) return false;
		var style = this.options.style;
		this.items.eq( this._focus() )
			.removeClass(style.item.focus);
		this.items.eq(idx)
			.toggleClass(style.item.selected)
			.addClass(style.item.focus);
		this.selectedIdx = idx;
		this.focusedIdx = idx;
		this.lastSelIdx = idx;
	},
	refresh : function(){
		var style = this.options.style;
		var o = this.options;
		if( this.items )
			this.items.unbind("hover");
		var items = $([]);
		this.element.children().each(function(idx,itm){
			var $itm = $(itm);
			var $ul = $itm.find("ul");
			if( $ul.length>0 ) {
				$itm.addClass(style.group.element);
				$itm.children().first().addClass(style.group.title);
				$ul.addClass(style.group.content);
				items = items.add( $ul.children() );
			}
			else
				items = items.add(itm);
		});
		items
			.addClass(style.item.element)
			.hover(
				function(){ if( !o.disabled ) $(this).addClass(style.item.hover); },
				function(){ if( !o.disabled ) $(this).removeClass(style.item.hover); }
			);
		this.items = items;
	},
	size : function() {
		return this.items.length;
	},
	enable: function() {
		var style = this.options.style;
		this.options.disabled = false;
		this.element.parent().parent()
			.attr("tabindex",0)
			.removeClass(style.disabled);
	},
	disable: function() {
		var style = this.options.style;
		this.options.disabled = true;
		this.element.parent().parent()
			.removeAttr("tabindex")
			.addClass(style.disabled);
	}
});

})( jQuery );
