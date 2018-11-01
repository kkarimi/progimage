const expect = require('chai').expect
const sinon = require('sinon')

const SANDBOX = sinon.createSandbox()

afterEach(() => {
  SANDBOX.restore()
})

module.exports = {
  expect,
  SANDBOX,
  sinon,
}
