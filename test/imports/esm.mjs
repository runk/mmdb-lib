import fs from 'fs';
import assert from 'assert';
import * as mmdb from '../../lib/index.js';
const db = fs.readFileSync('test/data/test-data/GeoIP2-City-Test.mmdb')

const reader = new mmdb.Reader(db)
const res = reader.get('175.16.199.255');
assert.strictEqual(res.city.geoname_id, 2038180);
console.log('esm: OK');
