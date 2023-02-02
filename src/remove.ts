import * as utils from "./utils";
import * as segment from "./segment";
import webp from "./webp";
import png from "./png";

export const remove = (imageBytes: string): string => {
  let bbase64Encoded = false;
  let fileType = "";
  if (imageBytes.slice(0, 2) == "\xff\xd8") {
    fileType = "jpeg";
  } else if (
    imageBytes.slice(0, 4) === "RIFF" &&
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
    bbase64Encoded = true;
    fileType = "jpeg";
  } else if (imageBytes.slice(0, 22) == "data:image/png;base64,") {
    imageBytes = utils.atob(imageBytes.split(",")[1]);
    bbase64Encoded = true;
    fileType = "png";
  } else if (imageBytes.slice(0, 23) == "data:image/webp;base64,") {
    imageBytes = utils.atob(imageBytes.split(",")[1]);
    bbase64Encoded = true;
    fileType = "webp";
  } else {
    throw new Error("Given data is not jpeg or webp.");
  }

  if (fileType === "jpeg") {
    const segments = segment.splitIntoSegments(imageBytes);
    const newSegments = segments.filter(function(segment: string) {
      return !(
        segment.slice(0, 2) == "\xff\xe1" &&
        segment.slice(4, 10) == "Exif\x00\x00"
      );
    });

    let newBytes = newSegments.join("");
    if (bbase64Encoded) {
      newBytes = "data:image/jpeg;base64," + utils.btoa(newBytes);
    }
    return newBytes;
  } else if (fileType === "webp") {
    let newBytes = webp.remove(imageBytes);
    if (bbase64Encoded) {
      newBytes = "data:image/webp;base64," + utils.btoa(newBytes);
    }
    return newBytes;
  } else if (fileType === "png") {
    let newBytes = png.remove(imageBytes);
    if (bbase64Encoded) {
      newBytes = "data:image/png;base64," + utils.btoa(newBytes);
    }
    return newBytes;
  }
};
