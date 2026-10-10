import manifestJson from "../../asset-manifest.json";

export type Segment = {
  readonly in: number; // source seconds
  readonly out: number;
  readonly rate?: number; // >1 shows an "Accelerated" label
  readonly shortened?: boolean; // shows "Time shortened" (a cut follows/precedes)
};

export type Focus = {
  readonly at: number; // seconds into the slot
  readonly x: number; // crop rect in source pixels
  readonly y: number;
  readonly w: number;
  readonly h: number;
};

export type Clip = {
  readonly shotId: string;
  readonly path: string;
  readonly status: "missing" | "ready";
  readonly verified: boolean;
  readonly kind: string;
  readonly runId: string | null;
  readonly capturedAt: string | null;
  readonly sourceInSeconds: number | null;
  readonly sourceOutSeconds: number | null;
  readonly segments?: readonly Segment[];
  readonly focus?: readonly Focus[];
  readonly sourceWidth?: number;
  readonly sourceHeight?: number;
  readonly appAudio?: boolean; // S03: play the clip's own audio inside narration.appAudioWindows
  readonly appAudioVolume?: number;
  readonly note?: string;
};

export type Facts = {
  readonly status: string;
  readonly verified: boolean;
  readonly sessionMode: string;
  readonly scenarioDate: string;
  readonly zone?: string;
  readonly heatWindow: readonly [string, string];
  readonly requestsInWindow: number;
  readonly clusterB: { readonly requests: number };
  readonly coverageBefore: { readonly covered: number; readonly total: number; readonly percent: number };
  readonly coverageAfter: { readonly covered: number; readonly total: number; readonly percent: number };
  readonly unresolved: readonly { readonly clusterId: string; readonly requests: number }[];
  readonly askTimeoutSecondsDemo: number;
  readonly bedrockModelId?: string;
  readonly awsServices: readonly string[];
  readonly appUrl: string | null;
  readonly repoUrl: string | null;
};

export type Manifest = {
  readonly mode: "draft" | "final";
  readonly facts: Facts;
  readonly clips: readonly Clip[];
  readonly narration: {
    kind: "tts" | "recorded";
    engine?: string;
    path?: string;
    status: "missing" | "draft" | "ready";
    finalApproved: boolean;
    offsetSeconds?: number;
  };
  readonly music?: { enabled: boolean; src?: string; duckDb?: number };
  readonly finalRenderAllowed: boolean;
};

export const manifest = manifestJson as unknown as Manifest;

export const getClip = (shotId: string): Clip | undefined => manifest.clips.find((c) => c.shotId === shotId);

export const clipSegments = (clip: Clip): Segment[] => {
  if (clip.segments && clip.segments.length > 0) return [...clip.segments];
  if (clip.sourceInSeconds !== null && clip.sourceOutSeconds !== null) {
    return [{ in: clip.sourceInSeconds, out: clip.sourceOutSeconds }];
  }
  return [];
};

/** True when every number on screen may be shown as fact (final overlays read only from verified facts). */
export const factsVerified = () => manifest.facts.verified && manifest.facts.status !== "expected_fixture_only";

/** Whether an AWS service may be named on screen. Draft (empty list) shows the storyboard set, flagged as unverified. */
export const serviceListed = (name: string) =>
  manifest.facts.awsServices.length === 0 || manifest.facts.awsServices.some((s) => s.toLowerCase() === name.toLowerCase());
