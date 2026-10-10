import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Local OFL fonts copied from @fontsource packages into public/fonts.
// No network font fetches during render. Every Hindi string uses Noto Sans Devanagari (F.deva).
const faces: [string, string, string, "normal" | "italic"][] = [
  ["Inter", "inter-latin-400-normal.woff2", "400", "normal"],
  ["Inter", "inter-latin-500-normal.woff2", "500", "normal"],
  ["Inter", "inter-latin-600-normal.woff2", "600", "normal"],
  ["Inter", "inter-latin-700-normal.woff2", "700", "normal"],
  ["Source Serif 4", "source-serif-4-latin-400-normal.woff2", "400", "normal"],
  ["Source Serif 4", "source-serif-4-latin-600-normal.woff2", "600", "normal"],
  ["Source Serif 4", "source-serif-4-latin-400-italic.woff2", "400", "italic"],
  ["JetBrains Mono", "jetbrains-mono-latin-400-normal.woff2", "400", "normal"],
  ["JetBrains Mono", "jetbrains-mono-latin-600-normal.woff2", "600", "normal"],
  ["Noto Sans Devanagari", "noto-sans-devanagari-devanagari-400-normal.woff2", "400", "normal"],
  ["Noto Sans Devanagari", "noto-sans-devanagari-devanagari-600-normal.woff2", "600", "normal"],
];

for (const [family, file, weight, style] of faces) {
  loadFont({
    family,
    url: staticFile(`fonts/${file}`),
    weight,
    style,
    display: "block",
  });
}
