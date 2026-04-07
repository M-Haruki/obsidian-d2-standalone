import { App, PluginSettingTab, Setting } from "obsidian";
import D2Standalone from "./main";

export interface Settings {
  aspectRatio: string;
  sketch: boolean;
  initialZoomRatio: number;
  mouseZoomSpeed: number;
}

export const DEFAULT_SETTINGS: Settings = {
  aspectRatio: "ratio4-3",
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
      .setName("D2 Standalone Plugin Settings")
      .setHeading()
      .setDesc("Settings will take effect upon re-rendering.");
    new Setting(containerEl)
      .setName("Diagram Aspect Ratio")
      .setDesc(
        "Specify the aspect ratio for D2 diagrams in width:height format. (Default: 4:3)",
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption("ratio16-9", "16:9")
          .addOption("ratio4-3", "4:3")
          .addOption("ratio1-1", "1:1")
          .addOption("ratio3-4", "3:4")
          .addOption("ratio9-16", "9:16")
          .setValue(this.plugin.settings.aspectRatio)
          .onChange(async (value) => {
            this.plugin.settings.aspectRatio = value;
            await this.plugin.saveSettings();
          }),
      );
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
