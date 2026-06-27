/** Redimensiona imagens antes de enviar ao Gemini — menos tokens de visão. */
const MAX_EDGE = 768;
const JPEG_QUALITY = 0.78;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Comprime/redimensiona para análise visual. GIF vira JPEG estático (1º frame).
 * Falha silenciosa → devolve o arquivo original em base64.
 */
export async function compressImageForAnalysis(
  file: File
): Promise<{ base64: string; mediaType: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    });

    return { base64: await blobToBase64(blob), mediaType: "image/jpeg" };
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          base64: (reader.result as string).split(",")[1] ?? "",
          mediaType: file.type,
        });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
