import assert from 'node:assert/strict';
import test from 'node:test';

import { createAuthenticationTestData } from './test-data.mjs';

test('authentication data is unique, bounded, origin-valid, and keeps the PIN in memory', () => {
  let nonce = 0;
  const factory = (id) => createAuthenticationTestData(id, {
    nonceFactory: () => `abcd${++nonce}`,
    pinFactory: () => '4927'
  });
  const first = factory('AUTH-NATIVE-001A');
  const second = factory('AUTH-NATIVE-001A');

  assert.notEqual(first.username, second.username);
  assert.match(first.username, /^[a-z0-9_-]{1,32}$/);
  assert.match(first.actionID, /^[a-z0-9][a-z0-9-]+-a1$/);
  assert.match(first.seedActionID, /^[a-z0-9][a-z0-9-]+-a1$/);
  assert.equal(first.pin, '4927');
  assert.equal(JSON.stringify(first.safe), JSON.stringify({ username: first.username }));
  assert.doesNotMatch(JSON.stringify(first.safe), /4927/);
});

test('authentication data rejects malformed generators', () => {
  assert.throws(
    () => createAuthenticationTestData('AUTH-NATIVE-001A', {
      nonceFactory: () => '../bad', pinFactory: () => '4927'
    }),
    /nonce/
  );
  assert.throws(
    () => createAuthenticationTestData('AUTH-NATIVE-001A', {
      nonceFactory: () => 'abcd1234', pinFactory: () => 'pin!'
    }),
    /PIN/
  );
});
