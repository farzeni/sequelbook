import { KeyBinding } from "@uiw/react-codemirror";

export const CELL_BINDINGS = {
  CELL_EXECUTE: 'Enter',
  CELL_NEXT: 'ArrowDown',
  CELL_PREVIOUS: 'ArrowUp',
};

interface SQBKeymapOptions {
  onExecute?: () => void;
  onSelectNextCell?: () => void;
  onSelectPreviousCell?: () => void;
}

export const sqbCodeMirrorKeymap: (options: SQBKeymapOptions) => KeyBinding[] = (options) =>
  [
    {
      key: `Ctrl-${CELL_BINDINGS.CELL_EXECUTE}`,
      run: () => {
        options.onExecute && options.onExecute();
        return true;
      }
    },
    {
      key: `Ctrl-${CELL_BINDINGS.CELL_NEXT}`,
      run: () => {
        options.onSelectNextCell && options.onSelectNextCell();
        return true;
      }
    },
    {
      key: `Ctrl-${CELL_BINDINGS.CELL_PREVIOUS}`,
      run: () => {
        options.onSelectPreviousCell && options.onSelectPreviousCell();
        return true;
      }
    }
  ];

