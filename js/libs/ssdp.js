// This class handles the detection of devices using SSDP protocol.

function SsdpDiscover (target) {
  // |target| is a SSDP target URN
  // e.g. "urn:schemas-upnp-org:service:ContentDirectory:1"
  this.ssdp_port = 1900;
  this.ssdp_address = "239.255.255.250";
  this.ssdp_discover_mx = 2;
  this.ssdp_target = target;

  this.searchSocket = new UDPSocket({
    loopback: true
  });
  
  self.deviceInfo = {}; // to store result
}
  
SsdpDiscover.prototype.makeSsdpDiscoverPacket = function() {
  return (
    "M-SEARCH * HTTP/1.1\r\n" +
    "HOST: " + this.ssdp_address + ":" + this.ssdp_port + "\r\n" +
    "MAN: \"ssdp:discover\"\r\n" +
    "MX: " + this.ssdp_discover_mx + "\r\n" +
    "ST: " + this.ssdp_target + "\r\n" +
    "\r\n"
  );
};

SsdpDiscover.prototype.parseSsdpAnswer = function(packet) {
  var deviceInfo = {};
  
  var lines = packet.split('\r\n');
  lines.forEach(line => {
    var match = line.match(/^location:\s*(.*)$/i);
    if (match) { deviceInfo.location = match[1] };
  });
  
  return deviceInfo;
};

SsdpDiscover.prototype.search = function(callback) {
  this.searchSocket.joinMulticastGroup(this.ssdp_address);

  this.searchSocket.onmessage = e => {
    var packet = String.fromCharCode.apply(null, new Uint8Array(e.data));
    this.deviceInfo = this.parseSsdpAnswer(packet);
    callback(this.deviceInfo);
  };
  
  this.searchSocket.opened.then(() => {
    this.searchSocket.send(this.makeSsdpDiscoverPacket(), this.ssdp_address, this.ssdp_port);
    setTimeout(() => { this.searchSocket.close() }, this.ssdp_discover_mx * 1000);
  });
};

