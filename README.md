# iotaseed
A pure client-side IOTA seed generator!

The code behind http://iotaseed.io/

It is secure, using random data from the mouse and other entropy such
as current time, to generate an IOTA seed.

It also provides 36 mnemonic words (35 + 1 parity) to represent the
seed, that can be used to recover the seed at all times.

All of these are then represented in a paper wallet that can be
printed off for easy safe-keeping.

The mnemonic words are those in the standard BIP32 list.

The interesting bits of code are inside jscript/iotaseed.js

If you want to test it offline in chrome, run with chrome
--allow-file-access-from-files, to make the paper wallet worker work.

Copyright © 2017. All rights reserved. Offline copies for personal use
are permitted.

The reason for copytighting it is to at the very least make it illegal
for scammers to take the code and to modify it so it steals keys.
