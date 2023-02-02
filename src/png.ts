/* eslint-disable @typescript-eslint/camelcase */
import * as struct from "./struct";
import { crc32_buf } from "./crc32";

export const PNG_HEADER = "\x89PNG\x0d\x0a\x1a\x0a";
const EXIF_MARKER = "tEXt";

interface Chunk {
  fourcc: string;
  length_bytes: string;
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
  const file_size = data.length;
  const END_SIGN = "IEND";

  const chunks: Chunk[] = [];
  while (pointer + CHUNK_FOURCC_LENGTH + LENGTH_BYTES_LENGTH < file_size) {
    const data_length_bytes = data.slice(
      pointer,
      pointer + LENGTH_BYTES_LENGTH
    );
    const data_length = struct.unpack(">L", data_length_bytes)[0];
    pointer += LENGTH_BYTES_LENGTH;

    const fourcc = data.slice(pointer, pointer + CHUNK_FOURCC_LENGTH);
    pointer += CHUNK_FOURCC_LENGTH;

    const chunk_data = data.slice(pointer, pointer + data_length);
    pointer += data_length;

    const crc = data.slice(pointer, pointer + CRC_LENGTH);
    pointer += CRC_LENGTH;
    chunks.push({
      fourcc: fourcc,
      length_bytes: data_length_bytes,
      data: chunk_data,
      crc: crc
    });

    if (fourcc == END_SIGN) {
      break;
    }
  }

  return chunks;
}

function merge_chunks(chunks: Chunk[]): string {
  const merged = chunks
    .map(c => {
      return c.length_bytes + c.fourcc + c.data + c.crc;
    })
    .join("");

  return merged;
}

function get_exif(data: string): string | undefined {
  if (data.slice(0, 8) != PNG_HEADER) {
    throw new Error("Not PNG");
  }

  const chunks = split(data);
  const chunk = chunks.find(c => c.fourcc === EXIF_MARKER);
  return chunk && chunk.data;
}

function insert_exif_into_chunks(chunks: Chunk[], exif_bytes: string): Chunk[] {
  const exif_length_bytes = struct.pack("<L", [exif_bytes.length]);
  const exif_data = EXIF_MARKER + exif_bytes;
  const exif_data_array = [];
  for (let i = 0; i < exif_data.length; i++) {
    exif_data_array.push(exif_data.charCodeAt(i));
  }
  const crc = struct
    .pack("<L", [crc32_buf(exif_data_array as any, 0)])
    .split("")
    .reverse()
    .join("");
  const exif_chunk: Chunk = {
    fourcc: EXIF_MARKER,
    length_bytes: exif_length_bytes,
    data: exif_bytes,
    crc: crc
  };

  const chunk_index = chunks.findIndex(c => c.fourcc === EXIF_MARKER);
  if (chunk_index >= 0) {
    chunks.splice(chunk_index, 1, exif_chunk);
  } else {
    chunks.splice(-1, 0, exif_chunk);
  }

  return chunks;
}

function insert(png_bytes: string, exif_bytes: string): string {
  const EXIF_CODE = "Exif\x00\x00";
  if (exif_bytes.startsWith(EXIF_CODE)) {
    exif_bytes = exif_bytes.slice(6);
  }
  const chunks = split(png_bytes);
  const new_chunks = insert_exif_into_chunks(chunks, exif_bytes);
  const merged = merge_chunks(new_chunks);
  const new_png_bytes = PNG_HEADER + merged;
  return new_png_bytes;
}

function remove(png_bytes: string): string {
  const chunks = split(png_bytes).filter(c => c.fourcc !== EXIF_MARKER);
  const merged = merge_chunks(chunks);
  const new_png_bytes = PNG_HEADER + merged;
  return new_png_bytes;
}

export default {
  PNG_HEADER,
  insert,
  remove,
  get_exif
};
