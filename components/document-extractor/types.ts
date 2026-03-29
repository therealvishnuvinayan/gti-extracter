export type SupportedLanguage = "English" | "Farsi" | "Dari";

export type FieldId =
  | "name"
  | "place"
  | "shopName"
  | "number"
  | "whatsApp"
  | "address"
  | "product"
  | "suggestions";

export type StructuredField = {
  id: FieldId;
  label: string;
  value: string;
};

export type ExtractionResult = {
  detectedLanguage: SupportedLanguage;
  structuredFields: StructuredField[];
  rawTranscription: string;
  englishTranslation: string;
  notes: string[];
};

export type SelectedDocument = {
  file: File;
  kind: "image" | "pdf";
  previewUrl?: string;
};

export type ProcessingStatus = "idle" | "ready" | "processing" | "complete";
