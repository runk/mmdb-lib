const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const { Reader } = require('../lib');

const databasePath = path.join(
  __dirname,
  '..',
  'test',
  'data',
  'test-data',
  'GeoIP2-City-Test.mmdb'
);

const lookups = [
  '1.1.1.1',
  '175.16.198.255',
  '175.16.199.1',
  '175.16.199.255',
  '::175.16.199.255',
  '175.16.200.1',
  '2a02:cf40:ffff::',
  '2a02:cf47:0000::',
  '2a02:cf48:0000::',
];

const warmupIterations = Number.parseInt(
  process.env.BENCH_WARMUP || '5000',
  10
);
const measuredIterations = Number.parseInt(
  process.env.BENCH_ITERATIONS || '100000',
  10
);
const minimumLookupsPerSecond = Number.parseInt(
  process.env.BENCH_MIN_LOOKUPS_PER_SEC || '0',
  10
);

if (!Number.isFinite(warmupIterations) || warmupIterations <= 0) {
  throw new Error(`Invalid BENCH_WARMUP value: ${process.env.BENCH_WARMUP}`);
}

if (!Number.isFinite(measuredIterations) || measuredIterations <= 0) {
  throw new Error(
    `Invalid BENCH_ITERATIONS value: ${process.env.BENCH_ITERATIONS}`
  );
}

if (!Number.isFinite(minimumLookupsPerSecond) || minimumLookupsPerSecond < 0) {
  throw new Error(
    'Invalid BENCH_MIN_LOOKUPS_PER_SEC value: ' +
      process.env.BENCH_MIN_LOOKUPS_PER_SEC
  );
}

const db = fs.readFileSync(databasePath);
const reader = new Reader(db);

const runLookups = (iterations) => {
  let hits = 0;

  for (let iteration = 0; iteration < iterations; iteration++) {
    const ip = lookups[iteration % lookups.length];
    if (reader.get(ip)) {
      hits++;
    }
  }

  return hits;
};

runLookups(warmupIterations);

const startedAt = performance.now();
const hits = runLookups(measuredIterations);
const durationMs = performance.now() - startedAt;
const lookupsPerSecond = Math.round((measuredIterations / durationMs) * 1000);

console.log(`Database: ${path.relative(process.cwd(), databasePath)}`);
console.log(`Warmup iterations: ${warmupIterations.toLocaleString('en-US')}`);
console.log(
  `Measured iterations: ${measuredIterations.toLocaleString('en-US')}`
);
console.log(`Hits: ${hits.toLocaleString('en-US')}`);
console.log(`Duration: ${durationMs.toFixed(2)} ms`);
console.log(
  `Throughput: ${lookupsPerSecond.toLocaleString('en-US')} lookups/sec`
);
console.log(
  'Minimum throughput requirement: ' +
    minimumLookupsPerSecond.toLocaleString('en-US') +
    ' lookups/sec'
);

if (lookupsPerSecond < minimumLookupsPerSecond) {
  throw new Error(
    'Benchmark throughput check failed: expected at least ' +
      minimumLookupsPerSecond.toLocaleString('en-US') +
      ' lookups/sec, got ' +
      lookupsPerSecond.toLocaleString('en-US')
  );
}
