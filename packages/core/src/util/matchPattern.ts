/** Matches a path against a pattern that supports `*` as a wildcard. */
export function matchesPattern(path: string, pattern: string): boolean {
  const regexSource = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${regexSource}$`).test(path) || path.includes(pattern.replace(/\*/g, ""));
}
