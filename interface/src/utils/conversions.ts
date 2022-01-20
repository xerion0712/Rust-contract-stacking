export function convertUint8ArrayTo128BitBigInt(arr: Uint8Array): bigint {
  const outValue: BigInt =
    BigInt(arr[0]) |
    (BigInt(arr[1]) << BigInt(8)) |
    (BigInt(arr[2]) << BigInt(16)) |
    (BigInt(arr[3]) << BigInt(24)) |
    (BigInt(arr[4]) << BigInt(32)) |
    (BigInt(arr[5]) << BigInt(40)) |
    (BigInt(arr[6]) << BigInt(48)) |
    (BigInt(arr[7]) << BigInt(56)) |
    (BigInt(arr[8]) << BigInt(64)) |
    (BigInt(arr[9]) << BigInt(72)) |
    (BigInt(arr[10]) << BigInt(80)) |
    (BigInt(arr[11]) << BigInt(88)) |
    (BigInt(arr[12]) << BigInt(96)) |
    (BigInt(arr[13]) << BigInt(104)) |
    (BigInt(arr[14]) << BigInt(112)) |
    (BigInt(arr[15]) << BigInt(120));
  return outValue as bigint;
}

export function convertUint8ArrayTo64BitBigInt(arr: Uint8Array): bigint {
  const outValue: BigInt =
    BigInt(arr[0]) |
    (BigInt(arr[1]) << BigInt(8)) |
    (BigInt(arr[2]) << BigInt(16)) |
    (BigInt(arr[3]) << BigInt(24)) |
    (BigInt(arr[4]) << BigInt(32)) |
    (BigInt(arr[5]) << BigInt(40)) |
    (BigInt(arr[6]) << BigInt(48)) |
    (BigInt(arr[7]) << BigInt(56));
  return outValue as bigint;
}
