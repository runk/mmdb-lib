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

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    warmup: 5000,
    iterations: 100000,
    minThroughput: 0,
  };
  const requireValue = (flagName, candidate) => {
    if (candidate === undefined || candidate.startsWith('--')) {
      throw new Error(`Missing value for benchmark argument: ${flagName}`);
    }

    return candidate;
  };
  const parseIntegerArg = (flagName, value) => {
    if (!/^-?\d+$/.test(value)) {
      throw new Error(`Invalid ${flagName} value: ${value}`);
    }

    return Number(value);
  };
  const parsePositiveIntegerArg = (flagName, value) => {
    const parsed = parseIntegerArg(flagName, value);

    if (parsed <= 0) {
      throw new Error(`Invalid ${flagName} value: ${value}`);
    }

    return parsed;
  };
  const parseNonNegativeIntegerArg = (flagName, value) => {
    const parsed = parseIntegerArg(flagName, value);

    if (parsed < 0) {
      throw new Error(`Invalid ${flagName} value: ${value}`);
    }

    return parsed;
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const value = args[index + 1];

    if (arg === '--warmup') {
      options.warmup = parsePositiveIntegerArg(arg, requireValue(arg, value));
      index++;
      continue;
    }

    if (arg === '--iterations') {
      options.iterations = parsePositiveIntegerArg(
        arg,
        requireValue(arg, value)
      );
      index++;
      continue;
    }

    if (arg === '--min-throughput') {
      options.minThroughput = parseNonNegativeIntegerArg(
        arg,
        requireValue(arg, value)
      );
      index++;
      continue;
    }

    throw new Error(`Unknown benchmark argument: ${arg}`);
  }

  return options;
};

const args = parseArgs();

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

runLookups(args.warmup);

const startedAt = performance.now();
const hits = runLookups(args.iterations);
const durationMs = performance.now() - startedAt;
const lookupsPerSecond = Math.round((args.iterations / durationMs) * 1000);

console.log(`Database: ${path.relative(process.cwd(), databasePath)}`);
console.log(`Warmup iterations: ${args.warmup.toLocaleString('en-US')}`);
console.log(
  `Measured iterations: ${args.iterations.toLocaleString('en-US')}`
);
console.log(`Hits: ${hits.toLocaleString('en-US')}`);
console.log(`Duration: ${durationMs.toFixed(2)} ms`);
console.log(
  `Throughput: ${lookupsPerSecond.toLocaleString('en-US')} lookups/sec`
);
console.log(
  'Minimum throughput requirement: ' +
    args.minThroughput.toLocaleString('en-US') +
    ' lookups/sec'
);

if (lookupsPerSecond < args.minThroughput) {
  throw new Error(
    'Benchmark throughput check failed: expected at least ' +
      args.minThroughput.toLocaleString('en-US') +
      ' lookups/sec, got ' +
      lookupsPerSecond.toLocaleString('en-US')
  );
}
