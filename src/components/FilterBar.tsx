import { useMemo } from "react";
import FacetButton from "./FacetButton";
import {
  FORMAT_GROUP_ORDER,
  NO_LABEL_SENTINEL,
  decadeOf,
  isAnyFilterActive,
  type FilterState,
  type Release,
} from "@/lib/nostr";
import {
  GENRE_ELECTRONIC_SUBS,
  GENRE_MAINS,
  genreLabel,
} from "@/lib/genre";

const LABEL_FACET_DEFAULT_TOP_N = 15;

type Props = {
  releases: Release[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  // Optional cluster anchored to the right of the facet row (e.g. result
  // count + view toggle). Aligned to the top so it stays reachable when
  // facets wrap to multiple lines on narrow screens.
  rightSlot?: React.ReactNode;
};

const DECADE_ORDER = [
  "pre-1970s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
];

// Schema enums from ndisc — preserve their semantic order in the popover.
const TYPE_ORDER = [
  "music",
  "sample",
  "stem",
  "field-recording",
  "message",
  "other",
];
const CATEGORY_ORDER = [
  "album",
  "ep",
  "single",
  "compilation",
  "mix",
  "live",
  "soundtrack",
  "bootleg",
  "miscellaneous", // Discogs uses this for digital-only releases
];

// Discogs grading scale, best-to-worst. Anything outside falls to the end
// alphabetically so dirty data is still selectable.
const CONDITION_ORDER = [
  "Mint (M)",
  "Near Mint (NM or M-)",
  "Very Good Plus (VG+)",
  "Very Good (VG)",
  "Good Plus (G+)",
  "Good (G)",
  "Fair (F)",
  "Poor (P)",
];

export default function FilterBar({ releases, value, onChange, rightSlot }: Props) {
  // Derive option lists from the current release set. Mediums are clamped to
  // the canonical two — physical/digital — even if the data is dirty, so the
  // facet stays predictable.
  const options = useMemo(() => {
    const mediumSet = new Set<string>();
    const formatSet = new Set<string>();
    const decadeSet = new Set<string>();
    const genreCounts = new Map<string, number>();
    const typeSet = new Set<string>();
    const categorySet = new Set<string>();
    const conditionSet = new Set<string>();
    const countrySet = new Set<string>();
    const labelCounts = new Map<string, number>();
    let noLabelCount = 0;
    for (const r of releases) {
      if (r.medium) mediumSet.add(r.medium);
      if (r.formatGroup) formatSet.add(r.formatGroup);
      if (r.type) typeSet.add(r.type);
      if (r.category) categorySet.add(r.category);
      if (r.condition) conditionSet.add(r.condition);
      if (r.country) countrySet.add(r.country);
      const d = decadeOf(r.year);
      if (d) decadeSet.add(d);
      // Genre counts are any-slot — a release with ["techno", "dub"] adds 1
      // to both counts, matching how the filter predicate selects (see
      // src/lib/nostr.ts → applyFilters). Lets the dropdown show how many
      // releases each chip would surface.
      for (const g of r.genres) {
        genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
      }
      if (r.label) labelCounts.set(r.label, (labelCounts.get(r.label) ?? 0) + 1);
      else noLabelCount++;
    }
    const genreSet: Set<string> = new Set(genreCounts.keys());
    // Top-N labels by release count, ties broken alphabetically. The "(no
    // label)" sentinel is pinned to the top of the default view when any
    // unlabeled release exists. The full alpha-sorted superset is exposed
    // separately so the popover search can reach the long tail.
    const labelsByCount = Array.from(labelCounts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    const topLabels = labelsByCount
      .slice(0, LABEL_FACET_DEFAULT_TOP_N)
      .map(([name]) => name);
    const allLabelsAlpha = Array.from(labelCounts.keys()).sort((a, b) =>
      a.localeCompare(b),
    );
    const labelDefault = noLabelCount > 0
      ? [NO_LABEL_SENTINEL, ...topLabels]
      : topLabels;
    const labelSearchable = noLabelCount > 0
      ? [NO_LABEL_SENTINEL, ...allLabelsAlpha]
      : allLabelsAlpha;
    return {
      medium: Array.from(mediumSet).sort(),
      // Canonical bucket order; append any unrecognized group so dirty data
      // is still selectable.
      format: [
        ...FORMAT_GROUP_ORDER.filter((v) => formatSet.has(v)),
        ...Array.from(formatSet)
          .filter((v) => !FORMAT_GROUP_ORDER.includes(v))
          .sort(),
      ],
      decade: DECADE_ORDER.filter((d) => decadeSet.has(d)),
      // Schema-defined order: mains first, then electronic subs. Any unknown
      // slug shouldn't reach here (normaliseGenres drops them on parse), but
      // appended alphabetically as a safety net.
      genre: [
        ...GENRE_MAINS.filter((g) => genreSet.has(g)),
        ...GENRE_ELECTRONIC_SUBS.filter((g) => genreSet.has(g)),
        ...Array.from(genreSet)
          .filter(
            (g) =>
              !GENRE_MAINS.includes(g as (typeof GENRE_MAINS)[number]) &&
              !GENRE_ELECTRONIC_SUBS.includes(
                g as (typeof GENRE_ELECTRONIC_SUBS)[number],
              ),
          )
          .sort(),
      ],
      genreCounts,
      // Keep schema-defined order; append any unknown values so dirty data
      // is still selectable.
      type: [
        ...TYPE_ORDER.filter((v) => typeSet.has(v)),
        ...Array.from(typeSet).filter((v) => !TYPE_ORDER.includes(v)).sort(),
      ],
      category: [
        ...CATEGORY_ORDER.filter((v) => categorySet.has(v)),
        ...Array.from(categorySet)
          .filter((v) => !CATEGORY_ORDER.includes(v))
          .sort(),
      ],
      condition: [
        ...CONDITION_ORDER.filter((v) => conditionSet.has(v)),
        ...Array.from(conditionSet)
          .filter((v) => !CONDITION_ORDER.includes(v))
          .sort(),
      ],
      country: Array.from(countrySet).sort(),
      label: labelDefault,
      labelSearchable,
    };
  }, [releases]);

  const set = <K extends keyof FilterState>(key: K, next: FilterState[K]) =>
    onChange({ ...value, [key]: next });

  // Resting-state text colours for the facet trigger row: each visible button
  // gets a colour along a primary→accent gradient that mirrors the hero
  // title. Hover + selected take over from this.
  const visibleFacets = [
    options.type.length > 0 && "type",
    options.category.length > 0 && "category",
    "medium",
    "format",
    "decade",
    options.genre.length > 0 && "genre",
    options.label.length > 0 && "label",
    options.country.length > 0 && "country",
    options.condition.length > 0 && "condition",
  ].filter(Boolean) as string[];
  const facetColor = (key: string): string => {
    const i = visibleFacets.indexOf(key);
    if (i < 0 || visibleFacets.length <= 1) return "hsl(var(--primary))";
    const pct = (i / (visibleFacets.length - 1)) * 100;
    return `color-mix(in oklch, hsl(var(--primary)), hsl(var(--accent)) ${pct}%)`;
  };

  type Facet =
    | "medium"
    | "format"
    | "decade"
    | "genre"
    | "type"
    | "category"
    | "condition"
    | "label"
    | "country";

  const removeChip = (facet: Facet, v: string) => {
    const next = new Set(value[facet]);
    next.delete(v);
    set(facet, next);
  };

  const clearAll = () =>
    onChange({
      search: "",
      medium: new Set(),
      format: new Set(),
      decade: new Set(),
      genre: new Set(),
      type: new Set(),
      category: new Set(),
      condition: new Set(),
      label: new Set(),
      country: new Set(),
    });

  const chips: Array<{ facet: Facet; value: string }> = [
    ...Array.from(value.type).map((v) => ({ facet: "type" as const, value: v })),
    ...Array.from(value.category).map((v) => ({
      facet: "category" as const,
      value: v,
    })),
    ...Array.from(value.medium).map((v) => ({ facet: "medium" as const, value: v })),
    ...Array.from(value.format).map((v) => ({ facet: "format" as const, value: v })),
    ...Array.from(value.decade).map((v) => ({ facet: "decade" as const, value: v })),
    ...Array.from(value.genre).map((v) => ({ facet: "genre" as const, value: v })),
    ...Array.from(value.label).map((v) => ({ facet: "label" as const, value: v })),
    ...Array.from(value.country).map((v) => ({
      facet: "country" as const,
      value: v,
    })),
    ...Array.from(value.condition).map((v) => ({
      facet: "condition" as const,
      value: v,
    })),
  ];

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {options.type.length > 0 && (
          <FacetButton
            label="type"
            options={options.type}
            selected={value.type}
            onChange={(next) => set("type", next)}
            gradientColor={facetColor("type")}
          />
        )}
        {options.category.length > 0 && (
          <FacetButton
            label="category"
            options={options.category}
            selected={value.category}
            onChange={(next) => set("category", next)}
            gradientColor={facetColor("category")}
          />
        )}
        <FacetButton
          label="medium"
          options={options.medium}
          selected={value.medium}
          onChange={(next) => set("medium", next)}
          gradientColor={facetColor("medium")}
        />
        <FacetButton
          label="format"
          options={options.format}
          selected={value.format}
          onChange={(next) => set("format", next)}
          gradientColor={facetColor("format")}
        />
        <FacetButton
          label="decade"
          options={options.decade}
          selected={value.decade}
          onChange={(next) => set("decade", next)}
          gradientColor={facetColor("decade")}
        />
        {options.genre.length > 0 && (
          <FacetButton
            label="genre"
            options={options.genre}
            selected={value.genre}
            onChange={(next) => set("genre", next)}
            labelFn={genreLabel}
            counts={options.genreCounts}
            gradientColor={facetColor("genre")}
          />
        )}
        {options.label.length > 0 && (
          <FacetButton
            label="label"
            options={options.label}
            searchableOptions={options.labelSearchable}
            selected={value.label}
            onChange={(next) => set("label", next)}
            gradientColor={facetColor("label")}
          />
        )}
        {options.country.length > 0 && (
          <FacetButton
            label="country"
            options={options.country}
            selected={value.country}
            onChange={(next) => set("country", next)}
            gradientColor={facetColor("country")}
          />
        )}
        {options.condition.length > 0 && (
          <FacetButton
            label="condition"
            options={options.condition}
            selected={value.condition}
            onChange={(next) => set("condition", next)}
            gradientColor={facetColor("condition")}
          />
        )}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map(({ facet, value: v }) => (
            <button
              key={`${facet}:${v}`}
              type="button"
              onClick={() => removeChip(facet, v)}
              className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
            >
              <span className="opacity-60">{facet}:</span>
              <span>{facet === "genre" ? genreLabel(v) : v}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
          {isAnyFilterActive(value) && (
            <button
              type="button"
              onClick={clearAll}
              className="font-mono text-[10px] text-muted-foreground/60 hover:text-primary transition-colors ml-1"
            >
              clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

