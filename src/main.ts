import { Plugin, MarkdownPostProcessorContext } from "obsidian";
import { DEFAULT_SETTINGS, Settings, SettingTab } from "./settings";
import { D2 } from "@terrastruct/d2";
import panzoom from "panzoom";

export default class D2Standalone extends Plugin {
  settings: Settings;
  private readonly parser = new DOMParser();

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingTab(this.app, this));
    this.registerMarkdownCodeBlockProcessor("d2", this.processD2CodeBlock);
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<Settings>,
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private processD2CodeBlock = async (
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext,
  ) => {
    // show loading state
    const loadingEl = document.createElement("p");
    loadingEl.className = "d2-loading";
    loadingEl.textContent = "Rendering D2 diagram...";
    el.appendChild(loadingEl);
    // render D2 diagram
    const d2 = new D2();
    let svg: string;
    try {
      const result = await d2.compile({
        fs: { index: source },
        options: {
          sketch: this.settings.sketch,
          noXMLTag: true,
          scale: 1, // disable built-in scaling(When svgEl.clientWidth matches el.clientWidth, the panzoom argument initialY is not applied.)
        },
      });
      svg = await d2.render(result.diagram, result.renderOptions);
    } catch (error) {
      // display error message
      const errorEl = document.createElement("pre");
      errorEl.className = "d2-error";
      errorEl.textContent = String(error);
      loadingEl.remove();
      el.appendChild(errorEl);
      return;
    }
    // insert SVG into DOM
    const doc = this.parser.parseFromString(
      this.patchSvgTheme(this.patchSvgIds(svg)),
      "image/svg+xml",
    );
    const svgEl = doc.documentElement;
    loadingEl.remove();
    el.appendChild(svgEl);
    // calculate initial zoom and position to fit the SVG within the container
    const initZoomX = el.clientWidth / svgEl.clientWidth;
    const initZoomY = el.clientHeight / svgEl.clientHeight;
    let initialZoom = 1;
    let initialX = 0;
    let initialY = 0;
    if (initZoomX < initZoomY) {
      initialZoom = initZoomX;
      initialY =
        (el.clientHeight - svgEl.clientHeight * initialZoom) /
        2 /
        (1 - initialZoom || 1);
    } else if (initZoomY < initZoomX) {
      initialZoom = initZoomY;
      initialX =
        (el.clientWidth - svgEl.clientWidth * initialZoom) /
        2 /
        (1 - initialZoom || 1);
    }
    // initialize panzoom
    panzoom(svgEl, {
      zoomSpeed: 0.1,
      pinchSpeed: 1,
      smoothScroll: false,
      bounds: true,
      boundsPadding: 0.1,
      initialZoom: initialZoom,
      initialX: initialX,
      initialY: initialY,
    });
  };

  private patchSvgTheme(svg: string): string {
    return svg.replace(
      /@media screen and \(prefers-color-scheme:dark\)/g,
      ".theme-dark",
    );
  }

  private patchSvgIds(svg: string): string {
    // generate a unique prefix for this SVG to avoid ID conflicts when multiple SVGs are rendered on the same page
    const prefix = `d2-${crypto.randomUUID()}-`;
    const doc = this.parser.parseFromString(svg, "image/svg+xml");
    const root = doc.documentElement;
    // create a mapping of old IDs to new IDs and update the IDs in the SVG
    const idMap = new Map<string, string>();
    root.querySelectorAll("[id]").forEach((node) => {
      const oldId = node.getAttribute("id");
      if (!oldId) return;
      const newId = `${prefix}${oldId}`;
      idMap.set(oldId, newId);
      node.setAttribute("id", newId);
    });
    // update references to the IDs in attributes that can contain URL references or ID references
    const attrs = [
      "marker-start",
      "marker-mid",
      "marker-end",
      "fill",
      "stroke",
      "filter",
      "clip-path",
      "mask",
      "href",
      "xlink:href",
    ];
    root.querySelectorAll("*").forEach((node) => {
      for (const a of attrs) {
        const v = node.getAttribute(a);
        if (!v) continue;
        let next = v;
        for (const [oldId, newId] of idMap) {
          next = next.replace(
            new RegExp(`url\\((['"]?)#${oldId}\\1\\)`, "g"),
            `url(#${newId})`,
          );
          if ((a === "href" || a === "xlink:href") && next === `#${oldId}`)
            next = `#${newId}`;
        }
        if (next !== v) node.setAttribute(a, next);
      }
    });
    // return
    return new XMLSerializer().serializeToString(root);
  }
}
