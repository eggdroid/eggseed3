window.done = false

EntropyCollector.start()

function updateEntropy() {
  var numberOfEvents = 256
  var percentage = Math.floor((EntropyCollector.eventsCaptured / numberOfEvents) * 100);
  document.getElementById('entropy').innerHTML = percentage;

  if (percentage != window.lastPercentage && percentage % 20 == 0) {
    if (percentage == 100) {
      Notifier.success(percentage + "%. All required randomness generated!");
    } else {
      Notifier.info(percentage + "% of required randomness generated!");
    }
    window.lastPercentage = percentage;
  }

  if (enoughEntropy(numberOfEvents) && !window.done) {
    generateSeed(numberOfEvents);
    window.done = true;
  }
}

function generateSeed(numberOfEvents) {
  if (enoughEntropy(numberOfEvents)) {
    var seed = randomTrytes(numberOfEvents, 81);
    doneGenerating(seed);
  }
}

function doneGenerating(seed) {
  EntropyCollector.stop();
  EntropyCollector.eventTarget.removeEventListener('mousemove', updateEntropy);

  var wordList = seedToWordList(seed);
  updateSeedOutputs(seed, wordList.join(" "));
  generatePaperWalletPrep("Generating based on seed...");
  updateWalletOutputs("Generating based on seed...", true);

  if (typeof(Worker) !== "undefined" && /^http.*/.test(document.location.protocol)) {
    var worker = new Worker('jscript/all-wallet.mini.js');

    worker.addEventListener('message', function(e) {
      var address = e.data;
      generatePaperWallet(seed, address, wordList);
      updateWalletOutputs(address);
    }, false);
    worker.postMessage(seed);
  } else {
    var tag = document.createElement("script");
    tag.type = 'text/javascript';
    tag.src = "jscript/all-wallet.mini.js";
    document.head.appendChild(tag);
  }
}

function updateSeedOutputs(seed, seedWords, disable) {
  disable = disable || false;

  document.getElementById("restart").innerHTML = '<a href="" onClick="window.location.reload()">Start again</a>';
  document.getElementById('entropy').innerHTML = '100';

  var output = document.getElementById("output");
  var outputWords = document.getElementById("outputWords");
  var color;

  output.innerHTML = seed;
  outputWords.innerHTML = seedWords;

  document.getElementById("copyButton").disabled = disable;
  document.getElementById("copyButtonWords").disabled = disable;
  document.getElementById("copyButtonReceiving").disabled = true;
  document.getElementById("printButton").disabled = true;
}

function updateWalletOutputs(address, disable) {
  disable = disable || false;

  var outputReceiving = document.getElementById("outputReceiving");
  outputReceiving.innerHTML = address;

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
  if (window.crypto && window.crypto.getRandomValues) {
    var sysRandArray = new Uint16Array(1);
    window.crypto.getRandomValues(sysRandArray);
    Math.seedrandom(array[max] + (new Date()).getTime() + sysRandArray[0]);

    var array2 = new Uint32Array(array.length);
    window.crypto.getRandomValues(array2);
  } else {
    Math.seedrandom(array[max] + (new Date()).getTime() + Math.random);
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
  var partsArray = new Int32Array(EntropyCollector.buffer);
  var array = new Int32Array(max * 2);
  array.set(partsArray.slice(1, max + 1));
  array.set(partsArray.slice(1025, max + 1025), max);
  return array
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
function enoughEntropy(events) {
  return events < EntropyCollector.eventsCaptured;
}

function generatePaperWalletPrep(text) {
  var imageCanvas = document.getElementById('imageCanvas');
  var ctx = imageCanvas.getContext('2d');
  ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 750, 275);
}

function generatePaperWallet(seed, address, wordList) {
  var imageCanvas = document.getElementById('imageCanvas');
  var seedCanvas = document.getElementById('seedCanvas');
  var addressCanvas = document.getElementById('addressCanvas');

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
    ctx.drawImage(addressCanvas, 1180, 180);
    ctx.drawImage(seedCanvas, 20, 60);

    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";

    ctx.fillText("PRIVATE SEED", 170, 400);

    ctx.font = "bold 23px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(seed, 20, 40);

    ctx.textAlign = "center";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("RECEIVING ADDRESS", 1330, 160);

    ctx.textAlign = "right";
    ctx.font = "bold 23px sans-serif";
    ctx.fillText(address, 1480, 520);

    var img = new Image;
    img.onload = function() {
      ctx.drawImage(img, 400, 105, 60, 57);
    };
    img.src = "images/paper-logo.png";

    ctx.textAlign = "left";
    ctx.font = "bold 60px sans-serif";
    ctx.fillText("IOTASeed.io", 475, 155);
    ctx.font = "bold 28px sans-serif";
    var jump = 6;
    var pixJump = 35;
    for (i = 0; i * jump < wordList.length; i += 1) {
      ctx.fillText(wordList.slice(i * jump, i * jump + jump).join(" "), 400, 240 + i * pixJump);
    }
  };
  bg.src = "images/paper-background.jpg";
}

function printWallet() {
  window.print();
}

window.onload = function() {
  window.lastPercentage = 0;
  EntropyCollector.eventTarget.addEventListener('mousemove', updateEntropy);

  (new Clipboard('#copyButton')).on('success', function(e) {
    Notifier.success("Copied to clipboard!");
  });
  (new Clipboard('#copyButtonWords')).on('success', function(e) {
    Notifier.success("Copied to clipboard!");
  });
  (new Clipboard('#copyButtonReceiving')).on('success', function(e) {
    Notifier.success("Copied to clipboard!");
  });
  Notifier.info("Move the mouse to generate randomness!");

  generatePaperWalletPrep("Paper wallet will appear after sufficient mouse movement");
};
