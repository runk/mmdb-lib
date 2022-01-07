# mmdb-lib

Javascript library for working with Maxmind binary databases (aka mmdb or geoip2).

Library is designed to be agnostic to environment and works equally well in node.js and browser. Module is fully compatible with IPv6. There are no differences in API between IPv4 and IPv6.

## Installation

```shell
npm i mmdb-lib
```

## Usage

```typescript
import fs from 'fs';
import * as mmdb from 'mmdb-lib';

// Get a buffer with mmdb database, from file system or whereever.
const db = fs.readFileSync('/path/to/GeoLite2-City.mmdb');

const reader = new mmdb.Reader<CityResponse>(db);
console.log(reader.get('66.6.44.4')); // inferred type `CityResponse`
console.log(reader.getWithPrefixLength('66.6.44.4')); // tuple with inferred type `[CityResponse|null, number]`
```

Supported response types:

```
- CountryResponse
- CityResponse
- AnonymousIPResponse
- AsnResponse
- ConnectionTypeResponse
- DomainResponse
- IspResponse
```

## Usage in browser-like environments

Library expects to receive an instance of `Buffer` during instantiation of `Reader`. Since there is no direct alternative of node's `Buffer` in browser, you can use https://github.com/feross/buffer that mimics native `Buffer` interface. Neither `ArrayBuffer` nor `Uint8Array` is supported right now. Another requirement is [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) object available.

## Options

_Reader(db:Buffer, [options])_

- `options`: `<Object>`
  - `cache`: `<Object>` Cache helper. [tiny-lru](https://github.com/avoidwork/tiny-lru) is great basic option. Only two methods expected: `get(key: string | number): any` and `set(key: string | number, val: any): void`.

## References

- Loosely based on https://github.com/PaddeK/node-maxmind-db
- MaxMind DB file format specification http://maxmind.github.io/MaxMind-DB/
- MaxMind test/sample DB files https://github.com/maxmind/MaxMind-DB
- GeoLite2 Free Downloadable Databases http://dev.maxmind.com/geoip/geoip2/geolite2/
- Great talk about V8 performance https://www.youtube.com/watch?v=UJPdhx5zTaw
- V8 Optimization killers https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
- More V8 performance tips http://www.html5rocks.com/en/tutorials/speed/v8/

## License

MIT

## Contributing

add a link
