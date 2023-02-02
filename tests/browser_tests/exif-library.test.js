const fs = require('fs');
const exifLib = require('../../dist/exif-library');

const timeout = 5000;
const jpegBinary = fs.readFileSync("./tests/files/r_canon.jpg").toString("binary");
const webpBinary = fs.readFileSync("./tests/files/pil_rgb.webp").toString("binary");
const exifLibPath = '../../dist/exif-library.js';

let page;
beforeAll(async () => {
  page = await global.__BROWSER__.newPage()
}, timeout);

afterAll(async () => {
  await page.close()
});

it('running puppeteer', async () => {
  await page.addScriptTag({
    content: "const x = 1 + 1;"
  });
});

it('exif-library is loaded', async () => {
  await page.addScriptTag({
    path: require.resolve(exifLibPath)
  });

  const browserOutput = await page.evaluate(() => {
    return exifLib;
  });
  expect(browserOutput).toBeTruthy();
});

it('should be same output from load on node and browser for jpeg ', async () => {
  const nodeOutput = exifLib.load(jpegBinary);
  await page.addScriptTag({
    path: require.resolve(exifLibPath)
  });

  const browserOutput = await page.evaluate((jpeg) => {
    return exifLib.load(jpeg);
  },
    jpegBinary
  );
  expect(browserOutput).toEqual(nodeOutput);
});

it('should be same output from load on node and browser for webp ', async () => {
  const nodeOutput = exifLib.load(webpBinary);
  await page.addScriptTag({
    path: require.resolve(exifLibPath)
  });

  const browserOutput = await page.evaluate((webp) => {
    return exifLib.load(webp);
  },
    webpBinary
  );
  expect(browserOutput).toEqual(nodeOutput);
});


it('should be same output from dump on node and browser for ', async () => {
  const exif = {
    '0th': {
      '256': 10,
      '257': 10
    }
  };
  const nodeOutput = exifLib.dump(exif);
  await page.addScriptTag({
    path: require.resolve(exifLibPath)
  });
  const browserOutput = await page.evaluate((exifObj) => {
    return exifLib.dump(exifObj);
  },
    exif
  );
  expect(browserOutput).toEqual(nodeOutput);
});


it('should be same output from insert on node and browser for jpg ', async () => {
  const exif = {
    '0th': {
      '256': 10,
      '257': 10
    }
  };
  const exifBinary = exifLib.dump(exif);
  const nodeOutput = exifLib.insert(exifBinary, jpegBinary);;
  await page.addScriptTag({
    path: require.resolve(exifLibPath)
  });
  const browserOutput = await page.evaluate((exif, jpeg) => {
    return exifLib.insert(exif, jpeg);
  },
    exifBinary,
    jpegBinary
  );
  expect(browserOutput).toEqual(nodeOutput);
});

it('should be same output from insert on node and browser for webp ', async () => {
  const exif = {
    '0th': {
      '256': 10,
      '257': 10
    }
  };
  const exifBinary = exifLib.dump(exif);
  const nodeOutput = exifLib.insert(exifBinary, webpBinary);;
  await page.addScriptTag({
    path: require.resolve(exifLibPath)
  });
  const browserOutput = await page.evaluate((exif, webp) => {
    return exifLib.insert(exif, webp);
  },
    exifBinary,
    webpBinary
  );
  expect(browserOutput).toEqual(nodeOutput);
});

it('should be same output from remove on node and browser for jpg', async () => {
  const nodeOutput = exifLib.remove(jpegBinary);
  await page.addScriptTag({
    path: require.resolve(exifLibPath)
  });
  const browserOutput = await page.evaluate((jpeg) => {
    return exifLib.remove(jpeg);
  },
    jpegBinary
  );
  expect(browserOutput).toEqual(nodeOutput);
});


it('should be same output from remove on node and browser for webp ', async () => {
  const nodeOutput = exifLib.remove(webpBinary);
  await page.addScriptTag({
    path: require.resolve(exifLibPath)
  });
  const browserOutput = await page.evaluate((webp) => {
    return exifLib.remove(webp);
  },
    webpBinary
  );
  expect(browserOutput).toEqual(nodeOutput);
});
