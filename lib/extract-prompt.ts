export const EXTRACTION_PROMPT = `
You are extracting content from an uploaded document that may be handwritten, printed, mixed-language, irregularly formatted, or not a customer form at all.

Your job:
- Read the document carefully, including messy handwriting and irregular layouts.
- Identify what kind of document it is.
- Detect whether the content is English, Farsi, Dari, or mixed.
- Produce a concise English summary of the document's purpose or contents.
- Preserve the original content faithfully in rawTranscription.
- Translate the content into clear English in englishTranslation.
- Extract the most important details from any document into keyDetails.
- If the document happens to be a customer form, also map relevant content into the requested customer-form fields.
- Never invent or guess missing values.
- Use empty strings for unknown fields.
- Add confidenceNotes for unclear handwriting, ambiguous characters, incomplete numbers, missing context, or uncertain interpretations.
- Add missingOrUnclearFields for any important fields or concepts that are missing, blank, unreliable, or only partially legible.
- Prefer accuracy over guessing.

Customer-form field mapping guidance:
- name: person's name
- place: city, town, or place
- shopName: shop, store, business, or company name
- number: primary phone or contact number
- whatsapp: WhatsApp number if separate
- address: address or location details
- product: product names or requested products
- suggestions: feedback, comments, or improvement suggestions

Output requirements:
- Return JSON only.
- Use the exact schema provided.
- documentTitle should be the visible title or best concise label for the document. Use an empty string if not clear.
- documentType should classify the document, for example: customer form, worksheet, receipt, letter, flyer, list, ID, invoice, survey, unknown.
- documentSummary should be a short English summary of what the document is and what it contains.
- keyDetails should contain the most meaningful extracted facts for any document, even when the customer-form fields are irrelevant.
- If the document is not a customer form, leave customer-form fields empty rather than forcing a mapping.
- rawTranscription should preserve line breaks when useful.
- If a piece of source text is unreadable, reflect uncertainty in confidenceNotes instead of fabricating text.
`.trim();

export const EXTRACTION_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "documentTitle",
    "documentType",
    "detectedLanguage",
    "documentSummary",
    "rawTranscription",
    "englishTranslation",
    "keyDetails",
    "fields",
    "confidenceNotes",
    "missingOrUnclearFields",
  ],
  properties: {
    documentTitle: { type: "string" },
    documentType: { type: "string" },
    detectedLanguage: { type: "string" },
    documentSummary: { type: "string" },
    rawTranscription: { type: "string" },
    englishTranslation: { type: "string" },
    keyDetails: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value"],
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
      },
    },
    fields: {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "place",
        "shopName",
        "number",
        "whatsapp",
        "address",
        "product",
        "suggestions",
      ],
      properties: {
        name: { type: "string" },
        place: { type: "string" },
        shopName: { type: "string" },
        number: { type: "string" },
        whatsapp: { type: "string" },
        address: { type: "string" },
        product: { type: "string" },
        suggestions: { type: "string" },
      },
    },
    confidenceNotes: {
      type: "array",
      items: { type: "string" },
    },
    missingOrUnclearFields: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;
