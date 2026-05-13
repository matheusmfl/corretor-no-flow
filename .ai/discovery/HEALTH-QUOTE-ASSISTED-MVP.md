# Health Quote Assisted MVP

## Objetivo

Definir uma primeira versao pragmatica para cotacoes de Saude com carater urgente: ler PDFs e planilhas, montar um rascunho revisavel e gerar uma planilha no formato de trabalho da corretora, preservando a possibilidade futura de PDF e link navegavel.

## Problema que o MVP resolve

A corretora hoje precisa montar manualmente uma planilha comparativa com:

- nomes ou identificadores das vidas;
- idades;
- parentesco/categoria quando existe;
- valores individuais por plano;
- totais por plano;
- opcoes de operadoras/seguradoras diferentes.

O sistema deve reduzir o trabalho de transcrever PDFs, ratear valores por faixa e replicar vidas para tabelas manuais.

## Norte do fluxo

```txt
PDFs / planilhas / tabelas
  -> extracao textual ou importacao
  -> rascunho de cotacao de Saude
  -> revisao humana
  -> grupo de vidas confirmado
  -> opcoes calculadas/extraidas
  -> planilha
  -> PDF
  -> link navegavel
```

## Entidades conceituais

### HealthQuoteDraft

Rascunho temporario criado a partir de uma ou mais fontes.

Campos candidatos:

- `clientName`
- `companyDocument`
- `state`
- `city`
- `sourceFiles`
- `lives`
- `quoteOptions`
- `tables`
- `warnings`
- `reviewStatus`

### DraftField

Todo campo extraido ou inferido deve carregar procedencia.

```ts
type DraftFieldSource =
  | "extracted"
  | "inferred"
  | "manual"
  | "table_lookup"
  | "ocr"
  | "vision_inferred"
  | "not_found";

type DraftField<T> = {
  value: T | null;
  source: DraftFieldSource;
  confidence: number;
  evidence?: string;
  needsReview: boolean;
};
```

Regra: campos sensiveis vindos de `inferred`, `ocr` ou `vision_inferred` devem exigir revisao humana antes de aparecerem como fato em planilha/PDF/link.

### MemberLife

Representa uma vida na cotacao.

Campos candidatos:

- `name` opcional;
- `label` opcional, como `Filho`, `Funcionario 1`, `Socio`;
- `age` obrigatorio para calculo;
- `relationship` opcional;
- `ageBand` calculado;
- `source` e `needsReview`.

Quando o PDF tiver apenas contagem por faixa, o sistema pode criar placeholders:

- `Vida 1 - 0 a 18`;
- `Vida 2 - 34 a 38`;
- `Vida 3 - 39 a 43`.

Depois a corretora pode preencher nomes reais ou deixar identificadores.

### QuoteOption

Uma opcao de plano/cotacao para o mesmo grupo de vidas.

Campos candidatos:

- `sourceType`: `portal_pdf`, `manual_table`, `spreadsheet_import`;
- `carrierOrOperator`;
- `administratorOrChannel`;
- `planName`;
- `productCode`;
- `accommodation`;
- `coparticipation`;
- `reimbursementMode`;
- `region`;
- `validUntil`;
- `ageBandPrices`;
- `perLifePrices`;
- `monthlyTotal`;
- `firstInstallmentTotal`;
- `dental`;
- `notes`;
- `warnings`;

### ManualTableSource

Tabela de preco cadastrada/importada para fontes sem PDF.

Campos candidatos:

- `sourceName`, ex.: Unimed PE, Hapvida, Qualicorp, Solbene;
- `planName`;
- `accommodation`;
- `coparticipation`;
- `region`;
- `validFrom`;
- `validUntil`;
- `ageBandPrices`;
- `sourceFile`;
- `reviewedByBroker`.

## Campos minimos do MVP

Para gerar uma planilha util rapidamente:

- seguradora/operadora/fonte;
- plano/opcao;
- validade da cotacao/tabela;
- vidas com nome opcional e idade obrigatoria;
- valores por vida;
- total mensal por opcao;
- coparticipacao quando clara;
- acomodacao quando clara;
- dental quando claro;
- avisos de recalculo/validade.

Campos que podem entrar como `not_found` no MVP:

- rede referenciada;
- carencia detalhada;
- reembolso detalhado;
- segmentacao assistencial;
- explicacoes comerciais longas.

## Regras de IA

A IA pode:

- extrair campos que aparecem no texto;
- sugerir campos semanticamente equivalentes;
- inferir campos com evidencia curta, por exemplo `Direto Nacional Enfermaria` -> acomodacao `Enfermaria`;
- retornar `null` quando nao houver evidencia;
- separar subprodutos Saude/Odonto quando o PDF trouxer ambos.

A IA nao deve:

- inventar rede, coparticipacao, reembolso ou carencia;
- transformar marketing pages do PDF em beneficio contratado sem confirmacao;
- misturar administradora/canal com operadora;
- publicar inferencia sensivel sem revisao.

## Saidas

### Planilha

Prioridade do MVP urgente.

Formato esperado:

- linhas por pessoa/vida;
- colunas por plano/opcao;
- totais por coluna;
- notas de validade/origem;
- opcionalmente abas para tabela de faixa etaria e fontes.

### PDF

Saida comercial posterior, gerada a partir do mesmo rascunho confirmado. Deve ser mais clara que a planilha, mas nao precisa entrar no primeiro corte se atrasar a entrega.

### Link navegavel

Saida consultiva posterior, mobile-first. Deve usar os mesmos dados revisados e nao recalcular/inferir informacoes diferentes da planilha/PDF.

## OCR e PDFs como imagem

O MVP textual pode iniciar com PDFs que possuem texto extraivel. No entanto, a arquitetura deve prever uma etapa futura para PDFs escaneados ou tabelas inseridas como imagem:

- detectar pagina sem texto suficiente;
- renderizar pagina;
- usar OCR ou vision model;
- preservar evidencias e coordenadas;
- marcar campos com origem diferente;
- exigir revisao.

Essa necessidade deve virar uma task propria depois que o fluxo textual estiver validado.

## Amostras de referencia

Entrada:

- `.ai/pdf-lab/input/pdfs-saude-variados`

Extracao:

- `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`
- `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.json`

Planilhas analisadas:

- `UNIMED - OTORRINOS.xlsx`
- arquivo `.xlsx` iniciado por `cotac...` e contendo `CTO ATUALIZADO`

## Riscos

- Saude pode ficar juridicamente perigoso se o produto prometer rede, reembolso, carencia ou coparticipacao errados.
- Planilhas recebidas por WhatsApp podem estar vencidas; validade precisa aparecer.
- Fontes como Qualicorp podem ser administradoras/canais, nao operadoras.
- PDFs com tabelas como imagem podem passar em branco na extracao textual.
- O prototipo pode virar arquitetura definitiva se nao separarmos draft, revisao e cotacao final.

## Decisao recomendada

Implementar Saude como fluxo de rascunho revisavel. O sistema pode ser generalista no inicio, mas todo campo precisa manter origem, confianca, evidencia e status de revisao.
