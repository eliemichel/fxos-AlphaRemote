// This class handles the detection of devices using SSDP protocol.

function SsdpDiscoverer(config) {
  config = config || {};
  this.ssdp_port =        config.port        || 1900;
  this.ssdp_address =     config.address     || "239.255.255.250";
  this.ssdp_discover_mx = config.discover_mx || 2;

  this.searchSocket = new UDPSocket({
    loopback: true
  });
  
  self.deviceInfo = {}; // to store result
}
  
SsdpDiscoverer.prototype.makeSsdpDiscoverPacket = function(target) {
  target = target || self.ssdp_target;
  return (
    "M-SEARCH * HTTP/1.1\r\n" +
    "HOST: " + this.ssdp_address + ":" + this.ssdp_port + "\r\n" +
    "MAN: \"ssdp:discover\"\r\n" +
    "MX: " + this.ssdp_discover_mx + "\r\n" +
    "ST: " + target + "\r\n" +
    "\r\n"
  );
};

SsdpDiscoverer.prototype.parseSsdpDiscoverAnswer = function(packet) {
  var deviceInfo = {};
  
  var lines = packet.split('\r\n');
  lines.forEach(line => {
    var match = line.match(/^location:\s*(.*)$/i);
    if (match) { deviceInfo.location = match[1] };
  });
  
  return deviceInfo;
};

SsdpDiscoverer.prototype.discover = function(target) {
  // |target| is a SSDP target URN
  // e.g. "urn:schemas-upnp-org:service:ContentDirectory:1"
  return new Promise((resolve, reject) => {
    this.searchSocket.joinMulticastGroup(this.ssdp_address);

    this.searchSocket.onmessage = e => {
      var packet = String.fromCharCode.apply(null, new Uint8Array(e.data));
      this.deviceInfo = this.parseSsdpDiscoverAnswer(packet);
      resolve(this.deviceInfo);
    };

    this.searchSocket.opened.then(() => {
      this.searchSocket.send(this.makeSsdpDiscoverPacket(target), this.ssdp_address, this.ssdp_port);
      setTimeout((() => {
        this.searchSocket.close();
        reject("SsdpDiscoverer: SSDP discovery time out (" + this.ssdp_discover_mx + "s delay)");
      }), this.ssdp_discover_mx * 1000);
    });
  });
};

// Provide an alternative interface similar to $http
function $ssdp(config) {
  return new SsdpDiscoverer(config);
}
