export const readUint = (
  bytes: Uint8Array,
  offset: number,
  length: number
): number => {
  let value = 0;

  for (let i = 0; i < length; i++) {
    value = value * 256 + bytes[offset + i];
  }

  return value;
};

export const readUint16 = (bytes: Uint8Array, offset: number): number =>
  bytes[offset] * 256 + bytes[offset + 1];

export const readUint32 = (bytes: Uint8Array, offset: number): number =>
  readUint(bytes, offset, 4);

export const readInt32 = (bytes: Uint8Array, offset: number): number => {
  const value = readUint32(bytes, offset);
  return value > 2_147_483_647 ? value - 4_294_967_296 : value;
};

export const readFloat32 = (bytes: Uint8Array, offset: number): number =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat32(
    offset,
    false
  );

export const readFloat64 = (bytes: Uint8Array, offset: number): number =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat64(
    offset,
    false
  );
