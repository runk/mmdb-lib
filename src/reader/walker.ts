import { readUint, readUint32 } from '../bytes';

type NodeReader = (offset: number) => number;

export interface Walker {
  left: NodeReader;
  right: NodeReader;
}

const readNodeRight24 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    readUint(db, offset + 3, 3);

const readNodeLeft24 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    readUint(db, offset, 3);

const readNodeLeft28 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    ((db[offset + 3] & 0xf0) << 20) | readUint(db, offset, 3);

const readNodeRight28 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    ((db[offset + 3] & 0x0f) << 24) | readUint(db, offset + 4, 3);

const readNodeLeft32 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    readUint32(db, offset);

const readNodeRight32 =
  (db: Uint8Array): NodeReader =>
  (offset: number): number =>
    readUint32(db, offset + 4);

export default (db: Uint8Array, recordSize: number): Walker => {
  switch (recordSize) {
    case 24:
      return { left: readNodeLeft24(db), right: readNodeRight24(db) };
    case 28:
      return { left: readNodeLeft28(db), right: readNodeRight28(db) };
    case 32:
      return { left: readNodeLeft32(db), right: readNodeRight32(db) };
  }
  throw new Error('Unsupported record size');
};
