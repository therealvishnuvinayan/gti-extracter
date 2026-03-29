import type { ExtractionResult } from "@/components/document-extractor/types";

export const MOCK_EXTRACTION_RESULT: ExtractionResult = {
  detectedLanguage: "English",
  structuredFields: [
    { id: "name", label: "Name", value: "Vinu Vinayan" },
    { id: "place", label: "Place", value: "Kabul" },
    { id: "shopName", label: "Shop Name", value: "SKG Industries" },
    { id: "number", label: "Number", value: "+91950097" },
    { id: "whatsApp", label: "WhatsApp", value: "+91950098" },
    { id: "address", label: "Address", value: "SKG, Shop 1, Kabul" },
    {
      id: "product",
      label: "Product",
      value: "Milano New York, Milano Green",
    },
    {
      id: "suggestions",
      label: "Suggestions",
      value: "Improve product delivery speed",
    },
  ],
  rawTranscription: `Name: Vinu Vinayan
Place: Kabul
Shop Name: SKG Industries
Number: +91950097
WhatsApp: +91950098
Address: SKG, Shop 1, Kabul
Product Interested: Milano New York, Milano Green
Suggestions: Improve product delivery speed

Form Type: Customer raffle / retailer feedback card
Detected Notes: Handwriting is slightly compressed around the phone fields.`,
  englishTranslation: `Customer name is Vinu Vinayan from Kabul. The shop is listed as SKG Industries and the primary contact number appears to be +91950097. A WhatsApp number is also provided as +91950098. The address references SKG, Shop 1, Kabul. The products mentioned are Milano New York and Milano Green. The writer suggests improving delivery speed for future orders.`,
  notes: [
    "Some handwriting in the contact section may be unclear.",
    "Phone number may need manual verification.",
    "Product names appear legible, but capitalization may vary from the source form.",
  ],
};
