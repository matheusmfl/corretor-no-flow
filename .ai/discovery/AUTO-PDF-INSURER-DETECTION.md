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

Observacoes coletadas em QA/discovery:

- Porto, Azul, Itau e Mitsui podem compartilhar um core de documento muito parecido, especialmente no orcamento reduzido.
- A headline e o nome do produto comercial podem ser sinais mais importantes que mencoes soltas de `Porto`.
- Amostras extraidas em 2026-05-02 confirmam que os PDFs completos e reduzidos de Azul, Itau, Mitsui e Porto compartilham textos, CNPJ, estrutura, pagamentos Porto Bank e blocos legais parecidos.
- Exemplos de produto/headline observados:
  - `Azul Tradicional e Protecao Combinada`
  - `Azul Auto Roubo`
  - `Auto Senior e Protecao Combinada`
  - `Itau Tradicional`
  - `Itau Assistencia 24h`
  - `Itau Seguro Auto Compacto`
  - `Mitsui Sumitomo Seguros e Protecao Combinada`
  - `Alternativo`
  - `Incendio e Furto/Roubo`
- Porto pode aparecer em logomarca/cabecalho ou em metodos de pagamento como `Porto Bank`; isso nao deve, sozinho, decidir a seguradora.
- No PDF completo, a Porto pode trazer mais beneficios, servicos, coberturas adicionais, descontos e ate cobertura residencial agregada. Esses blocos ajudam a explicar o produto, mas nao devem mascarar a seguradora emissora.

Impacto para parser/review:

- Ausencia de RCF, Casco ou franquia pode ser esperada em produtos reduzidos, compacto, roubo/furto/incendio ou perda total.
- O sistema deve diferenciar `nao contratado`, `nao aplicavel ao produto` e `nao encontrado no PDF`.
- Produtos como `Itau Seguro Auto Compacto` precisam de label explicativa para o corretor/cliente, por exemplo quando pagam percentual reduzido da FIPE.
- Produtos de roubo/furto/incendio podem ter cobertura principal sem franquia e percentual FIPE diferente de 100%.
- `Itau Assistencia 24h` pode nao ter casco tradicional, portanto nao deve ser tratado como erro automatico de extracao.

#### Matriz De Decisao Observada Em 2026-05-04

As amostras da `TASK-0030` confirmam que a familia Porto compartilha CNPJ, template, pagamentos Porto Bank, textos legais, link de grupo e blocos de beneficio. Esses sinais nao bastam para decidir `PORTO_SEGURO`.

Sinais dominantes por marca/produto:

- `PORTO_SEGURO`: headline/produto `Auto Senior e Protecao Combinada`, texto de solicitacao com `PORTO SEGURO`, segmento `AUTO SENIOR`.
- `AZUL`: headline/produto `Azul Tradicional e Protecao Combinada` ou `Azul Auto Roubo`, texto `Azul Seguro Auto e uma marca licenciada para uso da Porto Seguro Companhia de Seguros Gerais`, segmento `AZUL TRADICIONAL` ou produto Azul equivalente.
- `ITAU`: headline/produto `Itau Tradicional`, `Itau Assistencia 24h` ou `Itau Seguro Auto Compacto`; esses produtos podem aparecer no mesmo core de orcamento e devem bloquear roteamento Porto.
- `MITSUI`: headline/produto `Mitsui Sumitomo Seguros e Protecao Combinada`, texto de cosseguro com Porto lider e Mitsui Sumitomo como cosseguradora; deve ser detectado como Mitsui Sumitomo ou como nao processavel, nunca como Porto automatico.

Regra conservadora:

- Quando `Porto`, `Porto Bank`, CNPJ `61.198.164/0001-60` ou `61.198.164.0001/60`, link `portoseguro.com.br`, beneficios Porto ou texto legal de grupo aparecem junto de `Azul`, `Itau` ou `Mitsui Sumitomo` em headline/produto/segmento, a marca especifica vence.
- Sompo nao deve ser tratada como alias de Mitsui Sumitomo nem como parte da familia Porto neste momento; fica como seguradora futura separada.
- Se a marca especifica ainda nao existir no enum/processador, retornar `detectedInsurer: null`, `notProcessable: true`, `family: "porto"` e uma razao clara: seguradora reconhecida mas sem parser suportado.
- Se houver apenas sinais de grupo/template e nenhum sinal dominante de emissor, retornar baixa confianca e pedir confirmacao humana.
- `Mitsui Sumitomo` deve entrar como conceito proprio de detector. A relacao comercial observada e cosseguro/operacao com Porto; para o produto, isso nao autoriza usar parser Porto e exibir Porto como seguradora final.

#### Guard De Produto AUTO

O upload de processo `AUTO` deve validar ramo antes de processamento. O detector nao precisa classificar todos os ramos, mas precisa bloquear divergencias obvias.

Sinais fortes de AUTO:

- `Orcamento de Seguro Auto`;
- `Seguro Auto`;
- `Coberturas e servicos AUTO`;
- `Veiculo`, `placa`, `chassi`, `FIPE`, `franquia`, `RCF-V`, `casco`, `colisao`, `incendio`, `roubo` ou `furto` em contexto de veiculo;
- produto/segmento de portfolio auto como `Auto Senior`, `Azul Tradicional`, `Itau Tradicional`, `Itau Seguro Auto Compacto`, `Mitsui Sumitomo Seguros e Protecao Combinada`.

Sinais fortes de nao AUTO:

- `Plano de Saude`, `Seguro Saude`, `cobertura hospitalar`, `internacao hospitalar`, `consultas medicas`, `rede credenciada`, `reembolso medico`;
- ramo sem veiculo/placa/chassi/FIPE/franquia de auto.

Comportamento recomendado:

- AUTO forte + seguradora suportada: pode seguir fluxo automatico quando a confianca da seguradora for alta.
- AUTO forte + seguradora reconhecida mas nao suportada: bloquear processamento e informar seguradora/produto reconhecidos.
- Nao AUTO forte + qualquer seguradora: bloquear processamento em processo AUTO.
- AUTO ausente e nenhum ramo divergente forte: media/baixa confianca, pedir confirmacao antes de processar.

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
