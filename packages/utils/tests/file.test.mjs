import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {setTimeout as delay} from 'node:timers/promises';
import {file} from '../src/file.ts';

// Node 没有浏览器的 ProgressEvent 时，仅补充事件载体；计时、AbortSignal 均使用原生实现。
const originalProgressEvent = Object.getOwnPropertyDescriptor(globalThis, 'ProgressEvent');
before(() => {
  if (typeof globalThis.ProgressEvent === 'function') return;
  class TestProgressEvent extends Event {
    constructor(type, {lengthComputable, loaded, total}) {
      super(type);
      Object.assign(this, {lengthComputable, loaded, total});
    }
  }
  Object.defineProperty(globalThis, 'ProgressEvent', {configurable: true, value: TestProgressEvent});
});
after(() => {
  if (originalProgressEvent) Object.defineProperty(globalThis, 'ProgressEvent', originalProgressEvent);
  else delete globalThis.ProgressEvent;
});

test('reports initial bytes and monotonic progress, ending at the exact total and removing the abort listener', async (t) => {
  const controller = new AbortController();
  const removed = t.mock.method(controller.signal, 'removeEventListener');
  const events = [];
  await file.uploadProgress({
    total: 10_000_000,
    initialLoaded: 2_000_000,
    duration: 30,
    interval: 5,
    signal: controller.signal,
    onProgress: (event) => events.push(event),
  });

  assert.ok(events.length >= 2);
  assert.equal(events[0].loaded, 2_000_000);
  assert.equal(events.at(-1).loaded, 10_000_000);
  events.forEach((event, index) => {
    assert.ok(event instanceof ProgressEvent);
    assert.equal(event.type, 'progress');
    assert.equal(event.total, 10_000_000);
    assert.equal(event.lengthComputable, true);
    assert.ok(event.loaded >= (events[index - 1]?.loaded ?? 0));
    assert.ok(event.loaded <= event.total);
  });
  assert.equal(removed.mock.callCount(), 1);
  const count = events.length;
  await delay(15);
  assert.equal(events.length, count);
});

test('aborting an active upload rejects with AbortError and stops further progress', async () => {
  const controller = new AbortController();
  let count = 0;
  const upload = file.uploadProgress({
    total: 1000,
    duration: 100,
    interval: 5,
    signal: controller.signal,
    onProgress: () => {
      count++;
      if (count === 2) controller.abort();
    },
  });
  await assert.rejects(upload, (error) => error instanceof DOMException && error.name === 'AbortError');
  await delay(20);
  assert.equal(count, 2);
});

test('an already aborted signal never reports progress; aborting inside the first callback schedules no more progress', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    file.uploadProgress({
      total: 100,
      signal: controller.signal,
      onProgress: () => assert.fail('Unexpected progress'),
    }),
    {name: 'AbortError'}
  );

  const active = new AbortController();
  let count = 0;
  await assert.rejects(
    file.uploadProgress({
      total: 100,
      signal: active.signal,
      onProgress: () => {
        count++;
        active.abort();
      },
    }),
    {name: 'AbortError'}
  );
  await delay(15);
  assert.equal(count, 1);
});

test('zero duration, zero bytes and an already complete upload each emit just the final progress', async () => {
  for (const options of [{total: 100, duration: 0}, {total: 0}, {total: 100, initialLoaded: 100}]) {
    const events = [];
    await file.uploadProgress({...options, onProgress: (event) => events.push(event)});
    assert.equal(events.length, 1);
    assert.equal(events[0].loaded, options.total);
  }
  await file.uploadProgress({total: 100, duration: 0});
});

test('callback errors reject the promise and clean up listeners and subsequent progress', async (t) => {
  const controller = new AbortController();
  const removed = t.mock.method(controller.signal, 'removeEventListener');
  const expected = new Error('Progress callback failed');
  let count = 0;
  await assert.rejects(
    file.uploadProgress({
      total: 100,
      signal: controller.signal,
      onProgress: () => {
        count++;
        throw expected;
      },
    }),
    (error) => error === expected
  );
  await delay(15);
  assert.equal(count, 1);
  assert.equal(removed.mock.callCount(), 1);
});

test('invalid sizes and timings reject instead of starting an endless or invalid simulation', async () => {
  for (const options of [
    {total: -1},
    {total: NaN},
    {total: Infinity},
    {total: 1.5},
    {total: 10, initialLoaded: -1},
    {total: 10, initialLoaded: 11},
    {total: 10, duration: -1},
    {total: 10, duration: Infinity},
    {total: 10, interval: 0},
    {total: 10, interval: NaN},
  ]) {
    await assert.rejects(file.uploadProgress(options), RangeError);
  }
});

test('file size checks include both boundaries and reject non-finite or inconsistent ranges', () => {
  assert.equal(file.isFileSizeInRange(0, 100), true);
  assert.equal(file.isFileSizeInRange(100, 100), true);
  assert.equal(file.isFileSizeInRange(50, 100, 50), true);
  assert.equal(file.isFileSizeInRange(49, 100, 50), false);
  for (const args of [
    [NaN, 100],
    [Infinity, 100],
    [-1, 100],
    [1, NaN],
    [1, Infinity],
    [1, -1],
    [1, 100, NaN],
    [1, 100, -1],
    [1, 100, 101],
  ]) {
    assert.equal(file.isFileSizeInRange(...args), false);
  }
});
