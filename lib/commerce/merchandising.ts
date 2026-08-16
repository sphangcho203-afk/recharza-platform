export type MerchandisingBadge = {
  label: "Most Bought" | "Hot" | "Best Value";
  tone: "violet" | "rose" | "emerald";
};

export function getMerchandisingBadge(input: {
  name: string;
  featured?: boolean;
}): MerchandisingBadge | null {
  const name = input.name.toLowerCase();
  // Badges are intentionally rare. Ordinary products should remain calm and legible.
  if (input.featured) return { label: "Most Bought", tone: "violet" };
  if (name.includes("hot offer")) return { label: "Hot", tone: "rose" };
  if (name.includes("best value")) return { label: "Best Value", tone: "emerald" };
  return null;
}

export function splitBonusQuantity(name: string): {
  base: string;
  plus: string;
  bonus: string;
} {
  const match = name.match(/^(.*?\d+)\s*(\+\s*)(\d+)(\s+.*)?$/);
  if (!match) return { base: name, plus: "", bonus: "" };
  return {
    base: match[1].trim(),
    plus: "+",
    bonus: `${match[3]}${match[4] ?? ""}`.trim(),
  };
}
