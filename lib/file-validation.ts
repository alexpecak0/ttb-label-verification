import { MAX_IMAGE_BYTES } from "./downscale";

const fileError = "Choose JPEG or PNG images no larger than 10 MB.";

export function validateLabelFiles(files: File[]) {
  const accepted = files.filter(
    (file) =>
      (file.type === "image/jpeg" || file.type === "image/png") &&
      file.size <= MAX_IMAGE_BYTES,
  );

  return {
    accepted,
    error: accepted.length === files.length ? null : fileError,
  };
}
