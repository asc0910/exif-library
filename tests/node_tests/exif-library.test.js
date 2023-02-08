const fs = require("fs");
const jpeg = require('jpeg-js');
const exifLib = require('../../dist/exif-library');

const ZEROTH_IFD = {
  [exifLib.TagNumbers.ImageIFD.Software]: "exif-library",
  [exifLib.TagNumbers.ImageIFD.Make]: "Make",
  [exifLib.TagNumbers.ImageIFD.Model]: "XXX-XXX",
  [exifLib.TagNumbers.ImageIFD.ResolutionUnit]: 65535,
  [exifLib.TagNumbers.ImageIFD.BitsPerSample]: [24, 24, 24],
  [exifLib.TagNumbers.ImageIFD.XResolution]: [4294967295, 1],
  [exifLib.TagNumbers.ImageIFD.BlackLevelDeltaH]: [[1, 1], [1, 1], [1, 1]],
};

const EXIF_IFD = {
  [exifLib.TagNumbers.ExifIFD.DateTimeOriginal]: "2099:09:29 10:10:10",
  [exifLib.TagNumbers.ExifIFD.LensMake]: "LensMake",
  [exifLib.TagNumbers.ExifIFD.OECF]: "\xaa\xaa\xaa\xaa\xaa\xaa",
  [exifLib.TagNumbers.ExifIFD.Sharpness]: 65535,
  [exifLib.TagNumbers.ExifIFD.ISOSpeed]: 4294967295,
  [exifLib.TagNumbers.ExifIFD.ExposureTime]: [4294967295, 1],
  [exifLib.TagNumbers.ExifIFD.LensSpecification]: [[1, 1], [1, 1], [1, 1], [1, 1]],
  [exifLib.TagNumbers.ExifIFD.ExposureBiasValue]: [2147483647, -2147483648],
};

const GPS_IFD = {
  [exifLib.TagNumbers.GPSIFD.GPSVersionID]: [0, 0, 0, 1],
  [exifLib.TagNumbers.GPSIFD.GPSAltitudeRef]: 1,
  [exifLib.TagNumbers.GPSIFD.GPSDateStamp]: "1999:99:99 99:99:99",
  [exifLib.TagNumbers.GPSIFD.GPSDifferential]: 65535,
  [exifLib.TagNumbers.GPSIFD.GPSLatitude]: [4294967295, 1],
};

const FIRST_IFD = {
  [exifLib.TagNumbers.ImageIFD.Software]: "PIL",
  [exifLib.TagNumbers.ImageIFD.Make]: "Make",
  [exifLib.TagNumbers.ImageIFD.Model]: "XXX-XXX",
  [exifLib.TagNumbers.ImageIFD.BitsPerSample]: [24, 24, 24],
  [exifLib.TagNumbers.ImageIFD.BlackLevelDeltaH]: [[1, 1], [1, 1], [1, 1]],
};

const INTEROP_IFD = { [exifLib.TagNumbers.InteropIFD.InteroperabilityIndex]: "R98" };

const EXIF_OBJ = {
  "0th": ZEROTH_IFD,
  "Exif": EXIF_IFD,
  "GPS": GPS_IFD,
  "1st": FIRST_IFD,
  "Interop": INTEROP_IFD,
};

// test('"load" returns a object contains IFD -- 1', () => {
//   const jpegBytes = fs.readFileSync("./tests/files/r_canon.jpg").toString("binary");
//   const exifObj = exifLib.load(jpegBytes);
//   expect(Object.keys(exifObj)).toContain('0th');
// });

// test('"load" returns correct value" -- 1', () => {
//   const exifBytes = 'Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00\x02\x01\x00\x00\x04\x00\x00\x00\x01\x00\x00\x00\n\x01\x01\x00\x04\x00\x00\x00\x01\x00\x00\x00\n\x00\x00\x00\x00';
//   const correctObj = {
//     '0th': {
//       [exifLib.TagNumbers.ImageIFD.ImageWidth]: 10,
//       [exifLib.TagNumbers.ImageIFD.ImageLength]: 10
//     }
//   };
//   const exifObj = exifLib.load(exifBytes);
//   expect(exifObj).toEqual(correctObj);
// });

// test('"dump" returns correct value" -- 1', () => {
//   const exifObj = {
//     '0th': {
//       [exifLib.TagNumbers.ImageIFD.ImageWidth]: 10,
//       [exifLib.TagNumbers.ImageIFD.ImageLength]: 10
//     }
//   };
//   const exifBytes = exifLib.dump(exifObj);
//   const correctBytes = 'Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00\x02\x01\x00\x00\x04\x00\x00\x00\x01\x00\x00\x00\n\x01\x01\x00\x04\x00\x00\x00\x01\x00\x00\x00\n\x00\x00\x00\x00';
//   expect(exifBytes).toBe(correctBytes);
// });

// test('"dump" throws "ValueConvertError"" -- 1', () => {
//   const exifObj = {
//     '0th': {
//       [exifLib.TagNumbers.ImageIFD.ImageWidth]: "10"
//     }
//   };
//   expect(
//     () => { exifLib.dump(exifObj); }
//   ).toThrow(exifLib.ValueConvertError);
// });

// test('Compare "load" output with some correct values - BIG ENDIAN FILE - 1', () => {
//   const jpegBytes = fs.readFileSync("./tests/files/r_canon.jpg").toString("binary");
//   const exifObj = exifLib.load(jpegBytes);
//   expect(exifObj['0th'][exifLib.TagNumbers.ImageIFD.Make]).toBe('Canon');
//   expect(exifObj['0th'][exifLib.TagNumbers.ImageIFD.Orientation]).toBe(1);
//   expect(exifObj['Exif'][exifLib.TagNumbers.ExifIFD.ExposureTime]).toEqual([1, 50]);
//   expect(exifObj['Exif'][exifLib.TagNumbers.ExifIFD.PixelXDimension]).toBe(4352);
// });

// test('Compare "load" output with soem correct values - LITTLE ENDIAN FILE - 1', () => {
//   const jpegBytes = fs.readFileSync("./tests/files/r_sony.jpg").toString("binary");
//   const exifObj = exifLib.load(jpegBytes);
//   expect(exifObj['0th'][exifLib.TagNumbers.ImageIFD.Make]).toBe('SONY');
//   expect(exifObj['0th'][exifLib.TagNumbers.ImageIFD.Orientation]).toBe(1);
//   expect(exifObj['Exif'][exifLib.TagNumbers.ExifIFD.ExposureTime]).toEqual([1, 125]);
//   expect(exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormatLength]).toBe(13127);
// });

// test('round trip "load" and "dump" -- 1', () => {
//   const jpegBytes = fs.readFileSync("./tests/files/r_sony.jpg").toString("binary");
//   const exifObj = exifLib.load(jpegBytes);
//   const exifBytes = exifLib.dump(exifObj);
//   const _exifObj = exifLib.load(exifBytes);

//   // remove pointer values
//   delete exifObj['0th'][exifLib.TagNumbers.ImageIFD.ExifTag];
//   delete _exifObj['0th'][exifLib.TagNumbers.ImageIFD.ExifTag];
//   delete exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormat];
//   delete _exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormat];
//   delete exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormatLength];
//   delete _exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormatLength];
//   delete exifObj['Exif'][exifLib.TagNumbers.ExifIFD.InteroperabilityTag];
//   delete _exifObj['Exif'][exifLib.TagNumbers.ExifIFD.InteroperabilityTag];

//   expect(exifObj).toEqual(_exifObj);
// });

// test('round trip "dump" and "load" -- 1', () => {
//   console.log(EXIF_OBJ.thumbnail.length)
//   let exifObj = {};
//   Object.assign(exifObj, EXIF_OBJ);
//   const exifBytes = exifLib.dump(EXIF_OBJ);
//   const _exifObj = exifLib.load(exifBytes);

//   // remove pointer values
//   delete exifObj['0th'][exifLib.TagNumbers.ImageIFD.ExifTag];
//   delete _exifObj['0th'][exifLib.TagNumbers.ImageIFD.ExifTag];
//   delete exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormat];
//   delete _exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormat];
//   delete exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormatLength];
//   delete _exifObj['1st'][exifLib.TagNumbers.ImageIFD.JPEGInterchangeFormatLength];
//   delete exifObj['Exif'][exifLib.TagNumbers.ExifIFD.InteroperabilityTag];
//   delete _exifObj['Exif'][exifLib.TagNumbers.ExifIFD.InteroperabilityTag];
//   delete exifObj['thumbnail'];
//   delete _exifObj['thumbnail'];

//   expect(exifObj).toEqual(exifObj);
// });

// test('success remove -- 1', () => {
//   const jpegBytes = fs.readFileSync("./tests/files/r_pana.jpg").toString("binary");
//   const exifObj = exifLib.load(jpegBytes);
//   expect(Object.keys(exifObj)).toContain('0th');
//   const jpegBytesRemovedExif = exifLib.remove(jpegBytes);
//   const exifObjRemovedExif = exifLib.load(jpegBytesRemovedExif);
//   expect(exifObjRemovedExif).toEqual({});
// });

// test('success insert -- 1', () => {
//   const jpegBytes = fs.readFileSync("./tests/files/noexif.jpg").toString("binary");
//   const exifBytes = 'Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00\x02\x01\x00\x00\x04\x00\x00\x00\x01\x00\x00\x00\n\x01\x01\x00\x04\x00\x00\x00\x01\x00\x00\x00\n\x00\x00\x00\x00';
//   const jpegBytesExifInsert = exifLib.insert(exifBytes, jpegBytes);
//   const buffer = Buffer.from(jpegBytesExifInsert, 'ascii');
//   jpeg.decode(buffer, true);
//   expect(jpegBytesExifInsert).toMatch(exifBytes);
// });

// test('success insert -- webp', () => {
//   const webpBytes = fs.readFileSync("./tests/files/pil_rgb.webp").toString("binary");
//   const exifBytes = 'Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00\x02\x01\x00\x00\x04\x00\x00\x00\x01\x00\x00\x00\n\x01\x01\x00\x04\x00\x00\x00\x01\x00\x00\x00\n\x00\x00\x00\x00';
//   const webpBytesExifInsert = exifLib.insert(exifBytes, webpBytes);
//   const buffer = Buffer.from(webpBytesExifInsert, 'ascii');
//   // jpeg.decode(buffer, true);
//   fs.writeFileSync("./tests/files/pil_rgb_with_metadata.webp", buffer)
//   expect(webpBytesExifInsert).toMatch(exifBytes);
//   // const webpBytes1 = fs.readFileSync("./tests/files/pil_rgb_with_metadata.webp").toString("binary");
//   // const exifBytes1 = exifLib.load(webpBytes1);

// });


// test('test read / write -- webp', () => {
//   const exifObj = EXIF_OBJ;
//   const exifBytes = exifLib.dump(exifObj);
//   const webpBytes1 = fs.readFileSync("./tests/files/example.webp").toString("binary");
//   const webpBytesExifInserted = exifLib.insert(exifBytes, webpBytes1)
//   fs.writeFileSync("./tests/files/example_with_metadata_changed.webp", webpBytesExifInserted, 'binary')
//   const exifObj1 = exifLib.load(webpBytesExifInserted)
//   console.log(exifObj1)
// });

// test('test read / write -- jpg', () => {
//   const exifObj = EXIF_OBJ
//   const exifBytes = exifLib.dump(exifObj);
//   const jpgBytes1 = fs.readFileSync("./tests/files/L01.jpg").toString("binary");
//   const jpgBytesExifInserted = exifLib.insert(exifBytes, jpgBytes1)
//   fs.writeFileSync("./tests/files/L01_with_metadata_changed.jpg", jpgBytesExifInserted, 'binary')
//   const exifObj1 = exifLib.load(jpgBytesExifInserted)
//   console.log(exifObj1)
// });


// test('test read / write -- png', () => {
//   const exifObj = {
//     '0th': {
//       '270': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
//     }
//   };
//   const exifBytes = exifLib.dump(exifObj);
//   const pngBytes1 = fs.readFileSync("./tests/files/1.png").toString("binary");
//   const pngBytesExifInserted = exifLib.insert(exifBytes, pngBytes1)
//   fs.writeFileSync("./tests/files/1_with_metadata_changed.png", pngBytesExifInserted, 'binary')
//   const exifObj1 = exifLib.load(pngBytesExifInserted)
//   console.log(exifObj1)
// });


// test('test read', () => {
//   const pngBytes = fs.readFileSync("./tests/files/test1.png").toString("binary");
//   const exifObj = exifLib.load(pngBytes)
//   console.log(exifObj)
// });

test('test custom', () => {
  const pngBytes = fs.readFileSync("./tests/files/1.png").toString("binary");
  const pngBytesExifAdded = exifLib.insertCustomMeta('testmetadata', pngBytes)
  fs.writeFileSync("./tests/files/1_with_metadata_changed.png", pngBytesExifAdded, 'binary')
  let exif;
  exif = exifLib.loadCustomMeta(pngBytesExifAdded);
  console.log(exif);
  const webpBytes = fs.readFileSync("./tests/files/example.webp").toString("binary");
  const webpBytesExifAdded = exifLib.insertCustomMeta('testmetadata', webpBytes)
  fs.writeFileSync("./tests/files/example_with_metadata_changed.webp", webpBytesExifAdded, 'binary')
  exif = exifLib.loadCustomMeta(webpBytesExifAdded);
  console.log(exif);
  const jpgBytes = fs.readFileSync("./tests/files/L01.jpg").toString("binary");
  const jpgBytesExifAdded = exifLib.insertCustomMeta('testmetadata', jpgBytes)
  fs.writeFileSync("./tests/files/L01_with_metadata_changed.jpg", jpgBytesExifAdded, 'binary')
  exif = exifLib.loadCustomMeta(jpgBytesExifAdded);
  console.log(exif);
});

