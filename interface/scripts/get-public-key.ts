import * as fs from 'fs';
import {Keypair, PublicKey} from '@solana/web3.js';

export function getPublicKey(pathToPrivateKeyFile: string): PublicKey {
  return getKeyPair(pathToPrivateKeyFile).publicKey;
}

export function getKeyPair(pathToPrivateKeyFile: string): Keypair {
  const privateKey = JSON.parse(
    fs.readFileSync(pathToPrivateKeyFile, {
      encoding: 'utf8',
    })
  ) as number[];

  return Keypair.fromSecretKey(Uint8Array.from(privateKey));
}

if (require.main === module) {
  const programPublicKey = getPublicKey(process.argv[2]);
  console.log(programPublicKey.toString());
}
