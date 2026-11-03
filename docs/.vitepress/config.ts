import { defineConfig } from "vitepress";

export default defineConfig({
  title: "9aia",
  description: "Rounded, blue VitePress theme.",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Theming", link: "/guide/theming" },
      { text: "Components", link: "/guide/components" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/" },
          { text: "Theming", link: "/guide/theming" },
          { text: "Components", link: "/guide/components" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/9aia/vitepress-theme-9aia" }],
    search: {
      provider: "local",
    },
  },
});
