"use strict";
// This class bridges the Camera object to the application.
// The Camera must not be aware of anything related to the display.

function CameraDisplay(camera, canvas) {
  // |camera| is the instance of Camera to display
  // |canvas| is the DOM canvas node to display it in.
  this.camera = camera;
  this.canvas = canvas;
  
  this.context = this.canvas.getContext("2d");
  this.imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
  
  this.liveviewEndpoint = undefined;
  this.streamingState = 0; // Not started
}

CameraDisplay.UPDATE_PERIOD = 1000;

CameraDisplay.prototype.setJpeg = function(data) {
  console.log("Update liveview", data.length);
  var blob = new Blob( [ data ], { type: "image/jpeg" } );
  var imageUrl = window.URL.createObjectURL( blob );
  var lastPic = document.getElementById('img-last-pic');
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

    //var socket = navigator.mozTCPSocket.open("192.168.122.1", 8080, {binaryType: 'string'});
    //socket.onopen = () => socket.send("GET /liveview/liveviewstream HTTP/1.1\r\nHost: 192.168.122.1\r\n\r\n");
    
    //var httpStream = new StringStream(socket);
    var stream = new Stream();
    
    var xhr = new XMLHttpRequest({ mozSystem: true });
    xhr.responseType = "moz-chunked-arraybuffer";
    xhr.open('GET', 'http://192.168.122.1:8080/liveview/liveviewstream');
    xhr.addEventListener('progress', event => {
      window.res = xhr.response;
      stream.feed(xhr.response);
    });
    xhr.send();
    
    
    //var httpStreamParser = new HttpStreamParser(httpStream, stream);
    //httpStreamParser.run();
    
    function checkMagick(magick) {
      if (magick != 0xff) {
        console.log("Protocole Error (CameraRemote): Wrong Magick (" + magick + ")");
      }
    }
    function checkPayloadType(type) {
      if (type != 0x01) {
        console.log("Warning: Non liveview frame (payload type: " + type + ")");
      }
    }
    function checkPayloadMagick(magick) {
      if (magick[0] != 0x24 || magick[1] != 0x35 || magick[2] != 0x68 || magick[3] != 0x79) {
        console.log("Protocole Error (CameraRemote): Wrong Payload Magick (" + magick[0] + ", " + magick[1] + ", " + magick[2] + ", " + magick[3] + ")");
      }
    }
    
    var handleCommonHeader = data => {
      checkMagick(data[0]);
      checkPayloadType(data[1]);
      var frameId = data[2] * 255 + data[3];
      var timestamp = (new Int32Array(data.buffer, 4, 1))[0];
      console.log("timestamp: " + timestamp, "frameId: " + frameId);
      
      return stream.read(128).then(handlePayloadHeader)
    };
    
    var paddingSize;
    var handlePayloadHeader = data => {
      checkPayloadMagick(data);
      var payloadSize = (data[4] * 255 + data[5]) * 255 + data[6];
      var payloadSizeAlt = (data[6] * 255 + data[5]) * 255 + data[4];
      paddingSize = data[7];
      console.log("payloadSize: " + payloadSize, "payloadSizeAlt: " + payloadSizeAlt, "paddingSize: " + paddingSize);
      
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
