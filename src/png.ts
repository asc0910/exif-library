/* eslint-disable @typescript-eslint/camelcase */
import * as struct from "./struct";
import { crc32_buf } from "./crc32";

export const PNG_HEADER = "\x89PNG\x0d\x0a\x1a\x0a";
const EXIF_MARKER = "tEXt";

interface Chunk {
  fourcc: string;
  lengthBytes: string;
  data: string;
  crc: string;
}

function split(data: string): Chunk[] {
  if (data.slice(0, 8) != PNG_HEADER) {
    throw new Error("Not PNG");
  }

  const start = 8;
  let pointer = start;
  const CHUNK_FOURCC_LENGTH = 4;
  const LENGTH_BYTES_LENGTH = 4;
  const CRC_LENGTH = 4;
  const fileSize = data.length;
  const END_SIGN = "IEND";

  const chunks: Chunk[] = [];
  while (pointer + CHUNK_FOURCC_LENGTH + LENGTH_BYTES_LENGTH < fileSize) {
    const dataLengthBytes = data.slice(pointer, pointer + LENGTH_BYTES_LENGTH);
    const dataLength = struct.unpack(">L", dataLengthBytes)[0];
    pointer += LENGTH_BYTES_LENGTH;

    const fourcc = data.slice(pointer, pointer + CHUNK_FOURCC_LENGTH);
    pointer += CHUNK_FOURCC_LENGTH;

    const chunkData = data.slice(pointer, pointer + dataLength);
    pointer += dataLength;

    const crc = data.slice(pointer, pointer + CRC_LENGTH);
    pointer += CRC_LENGTH;
    chunks.push({
      fourcc: fourcc,
      lengthBytes: dataLengthBytes,
      data: chunkData,
      crc: crc
    });

    if (fourcc == END_SIGN) {
      break;
    }
  }

  return chunks;
}

function mergeChunks(chunks: Chunk[]): string {
  const merged = chunks
    .map(c => {
      return c.lengthBytes + c.fourcc + c.data + c.crc;
    })
    .join("");

  return merged;
}

function getExif(data: string): string | undefined {
  if (data.slice(0, 8) != PNG_HEADER) {
    throw new Error("Not PNG");
  }

  const chunks = split(data);
  const chunk = chunks.find(c => c.fourcc === EXIF_MARKER);
  return chunk && chunk.data;
}

function insertExifIntoChunks(chunks: Chunk[], exifBytes: string): Chunk[] {
  const exifLengthBytes = struct.pack("<L", [exifBytes.length]);
  const exifData = EXIF_MARKER + exifBytes;
  const exifDataArray = [];
  for (let i = 0; i < exifData.length; i++) {
    exifDataArray.push(exifData.charCodeAt(i));
  }
  const crc = struct
    .pack("<L", [crc32_buf(exifDataArray as any, 0)])
    .split("")
    .reverse()
    .join("");
  const exifChunk: Chunk = {
    fourcc: EXIF_MARKER,
    lengthBytes: exifLengthBytes,
    data: exifBytes,
    crc: crc
  };

  const chunkIndex = chunks.findIndex(c => c.fourcc === EXIF_MARKER);
  if (chunkIndex >= 0) {
    chunks.splice(chunkIndex, 1, exifChunk);
  } else {
    chunks.splice(-1, 0, exifChunk);
  }

  return chunks;
}

function insert(pngBytes: string, exifBytes: string): string {
  const EXIF_CODE = "Exif\x00\x00";
  if (exifBytes.startsWith(EXIF_CODE)) {
    exifBytes = exifBytes.slice(6);
  }
  const chunks = split(pngBytes);
  const newChunks = insertExifIntoChunks(chunks, exifBytes);
  const merged = mergeChunks(newChunks);
  const newPngBytes = PNG_HEADER + merged;
  return newPngBytes;
}

function remove(pngBytes: string): string {
  const chunks = split(pngBytes).filter(c => c.fourcc !== EXIF_MARKER);
  const merged = mergeChunks(chunks);
  const newPngBytes = PNG_HEADER + merged;
  return newPngBytes;
}

export default {
  PNG_HEADER,
  insert,
  remove,
  getExif
};
