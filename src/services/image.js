const sharp = require("sharp");

const types = [
  { sharp: "webp", contentType: "image/webp" },
  { sharp: "jpeg", contentType: "image/jpeg" },
  { sharp: "png", contentType: "image/png" }
];

class ImageService {
  getImageType(type, def = "webp") {
    const found = types.find(item => item.sharp === type);

    if (!found && type === def) {
      return { sharp: def, contentType: `image/${def}` };
    }

    return found || this.getImageType(def, def);
  }
  convert(image, format) {
    if (!image) throw new Error("An Image must be specified");
    if (!format) throw new Error("Image format must be specified");
    const sharpFormat = this.getImageType(format, "webp");
    return new Promise((res, rej) => {
      sharp(new Buffer(image.buffer))
        [sharpFormat.sharp]()
        .toBuffer()
        .then(data => {
          return res({
            image: data,
            contentType: sharpFormat.contentType
          });
        })
        .catch(err => rej(err));
    });
  }
  resize(image, size, quality, type) {
    if (!image) throw new Error("An Image must be specified");
    if (!size) throw new Error("Image size must be specified");

    const sharpType = this.getImageType(type, "webp");

    return new Promise((res, rej) => {
      sharp(new Buffer(image.buffer))
        .resize(size.w, size.h)
        .resize({ fit: "inside" })
        [sharpType.sharp]({ quality: quality })
        .toBuffer()
        .then(data => {
          return res({
            image: data,
            contentType: sharpType.contentType
          });
        })
        .catch(err => rej(err));
    });
  }
}

module.exports = ImageService;
