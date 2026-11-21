export function findNodesByIds<T extends {id: string; children?: T[]}>(tree: T[], ids: string[]): T[] {
  const result: T[] = [];
  function traverse(nodes: T[]) {
    for (const node of nodes) {
      if (ids.includes(node.id)) result.push(node);
      if (node.children) traverse(node.children);
    }
  }
  traverse(tree);
  return result;
}
