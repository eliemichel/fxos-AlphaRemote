'use strict';

function setButtonPicAction(camera) {
  var buttonPic = document.getElementById('button-pic');
  var lastPic = document.getElementById('img-last-pic');
  
  buttonPic.addEventListener("click", e => {
    camera.takePicture().then(img => {
      var imageUrl = window.URL.createObjectURL( img );
      lastPic.src = imageUrl;
    });
  });
}


window.addEventListener('DOMContentLoaded', function() {
  
  var translate = navigator.mozL10n.get;
  navigator.mozL10n.once(start);
  
  function start() {
    var canvas = document.getElementById('liveview-canvas');
    var camera = new AlphaCameraControl();
    window.camera = camera; // for debug
    
    camera.discover()
    .then(() => {
      setButtonPicAction(camera);
    
    camera.getPreviewStream({width: 300, height: 300}).then(stream => {
        var liveview = document.getElementById('liveview');
        liveview.mozSrcObject = stream;
        liveview.play();
      });
    });
  }

});
