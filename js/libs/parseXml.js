define(function(require, exports, module) {
'use strict';
  
module.exports = parseXml;

function parseXml(xmlStr) {

  if (typeof window.DOMParser != "undefined") {
    return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
  } else if (typeof window.ActiveXObject != "undefined" &&
             new window.ActiveXObject("Microsoft.XMLDOM")) {
    var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = "false";
    xmlDoc.loadXML(xmlStr);
    return xmlDoc;
  } else {
    throw new Error("No XML parser found");
  }

}
  
});