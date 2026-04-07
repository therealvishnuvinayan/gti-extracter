import "server-only";

import {
  DOMMatrix,
  ImageData,
  Path2D,
  createCanvas,
} from "@napi-rs/canvas";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type CanvasContext = CanvasRenderingContext2D;

export type RenderedPdfPage = {
  pageNumber: number;
  width: number;
  height: number;
  mimeType: "image/png";
  bytes: Buffer;
};

const TARGET_LONG_EDGE = 2200;
const MIN_SCALE = 1.8;
const MAX_SCALE = 3;

let pdfJsPromise: Promise<PdfJsModule> | null = null;

export async function renderPdfToPngPages(pdfBytes: Buffer) {
  installPdfRenderingGlobals();

  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: false,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  });

  const document = await loadingTask.promise;
  const pages: RenderedPdfPage[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);

      try {
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = resolveRenderScale(baseViewport.width, baseViewport.height);
        const viewport = page.getViewport({ scale });
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        const context = canvas.getContext("2d");
        const renderContext = {
          canvas: canvas as unknown as HTMLCanvasElement,
          canvasContext: context as unknown as CanvasContext,
          viewport,
        } as unknown as Parameters<typeof page.render>[0];

        await page.render(renderContext).promise;

        pages.push({
          pageNumber,
          width: canvas.width,
          height: canvas.height,
          mimeType: "image/png",
          bytes: canvas.toBuffer("image/png"),
        });
      } finally {
        page.cleanup();
      }
    }
  } finally {
    await document.destroy();
  }

  return pages;
}

function resolveRenderScale(width: number, height: number) {
  const longEdge = Math.max(width, height);
  const targetScale = TARGET_LONG_EDGE / Math.max(longEdge, 1);

  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale));
}

function installPdfRenderingGlobals() {
  const globalScope = globalThis as Record<string, unknown>;

  if (!globalScope.DOMMatrix) {
    globalScope.DOMMatrix = DOMMatrix;
  }

  if (!globalScope.ImageData) {
    globalScope.ImageData = ImageData;
  }

  if (!globalScope.Path2D) {
    globalScope.Path2D = Path2D;
  }

  if (!globalScope.CanvasRenderingContext2D) {
    globalScope.CanvasRenderingContext2D = createCanvas(1, 1)
      .getContext("2d")
      .constructor;
  }
}

function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }

  return pdfJsPromise;
}
