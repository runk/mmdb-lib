import { strict as assert } from 'assert';
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

  describe('decodeArray()', () => {
    const testCases = [
      {
        expected: [],
        input: [0x0, 0x4],
        name: 'empty array',
      },
      {
        expected: ['Foo'],
        input: [
          0x1, 0x4,
          // Foo
          0x43, 0x46, 0x6f, 0x6f,
        ],
        name: 'one element array',
      },
      {
        expected: ['Foo', '人'],
        input: [
          0x2, 0x4,
          // Foo
          0x43, 0x46, 0x6f, 0x6f,
          // 人
          0x43, 0xe4, 0xba, 0xba,
        ],
        name: 'two element array',
      },
    ];

    for (const tc of testCases) {
      it(`should decode ${tc.name} correctly`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
  });

  describe('decodeBoolean()', () => {
    const testCases = [
      { expected: false, input: [0x0, 0x7] },
      { expected: true, input: [0x1, 0x7] },
    ];

    for (const tc of testCases) {
      it(`should decode ${JSON.stringify(tc.input)} to ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
  });

  function formatInput(v: number[]): string {
    return v.length > 20
      ? `[${v.slice(0, 10).join(',')},...] (${v.length} bytes)`
      : JSON.stringify(v);
  }

  describe('decodeBytes()', () => {
    const testCases = [
      { expected: Buffer.from(''), input: [0x90] },
      { expected: Buffer.from('1'), input: [0x91, 0x31] },
      { expected: Buffer.from('人'), input: [0x93, 0xe4, 0xba, 0xba] },
      { expected: Buffer.from('123'), input: [0x93, 0x31, 0x32, 0x33] },
      {
        expected: Buffer.from('123456789012345678901234567'),
        input: [
          0x9b, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
          0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31,
          0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
        ],
      },
      {
        expected: Buffer.from('x'.repeat(500)),
        input: [0x9e, 0x01, 0xc1, ...Array(500).fill(0x78)],
      },
      {
        expected: Buffer.from('x'.repeat(2000)),
        input: [0x9e, 0x06, 0xb4, ...Array(2000).fill(0x78)],
      },
      {
        expected: Buffer.from('x'.repeat(70000)),
        input: [0x9f, 0x01, 0x10, 0x30, ...Array(70000).fill(0x78)],
      },
    ];

    for (const tc of testCases) {
      const inputStr = formatInput(tc.input);
      const expectedStr =
        tc.expected.length > 50
          ? `<Buffer ${tc.expected.toString('hex', 0, 20)}... (${tc.expected.length} bytes)>`
          : `<Buffer ${tc.expected.toString('hex')}>`;

      it(`should decode ${inputStr} to ${expectedStr}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        const result = decoder.decode(0).value;
        assert.deepStrictEqual(result, tc.expected);
      });
    }
  });

  describe('decodeDouble()', () => {
    const testCases = [
      { expected: 0.0, input: [0x68, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0] },
      {
        expected: 0.5,
        input: [0x68, 0x3f, 0xe0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0],
      },
      {
        expected: 3.14159265359,
        input: [0x68, 0x40, 0x9, 0x21, 0xfb, 0x54, 0x44, 0x2e, 0xea],
      },
      {
        expected: 123.0,
        input: [0x68, 0x40, 0x5e, 0xc0, 0x0, 0x0, 0x0, 0x0, 0x0],
      },
      {
        expected: 1073741824.12457,
        input: [0x68, 0x41, 0xd0, 0x0, 0x0, 0x0, 0x7, 0xf8, 0xf4],
      },
      {
        expected: -0.5,
        input: [0x68, 0xbf, 0xe0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0],
      },
      {
        expected: -3.14159265359,
        input: [0x68, 0xc0, 0x9, 0x21, 0xfb, 0x54, 0x44, 0x2e, 0xea],
      },
      {
        expected: -1073741824.12457,
        input: [0x68, 0xc1, 0xd0, 0x0, 0x0, 0x0, 0x7, 0xf8, 0xf4],
      },
    ];

    for (const tc of testCases) {
      it(`should decode ${JSON.stringify(tc.input.slice(1))} to ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
  });

  describe('decodeFloat()', () => {
    const testCases = [
      { expected: 0.0, input: [0x04, 0x08, 0x00, 0x00, 0x00, 0x00] },
      { expected: 1.0, input: [0x04, 0x08, 0x3f, 0x80, 0x00, 0x00] },
      {
        expected: 1.100000023841858,
        input: [0x04, 0x08, 0x3f, 0x8c, 0xcc, 0xcd],
      },
      {
        expected: 3.140000104904175,
        input: [0x04, 0x08, 0x40, 0x48, 0xf5, 0xc3],
      },
      { expected: 9999.990234375, input: [0x04, 0x08, 0x46, 0x1c, 0x3f, 0xf6] },
      { expected: -1.0, input: [0x04, 0x08, 0xbf, 0x80, 0x00, 0x00] },
      {
        expected: -1.100000023841858,
        input: [0x04, 0x08, 0xbf, 0x8c, 0xcc, 0xcd],
      },
      {
        expected: -3.140000104904175,
        input: [0x04, 0x08, 0xc0, 0x48, 0xf5, 0xc3],
      },
      {
        expected: -9999.990234375,
        input: [0x04, 0x08, 0xc6, 0x1c, 0x3f, 0xf6],
      },
    ];

    for (const tc of testCases) {
      it(`should decode ${JSON.stringify(tc.input.slice(2))} to approx ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
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
      it(`should decode ${JSON.stringify(tc.input)} to ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
  });

  describe('decodeMap()', () => {
    const testCases = [
      {
        expected: {},
        input: [0xe0],
        name: 'empty map',
      },
      {
        expected: { en: 'Foo' },
        input: [
          0xe1,
          // key "en"
          0x42, 0x65, 0x6e,
          // value "Foo"
          0x43, 0x46, 0x6f, 0x6f,
        ],
        name: 'map with one key',
      },
      {
        expected: { en: 'Foo', zh: '人' },
        input: [
          0xe2,
          // key "en"
          0x42, 0x65, 0x6e,
          // value "Foo"
          0x43, 0x46, 0x6f, 0x6f,
          // key "zh"
          0x42, 0x7a, 0x68,
          // value "人"
          0x43, 0xe4, 0xba, 0xba,
        ],
        name: 'map with two keys',
      },
      {
        expected: { name: { en: 'Foo', zh: '人' } },
        input: [
          0xe1,
          // key: "name"
          0x44, 0x6e, 0x61, 0x6d, 0x65, 0xe2,
          // key: "en"
          0x42, 0x65, 0x6e,
          // value: "Foo"
          0x43, 0x46, 0x6f, 0x6f,
          // key: "zh"
          0x42, 0x7a, 0x68,
          // value: "人"
          0x43, 0xe4, 0xba, 0xba,
        ],
        name: 'nested map',
      },
      {
        expected: { languages: ['en', 'zh'] },
        input: [
          0xe1,
          // key: "languages"
          0x49, 0x6c, 0x61, 0x6e, 0x67, 0x75, 0x61, 0x67, 0x65, 0x73,
          // value: array, size 2
          0x2, 0x4,
          // value: "en"
          0x42, 0x65, 0x6e,
          // value: "zh"
          0x42, 0x7a, 0x68,
        ],
        name: 'map with array value',
      },
    ];

    for (const tc of testCases) {
      it(`should decode ${tc.name} correctly`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
  });

  describe('decodeString()', () => {
    const testCases = [
      { expected: '', input: [0x40] },
      { expected: '1', input: [0x41, 0x31] },
      { expected: '人', input: [0x43, 0xe4, 0xba, 0xba] },
      { expected: '123', input: [0x43, 0x31, 0x32, 0x33] },
      {
        expected: '123456789012345678901234567',
        input: [
          0x5b, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
          0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31,
          0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
        ],
      },
      {
        expected: '1234567890123456789012345678',
        input: [
          0x5c, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
          0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31,
          0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38,
        ],
      },
      {
        expected: '12345678901234567890123456789',
        input: [
          0x5d, 0x00, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
          0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
          0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
        ],
      },
      {
        expected: '123456789012345678901234567890',
        input: [
          0x5d, 0x01, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
          0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
          0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
        ],
      },
      {
        expected: 'x'.repeat(500),
        input: [0x5e, 0x01, 0xc1, ...Array(500).fill(0x78)],
      },
      {
        expected: 'x'.repeat(2000),
        input: [0x5e, 0x06, 0xb4, ...Array(2000).fill(0x78)],
      },
      {
        expected: 'x'.repeat(70000),
        input: [0x5f, 0x01, 0x10, 0x30, ...Array(70000).fill(0x78)],
      },
    ];

    for (const tc of testCases) {
      const inputStr = formatInput(tc.input);
      const expectedStr =
        tc.expected.length > 50
          ? `'${tc.expected.substring(0, 20)}...' (${tc.expected.length} chars)`
          : `'${tc.expected}'`;

      it(`should decode ${inputStr} to ${expectedStr}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }

    const createBufferWithStringAtOffset = (
      offset: number,
      content: string
    ): Buffer => {
      const contentBuf = Buffer.from(content);
      const size = contentBuf.length;
      const padding = Buffer.alloc(offset);

      let header: Buffer;
      if (size <= 0x1f) {
        header = Buffer.from([0x40 | size]);
      } else if (size <= 0xffff) {
        header = Buffer.from([0x40 | 0x1f, (size >> 8) & 0xff, size & 0xff]);
      } else {
        header = Buffer.from([
          0x5f,
          (size >> 24) & 0xff,
          (size >> 16) & 0xff,
          (size >> 8) & 0xff,
          size & 0xff,
        ]);
      }

      return Buffer.concat([padding, header, contentBuf]);
    };

    const MAX_INT_32 = 2147483648;

    it('should handle string just below 2^31 boundary', function () {
      this.timeout(15000);
      const offset = MAX_INT_32 - 16;
      const content = 'boundary test';

      const buffer = createBufferWithStringAtOffset(offset, content);

      const decoder = new Decoder(buffer);

      const result = decoder.decode(offset);
      assert.strictEqual(result.value, content);
      assert(
        result.offset > offset,
        `Offset ${result.offset} should be > ${offset}`
      );
    });

    it('should handle when string at offset >= 2^31', function () {
      this.timeout(15000);
      const offset = MAX_INT_32;
      const content = 'test';

      const buffer = createBufferWithStringAtOffset(offset, content);
      const decoder = new Decoder(buffer);

      const result = decoder.decode(offset);
      assert.strictEqual(result.value, content);
      assert(
        result.offset > offset,
        `Offset ${result.offset} should be > ${offset}`
      );
    });

    it('should handle string that spans the 2^31 boundary', function () {
      this.timeout(15000);
      const content = 'string spans the boundary';
      const offset = MAX_INT_32 - Math.round(content.length / 2);
      const buffer = createBufferWithStringAtOffset(offset, content);

      const decoder = new Decoder(buffer);
      const result = decoder.decode(offset);
      assert.strictEqual(result.value, content);
      assert(
        result.offset > offset,
        `Offset ${result.offset} should be > ${offset}`
      );
    });
  });

  describe('decodeUint() - uint16', () => {
    const testCases = [
      { expected: 0, input: [0xa0] },
      { expected: 255, input: [0xa1, 0xff] },
      { expected: 500, input: [0xa2, 0x01, 0xf4] },
      { expected: 10872, input: [0xa2, 0x2a, 0x78] },
      { expected: 65535, input: [0xa2, 0xff, 0xff] },
    ];

    for (const tc of testCases) {
      it(`should decode ${JSON.stringify(tc.input)} to ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
  });

  describe('decodeUint() - uint32', () => {
    const testCases = [
      { expected: 0, input: [0xc0] },
      { expected: 255, input: [0xc1, 0xff] },
      { expected: 500, input: [0xc2, 0x01, 0xf4] },
      { expected: 10872, input: [0xc2, 0x2a, 0x78] },
      { expected: 65535, input: [0xc2, 0xff, 0xff] },
      { expected: 16777215, input: [0xc3, 0xff, 0xff, 0xff] },
      { expected: 4294967295, input: [0xc4, 0xff, 0xff, 0xff, 0xff] },
    ];

    for (const tc of testCases) {
      it(`should decode ${JSON.stringify(tc.input)} to ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        assert.deepStrictEqual(decoder.decode(0).value, tc.expected);
      });
    }
  });

  function generateLargeUintCases(
    bits: 64 | 128
  ): { expected: bigint; input: number[] }[] {
    const ctrlByte = bits === 64 ? 0x02 : 0x03;
    const cases = [
      { expected: 0n, input: [0x00, ctrlByte] },
      { expected: 500n, input: [0x02, ctrlByte, 0x01, 0xf4] },
      { expected: 10872n, input: [0x02, ctrlByte, 0x2a, 0x78] },
    ];

    const maxBytes = bits / 8;
    for (let byteCount = 1; byteCount <= maxBytes; byteCount++) {
      const expectedValue = (1n << BigInt(8 * byteCount)) - 1n;

      const inputBytes: number[] = Array(byteCount).fill(0xff);
      const input = [byteCount, ctrlByte, ...inputBytes];
      cases.push({ expected: expectedValue, input: input });
    }
    return cases;
  }

  describe('decodeBigUint() - uint64', () => {
    const testCases = generateLargeUintCases(64);

    for (const tc of testCases) {
      it(`should decode ${JSON.stringify(tc.input)} to ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        const result = decoder.decode(0).value;
        assert.deepStrictEqual(result, tc.expected);
      });
    }
  });

  describe('decodeBigUint() - uint128', () => {
    const testCases = generateLargeUintCases(128);

    for (const tc of testCases) {
      const inputStr = formatInput(tc.input);

      it(`should decode ${inputStr} to ${tc.expected}`, () => {
        const decoder = new Decoder(Buffer.from(tc.input));
        const result = decoder.decode(0).value;
        assert.deepStrictEqual(result, tc.expected);
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
