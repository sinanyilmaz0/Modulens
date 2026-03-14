const TOKEN_REGEX = /\{([a-zA-Z0-9_]+)\}/g;

export interface FormatTemplateOptions {
  fallback?: string;
  context?: string;
}

export function formatTemplate(
  template: string | undefined,
  params: Record<string, string | number>,
  options?: FormatTemplateOptions
): string {
  const base = template ?? options?.fallback ?? "";
  if (!template) {
    return base;
  }

  let result = template;
  for (const [key, value] of Object.entries(params)) {
    const re = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(re, String(value));
  }

  const unresolvedTokens: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(result)) !== null) {
    const token = match[1];
    if (!seen.has(token)) {
      seen.add(token);
      unresolvedTokens.push(token);
    }
  }

  if (unresolvedTokens.length > 0) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        `Unresolved translation token(s) in ${options?.context ?? "unknown"}: ${unresolvedTokens.join(
          ", "
        )}`,
        { template, params }
      );
    }
    if (options?.fallback != null) {
      return options.fallback;
    }
    return result.replace(TOKEN_REGEX, "").trim();
  }

  return result;
}

export function ensureNoUnresolvedTokens(
  value: string,
  options: { fallback: string; context: string }
): string {
  return formatTemplate(value, {}, options);
}

