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
    console.log(socket.binaryType);
    socket.onopen = () => socket.send("GET /liveview/liveviewstream HTTP/1.1\r\nHost: 192.168.122.1\r\n\r\n");
    var stream = new Stream(socket);
    stream.read(4)
    .then(data => {
      console.log(data);
    })
  });
};


// If only XmlHttpRequest allowed to perform streaming downloading, I would not have to
// recode this basic HTTP handler...

function Stream(socket) {
  this._socket = undefined;
  this._fullBuffer = new ArrayBuffer(Stream.MAX_BUFFER_SIZE * 2);
  this._bufferViewStart = 0;
  this._bufferViewEnd = 0; // actually, next empty cell
  this._transactionLock = false;
  this._transactionResolve = () => {};
  this._waitedByteLength = 0;
  
  if (socket) {
    this.listen(socket);
  }
}

Stream.MAX_BUFFER_SIZE = 1024;

Stream.prototype.listen = function(socket) {
  this._socket = socket;
  this._socket.ondata = this._onData.bind(this);
};

Stream.prototype._onData = function(evt) {
  // This is a dirty hack
  var buf = new ArrayBuffer(evt.data.length*2);
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=evt.data.length; i<strLen; i++) {
    bufView[i] = evt.data.charCodeAt(i);
  }
  
  // Append data to buffer
  (new Uint8Array(buf)).copyWithin(this._fullBuffer, this._bufferViewEnd);
  this._bufferViewEnd += evt.data.length;
  
  var bufferLength = this._bufferViewEnd - this._bufferViewStart;
  if (this._waitedByteLength > 0) {
    if (bufferLength >= this._waitedByteLength) {
      var waitedLength = this._waitedByteLength; // * 1.0 because we use Uint8Array
      var view = new Uint8Array(this._fullBuffer, this._bufferViewStart, waitedLength);
      
      this._bufferViewStart += this._waitedByteLength;
      this._waitedByteLength = 0;
      
      this._transactionResolve(view.slice()); // slice is used to copy buffer data
    }
  } else if (bufferLength > Stream.MAX_BUFFER_SIZE) {
    console.log("Warning: MAX_BUFFER_SIZE (" + Stream.MAX_BUFFER_SIZE + ") excedeed. Discarding all buffer.");
    this._bufferViewStart = 0;
    this._bufferViewEnd = 0;
  }
  
  // Cycling buffer data
  if (this._bufferViewStart > this._fullBuffer.length - Stream.MAX_BUFFER_SIZE) {
    bufferLength = this._bufferViewEnd - this._bufferViewStart;
    (new Uint8Array(this._fullBuffer, this._bufferViewStart, bufferLength)).copyWithin(this._fullBuffer);
    this._bufferViewEnd -= this._bufferViewStart;
    this._bufferViewStart = 0;
  }
};

Stream.prototype.read = function(len) {
  if (this._transactionLock) {
    console.log("Transation lock already active.");
    return;
  }
  this._waitedByteLength = len;
  this._transactionLock = true;
  
  return new Promise((resolve, reject) => {
    this._transactionResolve = data => {
      this._transactionLock = true;
      resolve(data);
    }
  });
};

