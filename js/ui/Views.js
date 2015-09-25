"use strict";

/********
 * Views
 ********/

var Views = (function() {
	var self = {};
	var currentView = '';
	var mainSection = '';
	var templates = {};

	/**
	 * Initialize view system
	 * Get DOM objects and build template list
	 */
	self.init = function() {
		templates['index'] = document.getElementById('index');
		templates['controlsOverlay'] = document.getElementById('controls-overlay');

		mainSection = document.querySelector('main');
	};

	/**
	 * Remove everything from main section
	 */
	self.empty = function() {
		while (mainSection.firstChild) {
			mainSection.removeChild(mainSection.firstChild);
		}
	};

	/**
	 * Refresh view given by local `currentView`
	 */
	self.refresh = function() {
		mainSection.className = currentView;
		self.empty();

		var template = templates[currentView];
		mainSection.appendChild(document.importNode(template.content.cloneNode(true), true));
	};

	self.index = function() {
		currentView = "index";
		self.refresh();
	};

	return self;
})();
