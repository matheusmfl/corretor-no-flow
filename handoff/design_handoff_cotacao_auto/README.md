# Handoff: Cotação Auto — Resumo Visual para Cliente

## Visão Geral

Esta é uma página de **resumo de cotação de seguro de automóvel**, gerada pelo SaaS Cotador. O objetivo é substituir o PDF bruto das seguradoras por um card visual, amigável e fácil de ler, que o corretor envia ao cliente via WhatsApp ou e-mail.

O design deve funcionar **mobile-first (largura máxima 420px)** e também ser legível em desktop (centralizado). É pensado também para impressão/PDF.

---

## Sobre os Arquivos

O arquivo `Cotacao Auto.html` é uma **referência de design em HTML** — não é código de produção para ser copiado diretamente. A tarefa do desenvolvedor é **recriar este design no ambiente do codebase existente** (React, Next.js, Vue, etc.) usando os padrões e bibliotecas já estabelecidos no projeto.

**Fidelidade: Alta (Hi-fi).** O HTML de referência tem cores, tipografia, espaçamentos e interações finais. A implementação deve seguir o design pixel a pixel.

---

## Estrutura da Página (de cima pra baixo)

### 1. Stripe Bar (Barra listrada)
- Barra decorativa no topo, 10px de altura
- Padrão: listras alternadas com `--brand` e `--accent`
- CSS: `repeating-linear-gradient`

### 2. Header
- Logo da corretora (placeholder retangular dashed, 80×36px) à esquerda
- Nome da seguradora (bold, 17px) + número da cotação (monospace, 11px, cinza) à direita
- Padding: 20px top/sides, 16px bottom
- Border-bottom: 1px solid `--border`

### 3. Saudação + Dados do Veículo
- Texto: "Olá **{nome}**, aqui está a cotação do seu **{veiculo}** na **{seguradora}**."
- Font-size: 15px, cor `--text-2`
- Tags do veículo abaixo: chips em `Space Mono`, fundo `--surface-2`, borda `--border`
  - Placa | Ano | Chassi (parcial)

### 4. Valor Hero (Ticket Rasgado)
- Fundo: `--brand` (cor escura)
- Efeito "ticket rasgado": `::before` e `::after` com `repeating-radial-gradient` (semicírculos)
- Margem vertical: `padding: 14px 0` no container para o efeito funcionar
- Conteúdo:
  - Esquerda: label "Valor anual do seguro" (monospace 10px, branco 55% opacidade) + valor principal (42px, bold 800, branco)
  - Direita: "ou parcelado em" + "10× R$ xxx" (19px, bold, `--accent`)
  - Linha separadora abaixo: franquia principal com tipo (Reduzida/Obrigatória), valor em branco bold

### 5. Coberturas Contratadas (4 grupos)

Cada grupo tem:
- **Header do grupo**: fundo `--brand-light`, ícone + título monospace + badge verde "Contratado"
- **Linhas de item**: flex row com label (cinza) e valor (monospace bold), border-bottom entre itens
- Items com valor zero ou não contratado: mostrar texto "Não contratado" em cinza, sem bold

**Grupos:**
| Grupo | Itens |
|-------|-------|
| 🚗 Cobertura do Veículo | % FIPE (hero grande: 100%) + descrição |
| ⚖️ RCF — Responsabilidade Civil Facultativa | D.M., D.C., Danos Morais, G.U. |
| 🏥 APP — Acidentes Pessoais de Passageiros | Morte p/ Passageiro, Invalidez p/ Passageiro, Despesas Médicas, Lotação Oficial |
| 🛠️ Assistências | Guincho (km), Vidros |

### 6. Franquias por Item

- Nota explicativa no topo (fundo `--surface-2`, borda esquerda 3px `--accent`): explica o que é franquia
- Lista de linhas: label (cinza) + valor (monospace bold), border-bottom dashed entre itens
- **Mostrar apenas itens com valor > 0**
- Franquia do veículo inclui tipo entre parênteses: `(Reduzida)` ou `(Obrigatória)`, em monospace cinza 11px

### 7. Formas de Pagamento (Abas)

- 4 abas: **Débito em Conta**, **CC Bradesco**, **Cartão de Crédito**, **Carnê**
- Abas scrolláveis horizontalmente sem scrollbar visível
- Aba ativa: `color: --brand`, `border-bottom: 2px solid --brand`
- Tabela por aba com colunas: Nº | Parcelas | Total
  - Header: monospace 9px uppercase cinza
  - Linhas pares: fundo `--surface-2`
  - **Linha da opção recomendada** (ex: 5× à vista ou a mais vantajosa): fundo amarelo suave (`--accent` 12% opacidade), valor em `--brand`
  - Coluna "Total": monospace bold
- Cada seguradora tem número diferente de parcelas disponíveis por método

### 8. Questionário — Condutor Principal

- Grid 2 colunas com campo "Nome" em largura total
- Cada item: label monospace 10px cinza uppercase + valor 14px semibold
- Campos: Nome, CPF/CNPJ, Data de Nascimento, Sexo, Estado Civil

### 9. Aviso Legal

- Fundo `--surface-2`, border-top `2px dashed --border`
- Ícone ⚠️ + parágrafo 11px cinza
- Texto: *"Este documento não tem valor legal e não substitui o PDF oficial gerado pela **{seguradora}**. As informações aqui apresentadas são um resumo da cotação para facilitar a visualização pelo cliente. Por favor, consulte seu corretor de seguros e confirme se os dados exibidos estão de acordo com o documento oficial emitido pela seguradora."*

### 10. Footer
- Fundo `--brand`, texto monospace 10px branco 40% opacidade
- Conteúdo: "COTAÇÃO GERADA PELO SISTEMA · VÁLIDA POR 30 DIAS"

---

## Design Tokens (CSS Variables)

```css
--brand:        #1f2d3d;   /* cor principal — TROCAR pela seguradora */
--brand-light:  #e8ecf0;   /* versão clara do brand */
--brand-mid:    #3a5068;   /* intermediária */
--accent:       #f0a500;   /* destaque / amarelo quente neutro */

--bg:           #f4f2ee;   /* fundo da página */
--surface:      #ffffff;   /* fundo dos cards */
--surface-2:    #f9f8f6;   /* fundo secundário */
--border:       #e2dfd8;   /* bordas e separadores */
--text-1:       #1a1814;   /* texto principal */
--text-2:       #5a5750;   /* texto secundário */
--text-3:       #9a9590;   /* texto terciário / labels */
```

> ⚠️ **Importante para o SaaS:** `--brand`, `--brand-light` e `--brand-mid` devem ser gerados dinamicamente com base na cor da seguradora cadastrada. Se nenhuma cor for informada, usar os valores neutros acima.

---

## Tipografia

| Uso | Família | Peso | Tamanho |
|-----|---------|------|---------|
| Corpo principal | Plus Jakarta Sans | 400–700 | 13–17px |
| Valor hero | Plus Jakarta Sans | 800 | 42px |
| Labels / monoespaçado | Space Mono | 400–700 | 9–13px |
| Número de cotação, tags veículo | Space Mono | 700 | 10–13px |

---

## Interações

### Abas de Pagamento
- Clique na aba → oculta o painel anterior, exibe o novo
- Sem animação de transição (troca direta)
- Estado: `active` na aba selecionada controla visibilidade do painel

### Dados Dinâmicos
Todos os campos com `{chaves}` devem ser preenchidos via API/props:

| Campo | Variável |
|-------|----------|
| Nome do cliente | `cliente.nome` |
| Veículo | `veiculo.descricao` (marca + modelo + ano) |
| Seguradora | `seguradora.nome` |
| Número da cotação | `cotacao.numero` |
| Placa | `veiculo.placa` |
| Ano modelo | `veiculo.anoModelo` |
| Chassi | `veiculo.chassi` (exibir parcial: `9BW···XXXX`) |
| Valor cheio | `cotacao.valorAnual` |
| Valor parcelado | `cotacao.valorParcela` |
| Franquia principal | `cotacao.franquiaPrincipal.valor` + `.tipo` |
| % FIPE | `cotacao.cobertura.fipePct` |
| RCF D.M. | `cotacao.rcf.danosMateriais` |
| RCF D.C. | `cotacao.rcf.danosCorporais` |
| RCF Morais | `cotacao.rcf.danosMorais` |
| APP — Morte | `cotacao.app.morte` |
| APP — Invalidez | `cotacao.app.invalidez` |
| APP — Lotação | `cotacao.app.lotacao` |
| Guincho | `cotacao.assistencias.guincho` (km) |
| Franquias por item | `cotacao.franquias[]` → só exibir onde `valor > 0` |
| Tabela de pagamento | `cotacao.pagamento[metodo][parcelas]` |
| Condutor — Nome | `condutor.nome` |
| Condutor — CPF | `condutor.cpf` |
| Condutor — Nascimento | `condutor.dataNascimento` |
| Condutor — Sexo | `condutor.sexo` |
| Condutor — Estado Civil | `condutor.estadoCivil` |

---

## Comportamento de Cor por Seguradora

O sistema precisa gerar as variantes de `--brand` automaticamente:
- `--brand`: cor principal da seguradora (hex)
- `--brand-light`: `color-mix(in srgb, --brand 15%, white)` ou equivalente
- `--brand-mid`: `color-mix(in srgb, --brand 60%, white)` ou equivalente

Se não houver cor cadastrada para a seguradora, usar os valores neutros padrão.

---

## Responsividade

- **Mobile (padrão):** max-width 420px, centralizado, padding lateral 16px na página
- **Impressão/PDF:** remover fundo da página (`--bg`), manter o card com sombra e bordas
- Tabela de pagamento: scroll horizontal suave, sem scrollbar visível

---

## Assets

- **Logo da corretora:** placeholder retangular (`80×36px`, borda dashed). Substituir por `<img>` com a logo real.
- **Logo da seguradora:** exibir o nome em texto por enquanto; pode evoluir para `<img>` futuramente.
- Sem ícones externos — usar emojis como placeholder visual nos grupos de cobertura.

---

## Arquivos neste pacote

| Arquivo | Descrição |
|---------|-----------|
| `Cotacao Auto.html` | Referência de design completa e interativa |
| `README.md` | Este documento de handoff |
