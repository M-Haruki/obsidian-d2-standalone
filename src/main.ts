import {
  Plugin,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
} from "obsidian";
import { DEFAULT_SETTINGS, Settings, SettingTab } from "./settings";
import { D2 } from "@terrastruct/d2";
import panzoom from "panzoom";

export default class D2Standalone extends Plugin {
  settings: Settings = DEFAULT_SETTINGS;
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
    ctx: MarkdownPostProcessorContext,
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
          salt: crypto.randomUUID(), // this value is used for UUID generation within the library. set it to prevent ID conflicts between different diagrams.
          pad: 0,
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
      this.patchSvgTheme(svg),
      "image/svg+xml",
    );
    const svgEl = doc.documentElement;
    svgEl.classList.add(this.settings.aspectRatio);
    loadingEl.remove();
    el.appendChild(svgEl);
    // calculate initial zoom and position to fit the SVG within the container
    await new Promise((resolve) => requestAnimationFrame(resolve));
    let initialX, initialY, initialZoom;
    if (
      isFinite(svgEl.clientWidth) &&
      isFinite(svgEl.clientHeight) &&
      svgEl.clientWidth > 0 &&
      svgEl.clientHeight > 0
    ) {
      initialZoom =
        Math.min(
          el.clientWidth / svgEl.clientWidth,
          el.clientHeight / svgEl.clientHeight,
        ) * this.settings.initialZoomRatio; // add some padding;
      // panzoom treats initialX/initialY as zoom anchor coordinates (not final offsets), so we divide by (1 - initialZoom) to get centered screen offsets after zoom.
      initialX =
        (el.clientWidth - svgEl.clientWidth * initialZoom) /
        2 /
        (1 - initialZoom || 1);
      initialY =
        (el.clientHeight - svgEl.clientHeight * initialZoom) /
        2 /
        (1 - initialZoom || 1);
    } else {
      // fallback to default values when SVG dimensions are not available
      initialZoom = this.settings.initialZoomRatio;
      initialX = 0;
      initialY = 0;
    }
    // initialize panzoom
    const panzoomInstance = panzoom(svgEl, {
      zoomSpeed: this.settings.mouseZoomSpeed,
      pinchSpeed: 1,
      smoothScroll: false,
      bounds: true,
      boundsPadding: 0.1,
      initialZoom: initialZoom,
      initialX: initialX,
      initialY: initialY,
    });
    // dispose panzoom instance when the component is unloaded
    class D2MarkdownRenderChild extends MarkdownRenderChild {
      public unload() {
        panzoomInstance.dispose();
        super.unload();
      }
    }
    ctx.addChild(new D2MarkdownRenderChild(el));
  };

  private patchSvgTheme(svg: string): string {
    return svg.replace(
      /@media screen and \(prefers-color-scheme:dark\)/g,
      ".theme-dark",
    );
  }
}
