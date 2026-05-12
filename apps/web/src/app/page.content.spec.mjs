import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const page = [
  readFileSync(resolve("src/app/page.tsx"), "utf8"),
  readFileSync(resolve("src/app/flow-demo.tsx"), "utf8"),
].join("\n");
const css = readFileSync(resolve("src/app/globals.css"), "utf8");

const expectedCopy = [
  "AUMENTE SEU FATURAMENTO",
  "GANHE TEMPO",
  "TRANSMITA MAIS AUTORIDADE",
  "Transforme cotacoes tecnicas em vendas mais rapidas.",
  "Pare de mandar PDF e torcer.",
  "Seu cliente entende melhor a cotacao.",
  "comportamento dele.",
  "Voce ainda envia cotacao da forma tradicional?",
  "Os PDFs gerados pelas seguradoras muitas vezes sao complexos",
  "quem usa o Corretor no Flow sai na frente",
  "personalizada com o nome e a logo da sua corretora",
  "entende melhor o que esta contratando",
  "Quem abriu a proposta",
  "Quero vender com mais clareza",
  "Ver a proposta em acao",
  "Sua seguradora",
  "azul",
  "Formas de pagamento",
  "Cartao em 12x",
  "Pix com desconto",
  "flowDuration",
  "flow-brand-logo",
  "flow-azul-logo",
  "flow-scroll-hand",
  "flow-hand-emoji",
  "flow-public-scroll-shell",
  "flow-public-scroll",
  "Franquia reduzida",
  "Coberturas Porto",
  "Assistencias contratadas",
  "Chamar corretor no WhatsApp",
];

for (const copy of expectedCopy) {
  assert.ok(page.includes(copy), `Expected landing copy to include: ${copy}`);
}

const expectedAnchors = [
  '"#dor"',
  '"#como-funciona"',
  '"#rastreamento"',
  '"#captura"',
];

for (const anchor of expectedAnchors) {
  assert.ok(page.includes(anchor), `Expected navigation anchor: ${anchor}`);
}

assert.ok(css.includes("@keyframes handScrollHint"), "Expected scroll hand hint animation");
assert.ok(css.includes("@keyframes fullQuoteReveal"), "Expected public mock reveal animation");
assert.ok(page.includes("scrollTo({ top: 230"), "Expected public mock to perform real scroll");
assert.ok(page.includes("onScroll={() => setShowHand(false)}"), "Expected hand to hide on real scroll");

console.log("web landing content assertions passed");
