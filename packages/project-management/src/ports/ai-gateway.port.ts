import type { BrandMemory } from '../domain/project.aggregate.js';

export type AiGatewaySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AiGatewayQualityOutcome = 'passed' | 'warning' | 'failed' | 'blocked';
export type AiGatewaySourceValidationOutcome = 'passed' | 'needs_review' | 'blocked';

export interface AiGatewayReason {
  code: string;
  severity: AiGatewaySeverity;
  message: string;
  excerpt: string | null;
  suggestion: string | null;
}

export interface AiGatewaySuggestedFix {
  summary: string | null;
  instructions: string[];
}

export interface ValidateSourceLongreadParams {
  sourceContent: string;
  sourceLanguage: string;
  brandMemory?: BrandMemory | null;
  extraInstructions?: string | null;
}

export interface ValidateSourceLongreadResult {
  outcome: AiGatewaySourceValidationOutcome;
  summary: string;
  reasons: AiGatewayReason[];
  suggestedFix: AiGatewaySuggestedFix | null;
}

export interface GenerateAdaptationAiParams {
  sourceContent: string;
  sourceLanguage: string;
  channel: string;
  displayName: string;
  model?: string | null;
  publicationType?: string | null;
  style?: string | null;
  promptInstructions?: string | null;
  brandMemory?: BrandMemory | null;
  extraInstructions?: string | null;
}

export interface ReviseAdaptationAiParams {
  currentContent: string;
  sourceLanguage: string;
  channel: string;
  displayName: string;
  publicationType?: string | null;
  style?: string | null;
  promptInstructions?: string | null;
  instruction: string;
  selectedText?: string | null;
  sourceContent?: string | null;
  brandMemory?: BrandMemory | null;
  qualityReasons?: AiGatewayReason[];
  suggestedFix?: AiGatewaySuggestedFix | null;
}

export interface GenerateTranslationAiParams {
  sourceContent: string;
  sourceLanguage: string;
  targetLanguage: string;
  channel: string;
  displayName: string;
  publicationType?: string | null;
  style?: string | null;
  promptInstructions?: string | null;
  brandMemory?: BrandMemory | null;
}

export interface ReviseTranslationAiParams {
  currentContent: string;
  sourceContent: string;
  sourceLanguage: string;
  targetLanguage: string;
  channel: string;
  displayName: string;
  publicationType?: string | null;
  style?: string | null;
  promptInstructions?: string | null;
  brandMemory?: BrandMemory | null;
  qualityReasons?: AiGatewayReason[];
  suggestedFix?: AiGatewaySuggestedFix | null;
}

export interface AiGeneratedTextResult {
  content: string;
}

export interface CheckAdaptationQualityParams {
  sourceContent: string;
  adaptationContent: string;
  sourceLanguage: string;
  channel: string;
  displayName: string;
  publicationType?: string | null;
  style?: string | null;
  promptInstructions?: string | null;
  brandMemory?: BrandMemory | null;
}

export interface CheckTranslationFidelityParams {
  sourceContent: string;
  translatedContent: string;
  sourceLanguage: string;
  targetLanguage: string;
  channel: string;
  displayName: string;
  publicationType?: string | null;
  style?: string | null;
  promptInstructions?: string | null;
  brandMemory?: BrandMemory | null;
}

export interface AiQualityCheckResult {
  outcome: AiGatewayQualityOutcome;
  summary: string;
  reasons: AiGatewayReason[];
  suggestedFix: AiGatewaySuggestedFix | null;
}

export abstract class AiGatewayPort {
  abstract validateSourceLongread(
    params: ValidateSourceLongreadParams,
  ): Promise<ValidateSourceLongreadResult>;

  abstract generateAdaptation(params: GenerateAdaptationAiParams): Promise<AiGeneratedTextResult>;

  abstract reviseAdaptation(params: ReviseAdaptationAiParams): Promise<AiGeneratedTextResult>;

  abstract generateTranslation(params: GenerateTranslationAiParams): Promise<AiGeneratedTextResult>;

  abstract reviseTranslation(params: ReviseTranslationAiParams): Promise<AiGeneratedTextResult>;

  abstract checkAdaptationQuality(
    params: CheckAdaptationQualityParams,
  ): Promise<AiQualityCheckResult>;

  abstract checkTranslationFidelity(
    params: CheckTranslationFidelityParams,
  ): Promise<AiQualityCheckResult>;
}
