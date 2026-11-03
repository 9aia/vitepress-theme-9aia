import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "./style.css";

const theme = {
  extends: DefaultTheme,
} satisfies Theme;

export default theme;
