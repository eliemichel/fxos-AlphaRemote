AlphaRemote
===========

![Application Icon](https://raw.githubusercontent.com/eliemichel/fxos-AlphaRemote/master/img/icons/icon128x128.png)

This application is a remote controller for Sony Alpha series camera on Firefox OS.
It is based on the camera application and offers a remote viewer and trigger.

Installation
------------

This is a privileged app so you need to load it manually.

````bash
git clone https://github.com/eliemichel/fxos-AlphaRemote.git
````

Or download the latest version in this [ZIP file](https://github.com/eliemichel/fxos-AlphaRemote/archive/master.zip).

Import the app into the [App Manager](https://developer.mozilla.org/Firefox_OS/Using_the_App_Manager). Then you can run it in the simulator, or in a Firefox OS device.

Development Status
------------------

The basics of the application works, but only the basics. Which means that the liveview is displayed and you can take pictures, but the picture are not downloaded to the phone yet (they are still stored on the camera anyway). There is also no way to change any setting and take benefit of the numerous features of Sony Remote Camera API.

Troubleshooting
---------------

An important thing to know, is that you must enable the Camera Remote Control application **before starting the AlphaRemote application**. So you might have to kill the application and restart it (holding the *home* button and pressing the cross) if you forgot that.


Getting help
------------

If you find something that doesn't quite work as you'd expect, we'd appreciate if you [filed a bug](https://github.com/eliemichel/fxos-AlphaRemote/issues)!

