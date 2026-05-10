# Bradesco Saude - Public Preview MVC

Briefing de UX para um primeiro mock do link publico de uma cotacao Bradesco Saude.

## Objetivo

Criar uma primeira experiencia visual para demonstrar que a cotacao de saude pode virar um link consultivo para o cliente, mais claro que um PDF e com informacoes extras de decisao.

Este mock nao deve tentar ser a verdade final do produto. A saude e complexa, e o objetivo agora e testar percepcao de valor com dados ficticios e uma amostra de rede referenciada de Pernambuco.

## Estrategia De Assets E Branding

A primeira imagem gerada como banner completo serve para inspiracao visual, mas nao deve ser tratada como arquitetura final de produto.

Para o mock e para o produto futuro, separar assets em camadas:

- personagem/medica: asset bitmap gerado, idealmente com fundo transparente;
- fundo/pattern: CSS ou SVG leve gerado por codigo;
- marca d'agua: forma vetorial/CSS baseada no tema da corretora;
- logo/nome da corretora: componente de texto ou asset enviado pela corretora;
- cores: tokens configuraveis por corretora.

Asset de inspiracao ja gerado:

- Repo path: `.ai/assets/bradesco-health-preview/doctor-hero-header.png`
- Absolute path: `C:\Users\mathe\Desktop\codigos 2026\corretor-no-flow\.ai\assets\bradesco-health-preview\doctor-hero-header.png`
- Original generated path: `C:\Users\mathe\.codex\generated_images\019e1018-5e6f-7ac2-9624-fea0f88cb838\ig_0a049bb43a25d99e016a002675def08196a068ddd4c68cadc6.png`

Descricao do asset: mulher medica sorrindo, jaleco branco, tablet, fundo limpo em tons profissionais de saude, sem texto, sem logos e com espaco para texto/logo no lado direito.

Asset recomendado para execucao do mock:

- `doctor-cutout.png`: medica recortada, fundo transparente ou fundo muito limpo, para permitir reposicionamento no mobile/tablet.
- `health-background-pattern`: preferencialmente feito em CSS/SVG, nao imagem fixa.
- `broker-theme`: objeto/constante de tema com cores e nome da corretora.

Exemplo de tokens:

```ts
const brokerTheme = {
  primary: '#005A8D',
  secondary: '#0F9F92',
  accent: '#D4A017',
  logoText: 'Corretora Exemplo',
};
```

Essa separacao permite trocar cores por corretora, esconder/reduzir a imagem da medica no mobile, reposicionar o hero no tablet e manter uma identidade visual sem gerar um banner novo para cada cliente.

## Dados Ficticios Do Mock

Baseado na cotacao real analisada, mas sem dados sensiveis.

- Seguradora: Bradesco Saude
- Produto/plano: Nacional II
- Perfil: Socios
- Regiao: Pernambuco
- Reembolso: Especifico
- Vidas: 3
- Saude: R$ 3.981,76
- Dental: R$ 66,39
- Total mensal: R$ 4.048,15
- Primeira parcela com IOF: R$ 4.142,92

Vidas ficticias:

- Ana Souza, 42 anos
- Bruno Lima, 38 anos
- Clara Lima, 12 anos

Nao usar nomes reais, CPF, CNPJ, corretora real, email ou telefone real.

## Principio De UX

O link publico deve parecer um relatorio consultivo premium, nao uma copia do PDF.

O cliente precisa entender rapidamente:

- o que esta contratando;
- quanto custa;
- quem entra no plano;
- onde pode ser atendido;
- o que significa reembolso especifico;
- quais pontos ainda precisam ser confirmados com a corretora.

## Estrutura Recomendada

### Primeiro viewport

Hero com:

- imagem da medica;
- logo ficticio da corretora ou placeholder;
- marca d'agua abstrata da corretora;
- texto: `Plano Bradesco Saude Nacional II`;
- subtitulo: `Cotacao empresarial para Pernambuco, organizada para facilitar sua decisao.`;
- valor em destaque: `R$ 4.048,15 / mes`;
- chips de contexto: `3 vidas`, `Pernambuco`, `Reembolso especifico`, `Perfil socios`;
- CTA: `Ver rede credenciada`.

### Formato Do Mock Atual

Recomendacao atual: mock mobile centralizado.

Neste momento, o objetivo nao e desenhar tablet/desktop. O mock deve representar a experiencia principal do cliente abrindo o link no celular, provavelmente pelo WhatsApp.

Em telas maiores, renderizar o conteudo como um frame mobile centralizado no meio da pagina, com largura limitada. Isso ajuda a revisar a experiencia sem transformar a proposta em landing page desktop.

Mobile:

- header mais compacto;
- tabs ou segmented navigation;
- cards empilhados;
- busca de rede em destaque;
- simulador de reembolso como card;
- tabelas apenas quando inevitavel, com scroll horizontal contido;
- conteudo em uma coluna;
- cards com boa separacao visual;
- CTA da corretora sempre facil de encontrar.

Preferir tabs, principalmente para mobile:

- Resumo
- Vidas e valores
- Rede credenciada
- Reembolso
- FAQ
- Observacoes

Discussao: o scroll lateral pode ser usado dentro de uma tabela comparativa, mas nao como mecanismo principal de navegacao. Para cliente final, tabs reduzem atrito e deixam a experiencia mais controlada.

### Resumo

Labels sugeridas:

- `O que voce esta contratando`
- `Quanto fica por mes`
- `Quem entra no plano`
- `Pontos para confirmar antes de decidir`

Campos:

- Plano
- Regiao
- Perfil
- Reembolso
- Total mensal
- Primeira parcela
- Dental incluso/valor

### Vidas e valores

Tabela compacta:

- Nome
- Idade
- Valor estimado

Tambem mostrar:

- Saude
- Dental
- Total mensal
- Primeira parcela com IOF

### Rede credenciada

O objetivo e mostrar que o cliente pode pesquisar a rede, nao entregar uma base oficial completa.

Controles:

- Busca com lupa: `Buscar hospital, laboratorio ou cidade`
- Tabs ou segmented control: `Hospitais` e `Laboratorios`
- Filtro por cidade: Recife, Olinda, Jaboatao
- Filtro por atendimento: Hospital, Pronto Socorro, Maternidade, Ambulatorio, Hospital Dia

Badges:

- `H`
- `P.S`
- `M`
- `A`
- `HDIA`

Tooltips:

- `H`: Hospital
- `P.S`: Pronto Socorro
- `M`: Maternidade
- `A`: Ambulatorio
- `HDIA`: Hospital Dia

Exemplos de hospitais para o mock:

- Recife: Hospital Portugues
- Recife: Hospital Santa Joana
- Recife: Hospital Esperanca
- Recife: Hospital Jayme da Fonte
- Recife: HOPE
- Olinda: Hospital Esperanca Olinda
- Olinda: CLINOPE
- Jaboatao dos Guararapes: Hospital Memorial Guararapes
- Jaboatao dos Guararapes: Clinica N. Sra. da Piedade

Importante: mostrar texto de cautela:

`Rede referenciada com base em material de abril/2026. A rede pode mudar; confirme a disponibilidade com a corretora antes da contratacao.`

### Reembolso

Explicar sem juridiquês:

`Este plano aparece com reembolso especifico. Em linguagem simples, isso indica uma cobertura de reembolso mais restrita do que o reembolso completo. Ele pode envolver consultas medicas presenciais e honorarios medicos em situacoes previstas, conforme regras do produto.`

Tooltip:

`As regras e limites de reembolso variam por plano, regiao e contratacao. A corretora deve confirmar as condicoes oficiais antes da decisao.`

### Simulador De Reembolso

Hipotese forte de UX: incluir um simulador simples para transformar a duvida abstrata sobre reembolso em uma estimativa compreensivel.

Importante: hoje ainda nao temos uma tabela confiavel e estruturada de reembolso para calculo real do `Nacional II` da cotacao. Portanto, no mock, o simulador deve ser visual/demonstrativo, com dados ficticios e aviso explicito.

Proposta de campos:

- Tipo de atendimento
- Valor pago ao medico ou prestador
- Reembolso estimado
- Custo final para voce

Exemplo demonstrativo:

- Tipo: `Consulta medica`
- Limite ficticio: `ate R$ 120,00`
- Valor pago: `R$ 300,00`
- Reembolso estimado: `R$ 120,00`
- Custo final: `R$ 180,00`

Microcopy sugerida:

`Atendeu fora da rede? Simule quanto seu plano poderia reembolsar.`

Texto de cautela obrigatorio:

`Valores estimativos para demonstracao. O reembolso real depende da tabela do plano, regras do produto, documentos apresentados e analise da Bradesco Saude.`

Interacoes desejadas no mock:

- Select de tipo de atendimento: `Consulta medica`, `Honorarios medicos`, `Exame simples`
- Campo monetario para valor pago
- Resultado em destaque
- Tooltip em `reembolso especifico`
- Link/acao: `Tirar duvida com a corretora`

Ponto de produto: esse componente pode virar um dos maiores diferenciais do link publico, mas so deve ser calculado de verdade quando tivermos a tabela de reembolso por plano/regiao/procedimento validada.

### FAQ Do Produto

FAQ curta para o mock:

1. `Esse valor e mensal?`
   - Sim. O total mensal estimado do exemplo e R$ 4.048,15, com primeira parcela estimada em R$ 4.142,92 por causa do IOF.

2. `O que significa reembolso especifico?`
   - Significa que o reembolso nao e amplo para todos os procedimentos. Ele segue regras especificas do produto, especialmente para consultas medicas presenciais e honorarios medicos em situacoes previstas.

3. `A rede credenciada e garantida?`
   - A rede exibida deve ser tratada como referencia. Ela pode mudar e precisa ser confirmada na base oficial da Bradesco Saude ou pela corretora.

4. `Posso pesquisar hospitais por cidade?`
   - Sim. O mock deve permitir buscar e filtrar exemplos por Recife, Olinda e Jaboatao dos Guararapes.

5. `Esse plano cobre maternidade ou pronto socorro?`
   - A tabela de rede usa siglas como `M` para maternidade e `P.S` para pronto socorro. O mock deve explicar essas siglas com tooltips.

6. `Por que o PDF original e diferente dessa tela?`
   - O PDF e um documento formal da cotacao. O link publico reorganiza as informacoes para facilitar entendimento e conversa com a corretora.

7. `O que eu devo confirmar antes de contratar?`
   - Rede atualizada, acomodacao, regras de reembolso, carencias, coparticipacao quando existir e condicoes oficiais do plano.

8. `Esse simulador de reembolso e oficial?`
   - Nao no mock. Ele serve para mostrar como a informacao poderia ficar mais clara. Para uso real, a corretora precisa validar a tabela de reembolso do plano.

## Linguagem Visual

O visual deve ser:

- confiavel;
- limpo;
- consultivo;
- mais premium que uma tabela de PDF;
- sem cara de landing page generica.

Evitar:

- excesso de texto no primeiro viewport;
- gradientes roxos ou paletas de uma cor so;
- tabelas gigantes como primeira experiencia;
- promessas absolutas sobre rede, reembolso ou cobertura.

## Criterio De Sucesso Do Mock

O mock cumpre o objetivo se, em poucos segundos, um corretor conseguir mostrar para um cliente:

- o plano;
- o preco;
- as vidas;
- exemplos de rede por cidade;
- uma explicacao simples de reembolso;
- uma simulacao demonstrativa de reembolso com aviso de cautela;
- uma FAQ objetiva para reduzir duvidas basicas.
