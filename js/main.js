'use strict';

/**********
 * Ready()
 **********/

window.addEventListener('DOMContentLoaded', function() {
    Views.init();
    Router.route();
});

window.addEventListener('hashchange', function() {
    Router.route();
});

