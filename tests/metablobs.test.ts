import { expect, test } from "vite-plus/test";
import { METABLOB_PRESETS, resolveMetablobColors } from "../src/components/useMetablobs.ts";

test("default palette is the original six-hue mix", () => {
  const colors = resolveMetablobColors();
  expect(colors).toHaveLength(6);
  expect(colors[0]).toEqual([...METABLOB_PRESETS.periwinkle]);
});

test("a preset name resolves to a single-hue palette", () => {
  expect(resolveMetablobColors("mint")).toEqual([[0.68, 0.88, 0.82]]);
});

test("an rgb triple resolves to a single color", () => {
  expect(resolveMetablobColors([0.5, 0.8, 0.9])).toEqual([[0.5, 0.8, 0.9]]);
});

test("a mixed list resolves each entry", () => {
  const colors = resolveMetablobColors(["mint", [0.1, 0.2, 0.3]]);
  expect(colors).toEqual([[...METABLOB_PRESETS.mint], [0.1, 0.2, 0.3]]);
});

test("unknown preset falls back to periwinkle", () => {
  expect(resolveMetablobColors("nope" as never)).toEqual([[...METABLOB_PRESETS.periwinkle]]);
});
