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

CameraDisplay.prototype.startLiveviewStreaming = function() {
  if (this.streamingState != 0) {
    // streaming already initialized
    return;  
  }
  this.camera.startLiveview()
  .then(res => {
    this.liveviewEndpoint = res[0];

    var socket = navigator.mozTCPSocket.open("192.168.122.1", 8080, {binaryType: 'string'});
    socket.onopen = () => socket.send("GET /liveview/liveviewstream HTTP/1.1\r\nHost: 192.168.122.1\r\n\r\n");
    var stream = new StringStream(socket);
    var stream2 = new Stream();
    stream.strictCRLF = true;
    
    var httpHeader = new Array();
    
    var handleHeaderLine = data => {
      httpHeader.push(data);
      if (data == '') {
        // End of HTTP header
        console.log(httpHeader);
        return stream.readline().then(handleChunkSize);
      } else {
        return stream.readline().then(handleHeaderLine);
      }
    };
    
    var handleChunkSize = data => {
      var chunkSize = parseInt(data.substring(0,2), 16) / 2;
      //console.log("Chunk of size " + data)
      return stream.readline().then(handleChunkData);
    };
    
    var c = 0;
    var handleChunkData = data => {
      //c++; if (c <= 10) console.log("Chunk Payload (" + data.length + "): " + data);
      
      var buf = new ArrayBuffer(data.length*2);
      var bufView = new Uint16Array(buf);
      for (var i=0, strLen=data.length; i<strLen; i++) {
        bufView[i] = data.charCodeAt(i);
      }
      stream2.feed(buf);
      return stream.readline().then(handleChunkSize);
    };
    
    stream.readline().then(handleHeaderLine);
    
    stream2.read(128).then(data => console.log("bla", data));
  });
};

