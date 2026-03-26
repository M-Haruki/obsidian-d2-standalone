import { App, PluginSettingTab, Setting } from "obsidian";
import D2Standalone from "./main";

export interface Settings {
  sketch: boolean;
  initialZoomRatio: number;
  mouseZoomSpeed: number;
}

export const DEFAULT_SETTINGS: Settings = {
  sketch: false,
  initialZoomRatio: 0.95,
  mouseZoomSpeed: 0.2,
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
      .setDesc("Toggle sketch style for D2 diagrams. (Default: Off)")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.sketch).onChange(async (value) => {
          this.plugin.settings.sketch = value;
          await this.plugin.saveSettings();
          this.display();
        });
      });
    new Setting(containerEl)
      .setName("Initial Zoom Ratio")
      .setDesc("Set the initial zoom ratio for D2 diagrams. (Default: 0.95)")
      .addText((text) => {
        text
          .setPlaceholder("0.50 ~ 1.00")
          .setValue(this.plugin.settings.initialZoomRatio.toFixed(2))
          .setDisabled(true);
        text.inputEl.style.width = "var(--size-4-12)";
      })
      .addSlider((slider) => {
        slider
          .setLimits(0.5, 1, 0.05)
          .setValue(this.plugin.settings.initialZoomRatio)
          .onChange(async (value) => {
            this.plugin.settings.initialZoomRatio = value;
            await this.plugin.saveSettings();
            this.display();
          });
      });
    new Setting(containerEl)
      .setName("Mouse Zoom Speed")
      .setDesc("Set the zoom speed when using mouse wheel. (Default: 0.2)")
      .addText((text) => {
        text
          .setPlaceholder("0.1 ~ 1.0")
          .setValue(this.plugin.settings.mouseZoomSpeed.toFixed(1))
          .setDisabled(true);
        text.inputEl.style.width = "var(--size-4-12)";
      })
      .addSlider((slider) => {
        slider
          .setLimits(0.1, 1.0, 0.1)
          .setValue(this.plugin.settings.mouseZoomSpeed)
          .onChange(async (value) => {
            this.plugin.settings.mouseZoomSpeed = value;
            await this.plugin.saveSettings();
            this.display();
          });
      });
  }
}
