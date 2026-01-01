// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: '',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
})

// Mock PublicKeyCredential for passkey support (on both global and window)
const MockPublicKeyCredential = class MockPublicKeyCredential {
  static isUserVerifyingPlatformAuthenticatorAvailable() {
    return Promise.resolve(true)
  }
  
  static isConditionalMediationAvailable() {
    return Promise.resolve(true)
  }
}

// Delete existing if present, then define
if (global.PublicKeyCredential) {
  delete global.PublicKeyCredential
}
if (window.PublicKeyCredential) {
  delete window.PublicKeyCredential
}

global.PublicKeyCredential = MockPublicKeyCredential
window.PublicKeyCredential = MockPublicKeyCredential

