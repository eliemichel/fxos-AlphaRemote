function Stream(socket) {
  this._socket = undefined;
  this._fullBuffer = new ArrayBuffer(Stream.MAX_BUFFER_SIZE * 2);
  this._bufferViewStart = 0;
  this._bufferViewEnd = 0; // actually, next empty cell
  this._transactionLock = false;
  this._transactionResolve = () => {};
  this._waitedByteLength = -1;
  this._waitedMagick = null;
  
  if (socket) {
    this.listen(socket);
  }
}

Stream.MAX_BUFFER_SIZE = 1024 * 1024 * 6;

Stream.prototype.listen = function(socket) {
  this._socket = socket;
  this._socket.ondata = this._onData.bind(this);
};

Stream.prototype.feed = function(data) {
  this._onData({data: data});
};

Stream.prototype._onData = function(evt) {
  // Append data to buffer
  var newData = new Uint8Array(evt.data);
  (new Uint8Array(this._fullBuffer)).set(newData, this._bufferViewEnd);
  this._bufferViewEnd += evt.data.byteLength;
  
  var bufferLength = this._bufferViewEnd - this._bufferViewStart;
  if (this._waitedByteLength > -1) {
    if (bufferLength >= this._waitedByteLength) {
      var waitedLength = this._waitedByteLength; // * 1.0 because we use Uint8Array
      var view = new Uint8Array(this._fullBuffer, this._bufferViewStart, waitedLength);
      
      this._bufferViewStart += this._waitedByteLength;
      this._waitedByteLength = -1;
      
      this._transactionResolve(view.slice()); // slice is used to copy buffer data
    }
  } else if (this._waitedMagick) {
    // Only check new data, old buffer should have already been checked
    // but add the len(magick) previous characters
    var min = (a, b) => a > b ? b : a;
    var searchSliceLength = min(bufferLength, newData.length + this._waitedMagick.length);
    
    var searchSlice = new Uint8Array(this._fullBuffer, this._bufferViewEnd - searchSliceLength, searchSliceLength);
    var n = searchSlice.indexOf(this._waitedMagick[0])
    if (n >= 0) {
      var isMagickOkBeyond = i => {
        if (i >= this._waitedMagick.length) return true;
        if (i >= searchSlice.length) return false;
        return this._waitedMagick[i] == searchSlice[n+i] && isMagickOkBeyond(i+1);
      };
      if (isMagickOkBeyond(0)) {
        this._bufferViewStart = this._bufferViewEnd - searchSliceLength + n + this._waitedMagick.length;
        this._waitedMagick = null;

        this._transactionResolve();
      }
    }
  } else if (bufferLength > Stream.MAX_BUFFER_SIZE) {
    console.log("Warning: MAX_BUFFER_SIZE (" + Stream.MAX_BUFFER_SIZE + ") excedeed. Discarding all buffer.");
    this._bufferViewStart = 0;
    this._bufferViewEnd = 0;
  }
  
  // Cycling buffer data
  if (this._bufferViewEnd > this._fullBuffer.byteLength - Stream.MAX_BUFFER_SIZE) {
    console.log("Cycle");
    bufferLength = this._bufferViewEnd - this._bufferViewStart;
    (new Uint8Array(this._fullBuffer)).set(new Uint8Array(this._fullBuffer, this._bufferViewStart, bufferLength));
    this._bufferViewEnd -= this._bufferViewStart;
    this._bufferViewStart = 0;
  }
};

Stream.prototype._read = function(waitedByteLength, waitedMagick) {
  if (this._transactionLock) {
    console.log("Transation lock already active.");
    return;
  }
  this._waitedByteLength = waitedByteLength;
  this._waitedMagick = waitedMagick;
  this._transactionLock = true;
  
  this.extendBuffer(waitedByteLength);
  
  return new Promise((resolve, reject) => {
    this._transactionResolve = data => {
      this._transactionLock = false;
      resolve(data);
    }
  });
};

Stream.prototype.read = function(len) {
  return this._read(len, null);
};

Stream.prototype.flushToMagick = function(magick) {
  return this._read(-1, magick);
};

Stream.prototype.extendBuffer = function(len) {
  if (len + Stream.MAX_BUFFER_SIZE > this._fullBuffer.byteLength) {
    // This is a little dirty (?)
    this._fullBuffer = new ArrayBuffer(len + Stream.MAX_BUFFER_SIZE);
    console.log("Extending buffer to " + this._fullBuffer.byteLength);
  }
};
