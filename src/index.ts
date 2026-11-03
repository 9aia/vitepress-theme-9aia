import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { Murmuration, WireLog, Layers, Specimen, SpecRows, Ledger } from "./components/index.ts";
import "./style.css";

const theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Murmuration", Murmuration);
    app.component("WireLog", WireLog);
    app.component("Layers", Layers);
    app.component("Specimen", Specimen);
    app.component("SpecRows", SpecRows);
    app.component("Ledger", Ledger);
  },
} satisfies Theme;

export default theme;
