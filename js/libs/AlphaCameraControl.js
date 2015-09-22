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
  
  this.effect: 'none';
  this.exposureCompensation: 0;
  this.flashMode: 'off';
  this.focalLength: 50;
  this.focusAreas: [];
  this.focusDistanceFar: null; // unknown
  this.focusDistanceNear: null; // unknown
  this.focusDistanceOptimum: null; // unknown
  this.focusMode: 'auto';
  this.sceneMode: 'auto';
  this.whiteBalanceMode: 'auto';
  this.zoom: 1.0;
  this.meteringAreas = [];
  
  this.onShutter: evt => {};
  this.onClosed: evt => {};
  this.onRecorderStateChange: evt => {};
  
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

AlphaCameraContol.prototype._initCanvas = function(onsuccess, onerror) {
  if (this.canvas) {
    return onsuccess(this.canvas);
  }
  
  // TODO
  onsuccess(this.canvas);
};

AlphaCameraContol.prototype.autoFocus = function(onsuccess, onerror) {
  onerror = onerror || () => {};
  // Not true, just a test
  onerror("Autofocus not available");
};

AlphaCameraContol.prototype.getPreviewStream = function(options, onsuccess, onerror) {
  onerror = onerror || () => {};
  if (!options.width or !options.height) {
    return onerror("options must contains a width and a height fields");
  }
  
  // TODO: check options in this.capabilities.previewSizes
  this._initCanvas(() => onsuccess(this._canvas.captureStream()), onerror);
};

AlphaCameraContol.prototype.getPreviewStreamVideoMode = function() {
  onerror = onerror || () => {};
  if (!options.width or !options.height) {
    return onerror("options must contains a width and a height fields");
  }
  
  // TODO: check options in this.capabilities.videoSizes
  this._initCanvas(() => onsuccess(this._canvas.captureStream()), onerror);
};

AlphaCameraContol.prototype.release = function(onsuccess, onerror) {
  onsuccess = onsuccess || () => {};
  onerror = onerror || () => {};
  // nothing
  onsuccess();
};

AlphaCameraContol.prototype.resumePreview = function() {
};

AlphaCameraContol.prototype.setExposureCompensation = function(compensation) {
};

AlphaCameraContol.prototype.startRecording = function(options, storage, filename, onsuccess, onerror) {
  onerror = onerror || () => {};
  onerror("Video recording not available on this device");
};

AlphaCameraContol.prototype.stopRecording = function() {
};

AlphaCameraContol.prototype.pauseRecording = function() {
};

AlphaCameraContol.prototype.resumeRecording = function() {
};

AlphaCameraContol.prototype.takePicture = function(options, onsuccess, onerror) {
  onerror = onerror || () => {};
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






