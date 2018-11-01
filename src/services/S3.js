const AWS = require("aws-sdk");

const s3Errors = ["NotFound", "NoSuchKey", "Forbidden"];

const checkExists = (s3, bucketName, fileName) =>
  new Promise((res, rej) => {
    s3.headObject(
      {
        Bucket: bucketName,
        Key: fileName
      },
      (err, metadata) => {
        if (err && s3Errors.indexOf(err.code) > -1) {
          return res(err.code);
        } else if (err) {
          return rej(err);
        }

        return res(metadata);
      }
    );
  });

const getS3 = (s3, bucketName, fileName) =>
  new Promise((res, rej) => {
    s3.getObject(
      {
        Bucket: bucketName,
        Key: fileName
      },
      (err, data) => {
        if (err) {
          return rej(err);
        }

        const contentType = data.ContentType;
        const image = data.Body;

        return res({ image, contentType });
      }
    );
  });

const putS3 = (s3, bucketName, fileBuffer, filename) =>
  new Promise((res, rej) => {
    const params = {
      Bucket: bucketName,
      Key: filename,
      Body: fileBuffer,
      ACL: "public-read"
    };

    s3.putObject(params, (err, data) => {
      if (err) {
        return rej(err);
      }

      return res({ data });
    });
  });

class S3Service {
  constructor(bucketName) {
    this._S3 = new AWS.S3();
    this._bucketName = bucketName;
  }

  check(fileName) {
    return checkExists(this._S3, this._bucketName, fileName);
  }

  upload(fileBuffer, filename) {
    if (!fileBuffer) {
      return Promise.reject("file not specified");
    }
    return Promise.resolve(
      putS3(this._S3, this._bucketName, fileBuffer, filename)
    );
  }

  async fetch(fileName) {
    if (!fileName) {
      return Promise.reject("Filename not specified");
    }
    try {
      return getS3(this._S3, this._bucketName, fileName);
    } catch (err) {
      throw new Error("Invalid File");
    }
  }
}

module.exports = S3Service;
