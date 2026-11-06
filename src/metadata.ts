import Decoder from './decoder';
import utils from './utils';

const METADATA_START_MARKER = Uint8Array.of(
  0xab,
  0xcd,
  0xef,
  0x4d,
  0x61,
  0x78,
  0x4d,
  0x69,
  0x6e,
  0x64,
  0x2e,
  0x63,
  0x6f,
  0x6d
);

export interface Metadata {
  readonly binaryFormatMajorVersion: number;
  readonly binaryFormatMinorVersion: number;
  readonly buildEpoch: Date;
  readonly databaseType: string;
  readonly languages: string[];
  readonly description: string;
  readonly ipVersion: number;
  readonly nodeCount: number;
  readonly recordSize: number;
  readonly nodeByteSize: number;
  readonly searchTreeSize: number;
  readonly treeDepth: number;
}

export const parseMetadata = (db: Uint8Array): Metadata => {
  const offset = findStart(db);
  const decoder = new Decoder(db, offset);
  const metadata = decoder.decode(offset).value;

  if (!metadata) {
    throw new Error(
      isLegacyFormat(db)
        ? utils.legacyErrorMessage
        : 'Cannot parse binary database'
    );
  }

  utils.assert(
    [24, 28, 32].indexOf(metadata.record_size) > -1,
    'Unsupported record size'
  );

  return {
    binaryFormatMajorVersion: metadata.binary_format_major_version,
    binaryFormatMinorVersion: metadata.binary_format_minor_version,
    buildEpoch: new Date(Number(metadata.build_epoch) * 1000),
    databaseType: metadata.database_type,
    description: metadata.description,
    ipVersion: metadata.ip_version,
    languages: metadata.languages,
    nodeByteSize: metadata.record_size / 4,
    nodeCount: metadata.node_count,
    recordSize: metadata.record_size,
    searchTreeSize: (metadata.node_count * metadata.record_size) / 4,
    // Depth depends on the IP version, it's 32 for IPv4 and 128 for IPv6.
    treeDepth: Math.pow(2, metadata.ip_version + 1),
  };
};

const findStart = (db: Uint8Array): number => {
  let found = 0;
  let fsize = db.length - 1;
  const mlen = METADATA_START_MARKER.length - 1;

  while (found <= mlen && fsize-- > 0) {
    found += db[fsize] === METADATA_START_MARKER[mlen - found] ? 1 : -found;
  }
  return fsize + found;
};

export const isLegacyFormat = (db: Uint8Array): boolean => {
  const structureInfoMaxSize = 20;

  for (let i = 0; i < structureInfoMaxSize; i++) {
    // Look for [0xff, 0xff, 0xff] metadata delimiter
    const offset = db.length - 3 - i;
    if (
      db[offset] === 255 &&
      db[offset + 1] === 255 &&
      db[offset + 2] === 255
    ) {
      return true;
    }
  }

  return false;
};
