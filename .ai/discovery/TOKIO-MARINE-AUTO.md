# Tokio Marine AUTO Discovery

Status: manual discovery started on 2026-05-06.

## Inputs from human QA

The human generated Tokio Marine PDFs as renewal quotes. File naming convention:

- `renovacao_tokio_{nome_do_produto}`

This is intentional because previous insurer discoveries did not explicitly map how PDFs behave for insurance renewal scenarios. Tokio should therefore be validated for renewal-specific text, fields, and proposal labels before enabling processing.

All generated PDFs used the mandatory/basic deductible option. The current hypothesis is that reduced deductible PDFs are not required for first implementation, unless the extracted PDF text shows deductible wording that cannot be generalized.

## Product cards observed in portal

The portal showed 5 possible product cards:

- Auto
- Auto Classico
- Auto Protecao Mensal
- Auto Roubo + Rastreador
- Assistencia Exclusiva

Initial visible pricing behavior:

- Auto: annual/upfront product, shows 12x sem juros and discounted upfront value.
- Auto Classico: annual/upfront product, shows 12x sem juros and discounted upfront value.
- Auto Protecao Mensal: monthly product, card emphasizes monthly price and payment by credit card or debit account.
- Auto Roubo + Rastreador: annual/upfront product focused on incendio and roubo/furto.
- Assistencia Exclusiva: assistance-only product, no casco deductible, shows 6x sem juros and discounted upfront value.

## Renewal scenario

All current samples are renewal quotes. Implementation must verify whether the PDF contains fields such as:

- renewal marker;
- prior policy / apolice anterior;
- bonus class;
- current insurer / previous insurer;
- claim history;
- renewal-specific validity or discount text.

These fields should not pollute product detection or quote labels unless they are reliable and useful.

## Editable coverage variants

In the broker portal, only these products were observed with editable coverage fields:

- Auto
- Auto Classico
- Auto Protecao Mensal

The other products appear to have their own narrower coverage scopes and should be treated as product-specific, not as generic casco variants.

Observed editable "Tipo de Cobertura" options:

For Auto and Auto Classico:

- Colisao, Incendio e Roubo/Furto
- Colisao e Incendio
- Incendio e Roubo/Furto
- Indenizacao Integral-Colisao,Incendio,Roubo/Furto
- Sem Casco

For Auto Protecao Mensal:

- Colisao, Incendio e Roubo/Furto
- Colisao e Incendio
- Incendio e Roubo/Furto
- Sem Casco

Important difference: Auto Protecao Mensal did not show the "Indenizacao Integral-Colisao,Incendio,Roubo/Furto" option in the provided screenshot.

## Coverage matrix observed in portal

Baseline portal comparison for Auto / Auto Classico / Auto Protecao Mensal:

| Field | Auto | Auto Classico | Auto Protecao Mensal |
| --- | --- | --- | --- |
| % REM | 10,00% | 10,00% | 10,00% |
| Modalidade | Valor Referenciado (VMR) | Valor Referenciado (VMR) | Valor Referenciado (VMR) |
| Tipo de Cobertura | Colisao, Incendio e Roubo/Furto | Colisao, Incendio e Roubo/Furto | Colisao, Incendio e Roubo/Furto |
| % de Ajuste | 100,00% | 100,00% | 90,00% |
| Valor | R$ 29.659,00 | R$ 29.659,00 | R$ 26.693,10 |
| Despesa extraordinaria | 00 | 00 | 00 |
| RCF-V Danos Materiais | R$ 50.000,00 | R$ 50.000,00 | R$ 25.000,00 |
| RCF-V Danos Corporais | R$ 50.000,00 | R$ 50.000,00 | R$ 25.000,00 |
| RCF-V Danos Morais | empty/not selected | empty/not selected | empty/not selected |
| APP Morte por passageiro | R$ 5.000,00 | R$ 5.000,00 | R$ 5.000,00 |
| APP Invalidez por passageiro | R$ 5.000,00 | R$ 5.000,00 | R$ 5.000,00 |
| APP DMHO por passageiro | empty/not selected | empty/not selected | empty/not selected |
| Assistencia 24 horas | Completa | Completa | Completa |
| Km adicional de reboque | 100 km | 100 km | Nao possui |
| Extensao garantia 0km | Nao contratada | Nao contratada | Nao contratada |

## Repair conditions

| Field | Auto | Auto Classico | Auto Protecao Mensal |
| --- | --- | --- | --- |
| Tipo de oficina para reparo | Livre Escolha | Rede Referenciada | Rede Referenciada |
| Tipo de peca para reparo | Novas originais | Novas originais | Novas Compativeis |

These values are commercially important. If the PDF exposes them, the implementation should preserve them in extracted notes/coverage metadata or at least prevent labels that make Auto Classico / Protecao Mensal look equivalent to Auto.

## Services

| Field | Auto | Auto Classico | Auto Protecao Mensal |
| --- | --- | --- | --- |
| Vidros | Completo | Completo | Nao possui |
| Logomarca vidros | Nao possui | Nao possui | Nao possui |
| Martelinho e para-choque | Nao possui | Nao possui | Nao possui |
| Lataria e pintura | Nao possui | Nao possui | Nao possui |
| Roda, pneu e suspensao | Nao possui | Nao possui | Nao possui |
| Carro reserva dias | 15 diarias | 7 diarias | Nao possui |
| Carro reserva veiculo | Basico (Mecanico) | Basico (Mecanico) | Nao possui |

The human notes include only one selected variant for each option. Do not assume these are the only possible values. Example: carro reserva was observed as 15 days / 7 days / absent, but other durations may exist in the portal.

## Deductibles

| Field | Auto | Auto Classico | Auto Protecao Mensal |
| --- | --- | --- | --- |
| Indenizacao Parcial do Veiculo | Basica | Basica | Basica |
| Indenizacao Integral do Veiculo | Nao Possui | Nao Possui | Nao Possui |
| Isencao de 1a Franquia Parcial | Nao | Nao | Nao |

Card-level examples showed:

- Auto / Auto Classico / Auto Protecao Mensal: Indenizacao Parcial Basica around R$ 5.164,00 in the example.
- Auto Roubo + Rastreador: Indenizacao Parcial Basica around R$ 6.196,80 in the example.
- Assistencia Exclusiva: Sem Franquia para Casco.

## Implementation risks identified

- Renewal PDFs may include extra fields that previous parsers did not account for.
- Tokio has multiple products with similar names but materially different coverage scopes.
- Auto Protecao Mensal is not just "Auto with monthly payment": it showed 90% adjustment, lower RCF, no extra towing, no glass, no replacement vehicle, and compatible parts.
- Assistencia Exclusiva is assistance-only and must not produce phantom casco/FIPE coverage.
- Auto Roubo + Rastreador appears theft/fire-focused and may need a distinct product label and casco interpretation.
- "Sem Casco" is a valid editable coverage option, so missing casco can be intentional and must not always be treated as extraction failure.

## Discovery next steps

- Extract all `renovacao_tokio_*` PDFs to text.
- Compare PDF payment tables against `parsePortoPaymentTable` and Bradesco behavior.
- Collect at least one payment-variant PDF with carne and debit enabled, if available.
- Verify whether product name appears explicitly in PDF text or must be inferred from coverage/payment patterns.
- Decide whether first implementation should support all 5 products or start with a conservative subset.

## PDF lab extraction - 2026-05-06

Input PDFs were organized under:

```txt
.ai/pdf-lab/input/tokio/
```

Extracted outputs:

```txt
.ai/pdf-lab/output/auto_tokio_discovery.md
.ai/pdf-lab/output/auto_tokio_discovery.json
```

Command used:

```bash
node .ai/scripts/extract-pdf-lab.mjs --input-dir .ai/pdf-lab/input/tokio --output-name auto_tokio_discovery --insurer tokio --variant renovacao
```

Extracted files:

| File | Pages | Product observed |
| --- | ---: | --- |
| `renovacao_tokio_assistencia_exclusiva.pdf` | 3 | Assistencia Exclusiva |
| `renovacao_tokio_auto.pdf` | 4 | Auto |
| `renovacao_tokio_auto_classico.pdf` | 4 | Auto Classico |
| `renovacao_tokio_auto_roubo+rastreador.pdf` | 4 | Auto Roubo + Rastreador |
| `renovacao_tokio_protecao_mensal.pdf` | 3 | Auto Protecao Mensal |

The extracted PDF set covers all 5 Tokio products observed in the portal.

### Structure observed in extracted PDFs

- Header is consistent: `Cotacao Tokio Marine`, `Processo SUSEP no 15414.100335/2004-74 (Automovel)`.
- All samples are renewal quotes: `Tipo Seguro` appears as `Renovacao Congenere`.
- Renewal fields include previous insurer data:
  - `Nome da Congenere`: observed as `5312 - BRADESCO SEGUROS S/A`.
  - `Numero da apolice`: observed as `178550`.
  - `Fim de vigencia`: observed as `15/05/2026`.
  - `Classe de Bonus`: observed as `2`.
- This is a detector risk: `BRADESCO SEGUROS S/A` appears as prior insurer, not current quote issuer. Tokio strong header must dominate over renewal/congenere fields.
- Vehicle, driver, coverage, services, repair conditions, payment and legal text are all present in the extracted text.

### Coverage and product findings from PDFs

- `Assistencia Exclusiva`:
  - 3 pages.
  - `Casco`, RCF and APP appear as `Nao contratada`.
  - `Assistencia 24 horas Completa` is the actual paid coverage.
  - Explicit card text: `Sem Franquia para Casco`.
  - Payment goes up to 6x sem juros on credit card.
  - Must not render phantom casco/FIPE coverage.

- `Auto`:
  - 4 pages.
  - Main coverage: `Colisao, Incendio e Roubo/Furto`, `Valor Referenciado (VMR)`, `% de Ajuste 100,00%`.
  - RCF danos materiais and corporais: R$ 50.000,00 each.
  - APP morte/invalidez: R$ 5.000,00 each.
  - Assistance complete, additional towing 100 km.
  - Glass complete, replacement vehicle 15 days, free-choice repair shop, original new parts.
  - Payment goes up to 12x sem juros on credit card, plus discounted antecipado/a vista row.

- `Auto Classico`:
  - 4 pages.
  - Main coverage and 100% VMR similar to Auto.
  - RCF damages: R$ 50.000,00 each.
  - Repair shop differs: `Rede Referenciada`.
  - Replacement vehicle observed as 7 days.
  - Payment goes up to 12x sem juros.

- `Auto Roubo + Rastreador`:
  - 4 pages.
  - Main coverage: `Incendio e Roubo/Furto`, 100% VMR.
  - Requires tracker: legal text states mandatory installation in comodato within 15 days after policy issuance.
  - `Dispositivo comodato` observed as `ITURAN`.
  - RCF damages: R$ 50.000,00 each.
  - Replacement vehicle observed as 7 days.
  - Repair shop: `Rede Referenciada`; parts: `Novas originais`.
  - Payment goes up to 12x sem juros.

- `Auto Protecao Mensal`:
  - 3 pages.
  - Main coverage: `Colisao, Incendio e Roubo/Furto`, `Valor Referenciado (VMR)`, `% de Ajuste 90,00%`.
  - RCF damages: R$ 25.000,00 each.
  - No additional towing, no glass, no replacement vehicle in observed data.
  - Repair shop: `Rede Referenciada`; parts: `Novas Compativeis`.
  - Payment text shows monthly price and a 12x credit-card row totaling annualized value. Implementation must decide how to represent monthly product without making it look like a normal annual upfront premium.

### Payment parser direction

Tokio does not use the Porto Bank table. The extracted payment table is simpler and product-local:

- label: product name appears immediately before the table;
- columns: `Cartao Parcela (R$) Juros (%) Total (R$)`;
- first row may be a discounted `Antecipado*` upfront payment;
- regular rows use `Sem Juros`;
- annual products go up to 12x sem juros, except Assistencia Exclusiva observed at 6x;
- Protecao Mensal needs special handling because the product is sold as monthly but the PDF table exposes a 12x row with total.
- Current PDFs were generated with the default payment print behavior: credit card only.
- The broker can optionally include `carne` and `debito em conta` in the generated PDF. First implementation should either support those variants if a PDF sample is provided, or fail visibly/leave them out instead of parsing them as credit card.

Recommendation: implement a dedicated deterministic `parseTokioPaymentTable`, not `parsePortoPaymentTable` or Bradesco parser.

### Detector implications

- Current strong Tokio pattern `/tokio\s+marine/i` should detect these PDFs.
- Add/verify a real fixture where Tokio renewal text includes `BRADESCO SEGUROS S/A` as `Nome da Congenere`; detector must still return `TOKIO_MARINE`, not Bradesco.
- `HDI` was not observed in these extracted PDFs. Existing synthetic test text containing `Tokio Marine HDI Seguros S/A` is probably still acceptable, but not representative of these samples.

### Implementation recommendation

There is enough material to create `TASK-0040` for implementation, but the first implementation should be conservative:

- support the 5 extracted products;
- create Tokio-specific prompt and payment parser;
- include product labels:
  - `Auto`;
  - `Auto Classico`;
  - `Auto Protecao Mensal`;
  - `Auto Roubo + Rastreador`;
  - `Assistencia Exclusiva`;
- preserve coverage semantics for `Sem Casco`, `Nao contratada`, assistance-only and monthly product cases.
