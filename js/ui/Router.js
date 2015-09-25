"use strict";

/*********
 * Router
 *********/

/*
 * Router uses the page hash to load the appropriate view.
 */

var Router = (function() {
    var self= {};

    self.route = function() {
        var hash = window.location.hash.substr(1);

        if (hash.startsWith("/index")) {
            Views.index();
        } else {
            Views.index();
        }
    };

    return self;
})();
