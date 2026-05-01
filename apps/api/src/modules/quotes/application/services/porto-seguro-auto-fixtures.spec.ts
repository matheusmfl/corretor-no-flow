import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES_DIR = join(__dirname, 'fixtures');

describe('Porto Seguro AUTO fixtures', () => {
  describe('complete', () => {
    let text: string;

    beforeAll(() => {
      text = readFileSync(join(FIXTURES_DIR, 'porto-seguro-auto-complete.txt'), 'utf8');
    });

    it('carrega sem erro', () => expect(text).toBeTruthy());
    it('contém número da cotação', () => expect(text).toContain('5634702819-0-1'));
    it('contém modelo do veículo', () => expect(text).toContain('COMPASS SPORT'));
    it('contém prêmio total', () => expect(text).toContain('4.226,40'));
    it('contém seção de pagamento', () => expect(text).toContain('FORMAS DE PAGAMENTO'));
    it('contém seção de coberturas', () => expect(text).toContain('COBERTURAS'));
  });

  describe('incomplete', () => {
    let text: string;

    beforeAll(() => {
      text = readFileSync(join(FIXTURES_DIR, 'porto-seguro-auto-incomplete.txt'), 'utf8');
    });

    it('carrega sem erro', () => expect(text).toBeTruthy());
    it('contém número da cotação', () => expect(text).toContain('5634702819-0-1'));
    it('contém modelo do veículo', () => expect(text).toContain('COMPASSSPORT'));
    it('contém prêmio total', () => expect(text).toContain('4.226,40'));
    it('marca versão resumida', () => expect(text).toContain('versão resumida'));
  });
});
