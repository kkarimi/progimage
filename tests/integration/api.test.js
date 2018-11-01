const app = require('../..').server
const request = require('supertest')

const S3Service = require('../../src/services/S3');
const ImageService = require('../../src/services/image');
const fs = require('fs');

const { expect, SANDBOX } = require('../setup');

describe('API', () => {
  let result
  let createdImageUUID

  after(() => {
    result = null
    createdImageUUID = null
    SANDBOX.restore()
  });

  describe('#status', () => {
    it('should get status', async () => {
      result = await request(app).get('/status')

      expect(result.status).to.eql(200)
      expect(result.body).to.have.property('app_name').to.eql('progImage')
      expect(result.body).to.have.property('status').to.eql('OK')
    })
  })

  describe('#upload', () => {
    it('should be able to upload image', async () => {
      result = await request(app)
        .post('/upload')
        .attach('file', 'tests/fixtures/couch.jpg')

      expect(result.status).to.eql(200)
      expect(result.body).to.have.property('uuid').have.length(40)
      expect(result.body).to.have.property('uuid').contain('.jpg')
    })
  })

  describe('#fetch', () => {
    it('should be able to upload and fetch an image', async () => {
      result = await request(app)
        .post('/upload')
        .attach('file', 'tests/fixtures/couch.jpg')

      createdImageUUID = result.body.uuid

      result = await request(app)
        .get('/fetch')
        .query({ 'f': createdImageUUID })

      expect(result.status).to.eql(200)
      expect(result.header)
        .to.have.property('content-type')
        .to.eql('application/octet-stream')
      expect(result.body).to.not.be.empty;
    })

    it('should be able to upload image and then fetch with different extension', async () => {
      result = await request(app)
        .post('/upload')
        .attach('file', 'tests/fixtures/couch.jpg')

      createdImageUUID = result.body.uuid

      result = await request(app)
        .get('/fetch')
        .query({ 'f': `${createdImageUUID}.png` })

      expect(result.status).to.eql(200)
      expect(result.header)
        .to.have.property('content-type')
        .to.eql('image/png')
      expect(result.body).to.not.be.empty;
    })

    it('should return 500 if S3 could not retrieve requested file', async () => {
      result = await request(app)
        .post('/upload')
        .attach('file', 'tests/fixtures/couch.jpg')

      createdImageUUID = result.body.uuid

      SANDBOX.stub(S3Service.prototype, "fetch")
        .throws(new Error('S3_ERROR'));

      result = await request(app)
        .get('/fetch')
        .query({ 'f': createdImageUUID })

      expect(result.status).to.eql(500)
      expect(result.body).to.
        have.property('error').to.eql('S3_ERROR')
    })

    it('should return 500 if incorrect image ID', async () => {
      result = await request(app)
        .get('/fetch')
        .query({ 'f': '011' })
      expect(result.status).to.eql(404)
    })
  })

  describe('#resize', () => {
    it('should successfully upload, then request a resize transformation', async () => {
      const resizeSpy = SANDBOX.spy(ImageService.prototype, "resize")

      result = await request(app)
        .post('/upload')
        .attach('file', 'tests/fixtures/couch.jpg')

      createdImageUUID = result.body.uuid

      result = await request(app)
        .get('/resize')
        .query({ 'f': createdImageUUID })
        .query({ 'w': 500 })

      expect(resizeSpy.called).to.eql(true)
      expect(result.status).to.eql(200)
      expect(result.header)
        .to.have.property('content-type')
        .to.eql('image/webp')
      expect(result.body).to.not.be.empty;
    })
    it('should return 500 if image service throws error', async () => {
      const resizeStub = SANDBOX.stub(ImageService.prototype, "resize")
      resizeStub.throws(new Error('IMAGE_SERVICE_ERROR'))
      result = await request(app)
        .post('/upload')
        .attach('file', 'tests/fixtures/couch.jpg')

      createdImageUUID = result.body.uuid

      result = await request(app)
        .get('/resize')
        .query({ 'f': createdImageUUID })
        .query({ 'w': 500 })

      expect(resizeStub.called).to.eql(true)
      expect(result.status).to.eql(500)
      expect(result.body).to.not.be.empty;
      expect(result.body)
        .to.have.property('error')
        .to.eql('IMAGE_SERVICE_ERROR')
    })
    it('should return 500 without an image ID', async () => {
      result = await request(app)
        .get('/resize')
        .query({ 'f': null })
      expect(result.status).to.eql(500)
      expect(result.body.error).to.eql('Image ID must be specified!')
    })
  })
})
