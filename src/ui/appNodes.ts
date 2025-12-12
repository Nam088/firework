/**
 * DOM node references for the UI
 */

import type { AppNodes } from '../config';

// App DOM node selectors
const appNodeSelectors: Record<string, string> = {
  stageContainer: '.stage-container',
  canvasContainer: '.canvas-container',
  controls: '.controls',
  menu: '.menu',
  menuInnerWrap: '.menu__inner-wrap',
  pauseBtn: '.pause-btn',
  pauseBtnSVG: '.pause-btn use',
  soundBtn: '.sound-btn',
  soundBtnSVG: '.sound-btn use',
  shellType: '.shell-type',
  shellTypeLabel: '.shell-type-label',
  shellSize: '.shell-size',
  shellSizeLabel: '.shell-size-label',
  quality: '.quality-ui',
  qualityLabel: '.quality-ui-label',
  skyLighting: '.sky-lighting',
  skyLightingLabel: '.sky-lighting-label',
  scaleFactor: '.scaleFactor',
  scaleFactorLabel: '.scaleFactor-label',
  wordShell: '.word-shell',
  wordShellLabel: '.word-shell-label',
  autoLaunch: '.auto-launch',
  autoLaunchLabel: '.auto-launch-label',
  finaleModeFormOption: '.form-option--finale-mode',
  finaleMode: '.finale-mode',
  finaleModeLabel: '.finale-mode-label',
  hideControls: '.hide-controls',
  hideControlsLabel: '.hide-controls-label',
  fullscreenFormOption: '.form-option--fullscreen',
  fullscreen: '.fullscreen',
  fullscreenLabel: '.fullscreen-label',
  longExposure: '.long-exposure',
  longExposureLabel: '.long-exposure-label',

  // Help UI
  helpModal: '.help-modal',
  helpModalOverlay: '.help-modal__overlay',
  helpModalHeader: '.help-modal__header',
  helpModalBody: '.help-modal__body',
  helpModalCloseBtn: '.help-modal__close-btn',
};

// Create appNodes by querying DOM for each selector
export const appNodes: AppNodes = {} as AppNodes;

export function initAppNodes(): void {
  Object.keys(appNodeSelectors).forEach((key) => {
    (appNodes as Record<string, Element | null>)[key] = document.querySelector(
      appNodeSelectors[key]
    );
  });
}
