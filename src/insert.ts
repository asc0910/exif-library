import * as utils from "./utils";
import * as struct from "./struct";
import * as segment from "./segment";
import webp from "./webp";
import png from "./png";

export const insert = (exifBytes: string, imageBytes: string): string => {
  let base64Encoded = false;
  if (exifBytes.slice(0, 6) != "\x45\x78\x69\x66\x00\x00") {
    throw new Error("Given data is not exif data");
  }
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
    imageBytes = utils.atob(imageBytes.split(",")[1]);
    base64Encoded = true;
    fileType = "jpeg";
  } else if (imageBytes.slice(0, 23) == "data:image/webp;base64,") {
    imageBytes = utils.atob(imageBytes.split(",")[1]);
    base64Encoded = true;
    fileType = "webp";
  } else if (imageBytes.slice(0, 22) == "data:image/png;base64,") {
    imageBytes = utils.atob(imageBytes.split(",")[1]);
    base64Encoded = true;
    fileType = "png";
  } else {
    throw new Error("Given data is not jpeg or webp or png.");
  }

  if (fileType === "jpeg") {
    const app1Segment =
      "\xff\xe1" + struct.pack(">H", [exifBytes.length + 2]) + exifBytes;
    const segments = segment.splitIntoSegments(imageBytes);
    let newBytes = segment.mergeSegments(segments, app1Segment);
    if (base64Encoded) {
      newBytes = "data:image/jpeg;base64," + utils.btoa(newBytes);
    }

    return newBytes;
  } else if (fileType === "webp") {
    exifBytes = exifBytes.slice(6);
    let newBytes = webp.insert(imageBytes, exifBytes);
    if (base64Encoded) {
      newBytes = "data:image/webp;base64," + utils.btoa(newBytes);
    }
    return newBytes;
  } else if (fileType === "png") {
    exifBytes = exifBytes.slice(6);
    let newBytes = png.insert(imageBytes, exifBytes);
    if (base64Encoded) {
      newBytes = "data:image/webp;base64," + utils.btoa(newBytes);
    }
    return newBytes;
  }

  throw new Error("invalid file type");
};
