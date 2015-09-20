'use strict';

function apiPlay(camera){
  apiRequest(camera, "getMethodTypes", ["1.0"], res => {
    apiRequest(camera, "startRecMode", [], res => {
      apiRequest(camera, "startLiveView", [], res => {
        apiRequest(camera, "getAvailableApiList", [], res => {
          console.log(res);
          var buttonPic = document.getElementById('button-pic');
          var lastPic = document.getElementById('img-last-pic');
          buttonPic.addEventListener("click", e => {
            apiRequest(camera, "actTakePicture", [], res => {
              console.log(res);
              lastPic.src = res.result[0][0];
            });
          });
        });
      });
    });
  });
}

window.addEventListener('DOMContentLoaded', function() {

  var translate = navigator.mozL10n.get;
  navigator.mozL10n.once(start);

  // ---

  function start() {

    var message = document.getElementById('message');
    message.textContent = translate('message');

    $ssdp().discover("urn:schemas-sony-com:service:ScalarWebAPI:1")
    .then(deviceInfo => {
      message.textContent = deviceInfo.location;
      $http(deviceInfo.location).get().then(res => {
        message.textContent = res;
        var camera = getCameraEndpointFromXML(xhr.responseText);
        window.camera = camera; // for debug
        message.textContent = camera;
        apiPlay(camera);
      })
    });
  }
});

