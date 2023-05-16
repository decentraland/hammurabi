import { Scene, UtilityLayerRenderer } from "@babylonjs/core";
import { memoize } from "../../misc/memoize";
import { AdvancedDynamicTexture, StackPanel, Control, Checkbox, TextBlock, Button } from "@babylonjs/gui";

export const advancedUiTexture = memoize((scene: Scene) => {
  return AdvancedDynamicTexture.CreateFullscreenUI("UI", undefined, scene)
})

export const guiPanel = memoize((scene: Scene) => {
  const panel = new StackPanel();
  panel.spacing = 5;
  advancedUiTexture(scene).addControl(panel);
  panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  panel.paddingLeftInPixels = 10;
  panel.paddingTopInPixels = 10;

  return panel
})

export const utilLayer = memoize((scene: Scene) => new UtilityLayerRenderer(scene))

export function AddToggle(toggleText: string, panel: StackPanel) {
  var toggleViewLine = new StackPanel("toggleViewLine");
  toggleViewLine.isVertical = false;
  toggleViewLine.horizontalAlignment =
    Control.HORIZONTAL_ALIGNMENT_LEFT;
  toggleViewLine.spacing = 5;
  toggleViewLine.height = "25px";
  panel.addControl(toggleViewLine);
  var checkbox = new Checkbox();
  checkbox.verticalAlignment = 0; //BABYLON.Control.VERTICAL_ALIGNMENT_TOP;
  checkbox.width = "20px";
  checkbox.height = "20px";
  checkbox.isChecked = false;
  checkbox.color = "green";
  toggleViewLine.addControl(checkbox);
  toggleViewLine.paddingTop = 2;

  var checkboxText = new TextBlock(
    "checkboxText",
    toggleText
  );
  checkboxText.resizeToFit = true;
  checkboxText.color = "white";
  toggleViewLine.addControl(checkboxText);
  checkbox.onDisposeObservable.addOnce(() => toggleViewLine.dispose());
  return checkbox;
};

export function AddButton(buttonLabel: string, panel: StackPanel) {
  const button = Button.CreateSimpleButton("but", buttonLabel)
  button.width = "150px"
  button.height = "30px"
  panel.addControl(button);
  return button;
};
