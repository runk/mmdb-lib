import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import Decoder from './decoder';

describe('lib/decoder', () => {
  describe('decodeByType()', () => {
    const decoder: any = new Decoder(Buffer.from([0x00, 0x00]));
    it('should fail for unknown type', () => {
      assert.throws(() => {
        // @ts-ignore
        decoder.decodeByType(20, 0, 1);
      }, /Unknown type/);
    });
  });

  describe('decodeUint()', () => {
    it('should return zero for unsupported int size', () => {
      const decoder: any = new Decoder(
        fs.readFileSync(
          path.join(__dirname, '../test/data/test-data/GeoIP2-City-Test.mmdb')
        ),
        1
      );

      assert.strictEqual(decoder.decodeUint(1, 32), 0);
    });
  });

  describe('decodeInt()', () => {
    const testCases = [
      { expected: 0, input: [0x0, 0x1] },
      { expected: -1, input: [0x4, 0x1, 0xff, 0xff, 0xff, 0xff] },
      { expected: 255, input: [0x1, 0x1, 0xff] },
      { expected: -255, input: [0x4, 0x1, 0xff, 0xff, 0xff, 0x1] },
      { expected: 500, input: [0x2, 0x1, 0x1, 0xf4] },
      { expected: -500, input: [0x4, 0x1, 0xff, 0xff, 0xfe, 0xc] },
      { expected: 65535, input: [0x2, 0x1, 0xff, 0xff] },
      { expected: -65535, input: [0x4, 0x1, 0xff, 0xff, 0x0, 0x1] },
      { expected: 16777215, input: [0x3, 0x1, 0xff, 0xff, 0xff] },
      { expected: -16777215, input: [0x4, 0x1, 0xff, 0x0, 0x0, 0x1] },
      { expected: 2147483647, input: [0x4, 0x1, 0x7f, 0xff, 0xff, 0xff] },
      { expected: -2147483647, input: [0x4, 0x1, 0x80, 0x0, 0x0, 0x1] },
    ];

    for (let tc of testCases) {
      it(`should decode to ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
  });

  describe('decode()', () => {
    it('should throw when extended type has wrong size', () => {
      const test = new Decoder(Buffer.from([0x00, 0x00]));
      assert.throws(() => {
        test.decode(0);
      }, /Invalid Extended Type at offset 1 val 7/);
    });
  });

  describe('sizeFromCtrlByte()', () => {
    const decoder: any = new Decoder(Buffer.from([0x01, 0x02, 0x03, 0x04]));

    it('should return correct value (size <29)', () => {
      assert.deepStrictEqual(decoder.sizeFromCtrlByte(60, 0), {
        value: 28,
        offset: 0,
      });
    });

    it('should return correct value (size = 29)', () => {
      assert.deepStrictEqual(decoder.sizeFromCtrlByte(61, 0), {
        value: 30,
        offset: 1,
      });
    });

    it('should return correct value (size = 30)', () => {
      assert.deepStrictEqual(decoder.sizeFromCtrlByte(62, 0), {
        value: 543,
        offset: 2,
      });
    });

    it('should return correct value (size = 31)', () => {
      assert.deepStrictEqual(decoder.sizeFromCtrlByte(63, 0), {
        value: 131872,
        offset: 3,
      });
    });
  });

  describe('decodePointer()', () => {
    const decoder: any = new Decoder(Buffer.from([0x01, 0x02, 0x03, 0x04]));

    it('should return correct value (pointer size = 0)', () => {
      assert.deepStrictEqual(decoder.decodePointer(39, 0), {
        value: 1793,
        offset: 1,
      });
    });

    it('should return correct value (pointer size = 1)', () => {
      assert.deepStrictEqual(decoder.decodePointer(45, 0), {
        value: 329986,
        offset: 2,
      });
    });

    it('should return correct value (pointer size = 2)', () => {
      assert.deepStrictEqual(decoder.decodePointer(48, 0), {
        value: 592387,
        offset: 3,
      });
    });

    it('should return correct value (pointer size = 3)', () => {
      assert.deepStrictEqual(decoder.decodePointer(56, 0), {
        value: 16909060,
        offset: 4,
      });
    });
  });
});
