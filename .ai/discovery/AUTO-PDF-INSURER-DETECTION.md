# Discovery - Deteccao De Seguradora No Upload AUTO

## Contexto

O fluxo atual cria uma area de upload por seguradora selecionada. Isso permite que o corretor envie, por engano, um PDF da Porto no card da Bradesco, ou vice-versa.

Esse erro e critico porque o backend usa a seguradora da `quote` para escolher prompt, parser e regras de processamento. Um PDF enviado no lugar errado pode ser roteado para a estrategia errada e contaminar review, PDF final e link publico.

## Direcao De Produto

- O corretor deve selecionar o ramo/produto antes do upload.
- A seguradora nao deve ser uma selecao obrigatoria antes do upload.
- O upload de AUTO deve aceitar multiplos PDFs em uma area unica.
- O sistema deve detectar a seguradora de cada PDF antes do processamento final.
- O corretor deve revisar casos ambiguos, nao corrigir erros silenciosos depois.

## Regra Principal

Detectar a seguradora emissora/cotada, nao qualquer marca mencionada no PDF.

Isso e importante porque algumas seguradoras compartilham grupo, template, administracao, marca ou estrutura de documento. Exemplo:

- PDF Itau pode mencionar Porto Seguro.
- PDF Aliro pode mencionar Allianz.
- A presenca de uma marca de grupo nao deve vencer a seguradora especifica da cotacao.

## Classificacao Por Sinais

### Sinais fortes

Usar como base principal da decisao:

- nome da seguradora no cabecalho principal;
- nome/titulo da proposta ou orcamento;
- CNPJ emissor;
- razao social da seguradora;
- identificadores estruturais especificos;
- blocos de produto/seguradora em posicao dominante.

### Sinais medios

Podem reforcar uma decisao, mas nao deveriam decidir sozinhos:

- textos de apresentacao da cotacao;
- dominio/e-mail/rodape confiavel;
- estrutura conhecida do PDF;
- nome de produto comercial.

### Sinais fracos

Nao devem decidir seguradora sozinhos:

- nome de grupo economico;
- banco/financeira;
- parceiro;
- administradora;
- texto generico de rodape;
- marca que aparece apenas em condicoes gerais ou template compartilhado.

## Regras Manuais Por Familia

O detector deve aceitar regras configuraveis por familia/grupo, porque novas seguradoras podem ter peculiaridades que o corretor vai descobrir ao coletar PDFs reais.

### Familia Porto

Se o PDF contem `Porto` e `Itau`, e `Itau` aparece como seguradora/produto/cabecalho forte, detectar `ITAU`.

`Porto` nesse caso deve ser tratado como sinal de grupo/template, nao como seguradora final.

### Familia Allianz/Aliro

Se o PDF contem `Allianz` e `Aliro`, e `Aliro` aparece como seguradora/produto/cabecalho forte, detectar `ALIRO`.

`Allianz` nesse caso pode ser sinal de grupo/template, nao necessariamente seguradora final.

## Resultado Esperado Do Detector

O backend deve retornar dados explicaveis para o frontend:

```ts
type InsurerDetectionResult = {
  detectedInsurer: Insurer | null
  confidence: 'high' | 'medium' | 'low'
  family?: string
  candidates: Insurer[]
  signals: Array<{
    insurer: Insurer
    type: 'strong' | 'medium' | 'weak'
    source: string
    value: string
  }>
  reason?: string
}
```

## Comportamento Seguro

- `high`: pode criar/rotear a quote automaticamente.
- `medium`: pode mostrar pre-selecionado, mas deve permitir confirmacao do corretor antes do processamento final.
- `low` ou `detectedInsurer: null`: bloquear processamento final ate o corretor escolher uma seguradora suportada ou remover o arquivo.
- seguradora nao suportada: informar claramente que o PDF foi reconhecido, mas ainda nao e suportado.

## Fora De Escopo Agora

- Detectar ramo/produto automaticamente.
- Suportar seguradoras novas sem parser implementado.
- Usar IA pesada para classificacao inicial quando sinais deterministicos forem suficientes.
- Resolver todos os grupos de seguradoras do mercado antes da V1.

## Decisao Inicial

Implementar o fluxo em duas tasks:

1. Backend: deteccao conservadora de seguradora e criacao/roteamento de quotes por PDF.
2. Frontend: upload unico multi-PDF com revisao de deteccao antes do processamento final.

