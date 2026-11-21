import assert from 'node:assert/strict';
import {test} from 'node:test';
import {tree} from '../src/tree.ts';

test('search supports numeric labels, preserves ancestor paths, skips non-text labels and leaves the input untouched', () => {
  const input = [
    {
      id: 'root',
      label: 'Parent',
      children: [
        {id: 'number', label: 123},
        {id: 'string', label: 'Other'},
        {id: 'object', label: {text: '123'}},
      ],
    },
  ];
  const original = structuredClone(input);
  const result = tree.searchTree(input, '23');
  assert.deepEqual([...result.parentKeys], ['root']);
  assert.deepEqual(
    result.tree[0].children.map((node) => node.id),
    ['number']
  );
  assert.deepEqual(input, original);
  assert.equal(tree.searchTree([{id: 'missing'}], '').tree.length, 0);
});

test('search respects custom fields and matches case-insensitively', () => {
  const result = tree.searchTree([{key: 'a', name: 'API', nodes: [{key: 'b', name: 'React'}]}], 'REACT', {
    uniqueKey: 'key',
    labelKey: 'name',
    childrenKey: 'nodes',
  });
  assert.deepEqual([...result.parentKeys], ['a']);
  assert.equal(result.tree[0].nodes[0].key, 'b');
});

test('nested data uses unique full-path IDs across all branches and records correct ancestor paths', () => {
  const nodes = tree.generateNestedData(() => ({}), {}, 2, 2, 2);
  const ids = [];
  function visit(nodes, ancestors = []) {
    for (const node of nodes) {
      ids.push(node.id);
      assert.deepEqual(node.idPath, [...ancestors, node.id]);
      if (node.children) visit(node.children, node.idPath);
    }
  }
  visit(nodes);
  assert.equal(ids.length, 14);
  assert.equal(new Set(ids).size, 14);
  assert.equal(nodes[0].id, '0-0');
  assert.notEqual(nodes[0].children[0].id, nodes[1].children[0].id);
});

test('nested data preserves item fields and custom key, path and children configuration', () => {
  const nodes = tree.generateNestedData(
    (depth) => ({depth}),
    {uniqueKey: 'key', keyPath: 'ancestors', childrenKey: 'nodes'},
    2,
    1
  );
  assert.equal(nodes[0].depth, 0);
  assert.equal(nodes[0].nodes[0].depth, 1);
  assert.deepEqual(nodes[1].nodes[0].ancestors, [nodes[1].key, nodes[1].nodes[0].key]);
  assert.equal(tree.generateNestedData(() => ({})).length, 0);
});
