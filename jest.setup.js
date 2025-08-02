// Jest setup file for DOM mocking
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock canvas and context
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: '',
  globalAlpha: 1,
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  clearRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
}));

// Mock DOM elements
document.getElementById = jest.fn((id) => {
  const mockElement = {
    textContent: '',
    style: { display: '' },
    width: 400,
    height: 400,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  
  if (id === 'gameCanvas') {
    mockElement.getContext = global.HTMLCanvasElement.prototype.getContext;
  }
  
  return mockElement;
});

// Mock setInterval and clearInterval
global.setInterval = jest.fn();
global.clearInterval = jest.fn();
