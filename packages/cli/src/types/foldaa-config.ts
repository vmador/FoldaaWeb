export interface FoldaaConfig {
  name: string;
  framework?: string;
  outputDir?: string;
  buildCommand?: string;
  env?: Record<string, string>;
}
