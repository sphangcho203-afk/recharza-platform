export type MerchandisingBadge = {
  label: "Most Bought" | "Hot" | "Best Value";
  tone: "violet" | "rose" | "emerald";
};

export function getMerchandisingBadge(input: {
  name: string;
  featured?: boolean;
}): MerchandisingBadge | null {
  const name = input.name.toLowerCase();
  if (input.featured) return { label: "Most Bought", tone: "violet" };
  if (name.includes("twilight") || name.includes("monthly") || name.includes("weekly")) {
    return { label: "Hot", tone: "rose" };
  }
  if (/\d+\s*\+\s*\d+/.test(name)) return { label: "Best Value", tone: "emerald" };
  return null;
}

export function splitBonusQuantity(name: string): { base: string; bonus: string | null } {
  const match = name.match(/^(.*?\d+)\s*\+\s*(\d+)(\s+.*)?$/);
  if (!match) return { base: name, bonus: null };
  return {
    base: `${match[1].trim()}`,
    bonus: `+ ${match[2]}${match[3] ?? ""}`,
  };
}
