// Stub para testes unitários — pdfjs-dist usa ESM e não é compatível com Jest CJS
module.exports = {
  getDocument: jest.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
};
