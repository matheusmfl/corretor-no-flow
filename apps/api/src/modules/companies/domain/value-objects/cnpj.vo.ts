export class Cnpj {
  readonly value: string;

  constructor(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 14) throw new Error('CNPJ inválido.');
    this.value = digits;
  }

  formatted(): string {
    return this.value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
}
