const {getPublicKey} = require("../scripts/get-public-key");
const {Keypair} = require("@solana/web3.js");

process.env.REACT_APP_SOLANA_PROGRAM_ID = getPublicKey('../program-keypair.json');
process.env.REACT_APP_CWAR_STAKING_PUBKEY = Keypair.generate().publicKey.toString(); // Random this will get set in tests
