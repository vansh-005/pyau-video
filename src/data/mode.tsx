import React, { createContext, useContext } from "react";

export type RenderMode = "draft" | "final";

const ModeContext = createContext<RenderMode>("draft");

export const ModeProvider: React.FC<{ mode: RenderMode; children: React.ReactNode }> = ({ mode, children }) => (
  <ModeContext.Provider value={mode}>{children}</ModeContext.Provider>
);

export const useMode = () => useContext(ModeContext);

/** Final renders must never contain placeholders; fail loudly instead. */
export const assertNotFinal = (mode: RenderMode, what: string) => {
  if (mode === "final") {
    throw new Error(`Final render blocked: ${what}. Supply verified assets via asset-manifest.json.`);
  }
};
