import { getPref } from "./prefs";

type ModifierKey = "Control" | "Meta" | "Alt" | "Shift";

interface ConcatShortcutSpec {
  key?: string;
  modifiers: ModifierKey[];
}

export interface CapturedConcatShortcut {
  value: string;
  clear: boolean;
  cancel: boolean;
  modifierOnly: boolean;
}

export function getConcatShortcutKey() {
  const key = ((getPref("concatShortcutKey") as string) || "").trim();
  if (key) {
    return key;
  }
  return Zotero.isMac ? "Meta" : "Control";
}

export function isConcatShortcutKeyboardDownEvent(event: KeyboardEvent) {
  const shortcut = getConcatShortcutSpec();
  if (!matchesRequiredModifiers(event, shortcut.modifiers)) {
    return false;
  }
  const eventKey = normalizeConcatShortcutKey(event.key);
  if (shortcut.key) {
    return eventKey === shortcut.key;
  }
  return shortcut.modifiers.includes(eventKey as ModifierKey);
}

export function isConcatShortcutKeyboardUpEvent(event: KeyboardEvent) {
  const shortcut = getConcatShortcutSpec();
  const eventKey = normalizeConcatShortcutKey(event.key);
  return (
    eventKey === shortcut.key ||
    shortcut.modifiers.includes(eventKey as ModifierKey)
  );
}

export function isConcatShortcutMouseEvent(event: MouseEvent) {
  const shortcut = getConcatShortcutSpec();
  if (!matchesRequiredModifiers(event, shortcut.modifiers)) {
    return false;
  }
  return shortcut.key ? addon.data.translate.concatKey : true;
}

export function captureConcatShortcut(event: KeyboardEvent): CapturedConcatShortcut | null {
  const key = normalizeConcatShortcutKey(event.key);
  if (key === "Escape") {
    return { value: "", clear: false, cancel: true, modifierOnly: false };
  }
  if (key === "Backspace" || key === "Delete") {
    return { value: "", clear: true, cancel: false, modifierOnly: false };
  }
  if (key === "Tab") {
    return null;
  }
  if (isModifierKey(key)) {
    return {
      value: key,
      clear: false,
      cancel: false,
      modifierOnly: true,
    };
  }
  const modifiers = (["Control", "Meta", "Alt", "Shift"] as ModifierKey[]).filter(
    (modifier) => {
      switch (modifier) {
        case "Control":
          return event.ctrlKey;
        case "Meta":
          return event.metaKey;
        case "Alt":
          return event.altKey;
        case "Shift":
          return event.shiftKey;
      }
    },
  );
  return {
    value: [...modifiers, key].join("+"),
    clear: false,
    cancel: false,
    modifierOnly: false,
  };
}

function getConcatShortcutSpec(): ConcatShortcutSpec {
  const shortcut = getConcatShortcutKey();
  let parts = shortcut
    .split("+")
    .map((part) => normalizeConcatShortcutKey(part))
    .filter((part) => part);
  if (parts.length === 0) {
    parts = [Zotero.isMac ? "Meta" : "Control"];
  }
  const modifiers = parts.filter(isModifierKey);
  const key = parts.find((part) => !isModifierKey(part));
  return {
    key,
    modifiers,
  };
}

function matchesRequiredModifiers(
  event: KeyboardEvent | MouseEvent,
  modifiers: ModifierKey[],
) {
  return modifiers.every((modifier) => {
    switch (modifier) {
      case "Control":
        return event.ctrlKey;
      case "Meta":
        return event.metaKey;
      case "Alt":
        return event.altKey;
      case "Shift":
        return event.shiftKey;
    }
  });
}

function isModifierKey(key: string): key is ModifierKey {
  return ["Control", "Meta", "Alt", "Shift"].includes(key);
}

function normalizeConcatShortcutKey(key: string) {
  const normalized = key.trim();
  switch (normalized.toLowerCase()) {
    case "ctrl":
    case "control":
      return "Control";
    case "cmd":
    case "command":
    case "meta":
      return "Meta";
    case "option":
    case "alt":
      return "Alt";
    case "shift":
      return "Shift";
    default:
      return normalized;
  }
}
