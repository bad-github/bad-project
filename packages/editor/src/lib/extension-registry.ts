export function dedupeExtensions(extensions: any) {
  const map = new Map()

  for (const ext of extensions) {
    map.set(ext.name, ext)
  }

  return Array.from(map.values())
}