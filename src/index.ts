import { defineComponent, h, nextTick, onMounted, ref, watch } from "vue";
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

// VitePress's default `.vp-doc table` is `display:block` +
// `overflow-x:auto` — a scroll wrapper that shrink-wraps the anonymous
// inner table, so narrow tables never fill the container. base.css
// restores `display:table` for full width; this re-creates the scroll
// behavior with a real wrapper div around each doc table.
const wrapTables = () => {
  document
    .querySelectorAll<HTMLElement>(".vp-doc table:not([data-vp-wrapped])")
    .forEach((table) => {
      const scroller = document.createElement("div");
      scroller.className = "vp-table-scroll";
      table.before(scroller);
      scroller.appendChild(table);
      table.dataset.vpWrapped = "";
    });
};

// Mounts the metaball canvas inside `.VPHero` on `layout: home` pages —
// opt-in per page via `hero.blobs: true` in frontmatter (only 9aia.com
// uses it). MetaBlobs moves its own canvas into the hero on mount
// (Teleport proved unreliable here); `.VPHero` is position:relative and
// `.main` keeps z-index:10 so hero text stays above the blobs.
const Layout = defineComponent({
  name: "NineAiaLayout",
  setup() {
    const { frontmatter, site, theme, page } = useData();
    siteBase = site.value.base;
    externalSections = (theme.value as { externalSections?: string[] }).externalSections ?? [];
    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
      wrapTables();
    });
    watch(
      () => page.value.relativePath,
      () => nextTick(wrapTables),
    );
    return () =>
      h(DefaultTheme.Layout, null, {
        "home-hero-before": () =>
          mounted.value &&
          frontmatter.value.layout === "home" &&
          (frontmatter.value.hero as { blobs?: boolean } | undefined)?.blobs === true
            ? h(MetaBlobs, {
                colors: ["periwinkle", "lavender", "powder", "cyan", "mint", "blush", "indigo"],
              })
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
