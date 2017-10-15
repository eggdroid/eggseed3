function generateReceiving(seed, nr) {
  var iota = new window.IOTA()
  var options = {};

  options.index = 0;
  options.security = 2;
  options.deterministic = "off";
  options.checksum = true;
  options.total = 1;
  iota.api.getNewAddress(seed, options, function(e, address) {
    if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
      self.postMessage(address[0], nr);
    } else {
      generatePaperWallet(seed, address[0], nr);
      updateWalletOutputs(address, nr);
    }
  });
}

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.addEventListener('message', function(e) {
    var parts = e.data.split(" ");
    var seed = parts[0];
    var nr = parts[1]; 
    generateReceiving(seed, nr);
  }, false);
} else {
  var seeds = document.getElementById("output").innerHTML.split("<br>");
  console.log(seeds);
  for (var i = 0; i < seeds.length; i++) {
    generateReceiving(seeds[i], i);
  }
}
