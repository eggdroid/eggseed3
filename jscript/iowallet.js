function generateReceiving(seed, wordList) {
  var iota = new window.IOTA()
  var options = {};

  options.index = 0;
  options.security = 2;
  options.deterministic = "off";
  options.checksum = true;
  options.total = 1;
  iota.api.getNewAddress(seed, options, function(e, address) {
    if (window.workersAvailable) {
      self.postMessage(address[0]);
    } else {
      generatePaperWallet(seed, address[0], wordList);
      updateWalletOutputs(address);
    }
  });
}

if (window.workersAvailable) {
  self.addEventListener('message', function(e) {
    var parts = e.data.split(" ");
    var seed = parts[0];
    var wordList = parts.slice(1, -1).join(" ");
    window.generateReceiving(seed, wordList);
  }, false);
} else {
  var seed = document.getElementById("output").innerHTML;
  var wordList = document.getElementById("outputWords").innerHTML.split(" ");
  generateReceiving(seed, wordList);
}
