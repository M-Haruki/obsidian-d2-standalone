import { App, PluginSettingTab, Setting } from "obsidian";
import D2Standalone from "./main";

export interface Settings {
  defaultLayoutEngine: "dagre" | "elk";
  sketch: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultLayoutEngine: "dagre",
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
      .setName("Default Layout Engine")
      .setDesc("Choose the default layout engine for D2 diagrams.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("dagre", "Dagre")
          .addOption("elk", "ELK")
          .setValue(this.plugin.settings.defaultLayoutEngine)
          .onChange(async (value) => {
            this.plugin.settings.defaultLayoutEngine =
              value as Settings["defaultLayoutEngine"];
            await this.plugin.saveSettings();
          });
      });

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
