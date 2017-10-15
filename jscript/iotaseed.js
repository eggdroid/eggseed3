window.doneE = false

EntropyCollector.start()

window.isIEx = /*@cc_on!@*/false || !!document.documentMode; // Internet Explorer 6-11
window.isIEe = !window.isIEx && !!window.StyleMedia; // or Edge 20+

function updateEntropy() {
  if (window.isIEx || window.isIEe) {
    var numberOfEvents = 512;
  } else {
    var numberOfEvents = 256;
  }
  if (window.isBulk) {
    //numberOfEvents = numberOfEvents * 3;
    var percentageReport = 10;
  } else {
    var percentageReport = 20;
  }
  var percentage = Math.floor((EntropyCollector.eventsCaptured / numberOfEvents) * 100);
  document.getElementById('entropy').innerHTML = percentage;

  if (percentage != window.lastPercentage && percentage % percentageReport == 0) {
    if (percentage == 100) {
      Notifier.success(percentage + "%. All required randomness generated!");
    } else {
      Notifier.info(percentage + "% of required randomness generated!");
    }
    window.lastPercentage = percentage;
  }

  if (enoughEntropy(numberOfEvents) && !window.doneE) {
    if (window.isBulk) {
      generateMultipleSeeds(numberOfEvents);
    } else {
      generateSeed(numberOfEvents);
    }
    window.doneE = true;
  }
}

function generateSeed(numberOfEvents) {
  if (enoughEntropy(numberOfEvents)) {
    var seed = randomTrytes(numberOfEvents, 81);
    doneGenerating(seed);
  }
}

function generateMultipleSeeds(numberOfEvents) {
  if (enoughEntropy(numberOfEvents)) {
    var seeds = [];
    for (var i = 0; i < 12; i++) {
      seeds.push(randomTrytes(numberOfEvents, 81));
    }
    doneGeneratingMultipleSeeds(seeds);
  }
}

function doneGenerating(seed) {
  EntropyCollector.stop();
  EntropyCollector.eventTarget.removeEventListener('mousemove', updateEntropy);

  var wordList = seedToWordList(seed);
  wordList = wordList.join(" ");
  updateSeedOutputs(seed, wordList);

  if (window.isIEx) {
    generatePaperWalletPrep("Paper wallet does not work in IE, try Edge, Chrome, Firefox...");
    updateWalletOutputs("Paper wallet does not work in IE, try Edge, Chrome or Firefox...", 0, true);
  } else {
    generatePaperWalletPrep("Generating based on seed...");
    updateWalletOutputs("Generating based on seed...", 0, true);

    if (typeof(Worker) !== "undefined" && /^http.*/.test(document.location.protocol)) {
      var worker = new Worker('jscript/all-wallet.mini.js');

      worker.addEventListener('message', function(e) {
        var parts = e.data.split(" ");
        var address = parts[0];
        var nr = parts[1];
        generatePaperWallet(seed, address, nr);
        updateWalletOutputs(address, nr);
      }, false);
      worker.postMessage(seed + " " + 0);
    } else {
      var tag = document.createElement("script");
      tag.type = 'text/javascript';
      tag.src = "jscript/all-wallet.mini.js";
      document.head.appendChild(tag);
    }
  }
}

function doneGeneratingMultipleSeeds(seeds) {
  EntropyCollector.stop();
  EntropyCollector.eventTarget.removeEventListener('mousemove', updateEntropy);

  var wordLists = [];
  for (var i = 0; i < seeds.length; i++) {
    var wordList = seedToWordList(seeds[i]);
    wordLists.push(wordList.join(" "));
  }

  updateSeedOutputs(seeds.join("<br>"), wordLists.join("<br>"));

  if (window.isIEx) {
    generatePaperWalletPrep("Paper wallets do not work in IE, try Edge, Chrome, Firefox...");
    updateWalletOutputs("Paper wallets do not work in IE, try Edge, Chrome or Firefox...", 0, true);
  } else {
    generatePaperWalletPrep("Generating paper wallets based on seeds...");
    updateWalletOutputs("Generating paper wallets based on seeds...", 0, true);

    if (typeof(Worker) !== "undefined" && /^http.*/.test(document.location.protocol)) {
      var worker = new Worker('jscript/all-wallet.mini.js');

      worker.addEventListener('message', function(e) {
        var parts = e.data.split(" ");
        var address = parts[0];
        var nr = parts[1];
        generatePaperWallet(seed, address, nr);
        updateWalletOutputs(address, nr);
      }, false);
      for (var i = 0; i < seeds.length; i++) {
         worker.postMessage(seeds[i] + " " + i);
      }
    } else {
      var tag = document.createElement("script");
      tag.type = 'text/javascript';
      tag.src = "jscript/all-wallet.mini.js";
      document.head.appendChild(tag);
    }
  }
}

function updateSeedOutputs(seedText, seedWordsText, disable) {
  disable = disable || false;

  document.getElementById("restart").innerHTML = '<a href="" onClick="window.location.reload()">Start again</a>.';
  document.getElementById('entropy').innerHTML = '100';

  var output = document.getElementById("output");
  var outputWords = document.getElementById("outputWords");
  var color;

  output.innerHTML = seedText;
  outputWords.innerHTML = seedWordsText;

  document.getElementById("copyButton").disabled = disable;
  document.getElementById("copyButtonWords").disabled = disable;
  document.getElementById("copyButtonReceiving").disabled = true;
  document.getElementById("printButton").disabled = true;
}

function updateWalletOutputs(addressText, nr, disable) {
  disable = disable || false;

  if (typeof window.walletOutputs === 'undefined') {
    window.walletOutputs = [];
  }
  window.walletOutputs[nr] = addressText;

  var outputReceiving = document.getElementById("outputReceiving");
  outputReceiving.innerHTML = window.walletOutputs.join("<br>");

  document.getElementById("copyButtonReceiving").disabled = disable;
  document.getElementById("printButton").disabled = disable;
}

function decodeWords() {
  updateSeedOutputs("Decoding...", "Decoding...", true);
  var words = document.getElementById("inputWords").value;
  setTimeout(function() { 
    var seed = seedFromWordList(words.split(" "));
    if (seed) {
      doneGenerating(seed);
      var parts = [seed.slice(0, 25), seed.slice(25, 50), seed.slice(50, 75), seed.slice(75, 100)].join(" ")
      Notifier.success("Seed: " + parts, "Words have been decoded!");
    }
  }, 500);
}

// Withdraws entropy from the buffer.
function randomTrytes(max, length) {
  var array = getAllResults(max);
  var array2 = [];
  var visitedHash = [];
  var tokens = tryteTokens();
  var result = [];
  var newindex;
  if (!window.isIEx && !window.isIEe && window.crypto && window.crypto.getRandomValues) {
    var sysRandArray = new Uint16Array(1);
    window.crypto.getRandomValues(sysRandArray);
    Math.seedrandom(array[max] + (new Date()).getTime() + sysRandArray[0]);

    var array2 = new Uint32Array(array.length);
    window.crypto.getRandomValues(array2);
  } else {
    Math.seedrandom(array[max] + (new Date()).getTime() + Math.random());
    var array2 = array;
  }

  for (var i = 0; i < length; i++) {
    result.push(tokens[Math.floor(Math.random() * tokens.length)]);
    do {
      newIndexSeed = array2[Math.floor(Math.random() * max * 2)]
    } while (visitedHash[newIndexSeed])
    Math.seedrandom(newIndexSeed + result.join(""));
  }

  return result.join("");
}

function getAllResults(max) {
  var partsArrayIE = new Int32Array(EntropyCollector.buffer);
  var partsArray = Array.prototype.slice.call(partsArrayIE);
  // IE arrays to normal arrays so slice works in IE
  var arrayIE = new Int32Array(max * 2); // The bug was here
  arrayIE.set(partsArray.slice(1, max + 1));
  arrayIE.set(partsArray.slice(1025, max + 1025), max);
  array = Array.prototype.slice.call(arrayIE);
  if (array.length < max * 2 || array[0] == 0 || (array[0] == array[max] && array[0] == array[max * 2])) {
    alert('Error! Check entropy');
  }
  return array;
}

function tryteTokens() {
  var tokens = []
  for (var i = 0; i < 26; i++) {
    tokens.push(String.fromCharCode(65 + i));
  }
  tokens.push('9');
  return tokens;
}

function seedToWordList(seed) {
  var nr = fromTryteString(seed);
  var words = []
  var ints = intToBaseArray(nr, window.dictionary.length);

  for (var i = 0; i < ints.length; i++) {
    words.push(window.dictionary[ints[i]]);
  }
  if (words.length < 35) {
    Notifier.error("Word list too short. Try again!");
    return
  }
  var first = SHA256(words.join(" ")).slice(0, 10); // Parity word
  words.push(window.dictionary[parseInt(first, 16) % window.dictionary.length]);
  return words;
}

function seedFromWordList(words) {
  var error = false;
  if (words.length < 36) {
    Notifier.error("Not enough words. There should be 36. Try again!");
    error = true;
  }
  var wordHash = {};
  for (var i = 0; i < window.dictionary.length; i++) {
    wordHash[window.dictionary[i]] = i
  }
  var parityWord = words.pop();
  var first = SHA256(words.join(" ")).slice(0, 10); // Parity word
  if (parityWord != window.dictionary[parseInt(first, 16) % window.dictionary.length]) {
    Notifier.error("Wrong words, word-order, or parity word (last word). Try again!");
    error = true;
  }
  var array = [];
  for (var i = 0; i < words.length; i++) {
    var word = wordHash[words[i]];
    if (!word) {
      Notifier.error("Unknown word entered: " + words[i] + "! Try again!");
      error = true;
    }
    array.push(wordHash[words[i]]);
  }
  if (error) {
    return
  }

  array.reverse(); // Needed by bigInt
  nr = bigInt.fromArray(array, window.dictionary.length);
  var string = toTryteString(nr);
  return string;
}

function intToBaseArray(nr, base) {
  var out = [];
  var left = nr;
  while (left.isNegative() || left.compareAbs(base) >= 0) {
    var divmod = left.divmod(base);
    left = divmod.quotient;
    var digit = divmod.remainder;
    if (digit.isNegative()) {
      digit = base.minus(digit).abs();
      left = left.next();
    }
    out.push(digit);
  }
  out.push(left);
  return out;
}

function toTryteString(number) {
  var string = (number).toString(27);
  var newString = "";
  // Need to decode to JS's format, which starts at 0.
  for (var i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i);
    if (code == 113) {
      newString += String.fromCharCode(57);
    } else if (code < 58) {
      newString += String.fromCharCode(code + 17);
    } else if (code > 96) {
      newString += String.fromCharCode(code - 22);
    }
  }
  return newString
}

function fromTryteString(string) {
  var number = 1
  var newString = "";
  // Need to encode to JS's format, which starts at 0.
  for (var i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i);
    if (code == 57) {
      newString += String.fromCharCode(113);
    } else if (code < 75) {
      newString += String.fromCharCode(code - 17);
    } else if (code > 74) {
      newString += String.fromCharCode(code + 22);
    }
  }
  return bigInt(newString, 27);
}

// Do we have enough entropy events right now?
function enoughEntropy(requiredEvents) {
  return requiredEvents < EntropyCollector.eventsCaptured;
}

function generatePaperWalletPrep(text) {
  var imageCanvasses = document.getElementsByClassName('imageCanvasses');
  for (var i = 0; i < imageCanvasses.length; i++) {
    var ctx = imageCanvasses[i].getContext('2d');
    ctx.clearRect(0, 0, imageCanvasses[i].width, imageCanvasses[i].height);
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 850, 275);
  }
}

function generatePaperWallet(seed, address, nr) {
  var imageCanvas = document.getElementsByClassName('imageCanvasses')[nr];
  var seedCanvas = document.getElementsByClassName('seedCanvasses')[nr];
  var addressCanvas = document.getElementsByClassName('addressCanvasses')[nr];
  var wordList = seedToWordList(seed);

  sQR = new QRious({
    element: seedCanvas,
    value: seed,
    size: 300,
    backgroundAlpha: 0
  });

  aQR = new QRious({
    element: addressCanvas,
    value: address,
    size: 300,
    backgroundAlpha: 0
  });

  var ctx = imageCanvas.getContext('2d');
  ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

  var bg = new Image;
  bg.onload = function() {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.drawImage(bg, 0, 0, imageCanvas.width, imageCanvas.height);
    ctx.restore();
    ctx.drawImage(addressCanvas, 1380, 180);
    ctx.drawImage(seedCanvas, 20, 60);

    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";

    ctx.fillText("PRIVATE SEED", 170, 400);

    ctx.font = "bold 23px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(seed, 20, 40);

    ctx.textAlign = "center";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("RECEIVING ADDRESS", 1530, 160);

    ctx.textAlign = "right";
    ctx.font = "bold 23px sans-serif";
    ctx.fillText(address, 1680, 520);

    var img = new Image;
    img.onload = function() {
      ctx.drawImage(img, 500, 95, 60, 57);
    };
    img.src = "images/paper-logo.png";

    ctx.textAlign = "left";
    ctx.font = "bold 60px sans-serif";
    ctx.fillText("IOTASeed.io", 575, 145);
    ctx.font = "bold 32px sans-serif";
    var jump = 6;
    var pixJump = 40;
    for (i = 0; i * jump < wordList.length; i += 1) {
      ctx.fillText(wordList.slice(i * jump, i * jump + jump).join(" "), 500, 210 + i * pixJump);
    }
  };
  bg.src = "images/paper-background.jpg";
}

function printWallet() {
  window.print();
}
