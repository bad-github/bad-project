import {time} from '../src/time.ts';
import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';

const originalTimezone = process.env.TZ;
before(() => {
  process.env.TZ = 'UTC';
});
after(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

test('relative dates preserve past units and use absolute dates for the future instead of negative minutes', () => {
  const now = Date.now();
  assert.deepEqual(time.formatRelativeDate(now - 91_000), {unit: 'minutes', value: 1});
  assert.deepEqual(time.formatRelativeDate(now - 7_201_000), {unit: 'hours', value: 2});
  assert.deepEqual(time.formatRelativeDate(now - 259_201_000), {unit: 'days', value: 3});
  const future = new Date(now + 86400000);
  assert.deepEqual(time.formatRelativeDate(future), {unit: 'date', value: future});
  assert.equal(time.formatRelativeDate(now - 7 * 86400000).unit, 'date');
  assert.deepEqual(time.formatRelativeDate('invalid'), {unit: 'invalid', value: ''});
});

test('duration and Unix second formatting preserve all nine digits of large nanosecond values', () => {
  for (const format of [time.formatNsFromDuration, time.formatNsFromTimestamp]) {
    assert.equal(format('1769479005092417663', {unit: 's'}), '1769479005.092417663');
    assert.equal(format(-1500000000n, {unit: 's'}), '-1.500000000');
    assert.equal(format(1n, {unit: 's', fractionDigits: 12}), '0.000000001000');
  }
});

test('duration rounding carries across minutes, hours and days, including negative durations', () => {
  assert.equal(time.formatNsFromDuration(119999999999n, {fractionDigits: 3}), '2:00.000');
  assert.equal(time.formatNsFromDuration(3599999999999n, {fractionDigits: 3}), '1:00:00.000');
  assert.equal(time.formatNsFromDuration(86399999999999n, {fractionDigits: 3, unit: 'd'}), '1d 00:00:00.000');
  assert.equal(time.formatNsFromDuration(-119999999999n, {fractionDigits: 3}), '-2:00.000');
  assert.equal(time.formatNsFromDuration(3661000000001n, {unit: 'min'}), '61:01.000000001');
  assert.equal(time.formatNsFromDuration(500000000n, {unit: 's', fractionDigits: 0}), '1');
});

test('timestamps round before calendar formatting, preserve pre-epoch fractions and implement minute format', () => {
  const midnight = BigInt(Date.parse('2026-01-01T23:59:59Z')) * 1000000n + 999999999n;
  assert.equal(time.formatNsFromTimestamp(midnight, {unit: 'd', fractionDigits: 3}), '2026-01-02 00:00:00.000');
  assert.equal(time.formatNsFromTimestamp(-1n, {unit: 'd'}), '1969-12-31 23:59:59.999999999');
  assert.equal(time.formatNsFromTimestamp(61000000001n, {unit: 'min'}), '01:01.000000001');
});

test('calendar formatting respects local offsets and daylight-saving transitions after rounding', () => {
  try {
    process.env.TZ = 'Asia/Kathmandu';
    const start = BigInt(Date.parse('2026-01-01T00:00:00Z')) * 1000000n;
    assert.equal(time.formatNsFromTimestamp(start, {fractionDigits: 0}), '05:45:00');
    process.env.TZ = 'America/New_York';
    const transition = BigInt(Date.parse('2024-03-10T06:59:59Z')) * 1000000n + 999999999n;
    assert.equal(time.formatNsFromTimestamp(transition, {unit: 'd', fractionDigits: 0}), '2024-03-10 03:00:00');
  } finally {
    process.env.TZ = 'UTC';
  }
});

test('invalid precision and unsafe numeric nanoseconds fail explicitly; string/bigint remain supported', () => {
  for (const format of [time.formatNsFromDuration, time.formatNsFromTimestamp]) {
    for (const fractionDigits of [-1, 1.5, NaN, 101]) assert.throws(() => format(1n, {fractionDigits}), RangeError);
    for (const ns of [Number.MAX_SAFE_INTEGER + 1, Infinity, NaN, 1.5]) assert.throws(() => format(ns), RangeError);
  }
  assert.throws(() => time.formatNsFromTimestamp(10n ** 40n), RangeError);
});

test('time.sleep preserves the delay, success probability and original success/failure data', async (t) => {
  const delays = [];
  t.mock.method(globalThis, 'setTimeout', (callback, ms) => {
    delays.push(ms);
    callback();
    return 0;
  });
  const random = t.mock.method(Math, 'random', () => 0.25);
  const payload = {id: 1};
  assert.equal(await time.sleep(payload, 2000, 0.5), payload);
  random.mock.mockImplementation(() => 0.75);
  await assert.rejects(time.sleep(payload, 800, 0.5), (reason) => reason === payload);
  assert.deepEqual(delays, [2000, 800]);
});

test('time.sleep keeps its original default delay and rate, including explicit always-success and always-failure modes', async (t) => {
  const delays = [];
  t.mock.method(globalThis, 'setTimeout', (callback, ms) => {
    delays.push(ms);
    callback();
    return 0;
  });
  t.mock.method(Math, 'random', () => 0.995);
  await assert.rejects(time.sleep('original rejection'), (reason) => reason === 'original rejection');
  assert.equal(await time.sleep(undefined, 2000, 1), undefined);
  await assert.rejects(time.sleep(null, 0, 0), (reason) => reason === null);
  assert.deepEqual(delays, [1000, 2000, 0]);
});
