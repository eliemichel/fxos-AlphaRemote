/*
var parseXml = require('alpha/parseXml');
var $http = require('alpha/http');

module.exports = Camera;
  */

// This class handles the communication with a Sony Alpha series camera
// Anything depending on the Sony API should be here.

// These constants are here to avoid hardcoding anything within the class itself
// (This is actually not very relevant since we then load all the methods without
// any proxy, which breaks any protection to change in API)
var SONY_API_VERSION = "1.0";
var SONY_API_getMethodTypes = "getMethodTypes";
var SONY_API_XML_ScalarWebAPI_DeviceInfo = "av:X_ScalarWebAPI_DeviceInfo";
var SONY_API_XML_ScalarWebAPI_Service = "av:X_ScalarWebAPI_Service"
var SONY_API_XML_ScalarWebAPI_ServiceType = "av:X_ScalarWebAPI_ServiceType"
var SONY_API_XML_ScalarWebAPI_ActionList_URL = "av:X_ScalarWebAPI_ActionList_URL"

function Camera(endpoint) {
  // Counter of requests
  // (The API requires a different Id for each call)
  this.lastReqId = 0;
  
  this.endpoint = endpoint;
}

// This method is to be used as follow:
// camera.api("theApiMethod")(arg1, arg2)
// Once loadApiMethods() has been called, you can stop using this method and use
// camera.theApiMethod(arg1, arg2)
Camera.prototype.api = function(method) {
  var self = this;
  return function(/* API call arguments */) {
    var args = [].slice.call(arguments);
    return new Promise((resolve, reject) => {
      if (!self.endpoint) {
        reject("Camera: endpoint not defined");
      }

      var req = {
        "method": method,
        "params": args,
        "version": "1.0",
        id: ++self.lastReqId
      }

      $http(self.endpoint, { mozSystem: true })
      .post(JSON.stringify(req))
      .then(res => {
        res = JSON.parse(res);
        // An API result should contain either 'result' or 'results'
        // TODO: handle API errors
        if (res.result) {
          resolve(res.result);
        } else if (res.results) {
          resolve(res.results);
        } else {
          resolve(res);
        }
      });
    });
  }
};

// Get API methods and append them to the camera object
Camera.prototype.loadApiMethods = function() {
  var promise =
  this.api(SONY_API_getMethodTypes)(SONY_API_VERSION)
  .then(methods => {
    methods.forEach(method => {
      var name = method[0];
      this[name] = this.api(name);
    });
  });
  return promise;
};

// Extract endpoint URL from XML returned after SSDP discovery
Camera.prototype.setEndpointFromXML = function(xmlString) {
  var xml = parseXml(xmlString);
  var devices = xml.getElementsByTagName(SONY_API_XML_ScalarWebAPI_DeviceInfo);
  console.log("Found " + devices.length + " device" + (devices.length > 1 ? 's' : ''));

  for (var i = 0 ; i < devices.length ; i++) {
    var device = devices[i];
    var services = device.getElementsByTagName(SONY_API_XML_ScalarWebAPI_Service);
    console.log("Device #" + i + ": Found " + services.length + " service" + (services.length > 1 ? 's' : ''));
    for (var j = 0 ; j < services.length ; j++) {
      var service = services[j];
      var type = service.getElementsByTagName(SONY_API_XML_ScalarWebAPI_ServiceType);
      if (type.length == 0) {
        console.log("Device #" + i + ", Service #" + j + ": ServiceType not found");
        return;
      }
      var serviceType = type[0].textContent;

      var url = service.getElementsByTagName(SONY_API_XML_ScalarWebAPI_ActionList_URL);
      if (url.length == 0) {
        console.log("Device #" + i + ", Service #" + j + ": ServiceUrl not found");
        return;
      }
      var serviceUrl = url[0].textContent;

      var serviceEndpoint = url[0].textContent + "/" + type[0].textContent;

      console.log("Device #" + i + ", Service #" + j + ": ServiceEndpoint is " + serviceEndpoint);

      if (serviceType == "camera") {
        this.endpoint = serviceEndpoint;
      }
    };
  };
  return this.endpoint;
};

