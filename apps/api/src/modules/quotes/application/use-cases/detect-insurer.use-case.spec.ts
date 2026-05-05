import { DetectInsurerUseCase } from './detect-insurer.use-case';
import { PdfExtractorService } from '../services/pdf-extractor.service';

const makeSut = (text: string) => {
  const extractor = { extractText: jest.fn().mockResolvedValue(text) } as unknown as PdfExtractorService;
  const useCase = new DetectInsurerUseCase(extractor);
  return { useCase, extractor };
};

describe('DetectInsurerUseCase — campo supported', () => {
  it('BRADESCO retorna supported: true', async () => {
    const { useCase } = makeSut('BRADESCO SEGUROS S.A. Proposta de seguro auto');
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(true);
    expect(result.detectedInsurer).toBe('BRADESCO');
  });

  it('PORTO_SEGURO retorna supported: true', async () => {
    const { useCase } = makeSut('Porto Seguro Cia de Seguros Gerais CNPJ 61.198.164/0001-60');
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(true);
    expect(result.detectedInsurer).toBe('PORTO_SEGURO');
  });

  it('AZUL retorna supported: true', async () => {
    const { useCase } = makeSut(
      'Azul Seguro Auto Produto: Auto Tradicional CNPJ 61.198.164/0001-60',
    );
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(true);
    expect(result.detectedInsurer).toBe('AZUL');
  });

  it('seguradora não suportada retorna supported: false', async () => {
    const { useCase } = makeSut('Tokio Marine Seguradora S.A.');
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(false);
  });

  it('texto vazio retorna supported: false', async () => {
    const { useCase } = makeSut('');
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(false);
    expect(result.detectedInsurer).toBeNull();
  });
});
