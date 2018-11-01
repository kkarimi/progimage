# ProgImage Microservice

### Prerequisites

1. [Node](http://nodejs.org/) (at least version 8)
1. [NPM](https://npmjs.org/)
1. (Optional) [Yarn](https://yarnpkg.com/en/) as an alternative for package manager

```sh
node --version
v8.10.0

npm --version
5.6.0

yarn --version
1.0.2
```

### Installation

Start with cloning this repo on your local machine:

```sh
$ git clone https://github.com/kkarimi/progimage.git
$ cd progimage
```

Then install all the Node dependencies using npm or Yarn

```sh
$ npm install
$ yarn
```

### Images Bucket

This project is making use of a pre-existing S3 bucket from where fetching
the images to be processed and deliver to the client.
If you don't have an S3 already, create one from your AWS dashboard.

## Usage

### dotENV

For your local development you will need a `.env` file containing your S3 bucket name.
Rename the `.env.example` file in this project to be `.env` first, then replace with your AWS config.

```env

APP_NAME='progImage'
DEBUG='true'
BUCKET='bucket'
AWS_ACCESS_KEY_ID=''
AWS_SECRET_ACCESS_KEY=''
AWS_REGION='eu-west-1'
```

### Serving the app

```sh
npm run start
```

## API

1. Health check

[`http://localhost:3000/status`](http://localhost:3000/status)

You should be able to see a JSON information to prove that your app is actually
up and running.

### Upload (POST / form-data)

[`http://localhost:3000/upload`](http://localhost:3000/upload)

Payload:

```json
file: `file.jpg`
```

This uploads the file to S3 storage and returns a randomly generated UUID

**Example**:

```js
  { uuid: '4e934952-f3f3-4ce6-aaeb-9260bdabb29d' }
```

### Resize

`http://localhost:3000/resize?f=FILE-NAME&w=WIDTH&h=HEIGHT&q=QUALITY&t=TYPE`

| Query string name | Type   | Required | Description |
| ------------------ | ------ | -------- | ----------- |
| `f`                | String | Yes      | The complete image name uploaded to your S3 bucket (eg. placeholder.jpg)
| `w`                | Number | No       | The image width
| `h`                | Number | No       | The image height
| `q`                | Number | No       | The image quality (between 1-100)
| `t`                | String | No       | The image type (default is webp) Available values are [webp, jpeg and png]

Note. If the Type is different from your original image type, it will
automatically be converted into the new format.

**Example**:

`http://localhost:3000/resize?f=placeholder.png&w=600&q=75&t=jpeg`

Assuming that you have an image called `placeholder.png` on your S3 bucket:

### Fetch

This endpoints returns the image from storage using a UUID:

**Example**:

`http://localhost:3000/fetch?f=example.jpg`

Different image formats can be returned by using a different image file type as an extension on the image request URL:

`http://localhost:3000/fetch?f=example.jpg.png`

### Automated tests

Currently this service is tested end-to-end using Mocha framework, you may run the tests below (`.env` file must be set)

```sh
npm run test
```

Current coverage:

File      |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
----------|----------|----------|----------|----------|-------------------|
All files |    97.14 |    89.66 |      100 |      100 |                   |
 index.js |    97.14 |    89.66 |      100 |      100 |          36,43,58 |

## License

[MIT License](https://progimage.mit-license.org/2018)
