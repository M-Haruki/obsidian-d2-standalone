import { App, PluginSettingTab, Setting } from "obsidian";
import D2Standalone from "./main";

export interface Settings {
  sketch: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sketch: false,
};

export class SettingTab extends PluginSettingTab {
  plugin: D2Standalone;

  constructor(app: App, plugin: D2Standalone) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Sketch Style")
      .setDesc("Toggle sketch style for D2 diagrams.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.sketch).onChange(async (value) => {
          this.plugin.settings.sketch = value;
          await this.plugin.saveSettings();
          this.display();
        });
      });
  }
}
