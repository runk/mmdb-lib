const fs = require('fs');
const assert = require('assert');

const mmdb = require('../../lib/index.js');
const db = fs.readFileSync('test/data/test-data/GeoIP2-City-Test.mmdb')

const reader = new mmdb.Reader(db)
const res = reader.get('175.16.199.255');
assert.strictEqual(res.city.geoname_id, 2038180);
console.log('commonjs: OK');
