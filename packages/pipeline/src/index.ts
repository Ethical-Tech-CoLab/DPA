/**
 * @dpa/pipeline — the seven stages, wired end to end.
 *
 * See docs/ARCHITECTURE-v0.4.md. This package holds no domain logic of its
 * own; it is the composition root that makes the ADRs observable as one run.
 */
export { runPipeline, deliver } from "./pipeline.js";
export type { PipelineInput, PipelineResult } from "./pipeline.js";
