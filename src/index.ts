import { defineComponent, h, onMounted, ref } from "vue";
import DefaultTheme from "vitepress/theme";
import { useData, type Theme } from "vitepress";
import { Murmuration, WireLog, Layers, Specimen, SpecRows, Ledger } from "./components/index.ts";
import MetaBlobs from "./components/MetaBlobs.vue";
import "./style.css";

// Mounts the metaball canvas inside `.VPHero` on `layout: home` pages.
// MetaBlobs moves its own canvas into the hero on mount (Teleport proved
// unreliable here); `.VPHero` is position:relative and `.main` keeps
// z-index:10 so hero text stays above the blobs.
const Layout = defineComponent({
  name: "NineAiaLayout",
  setup() {
    const { frontmatter } = useData();
    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
    });
    return () =>
      h(DefaultTheme.Layout, null, {
        "home-hero-before": () =>
          mounted.value && frontmatter.value.layout === "home" && frontmatter.value.hero
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
