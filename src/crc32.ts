/* eslint-disable @typescript-eslint/camelcase */
function signed_crc_table(): Int32Array {
  let c = 0;
  const table = new Array(256);

  for (let n = 0; n != 256; ++n) {
    c = n;
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }

  return new Int32Array(table);
}

const T = signed_crc_table();

export function crc32_bstr(bstr: string, seed: number): number {
  let C = seed ^ -1;
  const L = bstr.length - 1;
  let i;
  for (i = 0; i < L; ) {
    C = (C >>> 8) ^ T[(C ^ bstr.charCodeAt(i++)) & 0xff];
    C = (C >>> 8) ^ T[(C ^ bstr.charCodeAt(i++)) & 0xff];
  }
  if (i === L) C = (C >>> 8) ^ T[(C ^ bstr.charCodeAt(i)) & 0xff];
  return (C ^ -1) >>> 0;
}

function crc32_buf_8(buf: Int32Array, seed: number): number {
  let C = seed ^ -1;
  const L = buf.length - 7;
  let i;
  for (i = 0; i < L; ) {
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
  }
  while (i < L + 7) C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
  return (C ^ -1) >>> 0;
}

export function crc32_buf(buf: Int32Array, seed: number): number {
  let C = seed ^ -1;
  const L = buf.length - 3;
  let i;
  for (i = 0; i < L; ) {
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
    C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
  }
  while (i < L + 3) C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
  return (C ^ -1) >>> 0;
}

export function crc32_str(str: string, seed: number): number {
  let C = seed ^ -1;
  let L, i, c, d;
  for (i = 0, L = str.length; i < L; ) {
    c = str.charCodeAt(i++);
    if (c < 0x80) {
      C = (C >>> 8) ^ T[(C ^ c) & 0xff];
    } else if (c < 0x800) {
      C = (C >>> 8) ^ T[(C ^ (192 | ((c >> 6) & 31))) & 0xff];
      C = (C >>> 8) ^ T[(C ^ (128 | (c & 63))) & 0xff];
    } else if (c >= 0xd800 && c < 0xe000) {
      c = (c & 1023) + 64;
      d = str.charCodeAt(i++) & 1023;
      C = (C >>> 8) ^ T[(C ^ (240 | ((c >> 8) & 7))) & 0xff];
      C = (C >>> 8) ^ T[(C ^ (128 | ((c >> 2) & 63))) & 0xff];
      C = (C >>> 8) ^ T[(C ^ (128 | ((d >> 6) & 15) | ((c & 3) << 4))) & 0xff];
      C = (C >>> 8) ^ T[(C ^ (128 | (d & 63))) & 0xff];
    } else {
      C = (C >>> 8) ^ T[(C ^ (224 | ((c >> 12) & 15))) & 0xff];
      C = (C >>> 8) ^ T[(C ^ (128 | ((c >> 6) & 63))) & 0xff];
      C = (C >>> 8) ^ T[(C ^ (128 | (c & 63))) & 0xff];
    }
  }
  return (C ^ -1) >>> 0;
}
