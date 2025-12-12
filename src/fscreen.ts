/*
  Copyright © 2022 Nam088. All rights reserved.
  Github: https://github.com/Nam088/firework
  Gitee: https://gitee.com/Nam088/firework
  This project is licensed under Apache-2.0.
  You are free to use, modify, and share this code, provided that you retain the original license and copyright information.
*/

// Fullscreen API with vendor prefix support
interface FscreenKeyMap {
  fullscreenEnabled: number;
  fullscreenElement: number;
  requestFullscreen: number;
  exitFullscreen: number;
  fullscreenchange: number;
  fullscreenerror: number;
}

type VendorPrefix = string[];

const key: FscreenKeyMap = {
  fullscreenEnabled: 0,
  fullscreenElement: 1,
  requestFullscreen: 2,
  exitFullscreen: 3,
  fullscreenchange: 4,
  fullscreenerror: 5,
};

const webkit: VendorPrefix = [
  'webkitFullscreenEnabled',
  'webkitFullscreenElement',
  'webkitRequestFullscreen',
  'webkitExitFullscreen',
  'webkitfullscreenchange',
  'webkitfullscreenerror',
];

const moz: VendorPrefix = [
  'mozFullScreenEnabled',
  'mozFullScreenElement',
  'mozRequestFullScreen',
  'mozCancelFullScreen',
  'mozfullscreenchange',
  'mozfullscreenerror',
];

const ms: VendorPrefix = [
  'msFullscreenEnabled',
  'msFullscreenElement',
  'msRequestFullscreen',
  'msExitFullscreen',
  'MSFullscreenChange',
  'MSFullscreenError',
];

// Safely access document even if not in browser environment
const doc: Document | Record<string, unknown> =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'
    ? window.document
    : {};

// Detect which vendor prefix to use
const vendor: VendorPrefix =
  ('fullscreenEnabled' in doc && Object.keys(key) as unknown as VendorPrefix) ||
  (webkit[0] in doc && webkit) ||
  (moz[0] in doc && moz) ||
  (ms[0] in doc && ms) ||
  [];

export interface Fscreen {
  requestFullscreen: (element: Element) => Promise<void>;
  requestFullscreenFunction: (element: Element) => (() => Promise<void>) | undefined;
  exitFullscreen: () => Promise<void>;
  addEventListener: (type: string, handler: EventListener, options?: boolean | AddEventListenerOptions) => void;
  removeEventListener: (type: string, handler: EventListener) => void;
  fullscreenEnabled: boolean;
  fullscreenElement: Element | null;
  onfullscreenchange: EventListener | null;
  onfullscreenerror: EventListener | null;
}

export const fscreen: Fscreen = {
  requestFullscreen(element: Element): Promise<void> {
    return (element as unknown as Record<string, () => Promise<void>>)[vendor[key.requestFullscreen]]();
  },
  requestFullscreenFunction(element: Element): (() => Promise<void>) | undefined {
    return (element as unknown as Record<string, () => Promise<void>>)[vendor[key.requestFullscreen]];
  },
  get exitFullscreen(): () => Promise<void> {
    return ((doc as Document)[vendor[key.exitFullscreen] as keyof Document] as () => Promise<void>).bind(doc);
  },
  addEventListener(type: string, handler: EventListener, options?: boolean | AddEventListenerOptions): void {
    (doc as Document).addEventListener(vendor[key[type as keyof FscreenKeyMap]], handler, options);
  },
  removeEventListener(type: string, handler: EventListener): void {
    (doc as Document).removeEventListener(vendor[key[type as keyof FscreenKeyMap]], handler);
  },
  get fullscreenEnabled(): boolean {
    return Boolean((doc as Document)[vendor[key.fullscreenEnabled] as keyof Document]);
  },
  set fullscreenEnabled(_val: boolean) {
    // No-op setter
  },
  get fullscreenElement(): Element | null {
    return (doc as Document)[vendor[key.fullscreenElement] as keyof Document] as Element | null;
  },
  set fullscreenElement(_val: Element | null) {
    // No-op setter
  },
  get onfullscreenchange(): EventListener | null {
    return (doc as unknown as Record<string, EventListener | null>)[
      ('on' + vendor[key.fullscreenchange]).toLowerCase()
    ];
  },
  set onfullscreenchange(handler: EventListener | null) {
    (doc as unknown as Record<string, EventListener | null>)[
      ('on' + vendor[key.fullscreenchange]).toLowerCase()
    ] = handler;
  },
  get onfullscreenerror(): EventListener | null {
    return (doc as unknown as Record<string, EventListener | null>)[
      ('on' + vendor[key.fullscreenerror]).toLowerCase()
    ];
  },
  set onfullscreenerror(handler: EventListener | null) {
    (doc as unknown as Record<string, EventListener | null>)[
      ('on' + vendor[key.fullscreenerror]).toLowerCase()
    ] = handler;
  },
};

// Also attach to window for global access
(window as unknown as { fscreen: Fscreen }).fscreen = fscreen;
