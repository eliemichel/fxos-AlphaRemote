define(function (require) {
'use strict';

var print = require("bla");
print('hello');
  
require("./alpha/AlphaCameraControl");

function setButtonPicAction() {
  var buttonPic = document.getElementById('button-pic');
  var lastPic = document.getElementById('img-last-pic');
  
  buttonPic.addEventListener("click", e => {
    camera.takePicture().then(img => {
      lastPic.src = img;
    });
  });
}

  var translate = navigator.mozL10n.get;
  navigator.mozL10n.once(start);
  
  var camera = new AlphaCameraControl();
  window.camera = camera; // for debug
  setButtonPicAction();

});
