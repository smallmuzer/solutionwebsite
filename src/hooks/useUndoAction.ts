import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface UndoAction {
  id: string;
  label: string;
  undoFn: () => Promise<void>;
  timeout: ReturnType<typeof setTimeout>;
}

export const useUndoAction = () => {
  const pendingActions = useRef<Map<string, UndoAction>>(new Map());

  const executeWithUndo = useCallback(
    async (params: {
      id: string;
      label: string;
      action: () => Promise<void>;
      undoFn: () => Promise<void>;
      delay?: number;
    }) => {
      const { id, label, action, undoFn, delay = 10000 } = params;

      // Execute the action immediately
      await action();

      // Set timeout for permanent execution
      const timeout = setTimeout(() => {
        pendingActions.current.delete(id);
      }, delay);

      pendingActions.current.set(id, { id, label, undoFn, timeout });

      // Show toast with undo button
      toast(label, {
        duration: delay,
        action: {
          label: "Undo",
          onClick: async () => {
            const pending = pendingActions.current.get(id);
            if (pending) {
              clearTimeout(pending.timeout);
              pendingActions.current.delete(id);
              await pending.undoFn();
              toast.success("Action undone!");
            }
          },
        },
      });
    },
    []
  );

  return { executeWithUndo };
};
