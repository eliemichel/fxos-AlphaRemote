function getCameraEndpointFromXML(xmlString) {
  var cameraEndpoint;
  var xml = parseXml(xmlString);
  var devices = xml.getElementsByTagName("av:X_ScalarWebAPI_DeviceInfo");
  console.log("Found " + devices.length + " device" + (devices.length > 1 ? 's' : ''));

  for (var i = 0 ; i < devices.length ; i++) {
    var device = devices[i];
    var services = device.getElementsByTagName("av:X_ScalarWebAPI_Service");
    console.log("Device #" + i + ": Found " + services.length + " service" + (services.length > 1 ? 's' : ''));
    for (var j = 0 ; j < services.length ; j++) {
      var service = services[j];
      var type = service.getElementsByTagName("av:X_ScalarWebAPI_ServiceType");
      if (type.length == 0) {
        console.log("Device #" + i + ", Service #" + j + ": ServiceType not found");
        return;
      }
      var serviceType = type[0].textContent;

      var url = service.getElementsByTagName("av:X_ScalarWebAPI_ActionList_URL");
      if (url.length == 0) {
        console.log("Device #" + i + ", Service #" + j + ": ServiceUrl not found");
        return;
      }
      var serviceUrl = url[0].textContent;

      var serviceEndpoint = url[0].textContent + "/" + type[0].textContent;

      console.log("Device #" + i + ", Service #" + j + ": ServiceType is " + serviceType);
      console.log("Device #" + i + ", Service #" + j + ": ServiceUrl is " + serviceUrl);
      console.log("Device #" + i + ", Service #" + j + ": ServiceEndpoint is " + serviceEndpoint);

      if (serviceType == "camera") {
        cameraEndpoint = serviceEndpoint;
      }
    };
  };
  
  return cameraEndpoint;
}

lastReqId = 0;
function apiRequest(endpoint, method, params, callback) {
  var req = {
    "method": method,
    "params": params,
    "version": "1.0"
  }
  req["id"] = lastReqId = lastReqId + 1

  var xhr = new XMLHttpRequest({ mozSystem: true });
  xhr.open("post", endpoint);
  xhr.onreadystatechange = function () {
    if ( 4 != xhr.readyState ) { return; }
    if ( 200 != xhr.status ) {
      console.log('error in ajax request')
      return;
    }
    callback(JSON.parse(xhr.responseText));
  };
  xhr.send(JSON.stringify(req));
}
