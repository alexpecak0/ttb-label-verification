export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_ENCODED_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_IMAGE_EDGE = 1600;

export interface PreparedImage {
  base64: string;
  fileName: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
}

export function calculateResizeDimensions(
  width: number,
  height: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= MAX_IMAGE_EDGE) {
    return { width, height };
  }

  const scale = MAX_IMAGE_EDGE / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file is not a readable image."));
    };
    image.src = objectUrl;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("The image could not be prepared."));
        }
      },
      "image/jpeg",
      0.85,
    );
  });
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    throw new Error("Choose a JPEG or PNG image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Choose an image no larger than 10 MB.");
  }

  const image = await loadImage(file);
  const dimensions = calculateResizeDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not prepare this image.");
  }

  context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
  const jpeg = await canvasToJpeg(canvas);
  if (jpeg.size >= MAX_ENCODED_IMAGE_BYTES) {
    throw new Error("Choose a smaller or more tightly cropped image.");
  }

  const dataUrl = await readAsDataUrl(jpeg);
  const base64 = dataUrl.split(",", 2)[1];
  if (!base64) {
    throw new Error("The image could not be prepared.");
  }

  return {
    base64,
    fileName: file.name,
    mimeType: "image/jpeg",
    ...dimensions,
  };
}
