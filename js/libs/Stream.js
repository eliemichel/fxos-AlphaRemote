// ArrayBuffer socket does not work as expected so I write a Stream variant
// that relies on string sockets.

function StringStream(socket) {
  this._socket = undefined;
  this._fullBuffer = '';
  this._transactionLock = false;
  this._transactionResolve = () => {};
  this._waitedLength = 0;
  this._waitLine = false;
  
  this.strictCRLF = false;
  
  if (socket) {
    this.listen(socket);
  }
}

StringStream.MAX_BUFFER_SIZE = 1024;

StringStream.prototype.listen = function(socket) {
  this._socket = socket;
  this._socket.ondata = this._onData.bind(this);
};

StringStream.prototype._onData = function(evt) {
  // Append data to buffer
  this._fullBuffer += evt.data
  
  if (this._waitedLength > 0) {
    if (this._fullBuffer.length >= this._waitedLength) {
      var buf = this._fullBuffer.substring(0, this._waitedLength);
      this._fullBuffer = this._fullBuffer.substring(this._waitedLength);
      this._waitedLength = 0;
      
      this._transactionResolve(buf);
    }
  } else if (this._waitLine) {
    var n, offset;
    if (this.strictCRLF) {
      n = this._fullBuffer.indexOf('\r\n');
      offset = 2;
    } else {
      n = this._fullBuffer.indexOf('\n');
      offset = 1;
    }
    if (n != -1) {
      var buf = this._fullBuffer.substring(0, n);
      this._fullBuffer = this._fullBuffer.substring(n + offset);
      this._waitLine = false;
      
      if (!this.strictCRLF && buf.length > 0 && buf.charAt(buf.length - 1) == '\r') {
        buf = buf.substring(0, buf.length - 1);
      }
      
      this._transactionResolve(buf);
    }
  } else if (this._fullBuffer.length > StringStream.MAX_BUFFER_SIZE) {
    console.log("Warning: MAX_BUFFER_SIZE (" + StringStream.MAX_BUFFER_SIZE + ") excedeed. Discarding all buffer.");
    //this._fullBuffer = this._fullBuffer.substr(this._fullBuffer.length - StringStream.MAX_BUFFER_SIZE);
    this._fullBuffer = '';
  }
};

StringStream.prototype.read = function(len) {
  return this._read(len, false);
};

StringStream.prototype.readline = function() {
  return this._read(0, true);
};

// Utility function to avoid code duplication
StringStream.prototype._read = function(waitedLength, waitLine) {
  if (this._transactionLock) {
    console.log("Transation lock already active.");
    return;
  }
  this._waitLine = waitLine;
  this._waitedLength = waitedLength;
  this._transactionLock = true;
  
  return new Promise((resolve, reject) => {
    this._transactionResolve = data => {
      this._transactionLock = false;
      resolve(data);
    }
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

Stream.prototype.feed = function(data) {
  this._onData({data: data});
};

Stream.prototype._onData = function(evt) {
  window.evt = evt;
  window.data = new Uint8Array(evt.data);
  window.bla = this;
  // Append data to buffer
  (new Uint8Array(evt.data)).copyWithin(this._fullBuffer, this._bufferViewEnd);
  this._bufferViewEnd += evt.data.byteLength;
  
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

