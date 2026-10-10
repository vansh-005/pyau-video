import { SAFE } from "../theme";

// Persistent demo-room frame (S03–S07). S01's map shrinks into it; it shrinks into S08's "Web app" node.
// Story rail sits to its left; callouts go in the right column. Captions live below the frame.
export const RAIL = { x: SAFE, y: 150, w: 172 } as const;
export const FRAME_BAR = 34;
export const VIDEO_W = 1232;
export const VIDEO_H = 693; // 16:9
export const FRAME = { x: SAFE + 172 + 32, y: 128, w: VIDEO_W, h: VIDEO_H + FRAME_BAR } as const;
export const VIDEO = { x: FRAME.x, y: FRAME.y + FRAME_BAR, w: VIDEO_W, h: VIDEO_H } as const;
export const COLUMN = { x: FRAME.x + FRAME.w + 36, y: FRAME.y, w: 1920 - SAFE - (FRAME.x + FRAME.w + 36) } as const;
