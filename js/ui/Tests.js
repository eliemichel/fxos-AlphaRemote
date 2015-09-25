"use strict";


var Tests = new Promise(function(resolve, reject) {
	if (!('content' in document.createElement('template'))) {
		reject("Templates are not supported");
	}
	resolve();
});
