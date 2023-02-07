/* eslint-disable @typescript-eslint/camelcase */
import * as struct from "./struct";
import { toHexFormat } from "./utils";

interface Chunk {
  fourcc: string;
  lengthBytes: string;
  data: string;
}

function split(data: string): Chunk[] {
  if (data.slice(0, 4) !== "RIFF" || data.slice(8, 12) !== "WEBP") {
    throw new Error("Not webp");
  }

  const webpLengthBytes = data.slice(4, 8);
  const webpLength = struct.unpack("<L", webpLengthBytes)[0];
  const RIFF_HEADER_SIZE = 8;
  const fileSize = RIFF_HEADER_SIZE + webpLength;
  const start = 12;
  let pointer = start;
  const CHUNK_FOURCC_LENGTH = 4;
  const LENGTH_BYTES_LENGTH = 4;
  const chunks: Chunk[] = [];
  while (pointer + CHUNK_FOURCC_LENGTH + LENGTH_BYTES_LENGTH < fileSize) {
    const fourcc = data.slice(pointer, pointer + CHUNK_FOURCC_LENGTH);
    pointer += CHUNK_FOURCC_LENGTH;
    const chunkLengthBytes = data.slice(pointer, pointer + LENGTH_BYTES_LENGTH);
    const chunkLength = struct.unpack("<L", chunkLengthBytes)[0];
    pointer += LENGTH_BYTES_LENGTH;
    const chunkData = data.slice(pointer, pointer + chunkLength);
    chunks.push({
      fourcc,
      lengthBytes: chunkLengthBytes,
      data: chunkData
    });
    const padding = chunkLength % 2 ? 1 : 0;
    pointer += chunkLength + padding;
  }

  return chunks;
}

function mergeChunks(chunks: Chunk[]): string {
  const merged = chunks
    .map(c => {
      return (
        c.fourcc + c.lengthBytes + c.data + (c.data.length % 2 ? "\x00" : "")
      );
    })
    .join("");

  return merged;
}

function getSizeFromVp8x(chunk: Chunk): [number, number] {
  const widthMinusOneBytes = chunk["data"].slice(-6, -3) + "\x00";
  const widthMinusOne = struct.unpack("<L", widthMinusOneBytes)[0];
  const width = widthMinusOne + 1;
  const heightMinusOneBytes = chunk["data"].slice(-3) + "\x00";
  const heightMinusOne = struct.unpack("<L", heightMinusOneBytes)[0];
  const height = heightMinusOne + 1;
  return [width, height];
}

function getSizeFromVp8(chunk: Chunk): [number, number] {
  const BEGIN_CODE = "\x9d\x01\x2a";
  const beginIndex = chunk["data"].indexOf(BEGIN_CODE);
  if (beginIndex === -1) {
    throw new Error("wrong VP8");
  } else {
    const BEGIN_CODE_LENGTH = BEGIN_CODE.length;
    const LENGTH_BYTES_LENGTH = 2;
    const lengthStart = beginIndex + BEGIN_CODE_LENGTH;
    const widthBytes = chunk["data"].slice(
      lengthStart,
      lengthStart + LENGTH_BYTES_LENGTH
    );
    const width = struct.unpack("<H", widthBytes)[0];
    const heightBytes = chunk["data"].slice(
      lengthStart + LENGTH_BYTES_LENGTH,
      lengthStart + 2 * LENGTH_BYTES_LENGTH
    );
    const height = struct.unpack("<H", heightBytes)[0];
    return [width, height];
  }
}

function vp8LContainsAlpha(chunkData: string): number {
  const flag = (chunkData.charCodeAt(4) >> (5 - 1)) & 1;
  const contains = 1 * flag;
  return contains;
}

function getSizeFromVp8L(chunk: Chunk): [number, number] {
  const b1 = chunk["data"].charCodeAt(1);
  const b2 = chunk["data"].charCodeAt(2);
  const b3 = chunk["data"].charCodeAt(3);
  const b4 = chunk["data"].charCodeAt(4);

  const widthMinusOne = ((b2 & 0x3f) << 8) | b1;
  const width = widthMinusOne + 1;

  const heightMinusOne = ((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6);
  const height = heightMinusOne + 1;

  return [width, height];
}

function getSizeFromAnmf(chunk: Chunk): [number, number] {
  const widthMinusOneBytes = chunk["data"].slice(6, 9) + "\x00";
  const widthMinusOne = struct.unpack("<L", widthMinusOneBytes)[0];
  const width = widthMinusOne + 1;
  const heightMinusOneBytes = chunk["data"].slice(9, 12) + "\x00";
  const heightMinusOne = struct.unpack("<L", heightMinusOneBytes)[0];
  const height = heightMinusOne + 1;
  return [width, height];
}

function setVp8x(chunks: Chunk[]): Chunk[] {
  let width: number | null = null;
  let height: number | null = null;
  const flags = ["0", "0", "0", "0", "0", "0", "0", "0"]; // [0, 0, ICC, Alpha, EXIF, XMP, Anim, 0]

  chunks.forEach(chunk => {
    if (chunk["fourcc"] === "VP8X") {
      [width, height] = getSizeFromVp8x(chunk);
    } else if (chunk["fourcc"] === "VP8 ") {
      [width, height] = getSizeFromVp8(chunk);
    } else if (chunk["fourcc"] === "VP8L") {
      const isRgba = vp8LContainsAlpha(chunk["data"]);
      if (isRgba) {
        flags[3] = "1";
      }
      [width, height] = getSizeFromVp8L(chunk);
    } else if (chunk["fourcc"] === "ANMF") {
      [width, height] = getSizeFromAnmf(chunk);
    } else if (chunk["fourcc"] === "ICCP") {
      flags[2] = "1";
    } else if (chunk["fourcc"] === "ALPH") {
      flags[3] = "1";
    } else if (chunk["fourcc"] === "EXIF") {
      flags[4] = "1";
    } else if (chunk["fourcc"] === "XMP ") {
      flags[5] = "1";
    } else if (chunk["fourcc"] === "ANIM") {
      flags[6] = "1";
    }
  });

  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;

  if (chunks[0]["fourcc"] === "VP8X") {
    chunks.shift();
  }

  const headerBytes = "VP8X";
  const lengthBytes = "\x0a\x00\x00\x00";
  const flagsBytes = struct.pack("<B", [parseInt(flags.join(""), 2)]);
  const paddingBytes = "\x00\x00\x00";
  const widthBytes = struct.pack("<L", [widthMinusOne]).slice(0, 3);
  const heightBytes = struct.pack("<L", [heightMinusOne]).slice(0, 3);

  const dataBytes = flagsBytes + paddingBytes + widthBytes + heightBytes;

  const vp8xChunk = {
    fourcc: headerBytes,
    lengthBytes: lengthBytes,
    data: dataBytes
  };
  chunks.splice(0, 0, vp8xChunk);
  return chunks;
}

function getFileHeader(chunks: Chunk[]): string {
  const WEBP_HEADER_LENGTH = 4;
  const FOURCC_LENGTH = 4;
  const LENGTH_BYTES_LENGTH = 4;

  let length = WEBP_HEADER_LENGTH;
  chunks.forEach(chunk => {
    let dataLength = struct.unpack("<L", chunk["lengthBytes"])[0];
    dataLength += dataLength % 2 ? 1 : 0;
    length += FOURCC_LENGTH + LENGTH_BYTES_LENGTH + dataLength;
  });
  const lengthBytes = struct.pack("<L", [length]);
  const riff = "RIFF";
  const webpHeader = "WEBP";
  const fileHeader = riff + lengthBytes + webpHeader;
  return fileHeader;
}

function getExif(data: string): string | null {
  if (data.slice(0, 4) != "RIFF" || data.slice(8, 12) != "WEBP") {
    throw new Error("Not WebP");
  }

  if (data.slice(12, 16) != "VP8X") {
    throw new Error("doesnot have exif");
  }

  const webpLengthBytes = data.slice(4, 8);
  const webpLength = struct.unpack("<L", webpLengthBytes)[0];
  const RIFF_HEADER_SIZE = 8;
  const fileSize = RIFF_HEADER_SIZE + webpLength;

  const start = 12;
  let pointer = start;
  const CHUNK_FOURCC_LENGTH = 4;
  const LENGTH_BYTES_LENGTH = 4;

  while (pointer < fileSize) {
    const fourcc = data.slice(pointer, pointer + CHUNK_FOURCC_LENGTH);
    pointer += CHUNK_FOURCC_LENGTH;
    const chunkLengthBytes = data.slice(pointer, pointer + LENGTH_BYTES_LENGTH);
    let chunkLength = struct.unpack("<L", chunkLengthBytes)[0];
    if (chunkLength % 2) {
      chunkLength += 1;
    }
    pointer += LENGTH_BYTES_LENGTH;
    if (fourcc === "EXIF") {
      return data.slice(pointer, pointer + chunkLength);
    }
    pointer += chunkLength;
  }
  return null; // if there isn't exif, return None.
}

function insertExifIntoChunks(chunks: Chunk[], exifBytes: string): Chunk[] {
  const EXIF_HEADER = "EXIF";
  const exifLengthBytes = struct.pack("<L", [exifBytes.length]);
  const exifChunk: Chunk = {
    fourcc: EXIF_HEADER,
    lengthBytes: exifLengthBytes,
    data: exifBytes
  };

  let xmpIndex: number | null = null;
  let animationIndex: number | null = null;

  chunks.forEach((chunk, index) => {
    if (chunk["fourcc"] === "EXIF") chunks.splice(index, 1);
  });

  chunks.forEach((chunk, index) => {
    if (chunk["fourcc"] === "XMP ") xmpIndex = index;
    else if (chunk["fourcc"] === "ANIM") animationIndex = index;
  });
  if (xmpIndex !== null) {
    chunks.splice(xmpIndex, 0, exifChunk);
  } else if (animationIndex !== null) {
    chunks.splice(animationIndex, 0, exifChunk);
  } else {
    chunks.push(exifChunk);
  }
  return chunks;
}

function insert(webpBytes: string, exifBytes: string): string {
  let chunks = split(webpBytes);
  chunks = insertExifIntoChunks(chunks, exifBytes);
  chunks = setVp8x(chunks);
  const fileHeader = getFileHeader(chunks);
  const merged = mergeChunks(chunks);
  const newWebpBytes = fileHeader + merged;
  return newWebpBytes;
}

function remove(webpBytes: string): string {
  let chunks = split(webpBytes);
  chunks.forEach((chunk, index) => {
    if (chunk["fourcc"] === "EXIF") chunks.splice(index, 1);
  });
  chunks = setVp8x(chunks);
  const fileHeader = getFileHeader(chunks);
  const merged = mergeChunks(chunks);
  const newWebpBytes = fileHeader + merged;
  return newWebpBytes;
}

export default { getExif, insert, remove };
