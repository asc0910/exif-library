/* eslint-disable @typescript-eslint/camelcase */
import * as struct from "./struct";
import { toHexFormat } from "./utils";

interface Chunk {
  fourcc: string;
  length_bytes: string;
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
      length_bytes: chunkLengthBytes,
      data: chunkData
    });
    const padding = chunkLength % 2 ? 1 : 0;
    pointer += chunkLength + padding;
  }

  return chunks;
}

function merge_chunks(chunks: Chunk[]): string {
  const merged = chunks
    .map(c => {
      return (
        c.fourcc + c.length_bytes + c.data + (c.data.length % 2 ? "\x00" : "")
      );
    })
    .join("");

  return merged;
}

function get_size_from_vp8x(chunk: Chunk): [number, number] {
  const width_minus_one_bytes = chunk["data"].slice(-6, -3) + "\x00";
  const width_minus_one = struct.unpack("<L", width_minus_one_bytes)[0];
  const width = width_minus_one + 1;
  const height_minus_one_bytes = chunk["data"].slice(-3) + "\x00";
  const height_minus_one = struct.unpack("<L", height_minus_one_bytes)[0];
  const height = height_minus_one + 1;
  return [width, height];
}

function get_size_from_vp8(chunk: Chunk): [number, number] {
  const BEGIN_CODE = "\x9d\x01\x2a";
  const begin_index = chunk["data"].indexOf(BEGIN_CODE);
  if (begin_index === -1) {
    throw new Error("wrong VP8");
  } else {
    const BEGIN_CODE_LENGTH = BEGIN_CODE.length;
    const LENGTH_BYTES_LENGTH = 2;
    const length_start = begin_index + BEGIN_CODE_LENGTH;
    const width_bytes = chunk["data"].slice(
      length_start,
      length_start + LENGTH_BYTES_LENGTH
    );
    const width = struct.unpack("<H", width_bytes)[0];
    const height_bytes = chunk["data"].slice(
      length_start + LENGTH_BYTES_LENGTH,
      length_start + 2 * LENGTH_BYTES_LENGTH
    );
    const height = struct.unpack("<H", height_bytes)[0];
    return [width, height];
  }
}

function vp8L_contains_alpha(chunk_data: string): number {
  const flag = (chunk_data.charCodeAt(4) >> (5 - 1)) & 1;
  const contains = 1 * flag;
  return contains;
}

function get_size_from_vp8L(chunk: Chunk): [number, number] {
  const b1 = chunk["data"].charCodeAt(1);
  const b2 = chunk["data"].charCodeAt(2);
  const b3 = chunk["data"].charCodeAt(3);
  const b4 = chunk["data"].charCodeAt(4);

  const width_minus_one = ((b2 & 0x3f) << 8) | b1;
  const width = width_minus_one + 1;

  const height_minus_one = ((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6);
  const height = height_minus_one + 1;

  return [width, height];
}

function get_size_from_anmf(chunk: Chunk): [number, number] {
  const width_minus_one_bytes = chunk["data"].slice(6, 9) + "\x00";
  const width_minus_one = struct.unpack("<L", width_minus_one_bytes)[0];
  const width = width_minus_one + 1;
  const height_minus_one_bytes = chunk["data"].slice(9, 12) + "\x00";
  const height_minus_one = struct.unpack("<L", height_minus_one_bytes)[0];
  const height = height_minus_one + 1;
  return [width, height];
}

function set_vp8x(chunks: Chunk[]): Chunk[] {
  let width: number | null = null;
  let height: number | null = null;
  const flags = ["0", "0", "0", "0", "0", "0", "0", "0"]; // [0, 0, ICC, Alpha, EXIF, XMP, Anim, 0]

  chunks.forEach(chunk => {
    if (chunk["fourcc"] === "VP8X") {
      [width, height] = get_size_from_vp8x(chunk);
    } else if (chunk["fourcc"] === "VP8 ") {
      [width, height] = get_size_from_vp8(chunk);
    } else if (chunk["fourcc"] === "VP8L") {
      const is_rgba = vp8L_contains_alpha(chunk["data"]);
      if (is_rgba) {
        flags[3] = "1";
      }
      [width, height] = get_size_from_vp8L(chunk);
    } else if (chunk["fourcc"] === "ANMF") {
      [width, height] = get_size_from_anmf(chunk);
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

  const width_minus_one = width - 1;
  const height_minus_one = height - 1;

  if (chunks[0]["fourcc"] === "VP8X") {
    chunks.shift();
  }

  const header_bytes = "VP8X";
  const length_bytes = "\x0a\x00\x00\x00";
  const flags_bytes = struct.pack("<B", [parseInt(flags.join(""), 2)]);
  const padding_bytes = "\x00\x00\x00";
  const width_bytes = struct.pack("<L", [width_minus_one]).slice(0, 3);
  const height_bytes = struct.pack("<L", [height_minus_one]).slice(0, 3);

  const data_bytes = flags_bytes + padding_bytes + width_bytes + height_bytes;

  const vp8x_chunk = {
    fourcc: header_bytes,
    length_bytes: length_bytes,
    data: data_bytes
  };
  chunks.splice(0, 0, vp8x_chunk);
  return chunks;
}

function get_file_header(chunks: Chunk[]): string {
  const WEBP_HEADER_LENGTH = 4;
  const FOURCC_LENGTH = 4;
  const LENGTH_BYTES_LENGTH = 4;

  let length = WEBP_HEADER_LENGTH;
  chunks.forEach(chunk => {
    let data_length = struct.unpack("<L", chunk["length_bytes"])[0];
    data_length += data_length % 2 ? 1 : 0;
    length += FOURCC_LENGTH + LENGTH_BYTES_LENGTH + data_length;
  });
  const length_bytes = struct.pack("<L", [length]);
  const riff = "RIFF";
  const webp_header = "WEBP";
  const file_header = riff + length_bytes + webp_header;
  return file_header;
}

function get_exif(data: string): string | null {
  if (data.slice(0, 4) != "RIFF" || data.slice(8, 12) != "WEBP") {
    throw new Error("Not WebP");
  }

  if (data.slice(12, 16) != "VP8X") {
    throw new Error("doesnot have exif");
  }

  const webp_length_bytes = data.slice(4, 8);
  const webp_length = struct.unpack("<L", webp_length_bytes)[0];
  const RIFF_HEADER_SIZE = 8;
  const file_size = RIFF_HEADER_SIZE + webp_length;

  const start = 12;
  let pointer = start;
  const CHUNK_FOURCC_LENGTH = 4;
  const LENGTH_BYTES_LENGTH = 4;

  while (pointer < file_size) {
    const fourcc = data.slice(pointer, pointer + CHUNK_FOURCC_LENGTH);
    pointer += CHUNK_FOURCC_LENGTH;
    const chunk_length_bytes = data.slice(
      pointer,
      pointer + LENGTH_BYTES_LENGTH
    );
    let chunk_length = struct.unpack("<L", chunk_length_bytes)[0];
    if (chunk_length % 2) {
      chunk_length += 1;
    }
    pointer += LENGTH_BYTES_LENGTH;
    if (fourcc === "EXIF") {
      return data.slice(pointer, pointer + chunk_length);
    }
    pointer += chunk_length;
  }
  return null; // if there isn't exif, return None.
}

function insert_exif_into_chunks(chunks: Chunk[], exif_bytes: string): Chunk[] {
  const EXIF_HEADER = "EXIF";
  const exif_length_bytes = struct.pack("<L", [exif_bytes.length]);
  const exif_chunk: Chunk = {
    fourcc: EXIF_HEADER,
    length_bytes: exif_length_bytes,
    data: exif_bytes
  };

  let xmp_index: number | null = null;
  let animation_index: number | null = null;

  chunks.forEach((chunk, index) => {
    if (chunk["fourcc"] === "EXIF") chunks.splice(index, 1);
  });

  chunks.forEach((chunk, index) => {
    if (chunk["fourcc"] === "XMP ") xmp_index = index;
    else if (chunk["fourcc"] === "ANIM") animation_index = index;
  });
  if (xmp_index !== null) {
    chunks.splice(xmp_index, 0, exif_chunk);
  } else if (animation_index !== null) {
    chunks.splice(animation_index, 0, exif_chunk);
  } else {
    chunks.push(exif_chunk);
  }
  return chunks;
}

function insert(webp_bytes: string, exif_bytes: string): string {
  let chunks = split(webp_bytes);
  chunks = insert_exif_into_chunks(chunks, exif_bytes);
  chunks = set_vp8x(chunks);
  const file_header = get_file_header(chunks);
  const merged = merge_chunks(chunks);
  const new_webp_bytes = file_header + merged;
  return new_webp_bytes;
}

function remove(webp_bytes: string): string {
  let chunks = split(webp_bytes);
  chunks.forEach((chunk, index) => {
    if (chunk["fourcc"] === "EXIF") chunks.splice(index, 1);
  });
  chunks = set_vp8x(chunks);
  const file_header = get_file_header(chunks);
  const merged = merge_chunks(chunks);
  const new_webp_bytes = file_header + merged;
  return new_webp_bytes;
}

export default { get_exif, insert, remove };
