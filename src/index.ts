import { defineComponent, h, onMounted, ref } from "vue";
import DefaultTheme from "vitepress/theme";
import { useData, type Theme } from "vitepress";
import {
  Murmuration,
  WireLog,
  Layers,
  Specimen,
  SpecRows,
  Ledger,
  BlobCluster,
} from "./components/index.ts";
import MetaBlobs from "./components/MetaBlobs.vue";
import { installSectionLinkGuard } from "./section-links.ts";
import "./style.css";

// Site data isn't available until setup, but the guard must be
// installed before VitePress's createApp() binds the router's
// capture-phase click listener — so install here at module scope and
// let the Layout publish the current base/sections into these slots.
let siteBase = "/";
let externalSections: string[] = [];
// SSR builds evaluate this module without `window` — the guard is a
// no-op there and installs on the client before createApp().
if (typeof window !== "undefined") {
  installSectionLinkGuard({
    base: () => siteBase,
    sections: () => externalSections,
  });
}

// Mounts the metaball canvas inside `.VPHero` on `layout: home` pages —
// opt-in per page via `hero.blobs: true` in frontmatter (only 9aia.com
// uses it). MetaBlobs moves its own canvas into the hero on mount
// (Teleport proved unreliable here); `.VPHero` is position:relative and
// `.main` keeps z-index:10 so hero text stays above the blobs.
const Layout = defineComponent({
  name: "NineAiaLayout",
  setup() {
    const { frontmatter, site, theme } = useData();
    siteBase = site.value.base;
    externalSections = (theme.value as { externalSections?: string[] }).externalSections ?? [];
    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
    });
    return () =>
      h(DefaultTheme.Layout, null, {
        "home-hero-before": () =>
          mounted.value &&
          frontmatter.value.layout === "home" &&
          (frontmatter.value.hero as { blobs?: boolean } | undefined)?.blobs === true
            ? h(MetaBlobs, { colors: "periwinkle" })
            : null,
      });
  },
});

const theme = {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("Murmuration", Murmuration);
    app.component("WireLog", WireLog);
    app.component("Layers", Layers);
    app.component("Specimen", Specimen);
    app.component("SpecRows", SpecRows);
    app.component("Ledger", Ledger);
    app.component("BlobCluster", BlobCluster);
  },
} satisfies Theme;

export default theme;
