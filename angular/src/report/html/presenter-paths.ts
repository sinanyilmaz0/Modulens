export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

export function getComponentDetailEntry<T>(
  map: Record<string, T>,
  filePath: string
): T | undefined {
  return map[normalizePath(filePath)] ?? map[filePath];
}
