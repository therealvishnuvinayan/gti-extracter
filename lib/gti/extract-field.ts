import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import { cropImageRegion } from "@/lib/gti/crops";
import {
  buildGtiFieldGroupExtractionPrompt,
  buildGtiFieldGroupJsonSchema,
} from "@/lib/gti/prompts";
import {
  extractionDebugTraceSchema,
  rawPageFieldValueSchema,
  type ExtractionDebugTrace,
  type RawPageFieldValue,
} from "@/lib/gti/schema";
import {
  getFieldGroup,
  getTemplateField,
  type GtiFieldGroupDefinition,
} from "@/lib/gti/template-fields";
import { type GtiExtractedFieldKey } from "@/lib/gti/template";
import {
  getImageInputDetail,
  getOpenAIClient,
  getPageExtractionModel,
  supportsReasoningEffort,
} from "@/lib/openai";

export type ExtractablePageImage = {
  pageNumber: number;
  mimeType: string;
  bytes: Buffer;
};

export type ExtractedFieldGroupResult = {
  groupId: string;
  pageNumber: number;
  notes: string[];
  fields: Record<GtiExtractedFieldKey, RawPageFieldValue>;
  debugTraces: ExtractionDebugTrace[];
};

const groupResponseBaseSchema = z
  .object({
    groupId: z.string(),
    pageNumber: z.number().int().positive(),
    notes: z.array(z.string()),
    fields: z.record(z.string(), rawPageFieldValueSchema),
  })
  .strict();

export async function extractFieldGroupFromPage({
  fileName,
  totalPages,
  page,
  group,
}: {
  fileName: string;
  totalPages: number;
  page: ExtractablePageImage;
  group: GtiFieldGroupDefinition;
}): Promise<ExtractedFieldGroupResult> {
  const client = getOpenAIClient();
  const model = getPageExtractionModel();
  const imageDetail = getImageInputDetail(model);
  const groupCrop = await cropImageRegion({
    sourceBytes: page.bytes,
    region: group.region,
    label: group.label,
    margin: 0.02,
  });
  const fieldCrops = await Promise.all(
    group.fieldKeys.map(async (fieldKey) =>
      cropImageRegion({
        sourceBytes: page.bytes,
        region: getTemplateField(fieldKey).region,
        label: getTemplateField(fieldKey).label,
        margin: 0.014,
      }),
    ),
  );

  const response = await createStructuredResponse({
    client,
    model,
    instructions: buildGtiFieldGroupExtractionPrompt(group),
    schemaName: `gti_group_${group.id}`,
    schema: buildGtiFieldGroupJsonSchema(group),
    maxOutputTokens: 1800,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              `Source file: ${fileName}`,
              `Actual page count in uploaded document: ${totalPages}`,
              `Target page: ${page.pageNumber}`,
              `Target field group: ${group.label}`,
              "Use the full page for layout context. Use the group crop and the individual field crops as the primary evidence for answer reading.",
            ].join("\n"),
          },
          {
            type: "input_text",
            text: "Full page context",
          },
          {
            type: "input_image",
            detail: imageDetail,
            image_url: toDataUrl(page.mimeType, page.bytes),
          },
          {
            type: "input_text",
            text: `Group crop: ${group.label}`,
          },
          {
            type: "input_image",
            detail: imageDetail,
            image_url: toDataUrl(groupCrop.mimeType, groupCrop.bytes),
          },
          ...fieldCrops.flatMap((crop) => [
            {
              type: "input_text" as const,
              text: `Field crop: ${crop.label}`,
            },
            {
              type: "input_image" as const,
              detail: imageDetail,
              image_url: toDataUrl(crop.mimeType, crop.bytes),
            },
          ]),
        ],
      },
    ],
  });

  const parsed = parseFieldGroupResponse(response, group);

  return {
    groupId: parsed.groupId,
    pageNumber: parsed.pageNumber,
    notes: parsed.notes,
    fields: parsed.fields,
    debugTraces: group.fieldKeys.map((fieldKey) =>
      extractionDebugTraceSchema.parse({
        field: fieldKey,
        page: group.pageNumber,
        groupId: group.id,
        cropLabel: group.fieldKeys.length === 1 ? getTemplateField(fieldKey).label : group.label,
        value: parsed.fields[fieldKey]?.value ?? "",
        selectedValues: parsed.fields[fieldKey]?.selectedValues ?? [],
        evidence: parsed.fields[fieldKey]?.evidence ?? "",
        reasoning: parsed.fields[fieldKey]?.reasoning ?? "",
        confidence: parsed.fields[fieldKey]?.confidence ?? "low",
        uncertainty: parsed.fields[fieldKey]?.uncertainty ?? "",
      }),
    ),
  };
}

export async function extractSingleFieldFromPage({
  fileName,
  totalPages,
  page,
  fieldKey,
}: {
  fileName: string;
  totalPages: number;
  page: ExtractablePageImage;
  fieldKey: GtiExtractedFieldKey;
}) {
  const field = getTemplateField(fieldKey);
  const fallbackGroup =
    getFieldGroup(field.groupId) ?? {
      id: `field_${fieldKey}`,
      pageNumber: field.pageNumber,
      label: field.label,
      description: field.promptHint,
      region: field.region,
      fieldKeys: [fieldKey] as GtiExtractedFieldKey[],
    };

  return extractFieldGroupFromPage({
    fileName,
    totalPages,
    page,
    group: {
      ...fallbackGroup,
      id: `field_${fieldKey}`,
      label: `${field.label} fallback`,
      description: field.promptHint,
      region: field.region,
      fieldKeys: [fieldKey],
    },
  });
}

function parseFieldGroupResponse(
  payload: unknown,
  group: GtiFieldGroupDefinition,
) {
  const parsed = groupResponseBaseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(
      `The field-group extraction response for ${group.id} did not match the expected shape.`,
    );
  }

  if (parsed.data.groupId !== group.id || parsed.data.pageNumber !== group.pageNumber) {
    throw new Error(
      `The field-group extraction response for ${group.id} did not match the requested group.`,
    );
  }

  const fields = {} as Record<GtiExtractedFieldKey, RawPageFieldValue>;

  for (const fieldKey of group.fieldKeys) {
    const rawField = parsed.data.fields[fieldKey];

    if (!rawField) {
      throw new Error(`Field ${fieldKey} was missing from the extraction response.`);
    }

    fields[fieldKey] = rawPageFieldValueSchema.parse(rawField);
  }

  return {
    groupId: parsed.data.groupId,
    pageNumber: parsed.data.pageNumber,
    notes: parsed.data.notes.map((note) => note.trim()).filter(Boolean),
    fields,
  };
}

async function createStructuredResponse({
  client,
  model,
  instructions,
  input,
  schemaName,
  schema,
  maxOutputTokens,
}: {
  client: OpenAI;
  model: string;
  instructions: string;
  input: OpenAI.Responses.ResponseCreateParams["input"];
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens: number;
}) {
  const response = await client.responses.create({
    model,
    store: false,
    ...(supportsReasoningEffort(model)
      ? {
          reasoning: {
            effort: "medium" as const,
          },
        }
      : {}),
    instructions,
    max_output_tokens: maxOutputTokens,
    input,
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  const rawOutput = response.output_text?.trim();

  if (!rawOutput) {
    throw new Error("OpenAI returned an empty field extraction response.");
  }

  try {
    return JSON.parse(rawOutput) as unknown;
  } catch {
    throw new Error("OpenAI returned malformed JSON for a field extraction response.");
  }
}

function toDataUrl(mimeType: string, bytes: Buffer) {
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}
