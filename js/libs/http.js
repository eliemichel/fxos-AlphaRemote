/*
module.exports = $http;
  */

function $http(url, opts){
  var core = {
    ajax : function (method, url, payload, args) {
      payload = payload || '';

      var promise = new Promise( function (resolve, reject) {

        var client = new XMLHttpRequest(opts);
        var uri = url;

        if (args) {
          uri += '?';
          var argcount = 0;
          for (var key in args) {
            if (args.hasOwnProperty(key)) {
              if (argcount++) {
                uri += '&';
              }
              uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
            }
          }
        }

        client.open(method, uri);
        client.send(payload);

        client.onload = function () {
          if (this.status == 200) {
            // Performs the function "resolve" when this.status is equal to 200
            resolve(this.response);
          } else {
            // Performs the function "reject" when this.status is different than 200
            reject(this.statusText);
          }
        };
        client.onerror = function () {
          reject(this.statusText);
        };
      });

      return promise;
    }
  };

  return {
    'get' : function(args) {
      return core.ajax('GET', url, undefined, args);
    },
    'post' : function(payload, args) {
      return core.ajax('POST', url, payload, args);
    },
    'put' : function(payload, args) {
      return core.ajax('PUT', url, payload, args);
    },
    'delete' : function(args) {
      return core.ajax('DELETE', url, undefined, args);
    }
  };
};

