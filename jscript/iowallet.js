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
      self.postMessage(seed + " " + address[0] + " " + nr);
    } else {
      generatePaperWallet(seed, address[0], nr);
      updateWalletOutputs(address, nr);
    }
  });
}

function delayedGenerateReceiving(seed, i) {
  setTimeout(function() {
    generateReceiving(seed, i);
  }, i * 3000); // Prevent page from hanging if workers are not supported by browser
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
  for (var i = 0; i < seeds.length; i++) {
    delayedGenerateReceiving(seeds[i], i);
  }
}
