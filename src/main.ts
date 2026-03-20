import { Notice, Plugin, MarkdownPostProcessorContext } from "obsidian";
import { DEFAULT_SETTINGS, Settings, SettingTab } from "./settings";
import { D2 } from "@terrastruct/d2";

export default class D2Standalone extends Plugin {
  settings: Settings;

  async onload() {
    new Notice("D2 Standalone plugin loaded!");
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
    // show loading message
    const loadingElement = document.createElement("p");
    loadingElement.className = "d2-loading";
    loadingElement.setText("Rendering D2 diagram...");
    el.appendChild(loadingElement);

    // render D2 diagram
    const d2 = new D2();
    const result = await d2.compile({
      fs: { index: source },
      options: {
        sketch: this.settings.sketch,
        noXMLTag: true,
      },
    });
    const svg = await d2.render(result.diagram, result.renderOptions);
    el.innerHTML = svg;
  };
}
