require("dotenv").config();

const app = require("express")();
const bodyParser = require("body-parser");
const fs = require("fs");
const multiparty = require("multiparty");
const uuidv4 = require("uuid/v4");

const S3Service = require("./src/services/S3");
const ImageService = require("./src/services/image");

const s3Service = new S3Service(process.env.BUCKET);
const imageService = new ImageService();

app.use(bodyParser.json());

const displayStatus = () => ({
  status: `OK`,
  app_name: process.env.APP_NAME,
  bucket: process.env.BUCKET,
  debug: process.env.DEBUG === "true",
  aws_config_set: process.env.AWS_REGION !== undefined
});

function handleServiceException(res, error) {
  return res.status(500).send({ error: error.message });
}

app.get("/status", (req, res) => {
  return res.status(200).send(displayStatus());
});

app.post("/upload", (req, res) => {
  const form = new multiparty.Form();
  form.parse(req, (err, fields, files) => {
    if (err) {
      return handleServiceException(res, error);
    }
    const file = files.file[0];
    const originalFileName = file.originalFilename;
    const fileExtension = originalFileName.substring(
      originalFileName.indexOf(".")
    );
    const newFileName = `${uuidv4()}${fileExtension}`;

    fs.readFile(file.path, async (err, buffer) => {
      if (err) {
        return handleServiceException(res, error);
      }
      await s3Service.upload(buffer, newFileName);
      return res.status(200).send({ uuid: newFileName });
    });
  });
});

app.get("/resize", async (req, res) => {
  const fileName = req.query && req.query.f;
  if (!fileName) {
    return handleServiceException(
      res,
      new Error("Image ID must be specified!")
    );
  }
  const quality = (req.query && +req.query.q) || 100;
  const type = req.query && req.query.t;
  const size = {
    w: (req && +req.query.w) || null,
    h: (req && +req.query.h) || null
  };
  try {
    const imageData = await s3Service.fetch(fileName);
    let data = await imageService.resize(imageData.image, size, quality, type);
    const img = new Buffer(data.image.buffer, "base64");

    res.writeHead(200, { "Content-Type": data.contentType });
    return res.end(img);
  } catch (error) {
    return handleServiceException(res, error);
  }
});

app.get("/fetch", async (req, res) => {
  try {
    const fileName = req.query && req.query.f;
    let contentType;
    let img;
    let check;
    check = await s3Service.check(fileName);
    if (check !== "NotFound") {
      const imageData = await s3Service.fetch(fileName);
      contentType = imageData.contentType;
      img = new Buffer(imageData.image.buffer, "base64");

      res.writeHead(200, { "Content-Type": contentType });

      return res.end(img);
    }
    /* if requested name not found, try with new extension */
    const requestedExtension = fileName.split(".")[
      fileName.split(".").length - 1
    ];
    const originalName = fileName.replace(`.${requestedExtension}`, "");
    check = await s3Service.check(originalName);
    if (check === "NotFound") {
      throw new Error("404");
    }
    const imageData = await s3Service.fetch(originalName);
    let data = await imageService.convert(imageData.image, requestedExtension);
    img = new Buffer(data.image.buffer, "base64");

    res.writeHead(200, { "Content-Type": data.contentType });
    return res.end(img);
  } catch (error) {
    if (error && error.message === "404") {
      return res
        .status(404)
        .send({ error: "The specified key does not exist." });
    }
    return handleServiceException(res, error);
  }
});

const server = app.listen(3000, () =>
  console.log(`Listening on http://localhost:${server.address().port}`)
);

module.exports = {
  server
};
