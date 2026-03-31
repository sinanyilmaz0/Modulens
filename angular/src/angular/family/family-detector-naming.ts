const NAME_SUFFIXES = [
  "list",
  "detail",
  "manage-fragments",
  "content-files",
  "fragment-player",
  "form",
  "view",
  "editor",
  "card",
  "item",
  "header",
  "footer",
  "modal",
  "dialog",
  "picker",
  "selector",
] as const;

const NAME_SUFFIX_REGEX = new RegExp(
  `^(.+)-(${NAME_SUFFIXES.join("|")})$`,
  "i"
);

export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

export function extractFamilySuffix(fileName: string): string | null {
  const baseName = fileName.replace(/\.component\.ts$/i, "");
  const match = baseName.match(NAME_SUFFIX_REGEX);
  return match ? `*-${match[2].toLowerCase()}` : null;
}

export function getBaseNameParts(fileName: string): string[] {
  const baseName = fileName.replace(/\.component\.ts$/i, "").toLowerCase();
  return baseName.split(/-/).filter(Boolean);
}

export function computeNameSimilarityScore(
  fileNames: string[],
  familySuffix: string
): number {
  if (fileNames.length < 2) return 1;
  const partsList = fileNames.map(getBaseNameParts);
  const suffixPart = familySuffix.replace("*-", "");
  let suffixOnlyCount = 0;
  let prefixOverlapCount = 0;
  let highJaccardCount = 0;
  for (let i = 0; i < partsList.length; i++) {
    for (let j = i + 1; j < partsList.length; j++) {
      const a = partsList[i];
      const b = partsList[j];
      const setA = new Set(a);
      const setB = new Set(b);
      const intersection = a.filter((x) => setB.has(x)).length;
      const union = new Set([...a, ...b]).size;
      const jaccard = union === 0 ? 1 : intersection / union;
      const hasSuffixA = a[a.length - 1] === suffixPart;
      const hasSuffixB = b[b.length - 1] === suffixPart;
      const prefixA = a.slice(0, -1);
      const prefixB = b.slice(0, -1);
      const prefixOverlap =
        prefixA.length > 0 &&
        prefixB.length > 0 &&
        prefixA.some((p) => prefixB.includes(p));
      if (hasSuffixA && hasSuffixB) {
        suffixOnlyCount++;
        if (prefixOverlap) prefixOverlapCount++;
      }
      if (jaccard > 0.7) highJaccardCount++;
    }
  }
  const pairs = (fileNames.length * (fileNames.length - 1)) / 2;
  if (pairs === 0) return 0.5;
  if (highJaccardCount / pairs >= 0.5) return 0.8;
  if (prefixOverlapCount > 0 && suffixOnlyCount > 0) return 0.6;
  if (suffixOnlyCount >= pairs * 0.5) return 0.3;
  return 0.2;
}
