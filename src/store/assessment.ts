import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AssessmentContext } from "@/types/benefit";

/**
 * Assessment state. Persisted to sessionStorage only — answers never leave
 * the browser and are cleared when the tab session ends.
 */
interface AssessmentState {
  context: AssessmentContext;
  completed: boolean;
  setHelpingSomeoneElse: (value: boolean) => void;
  setAnswer: (field: string, value: unknown) => void;
  setCompleted: (value: boolean) => void;
  reset: () => void;
}

const EMPTY: AssessmentContext = { province: "BC" };

export const useAssessment = create<AssessmentState>()(
  persist(
    (set) => ({
      context: { ...EMPTY },
      completed: false,
      setHelpingSomeoneElse: (value) =>
        set((s) => ({ context: { ...s.context, helpingSomeoneElse: value } })),
      setAnswer: (field, value) =>
        set((s) => ({ context: { ...s.context, [field]: value } })),
      setCompleted: (value) => set({ completed: value }),
      reset: () => set({ context: { ...EMPTY }, completed: false }),
    }),
    {
      name: "mb.assessment",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.sessionStorage
          : (undefined as unknown as Storage),
      ),
    },
  ),
);
