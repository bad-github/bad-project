import assert from 'node:assert/strict';
import {test} from 'node:test';
import {regex} from '../src/regex.ts';

test('subnet masks accept all 33 valid prefixes and reject invalid octets, discontinuous bits and extra text', () => {
  for (let prefix = 0; prefix <= 32; prefix++) {
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const text = [24, 16, 8, 0].map((shift) => (mask >>> shift) & 255).join('.');
    assert.equal(regex.SubnetMask.test(text), true, text);
  }
  for (const mask of ['255.255.0.0garbage', 'garbage255.255.255.0', '255.0.255.0', '255.255.255.1', '256.0.0.0']) {
    assert.equal(regex.SubnetMask.test(mask), false, mask);
  }
});

test('MAC addresses support either separator while rejecting mixed separators and incomplete input', () => {
  for (const value of ['AA:BB:CC:DD:EE:FF', 'aa-bb-cc-dd-ee-ff']) assert.equal(regex.MACAddress.test(value), true);
  for (const value of ['AA:BB-CC:DD-EE:FF', 'AA:BB:CC:DD:EE', 'AA:BB:CC:DD:EE:GG'])
    assert.equal(regex.MACAddress.test(value), false);
});

test('generic regex validation is repeatable for global/sticky patterns and preserves their cursor', () => {
  for (const pattern of [/abc/g, /abc/y]) {
    pattern.lastIndex = 2;
    assert.equal(regex.test(pattern, 'abc'), true);
    assert.equal(regex.test(pattern, 'abc'), true);
    assert.equal(regex.test(pattern, 'other'), false);
    assert.equal(pattern.lastIndex, 2);
  }
});
