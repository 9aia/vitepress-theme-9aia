import { defineComponent, h, onMounted, onUnmounted, ref } from "vue";
import DefaultTheme from "vitepress/theme";
import { useData, type Theme } from "vitepress";
import { Murmuration, WireLog, Layers, Specimen, SpecRows, Ledger } from "./components/index.ts";
import MetaBlobs from "./components/MetaBlobs.vue";
import { installSectionLinkGuard } from "./section-links.ts";
import "./style.css";

// Mounts the metaball canvas inside `.VPHero` on `layout: home` pages —
// opt-in per page via `hero.blobs: true` in frontmatter (only 9aia.com
// uses it). MetaBlobs moves its own canvas into the hero on mount
// (Teleport proved unreliable here); `.VPHero` is position:relative and
// `.main` keeps z-index:10 so hero text stays above the blobs.
const Layout = defineComponent({
  name: "NineAiaLayout",
  setup() {
    const { frontmatter, site, theme } = useData();
    const mounted = ref(false);
    let uninstall: (() => void) | undefined;
    onMounted(() => {
      mounted.value = true;
      uninstall = installSectionLinkGuard({
        base: () => site.value.base,
        sections: () => (theme.value as { externalSections?: string[] }).externalSections ?? [],
      });
    });
    onUnmounted(() => uninstall?.());
    return () =>
      h(DefaultTheme.Layout, null, {
        "home-hero-before": () =>
          mounted.value &&
          frontmatter.value.layout === "home" &&
          (frontmatter.value.hero as { blobs?: boolean } | undefined)?.blobs === true
            ? h(MetaBlobs)
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
  },
} satisfies Theme;

export default theme;
