"use strict";
// This class bridges the Camera object to the application.
// The Camera must not be aware of anything related to the display.

function CameraDisplay(camera, canvas) {
  // |camera| is the instance of Camera to display
  // |canvas| is the DOM canvas node to display it in.
  this.camera = camera;
  this.canvas = canvas;
  
  this.transport = new Transport();
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

    var socket = navigator.mozTCPSocket.open("192.168.122.1", 8080, 'arraybuffer');
    socket.onopen = () => socket.send("GET /liveview/liveviewstream HTTP/1.1\r\nHost: 192.168.122.1\r\n\r\n");
    this.transport.listen(socket);

    this.streamingState = 1;
    
    var poll = () => {
      try {
        this.updateLiveviewStreaming();
        if (this.streamingState < 4) {
          // Try to continue running until WaitException is thrown
          setTimeout(() => poll(), CameraDisplay.UPDATE_PERIOD);
        }
      } catch(ex) {
        if (ex instanceof Transport.WaitException) {
          setTimeout(() => poll(), CameraDisplay.UPDATE_PERIOD);
        } else {
          throw ex;
        }
      }
    };
    //poll();
    
  });
};

// This function can raise WaitException and so must remember its state
CameraDisplay.prototype.updateLiveviewStreaming = function() {
  console.log("updateLiveviewStreaming", this.streamingState);
  if (this.streamingState == 0) {
    // streaming not started
    return;
  } else if (this.streamingState == 1) {
    // init HTTP header
    this.httpHeader = new Array();
    this.streamingState = 2;
  } else if (this.streamingState == 2) {
    // consolidating HTTP header
    var line = this.transport.readline();
    this.httpHeader.push(line);

    if (line == '') {
      // End Of HTTP Header
      console.log("Header:", this.httpHeader);
      this.streamingState = 2.5;
    }
  } else if (this.streamingState == 2.5) {
    var line = this.transport.readline();
    this.streamingState = 3;
  } else if (this.streamingState == 3) {
    var payloadType, frameId, timestamp;
    this.transport.transaction(() => {
      var magick = this.transport.read(1);
      if (magick != 0xff) {
        console.log("Warning: Wrong magick: " + magick);
      }
      payloadType = this.transport.read(1);
      console.log("liveview payload? " + (payloadType == 0x01));
      frameId = (new Uint16Array(this.transport.read(2)))[0];
      console.log("frameId: " + frameId);
      timestamp = (new Uint32Array(this.transport.read(4)))[0];
      console.log("timestamp: " + timestamp);
      this.streamingState = 4;
    });

  //this.context.putImageData(this.imageData, 0, 0); 
  }
};



// If only XmlHttpRequest allowed to perform streaming downloading, I would not have to
// recode this basic HTTP handler...

function Transport() {
  this.socket = undefined;
  this.fullBuffer = new Uint8Array();
  this.transactionRunning = false;
  this.transactionBuffer = new Uint8Array();
}

Transport.READLINE_CHUNK_SIZE = 128;

Transport.WaitException = function() {
  this.name =        "Wait Exception";
  this.message =     "Need to wait for data. Please try again later.";
  this.toString =    () => (this.name + ": " + this.message);
};

Transport.prototype.listen = function(socket) {
  this.socket = socket;
  socket.ondata = ev => this.fullBuffer += ev.data;
};

Transport.prototype.read = function(n) {
  if (this.fullBuffer.length < n) {
    throw new Transport.WaitException();
  }

  var out = this.fullBuffer.substring(0, n);
  this.fullBuffer = this.fullBuffer.substring(n);
  if (this.transactionRunning) {
    this.transactionBuffer += out;
  }
  return out;
};

Transport.prototype.readline = function() {
  var buf = '';
  this.transaction(() => {
    while (buf.indexOf('\n') == -1) {
      buf += this.read(Transport.READLINE_CHUNK_SIZE);
    }
    var n = buf.indexOf('\n');
    this.fullBuffer = buf.substring(n + 1) + this.fullBuffer;
    buf = buf.substring(0, n);
    if (buf.length > 0 && buf.charAt(buf.length - 1) == '\r') {
      buf = buf.substring(0, buf.length - 1);
    }
  });
  return buf;
};

// Restores previous buffer state if something goes wrong (e.g. WaitException occurs)
Transport.prototype.transaction = function(transaction) {
  var prevTransactionBuffer = this.transactionBuffer;
  var prevTransactionRunning = this.transactionRunning;
  this.transactionBuffer = new Uint8Array();
  this.transactionRunning = true;
  
  var exception = undefined;
  
  try {
    transaction();
  } catch(ex) {
    if (ex instanceof Transport.WaitException) {
      console.log("Fail with buffer of size: " + this.transactionBuffer.length);
      console.log("While full buffer size is: " + this.fullBuffer.length);
      // Refill buffer
      this.fullBuffer = this.transactionBuffer + this.fullBuffer;
    }
    exception = ex;
  }
  
  this.transactionRunning = prevTransactionRunning;
  this.transactionBuffer = prevTransactionBuffer;
  
  if (exception) throw exception;
}
