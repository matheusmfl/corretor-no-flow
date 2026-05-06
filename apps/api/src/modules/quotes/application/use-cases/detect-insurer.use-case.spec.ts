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

  it('ITAU retorna supported: true e não retorna PORTO_SEGURO quando produto Itaú está explícito', async () => {
    const { useCase } = makeSut(
      'Orçamento de Seguro Auto\nItaú Seguro Auto\nSEGURADORA Itaú Seguros S.A.\nSegmento ITAÚ TRADICIONAL\n'
        + 'É uma marca licenciada da Porto Seguro',
    );
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(true);
    expect(result.detectedInsurer).toBe('ITAU');
    expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
  });

  it('MITSUI_SUMITOMO retorna supported: true e não retorna PORTO_SEGURO', async () => {
    const { useCase } = makeSut(
      'CNPJ: 61.198.164.0001/60 - Porto Seguro\nMITSUI SUMITOMO SEGUROS e PROTEÇÃO COMBINADA\nOrçamento de Seguro Auto\nSegmento MITSUI SUMITOMO SEGUROS',
    );
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(true);
    expect(result.detectedInsurer).toBe('MITSUI_SUMITOMO');
    expect(result.detectedInsurer).not.toBe('PORTO_SEGURO');
    expect(result.family).toBe('porto');
  });

  it('seguradora não suportada retorna supported: false', async () => {
    const { useCase } = makeSut('SulAmérica Seguros S/A cotação automóvel chassi placa FIPE');
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(false);
  });

  it('Tokio Marine retorna supported: true', async () => {
    const { useCase } = makeSut('Cotação Tokio Marine Processo SUSEP chassi placa FIPE');
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(true);
    expect(result.detectedInsurer).toBe('TOKIO_MARINE');
  });

  it('texto vazio retorna supported: false', async () => {
    const { useCase } = makeSut('');
    const result = await useCase.execute('/fake/path.pdf');
    expect(result.supported).toBe(false);
    expect(result.detectedInsurer).toBeNull();
  });
});
