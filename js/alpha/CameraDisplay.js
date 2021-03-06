/*
var Stream = require('alpha/Stream');

module.exports = CameraDisplay;
*/

// This class bridges the Camera object to the application.
// The Camera must not be aware of anything related to the display.

function CameraDisplay(camera, canvas) {
  // |camera| is the instance of Camera to display
  // |canvas| is the DOM canvas node to display it in.
  this.camera = camera;
  
  // TODO: adapt to camera settings
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 480;
  }
  
  this.canvas = canvas;
  
  this.context = this.canvas.getContext("2d");
  this.imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
  
  this.liveviewEndpoint = undefined;
  this.streamingState = 0; // Not started
}

CameraDisplay.UPDATE_PERIOD = 1000;

CameraDisplay.prototype.setJpeg = function(data) {
  var blob = new Blob( [ data ], { type: 'image/jpeg' } );
  var imageUrl = window.URL.createObjectURL( blob );
  var lastPic = new Image();
  lastPic.onload = () => {
    this.context.drawImage(lastPic,0,0);
  };
  lastPic.src = imageUrl;
};

CameraDisplay.prototype.startLiveviewStreaming = function() {
  if (this.streamingState != 0) {
    // streaming already initialized
    return;  
  }
  this.camera.startLiveview()
  .then(res => {
    this.liveviewEndpoint = res[0];
    console.log(this.liveviewEndpoint);

    var stream = new Stream();
    
    var xhr = new XMLHttpRequest({ mozSystem: true });
    xhr.responseType = "moz-chunked-arraybuffer";
    xhr.open('GET', this.liveviewEndpoint);
    xhr.addEventListener('progress', event => {
      window.res = xhr.response;
      stream.feed(xhr.response);
    });
    xhr.send();
    
    var payloadMagick = new Array(0x24, 0x35, 0x68, 0x79);
    
    function checkMagick(magick) {
      if (magick != 0xff) {
        //console.log("Protocole Error (CameraRemote): Wrong Magick (" + magick + ")");
      }
    }
    function checkPayloadType(type) {
      if (type != 0x01) {
        //console.log("Warning: Non liveview frame (payload type: " + type + ")");
      }
    }
    function checkPayloadMagick(magick) {
      if (magick[0] != payloadMagick[0] || magick[1] != payloadMagick[1] || magick[2] != payloadMagick[2] || magick[3] != payloadMagick[3]) {
        //console.log("Protocole Error (CameraRemote): Wrong Payload Magick (" + magick[0] + ", " + magick[1] + ", " + magick[2] + ", " + magick[3] + ")");
        return false;
      }
      return true;
    }
    
    var handleCommonHeader = data => {
      checkMagick(data[0]);
      checkPayloadType(data[1]);
      var frameId = data[2] * 255 + data[3];
      var timestamp = (new Int32Array(data.buffer, 4, 1))[0];
      //console.log("timestamp: " + timestamp, "frameId: " + frameId);
      
      return stream.read(4).then(handlePayloadHeader)
    };
    
    var paddingSize;
    var handlePayloadHeader = data => {
      if (!checkPayloadMagick(data)) {
        return stream.flushToMagick(payloadMagick).then(() => stream.read(124)).then(handlePayloadHeaderAfterMagick);
      }
      return stream.read(124).then(handlePayloadHeaderAfterMagick);
    };
    
    var handlePayloadHeaderAfterMagick = data => {
      var payloadSize = (data[0] * 255 + data[1]) * 255 + data[2];
      paddingSize = data[3];
      //console.log("payloadSize: " + payloadSize, "paddingSize: " + paddingSize);
      
      return stream.read(payloadSize).then(handlePayload);
    };
    
    var handlePayload = data => {
      this.setJpeg(data);
      return stream.read(paddingSize).then(handlePadding);
    };
    
    var handlePadding = data => {
      return stream.read(8).then(handleCommonHeader);
    };
    
    stream.read(8).then(handleCommonHeader);
  });
};

