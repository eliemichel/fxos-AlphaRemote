// This class bridges the Camera object to the application.
// The Camera must not be aware of anything related to the display.

function CameraDisplay(camera, canvas) {
  // |camera| is the instance of Camera to display
  // |canvas| is the DOM canvas node to display it in.
  this.camera = camera;
  this.canvas = canvas;
}

CameraDisplay.prototype.startLiveviewStreaming = function() {
  this.camera.startLiveview()
  .then(res => {
    this.liveviewEndpoint = res[0];
    
    var context = this.canvas.getContext("2d");
    var imageData = c.createImageData(this.canvas.width, this.canvas.height);
    
    
    
    context.putImageData(imageData, 0, 0);
  });
};
