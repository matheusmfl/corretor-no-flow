export class Slug {
  readonly value: string;

  constructor(input: string) {
    this.value = input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  toString() {
    return this.value;
  }
}
