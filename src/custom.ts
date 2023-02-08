import { dump } from "./dump";
import { insert } from "./insert";
import { IExif } from "./interfaces";
import { load } from "./load";
import png from "./png";

function getImageType(imageBytes: string): string {
  let fileType = "";
  if (imageBytes.slice(0, 2) == "\xff\xd8") {
    fileType = "jpeg";
  } else if (
    imageBytes.slice(0, 4) == "RIFF" &&
    imageBytes.slice(8, 12) === "WEBP"
  ) {
    fileType = "webp";
  } else if (imageBytes.slice(0, png.PNG_HEADER.length) === png.PNG_HEADER) {
    fileType = "png";
  } else if (
    imageBytes.slice(0, 23) == "data:image/jpeg;base64," ||
    imageBytes.slice(0, 22) == "data:image/jpg;base64,"
  ) {
    fileType = "jpeg";
  } else if (imageBytes.slice(0, 23) == "data:image/webp;base64,") {
    fileType = "webp";
  } else if (imageBytes.slice(0, 22) == "data:image/png;base64,") {
    fileType = "png";
  } else {
    throw new Error("Given data is not jpeg or webp or png.");
  }

  return fileType;
}
export function insertCustomMeta(exifData: string, imageBytes: string): string {
  const fileType = getImageType(imageBytes);
  if (fileType === "jpeg" || fileType === "webp") {
    const exifBytes = dump({
      "0th": {
        "270": exifData
      }
    });
    return insert(exifBytes, imageBytes);
  } else if (fileType === "png") {
    const exifBytes = "casestry" + "\x00" + exifData;
    return insert(exifBytes, imageBytes);
  }
}

export function loadCustomMeta(imageBytes: string): string | undefined {
  const fileType = getImageType(imageBytes);
  const obj = load(imageBytes);
  if (fileType === "jpeg" || fileType === "webp") {
    return ((obj as IExif)["0th"] as any)?.["270"] as string | undefined;
  } else if (fileType === "png") {
    return obj.casestry;
  }
}
