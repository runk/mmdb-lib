type NodeReader = (offset: number) => number;

export interface Walker {
  left: NodeReader;
  right: NodeReader;
}

const readNodeRight24 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    db[offset + 3] * 0x10000 + db[offset + 4] * 0x100 + db[offset + 5];

const readNodeLeft24 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    db[offset] * 0x10000 + db[offset + 1] * 0x100 + db[offset + 2];

const readNodeLeft28 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    ((db[offset + 3] & 0xf0) << 20) |
    (db[offset] * 0x10000 + db[offset + 1] * 0x100 + db[offset + 2]);

const readNodeRight28 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    ((db[offset + 3] & 0x0f) << 24) |
    (db[offset + 4] * 0x10000 + db[offset + 5] * 0x100 + db[offset + 6]);

const readNodeLeft32 =
  (view: DataView): NodeReader =>
  (offset: number): number =>
    view.getUint32(offset, false);

const readNodeRight32 =
  (view: DataView): NodeReader =>
  (offset: number): number =>
    view.getUint32(offset + 4, false);

export default (db: Uint8Array, recordSize: number): Walker => {
  const view = new DataView(db.buffer, db.byteOffset, db.byteLength);

  switch (recordSize) {
    case 24:
      return { left: readNodeLeft24(db), right: readNodeRight24(db) };
    case 28:
      return { left: readNodeLeft28(db), right: readNodeRight28(db) };
    case 32:
      return { left: readNodeLeft32(view), right: readNodeRight32(view) };
  }
  throw new Error('Unsupported record size');
};
