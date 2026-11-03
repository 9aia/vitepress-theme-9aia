import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";

test("palette is anchored on #00f", () => {
  const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");
  expect(css).toContain("--primary: #0000ff");
});
