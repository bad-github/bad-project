import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {dirname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const root = fileURLToPath(new URL('../src', import.meta.url));
const allowed = {
  modules: ['modules', 'common'],
  common: ['common'],
  faker: ['faker', 'common'],
};

// 公共工具不依赖业务；模块使用函数组合，依赖不形成环。
test('source imports respect layer boundaries and contain no circular dependencies', () => {
  const graph = new Map();
  for (const file of readdirSync(root, {recursive: true}).filter((file) => file.endsWith('.ts'))) {
    const source = resolve(root, file);
    const layer = file.split(sep)[0];
    const dependencies = [];
    const code = readFileSync(source, 'utf8');
    assert.doesNotMatch(code, /\bclass\s+\w*(?:Controller|Service|Module)\b/, `${file} must use function composition`);
    for (const [, path] of code.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      if (!path.startsWith('.')) continue;
      const dependency = resolve(dirname(source), `${path}.ts`);
      const targetLayer = relative(root, dependency).split(sep)[0];
      if (allowed[layer]) {
        assert.ok(allowed[layer].includes(targetLayer), `${file} cannot import ${path}`);
      }
      dependencies.push(dependency);
    }
    graph.set(source, dependencies);
  }
  const visited = new Set();
  const active = new Set();
  const visit = (source) => {
    assert.ok(!active.has(source), `Circular dependency: ${relative(root, source)}`);
    if (visited.has(source)) return;
    active.add(source);
    for (const dependency of graph.get(source) ?? []) visit(dependency);
    active.delete(source);
    visited.add(source);
  };
  for (const source of graph.keys()) visit(source);
});
