import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createSupabaseApi} from '../dist/esm/index.mjs';

function realtimeFixture() {
  const channels = [];
  const removals = [];
  const client = {
    auth: {},
    functions: {},
    storage: {
      from() {},
      listBuckets() {},
      getBucket() {},
      createBucket() {},
      updateBucket() {},
      deleteBucket() {},
      emptyBucket() {},
    },
    from() {},
    schema() {},
    rpc() {},
    channel(name, options) {
      assert.equal(this, client);
      const channel = {
        name,
        options,
        listeners: [],
        on(type, filter, callback) {
          this.listeners.push({type, filter, callback});
          return this;
        },
        subscribe(callback) {
          this.status = callback;
          return this;
        },
        presenceState() {
          return {alice: [{presence_ref: 'ref-1'}]};
        },
      };
      channels.push(channel);
      return channel;
    },
    getChannels() {
      return channels;
    },
    removeChannel(channel) {
      removals.push(channel);
      return Promise.resolve('ok');
    },
    removeAllChannels() {
      return Promise.resolve([]);
    },
  };
  return {client, api: createSupabaseApi(client), channels, removals};
}

test('table subscriptions retain filters, deliver payloads and clean up exactly once', async () => {
  const {api, channels, removals} = realtimeFixture();
  const received = [];
  const statuses = [];
  const subscription = api.realtime.subscribeToTable(
    {table: 'profiles', filter: 'id=eq.alice'},
    (payload) => received.push(payload),
    (status) => statuses.push(status)
  );
  const listener = channels[0].listeners[0];
  assert.equal(listener.type, 'postgres_changes');
  assert.deepEqual(listener.filter, {event: '*', schema: 'public', table: 'profiles', filter: 'id=eq.alice'});
  listener.callback({eventType: 'INSERT', new: {id: 'alice'}});
  channels[0].status('SUBSCRIBED');
  assert.equal(received[0].new.id, 'alice');
  assert.deepEqual(statuses, ['SUBSCRIBED']);
  const a = subscription.unsubscribe();
  const b = subscription.unsubscribe();
  assert.equal(a, b);
  await Promise.all([a, b]);
  assert.deepEqual(removals, [subscription.channel]);
});

test('default table channel names remain unique across facades for the same client', () => {
  const {client, api, channels} = realtimeFixture();
  api.realtime.subscribeToTable({table: 'profiles'}, () => {});
  createSupabaseApi(client).realtime.subscribeToTable({table: 'profiles'}, () => {});
  assert.notEqual(channels[0].name, channels[1].name);
  assert.throws(() => api.realtime.subscribeToTable({table: ''}, () => {}), TypeError);
});

test('broadcast subscriptions forward only the message payload', async () => {
  const {api, channels, removals} = realtimeFixture();
  const received = [];
  const subscription = api.realtime.subscribeToBroadcast('room:lobby', 'message', (payload) => received.push(payload));
  channels[0].listeners[0].callback({type: 'broadcast', event: 'message', payload: {text: 'Hello'}});
  assert.deepEqual(received, [{text: 'Hello'}]);
  await subscription.unsubscribe();
  assert.equal(removals.length, 1);
});

test('presence subscriptions read the owning channel snapshot', async () => {
  const {api, channels} = realtimeFixture();
  const received = [];
  const subscription = api.realtime.subscribeToPresence('room:lobby', (state) => received.push(state));
  channels[0].listeners[0].callback();
  assert.deepEqual(received, [{alice: [{presence_ref: 'ref-1'}]}]);
  await subscription.unsubscribe();
});
