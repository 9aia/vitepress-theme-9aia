import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";

const css = (name: string) =>
  readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8");

test("palette is anchored on #00f", () => {
  expect(css("tokens.css")).toContain("--blue: #0000ff");
});

test("style.css aggregates the four layers", () => {
  const main = css("style.css");
  for (const layer of ["tokens", "base", "patterns", "vitepress"]) {
    expect(main).toContain(`./${layer}.css`);
  }
});
