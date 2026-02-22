interface AllergenBadgeProps {
  allergen: string;
  /** Optional slots where this allergen appears */
  slots?: string[];
}

const ALLERGEN_ICONS: Record<string, string> = {
  gluten: "\u{1F33E}",     // sheaf of rice
  dairy: "\u{1F95B}",      // glass of milk
  nuts: "\u{1F330}",       // chestnut
  tree_nuts: "\u{1F330}",
  peanuts: "\u{1F95C}",
  soy: "\u{1FAD8}",        // beans
  eggs: "\u{1F95A}",       // egg
  fish: "\u{1F41F}",       // fish
  shellfish: "\u{1F990}",  // shrimp
  sesame: "\u{1F330}",
};

function formatTag(tag: string): string {
  return tag
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function AllergenBadge({ allergen, slots }: AllergenBadgeProps) {
  const icon = ALLERGEN_ICONS[allergen] ?? "\u{26A0}\u{FE0F}";

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-medium">
      <span className="text-sm leading-none">{icon}</span>
      {formatTag(allergen)}
      {slots && slots.length > 0 && (
        <span className="text-red-400 font-normal">
          ({slots.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")})
        </span>
      )}
    </span>
  );
}
