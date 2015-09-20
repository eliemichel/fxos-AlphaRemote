'use strict';

function setButtonPicAction() {
  var buttonPic = document.getElementById('button-pic');
  var lastPic = document.getElementById('img-last-pic');
  
  buttonPic.addEventListener("click", e => {
    camera.actTakePicture().then(res => {
      lastPic.src = res[0][0];
    });
  });
}

window.addEventListener('DOMContentLoaded', function() {

  var translate = navigator.mozL10n.get;
  navigator.mozL10n.once(start);
  
  var camera = new Camera();
  window.camera = camera; // for debug

  // ---

  function start() {
    
    var liveview = document.getElementById('liveview');
    var cameraDisplay = new CameraDisplay(camera, liveview)

    $ssdp().discover("urn:schemas-sony-com:service:ScalarWebAPI:1")
    .then(deviceInfo => {
      message.textContent = deviceInfo.location;
      return $http(deviceInfo.location, { mozSystem: true }).get();
    })
    .then(xml => {
      message.textContent = xml;
      camera.setEndpointFromXML(xml);
      message.textContent = camera.endpoint;
      return camera.loadApiMethods();
    })
    .then(res => camera.startRecMode())
    .then(res => cameraDisplay.startLiveviewStreaming())
    .then(res => setButtonPicAction());
  }
});

