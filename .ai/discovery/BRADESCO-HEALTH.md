# Bradesco Saude Discovery

Status: manual portal discovery started on 2026-05-10.

## Objetivo

Mapear o fluxo de cotacao do produto Saude Bradesco antes de implementar schema, extracao de PDF, comparacao, PDF proprio ou link publico.

Esta discovery parte da tela inicial de uma nova cotacao de Saude no portal Bradesco. As observacoes abaixo foram levantadas por input humano e screenshots do portal, ainda sem PDF final analisado.

## Alerta inicial observado no portal

O portal exibe um alerta sobre nova modalidade de reembolso:

- O modelo de reembolso da cotacao pode ser completo ou especifico, dependendo do municipio da empresa e da regiao tarifaria selecionada.
- Reembolso completo: cobre todos os procedimentos do Rol da ANS realizados fora da rede.
- Reembolso especifico: cobre consultas medicas presenciais e honorarios medicos de profissionais nao referenciados, em cirurgias ou tratamentos de paciente internado na rede referenciada.
- Os planos `Nacional Plus` e `Premium` contam apenas com reembolso completo.

Implicacao para produto: reembolso nao deve ser tratado como atributo livre e universal. Ele parece depender de municipio/regiao/plano, e precisa ser preservado com a modalidade exibida pelo portal ou pelo PDF.

## Dados da cotacao

Campos observados na primeira tela:

- Tipo de Cotacao: `Saude`.
- Codigo Sucursal: campo observado; valor sensivel removido.
- CPD Corretor: campo observado; valor sensivel removido.
- Angariacao: campo observado com seletor de condicao comercial.
- Corretagem: campo observado com seletor de percentual/condicao.
- Produto: exemplo observado `Top`.
- CNPJ ou CAEPF: aceita seletor de tipo; valor sensivel removido.
- Razao Social: campo observado; valor sensivel removido.
- UF: exemplo observado `PE`.
- Ramo de Atividade: campo observado com codigo/descricao da atividade.
- Natureza Juridica: exemplo observado `Sociedade Empresarial Limitada`.
- Tipo de SPG: opcoes visiveis `3 a 29`, `30 a 99`, `100 a 199`; exemplo marcado `3 a 29`.
- Quantidade de Titulares: opcoes visiveis `Somente 1 titular`, `Mais de 1 titular`; exemplo marcado `Somente 1 titular`.
- Tipo de Adesao: opcoes visiveis `Opcional`, `Compulsorio`; exemplo marcado `Compulsorio`.
- Categoria Funcional: opcoes visiveis como checkboxes: `Funcionarios`, `Socios e Diretores`, `Estagiarios`, `Menor Aprendiz`, `Trabalhadores Temporarios`, `Adm. PJ Contratante`; exemplo marcado `Socios e Diretores`.
- Tipo de Adesao ao Kit: exemplo marcado `Digital Por Apolice`.

Campos cortados/parcialmente visiveis nos screenshots e ainda pendentes:

- Agencia Produtora.
- Posto de Atendimento Bancario.
- Municipio.
- Celular/e-mail completos em alguns blocos.

## Transferencia Bradesco e beneficios

Campos observados:

- `Transferencia Bradesco`: seletor com exemplo `Nao`.
- Bloco `Cartoes Bradesco`: mensagem clicavel para inserir cartoes de transferencia Bradesco.
- Bloco `Beneficios Adicionais`: checkbox `Desconto Folha de Pagamento Bradesco`, observado marcado.

Perguntas de descoberta:

- Quando `Transferencia Bradesco = Sim`, quais campos extras aparecem?
- O desconto de folha impacta premio, elegibilidade, comissao ou apenas cadastro?
- A existencia de cartoes Bradesco altera a modalidade de pagamento ou desconto?

## Assinatura de proposta eletronica

Bloco observado: `Dados da Corretora para assinatura de Proposta Eletronica`.

Campos observados:

- CPF/CNPJ da corretora: campo observado; valor sensivel removido.
- Corretora: campo observado; valor sensivel removido.
- E-mail da corretora: campo observado; valor sensivel removido.
- Celular da corretora: campo observado; valor sensivel removido.

Bloco observado: `Dados do Intermediario da Cotacao para identificacao na Ficha Eletronica`.

Campos observados:

- Perfil: opcoes `Corretora`, `Produtor`, `Angariador`; exemplo marcado `Corretora`.
- CPF: campo observado; valor sensivel removido.
- Nome: campo observado; valor sensivel removido.
- E-mail do intermediario: campo observado; valor sensivel removido.
- Celular do intermediario: campo observado; valor sensivel removido.

Implicacao para implementacao: esses campos parecem administrativos e de assinatura, nao atributos comerciais do plano. Devem ser ignorados em comparacao para cliente, salvo se o PDF final usar esses dados como identificacao de proposta.

## Perfil dos clientes

O portal cria pelo menos um bloco `Perfil 1`.

Campos observados no perfil:

- Categoria Funcional.
- Plano Saude.
- Regiao.
- Acomodacao.
- Vidas por faixa etaria.

### Categoria funcional

Opcoes observadas no seletor:

- `Selecione...`
- `Administradores`
- `Coordenadores`
- `Diretorias`
- `Funcionarios`
- `Gerentes`
- `Operarios`
- `Outros`
- `Socios`

Exemplo usado nos screenshots: `Socios`.

Observacao: existe tambem o checkbox de categoria funcional na area de dados da cotacao. Precisa validar a relacao entre o checkbox macro (`Socios e Diretores`) e a categoria funcional do perfil (`Socios`, etc.).

### Planos Saude observados

Opcoes observadas no seletor:

- `Selecione...`
- `Ideal 1`
- `Nacional Flex`
- `Nacional II`
- `Nacional III`
- `Nacional Plus`
- `Premium`
- `Saude Efetivo IV`

Regiao observada nos exemplos: `Pernambuco`.

### Acomodacoes observadas por plano

| Plano | Acomodacoes observadas |
| --- | --- |
| Nacional Flex | `Enfermaria`, `Quarto Privativo` |
| Nacional III | `Quarto Privativo`, `Multiplo 2`, `Multiplo 3` |
| Nacional Plus | `Multiplo 4`, `Multiplo 6`, `Multiplo 8` |
| Premium | `PREMIUM QUARTO MULT. 10`, `PREMIUM QUARTO MULT. 8`, `PREMIUM QUARTO MULT. 6` |
| Saude Efetivo IV | `Enfermaria`, `Quarto Privativo` |

Planos ainda sem acomodacoes mapeadas neste recorte:

- `Ideal 1`.
- `Nacional II`.

Nota do input humano: "acomodacoes possiveis no Nacional 3 e adiante" aparecem como multiplos nos planos superiores. Isso precisa ser confirmado com cotacoes/PDFs porque os nomes de acomodacao parecem codificar rede, plano ou multiplicador, nao apenas enfermaria/apartamento.

### Vidas e faixas etarias

Faixas visiveis no bloco de vidas:

- `Ate 18 anos`.
- `19 a 23`.
- `24 a 28`.
- `29 a 33`.
- `34 a 38`.
- `39 a 43`.
- `44 a 48`.
- `49 a 53`.

Exemplos observados:

- `Ate 18 anos`: 1 vida.
- `49 a 53`: 2 vidas em um exemplo de `Nacional Flex`.

Pendencias:

- Capturar se existem faixas acima de 53 anos via scroll horizontal.
- Validar se vidas sao informadas por perfil/categoria e depois consolidadas no PDF.
- Validar se o portal permite multiplos perfis com categorias/planos diferentes.

## Reembolso

O portal mostra um indicador proximo ao perfil:

- `Reembolso Especifico (exceto Na...)` em exemplos com planos como `Nacional II` / `Nacional Flex`.

Regras confirmadas pelo alerta:

- `Nacional Plus`: somente reembolso completo.
- `Premium`: somente reembolso completo.

Pendencias:

- Ver o texto completo do indicador de reembolso no perfil.
- Capturar como o PDF final expressa `Reembolso Especifico` vs `Reembolso Completo`.
- Validar se `Nacional III` pode alternar entre especifico/completo por municipio/regiao.

## PDF de cotacao observado

Primeira amostra de PDF Bradesco Saude analisada em 2026-05-10:

- Arquivo local: `.ai/pdf-lab/input/bradesco/bradesco-saude.pdf`.
- Output gerado pelo PDF lab: `.ai/pdf-lab/output/bradesco_saude_discovery.md` e `.json`.
- Total extraido: 2 paginas.
- O PDF extraido parece ser um resumo de valores por perfil, nao uma proposta completa com dados cadastrais do cliente/corretora.

Campos observados no PDF:

- Data da cotacao/arquivo.
- Perfil: exemplo estrutural `Perfil 1`.
- Categoria funcional do perfil.
- Plano Saude.
- Codigo do plano.
- Regiao.
- Modalidade de reembolso.
- Tabela por faixa etaria.
- Valor unitario de Saude por faixa.
- Valor unitario de Saude Conjugado por faixa.
- Valor unitario de Dental Conjugado por faixa.
- Quantidade de vidas por faixa.
- Total de Saude por faixa.
- Total de Saude Conjugado por faixa.
- Total de Dental por faixa.
- Total de Saude + Dental por faixa.
- Total de vidas.
- Premio Saude.
- Premio Dental, quando cotacao conjugada.
- Total Geral, quando cotacao conjugada.
- Taxa Kit Digital.
- I.O.F. Saude.
- Total da 1a Parcela.
- Demais Parcelas.
- Texto de validade/revisao da cotacao.

Campos com alta prioridade para schema temporario:

- `insurer`: Bradesco Saude.
- `product`: Saude.
- `profileName`: identificador do perfil, ex.: Perfil 1.
- `functionalCategory`: categoria funcional.
- `planName`: nome do plano.
- `planCode`: codigo do plano.
- `region`: regiao tarifaria.
- `reimbursementMode`: especifico ou completo.
- `ageBands`: lista de faixas com quantidade de vidas e valores.
- `totalLives`: total de vidas.
- `healthPremium`: premio de Saude.
- `dentalPremium`: premio Dental, se existir.
- `generalTotal`: total com Saude + Dental, se existir.
- `healthIof`: I.O.F. Saude.
- `firstInstallmentTotal`: total da primeira parcela.
- `remainingInstallmentTotal`: total das demais parcelas.
- `validityNote`: texto/nota de validade e revisao pela seguradora.

Campos deliberadamente fora do schema temporario:

- Dados cadastrais de cliente, corretora, intermediario, CPF/CNPJ, telefone e e-mail.
- Identificadores internos do portal que nao aparecam no PDF de Saude ou nao sejam necessarios para comparacao.
- Explicacoes completas de condicoes legais, exceto quando forem mensagem curta de validade/revisao da cotacao.

## Campos comerciais candidatos para schema futuro

Nao implementar ainda; candidatos a preservar quando houver PDF/amostras:

- Seguradora: Bradesco Saude.
- Produto/carteira: exemplo inicial `Top`.
- Plano: `Ideal 1`, `Nacional Flex`, `Nacional II`, `Nacional III`, `Nacional Plus`, `Premium`, `Saude Efetivo IV`.
- Regiao tarifaria: exemplo `Pernambuco`.
- Municipio da empresa.
- Categoria funcional do perfil.
- Numero de vidas por faixa etaria.
- Total de titulares/vidas.
- Tipo de adesao: opcional/compulsorio.
- Tipo de SPG.
- Acomodacao.
- Modalidade de reembolso: especifico/completo.
- Beneficios/descontos Bradesco aplicados, se afetarem preco.
- Preco total e preco por vida/faixa, quando o PDF ou tela final mostrar.

## Riscos de comparacao

- Reembolso especifico vs completo e sensivel: nao simplificar como "tem reembolso" sem a modalidade.
- `Multiplo 2`, `Multiplo 3`, `Multiplo 4`, etc. nao devem ser traduzidos automaticamente para enfermaria/apartamento sem catalogo Bradesco.
- Categoria funcional e adesao compulsoria/opcional podem afetar elegibilidade e preco; nao sao apenas metadados.
- Regiao/municipio parecem influenciar reembolso e provavelmente preco/rede.
- Dados de corretora/intermediario nao devem aparecer como diferencial comercial para o cliente.

## Proximas capturas recomendadas

- Screenshot/tela final com valores para uma cotacao completa.
- PDF da proposta/cotacao Bradesco Saude, se o portal gerar.
- Captura do texto completo de `Reembolso Especifico` no perfil.
- Matriz plano x acomodacao para `Ideal 1` e `Nacional II`.
- Caso com `Transferencia Bradesco = Sim`.
- Caso com `Tipo de Adesao = Opcional`.
- Caso com mais de uma categoria funcional/perfil.
- Caso com faixas acima de 53 anos.
