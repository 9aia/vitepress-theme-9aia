// Same-origin links that point outside this site's section of the domain
// (sibling docs sites like /<repo>/, or the org homepage) must be real
// navigations. VitePress's SPA router intercepts every same-origin <a>
// click and would 404 on them, so we stop the event during the capture
// phase and let the browser perform a server-side navigation instead.
//
// Ordering matters (VitePress ≥1.6): the router binds its click
// interceptor on `window` with `{ capture: true }` inside `createApp()`.
// The theme module evaluates before that, so the guard must be
// installed at module scope — a `setup`/`onMounted` install would run
// after the router listener already exists. And because both listeners
// sit on the same node in the same phase, `stopPropagation()` can't
// preempt it — `stopImmediatePropagation()` is required.
//
// Two ways a link counts as "outside":
//   - the site has a non-root `base` and the path doesn't start with it
//     (every org docs site lives at /<name>/)
//   - the site sits at the domain root (base "/") and the first path
//     segment is listed in `themeConfig.externalSections`

interface GuardOptions {
  base: () => string;
  sections: () => string[];
}

// Mirrors VitePress's treatAsHtml closely enough: page routes are
// extensionless or .html; anything else (assets, downloads) is left to
// the browser anyway, so the guard doesn't need to care.
function isHtmlPath(pathname: string) {
  const last = pathname.slice(pathname.lastIndexOf("/") + 1);
  const dot = last.lastIndexOf(".");
  if (dot === -1) return true;
  const ext = last.slice(dot + 1).toLowerCase();
  return ext === "html" || ext === "htm";
}

function isOutsideSite(pathname: string, base: string, sections: string[]) {
  const norm = base.endsWith("/") ? base : `${base}/`;
  if (norm !== "/") {
    return !pathname.startsWith(norm);
  }
  return sections.some(
    (s) => pathname === `/${s}` || pathname === `/${s}/` || pathname.startsWith(`/${s}/`),
  );
}

const INSTALLED_KEY = "__vitepressTheme9aiaSectionLinks";

export function installSectionLinkGuard({ base, sections }: GuardOptions) {
  // HMR can re-evaluate the theme module — don't stack listeners
  const w = window as unknown as Record<string, unknown>;
  if (w[INSTALLED_KEY]) return () => {};
  w[INSTALLED_KEY] = true;
  const onClick = (e: MouseEvent) => {
    if (
      e.defaultPrevented ||
      !(e.target instanceof Element) ||
      e.target.closest("button") ||
      e.button !== 0 ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.metaKey
    ) {
      return;
    }
    const link = e.target.closest("a");
    if (
      !link ||
      link.closest(".vp-raw") ||
      link.hasAttribute("download") ||
      link.hasAttribute("target")
    ) {
      return;
    }
    const linkHref =
      link.getAttribute("href") ??
      (link instanceof SVGAElement ? link.getAttribute("xlink:href") : null);
    if (linkHref == null) return;
    let url: URL;
    try {
      url = new URL(linkHref, link.baseURI);
    } catch {
      return;
    }
    if (url.origin !== location.origin || !isHtmlPath(url.pathname)) return;
    if (!isOutsideSite(url.pathname, base(), sections())) return;
    e.stopImmediatePropagation();
  };
  window.addEventListener("click", onClick, true);
  return () => {
    window.removeEventListener("click", onClick, true);
    delete w[INSTALLED_KEY];
  };
}
