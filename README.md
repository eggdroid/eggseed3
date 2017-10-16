# iotaseed
A pure client-side IOTA seed generator!

The code behind http://iotaseed.io/.

Should also work locally. Both through 'Save Page As', and when checked
out from the git repo. Though when using it for real, please stick to
the stable version from the site.

It is secure, using random data from the mouse and other entropy such
as current time, to generate an IOTA seed.

It also provides 36 mnemonic words (35 + 1 parity) to represent the
seed, that can be used to recover the seed at all times.

All of these are then represented in a paper wallet that can be
printed off for easy safe-keeping. Now also supports bulk seed 
generating, providing 12 paper wallets in one go.

The mnemonic words are those in the standard BIP32 list.

The interesting bits of code are inside jscript/iotaseed.js and iotawallet.js

Libraries used are:

* BigInteger (for Mnemonic words, http://peterolson.github.io/BigInteger.js/)
* clipboard (for copy to clipboard, https://clipboardjs.com/)
* entropy-collector (for mouse entropy, https://github.com/vibornoff/entropy-collector.js)
* notifier (for UI notifications, http://rlemon.github.io/Notifier.js/)
* seedrandom (for seeding with entropy, https://github.com/davidbau/seedrandom)

And for the paper wallet generator (inspired by Aran Cauchi's
https://github.com/arancauchi/IOTA-Paper-Wallet)

* iota.lib.js (for receive address, https://github.com/iotaledger/iota.lib.js)
* qrious (for wallet QR codes, https://github.com/neocotic/qrious)

Copyright 2017 Iotaseed.io, All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to use and make offline copies of the Software for
personal use, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

The reason for copytighting it is to at the very least make it illegal
for scammers to take the code and to modify it in inappropriate ways.
