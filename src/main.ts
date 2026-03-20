import { Notice, Plugin, MarkdownPostProcessorContext } from "obsidian";

export default class D2Standalone extends Plugin {
  async onload() {
    new Notice("D2 Standalone plugin loaded!");
    this.registerMarkdownCodeBlockProcessor("d2", this.processD2CodeBlock);
  }

  private processD2CodeBlock = async (
    source: string,
    el: HTMLElement,
    _ctx: MarkdownPostProcessorContext,
  ) => {
    el.setText("Processing D2 code block...");
  };
}
