import type { GtiFieldGroupDefinition } from "@/lib/gti/template-fields";
import { GTI_TEMPLATE_NAME } from "@/lib/gti/template";
import { getTemplateField } from "@/lib/gti/template-fields";

export function buildGtiFieldGroupExtractionPrompt(
  group: GtiFieldGroupDefinition,
) {
  const fieldInstructions = group.fieldKeys
    .map((fieldKey, index) => buildFieldInstruction(fieldKey, index + 1))
    .join("\n\n");

  return [
    `You are reading a scanned page from the fixed GTI form "${GTI_TEMPLATE_NAME}".`,
    `Your task is to extract only the answers for the field group "${group.label}".`,
    "",
    "Critical rules:",
    "- This is always the same GTI Consumer Product Testing Feedback Form template.",
    "- Do not infer new questions or extra fields.",
    "- Do not return question text, section headers, or printed option labels as answers.",
    "- Selection is determined by the visible human mark nearest to an option, not by the printed option itself.",
    "- Check for tick marks, pen slashes, hand-drawn strokes, filled circles, darkened radio buttons, offset pen marks, and empty options.",
    "- If no option is selected, return an empty string or empty array as required.",
    "- If more than one option appears marked for a single-select or scale field, return blank unless one mark is clearly dominant.",
    "- If the mark is unclear, do not guess. Return blank and explain the issue in uncertainty.",
    "- For free-text fields, transcribe only the handwritten or typed answer entered by the respondent.",
    "- Handwritten free text may be English, Dari, or Pashto.",
    "- Use the full page for context, but use the group crop and the field crops as the primary evidence.",
    "",
    "Response rules:",
    "- Return JSON only.",
    "- Follow the schema exactly.",
    "- Keep reasoning short and factual.",
    "- Keep evidence visual and concrete, such as 'tick closest to option 4' or 'handwritten text on answer line reads Seven Stars'.",
    "",
    "Fields to extract:",
    fieldInstructions,
  ].join("\n");
}

export function buildGtiFieldGroupJsonSchema(group: GtiFieldGroupDefinition) {
  const requiredFieldKeys = [...group.fieldKeys];
  const fieldProperties = Object.fromEntries(
    group.fieldKeys.map((fieldKey) => [
      fieldKey,
      buildFieldSchema(fieldKey),
    ]),
  );

  return {
    type: "object",
    additionalProperties: false,
    required: ["groupId", "pageNumber", "notes", "fields"],
    properties: {
      groupId: {
        type: "string",
        enum: [group.id],
      },
      pageNumber: {
        type: "integer",
        enum: [group.pageNumber],
      },
      notes: {
        type: "array",
        items: {
          type: "string",
        },
      },
      fields: {
        type: "object",
        additionalProperties: false,
        required: requiredFieldKeys,
        properties: fieldProperties,
      },
    },
  } as const;
}

function buildFieldInstruction(fieldKey: Parameters<typeof getTemplateField>[0], index: number) {
  const field = getTemplateField(fieldKey);
  const allowedValues = buildAllowedValueText(field);

  return [
    `${index}. Field: ${field.key}`,
    `Question: ${field.question}`,
    `Type: ${field.type}`,
    allowedValues ? `Allowed outputs: ${allowedValues}` : "",
    field.leftLabel || field.rightLabel
      ? `Scale labels: ${field.leftLabel ?? ""} -> ${field.rightLabel ?? ""}`.trim()
      : "",
    `Field-specific instruction: ${field.promptHint}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFieldSchema(fieldKey: Parameters<typeof getTemplateField>[0]) {
  const field = getTemplateField(fieldKey);

  return {
    type: "object",
    additionalProperties: false,
    required: [
      "value",
      "selectedValues",
      "evidence",
      "reasoning",
      "confidence",
      "isBlank",
      "uncertainty",
    ],
    properties: {
      value: buildValueSchema(field),
      selectedValues: buildSelectedValuesSchema(field),
      evidence: {
        type: "string",
      },
      reasoning: {
        type: "string",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
      },
      isBlank: {
        type: "boolean",
      },
      uncertainty: {
        type: "string",
      },
    },
  } as const;
}

function buildValueSchema(field: ReturnType<typeof getTemplateField>) {
  if (field.type === "free_text") {
    return { type: "string" } as const;
  }

  if (field.type === "multi_select_max_2") {
    return {
      type: "string",
    } as const;
  }

  return {
    type: "string",
    enum: ["", ...(field.allowedValues ?? [])],
  } as const;
}

function buildSelectedValuesSchema(field: ReturnType<typeof getTemplateField>) {
  if (field.type === "free_text") {
    return {
      type: "array",
      items: { type: "string" },
      maxItems: 0,
    } as const;
  }

  if (field.type === "multi_select_max_2") {
    return {
      type: "array",
      items: {
        type: "string",
        enum: field.allowedValues,
      },
      maxItems: 2,
    } as const;
  }

  return {
    type: "array",
    items: {
      type: "string",
      enum: field.allowedValues,
    },
    maxItems: 1,
  } as const;
}

function buildAllowedValueText(field: ReturnType<typeof getTemplateField>) {
  if (field.type === "free_text") {
    return "Return only the handwritten or typed answer, or an empty string.";
  }

  if (field.type === "multi_select_max_2") {
    return `selectedValues must contain up to 2 of: ${field.allowedValues?.join(" | ")}`;
  }

  return `'', ${field.allowedValues?.map((value) => `"${value}"`).join(", ")}`;
}
