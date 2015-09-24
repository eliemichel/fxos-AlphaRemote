define(function(require, exports, module) {
'use strict';

/**
 * Module Dependencies
 */

var $ssdp = require('lib/alpha/ssdp');
var $http = require('lib/alpha/http');
var Camera = require('lib/alpha/Camera');
var CameraDisplay = require('lib/alpha/CameraDisplay');
var Stream = require('lib/alpha/Stream');

var debug = require('debug')('AlphaCameraControl');

/**
 * Exports
 */

module.exports = AlphaCameraControl;

  
// This class implements the CameraControl interface for Alpha device
// See https://developer.mozilla.org/en-US/docs/Web/API/CameraControl

function AlphaCameraControl() {
  this.capabilities = {
    effects: [], // TODO
    fileFormats: ['jpeg'],
    flashModes: ['off'],
    focuseModes: ['auto'], // TODO
    minExposureCompensation: 0,
    maxExposureCompensation: 0,
    stepExposureCompensation: 0,
    maxFocusAreas: 1, // TODO
    maxMeteringAreas: 1, // TODO
    pictureSizes: [{height: 4000, width: 6000}], // TODO
    videoSizes: [{height: 4000, width: 6000}], // TODO
    previewSizes: [{height: 400, width: 600}], // TODO
    recorderProfiles: [], // TODO
    sceneModes: ['auto'], // TODO
    whiteBalanceModes: ['auto'], // TODO
    zoomRatios: [1.0], // TODO
  };
  
  this.effect = 'none';
  this.exposureCompensation = 0;
  this.flashMode = 'off';
  this.focalLength = 50;
  this.focusAreas = [];
  this.focusDistanceFar = null; // unknown
  this.focusDistanceNear = null; // unknown
  this.focusDistanceOptimum = null; // unknown
  this.focusMode = 'auto';
  this.sceneMode = 'auto';
  this.whiteBalanceMode = 'auto';
  this.zoom = 1.0;
  this.meteringAreas = [];
  
  this.onShutter = evt => {};
  this.onClosed = evt => {};
  this.onRecorderStateChange = evt => {};
  
  this.canvas = null;
  this.camera = new Camera();
  this.cameraDisplay = new CameraDisplay(this.camera);
  
  this.discover();
}

AlphaCameraControl.prototype.discover = function() {
  $ssdp().discover("urn:schemas-sony-com:service:ScalarWebAPI:1")
  .then(deviceInfo => {
    console.log(deviceInfo.location);
    return $http(deviceInfo.location, { mozSystem: true }).get();
  })
  .then(xml => {
    this.camera.setEndpointFromXML(xml);
    console.log(this.camera.endpoint);
    return this.camera.loadApiMethods();
  })
  .then(res => this.camera.startRecMode())
  .then(res => this.cameraDisplay.startLiveviewStreaming())
  .then(res => this.setButtonPicAction());
};

AlphaCameraControl.prototype._initCanvas = function(onsuccess, onerror) {
  if (this.canvas) {
    return onsuccess(this.canvas);
  }
  
  // TODO
  onsuccess(this.canvas);
};

AlphaCameraControl.prototype.autoFocus = function(onsuccess, onerror) {
  onerror = onerror || (() => {});
  // Not true, just a test
  onerror("Autofocus not available");
};

AlphaCameraControl.prototype.getPreviewStream = function(options, onsuccess, onerror) {
  onerror = onerror || (() => {});
  if (!options.width || !options.height) {
    return onerror("options must contains a width and a height fields");
  }
  
  // TODO: check options in this.capabilities.previewSizes
  this._initCanvas(() => onsuccess(this._canvas.captureStream()), onerror);
};

AlphaCameraControl.prototype.getPreviewStreamVideoMode = function() {
  onerror = onerror || (() => {});
  if (!options.width || !options.height) {
    return onerror("options must contains a width and a height fields");
  }
  
  // TODO: check options in this.capabilities.videoSizes
  this._initCanvas(() => onsuccess(this._canvas.captureStream()), onerror);
};

AlphaCameraControl.prototype.release = function(onsuccess, onerror) {
  onsuccess = onsuccess || (() => {});
  onerror = onerror || (() => {});
  // nothing
  onsuccess();
};

AlphaCameraControl.prototype.resumePreview = function() {
};

AlphaCameraControl.prototype.setExposureCompensation = function(compensation) {
};

AlphaCameraControl.prototype.startRecording = function(options, storage, filename, onsuccess, onerror) {
  onerror = onerror || (() => {});
  onerror("Video recording not available on this device");
};

AlphaCameraControl.prototype.stopRecording = function() {
};

AlphaCameraControl.prototype.pauseRecording = function() {
};

AlphaCameraControl.prototype.resumeRecording = function() {
};

AlphaCameraControl.prototype.takePicture = function(options, onsuccess, onerror) {
  onerror = onerror || (() => {});
  // TODO: look at options
  
  var xhr = new XMLHttpRequest({ mozSystem: true });
  xhr.responseType = "arraybuffer";
  
  xhr.onerror = function () {
    onerror(this.statusText);
  };
  xhr.onload = function () {
    if (this.status != 200) {
      reject(this.statusText);
    }
    var blob = new Blob([this.response], {type: 'image/jpeg'});
    onsuccess(blob);
  };

  this._camera.actTakePicture().then(res => {
    var url = res[0][0];
    xhr.open('GET', url);
    xhr.send();
  });
};


});



