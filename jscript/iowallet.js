function generateReceiving(seed, wordList) {
  var iota = new window.IOTA()
  var options = {};

  options.index = 0;
  options.security = 2;
  options.deterministic = "off";
  options.checksum = true;
  options.total = 1;
  iota.api.getNewAddress(seed, options, function(e, address) {
    self.postMessage(address[0]);
  });
}

self.addEventListener('message', function(e) {
	var parts = e.data.split(" ");
  var seed = parts[0];
	var wordList = parts.slice(1, -1).join(" ");
	generateReceiving(seed, wordList);
}, false);
