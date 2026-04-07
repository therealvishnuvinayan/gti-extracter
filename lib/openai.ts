import "server-only";
import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}

export function getPageExtractionModel() {
  return process.env.OPENAI_PAGE_EXTRACT_MODEL || process.env.OPENAI_EXTRACT_MODEL || "gpt-5.4";
}

export function getDocumentNormalizationModel() {
  return (
    process.env.OPENAI_DOCUMENT_NORMALIZE_MODEL ||
    process.env.OPENAI_EXTRACT_MODEL ||
    "gpt-5.4"
  );
}

export function getImageInputDetail(model: string) {
  return model.startsWith("gpt-5.4") ? "original" : "high";
}

export function supportsReasoningEffort(model: string) {
  return /^gpt-5($|[\.-])/.test(model);
}
