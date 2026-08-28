export type SourceKind = "url" | "topic" | "file";

export type BriefSource = {
  kind: SourceKind;
  value: string;
};

export type CitedSource = {
  title: string;
  url?: string;
};

export type ResearchBrief = {
  id: string;
  title: string;
  source: BriefSource;
  fetchedAt: string;
  problem: string;
  facts: string[];
  risks: string[];
  nextAction: string;
  sources: CitedSource[];
  limits: string;
};

export type DraftBriefInput = {
  url?: string;
  topic?: string;
};
