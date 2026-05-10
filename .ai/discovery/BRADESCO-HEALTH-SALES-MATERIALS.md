# Bradesco Saude - Materiais de Apoio a Venda

Status: discovery started on 2026-05-10.

## Objetivo

Mapear materiais oficiais de apoio a venda do Bradesco Saude e identificar quais informacoes podem melhorar:

- entendimento do corretor;
- apresentacao no link publico;
- perguntas frequentes do cliente;
- campos futuros de produto/schema;
- alertas de validacao humana antes da venda.

Esta discovery nao deve copiar documentos completos. O objetivo e transformar PDFs extensos em conhecimento acionavel para o produto.

## Plano de execucao

1. Inventariar todos os PDFs colocados em `.ai/pdf-lab/input/bradesco-health-materials`.
2. Processar um PDF por rodada.
3. Para cada PDF, registrar:
   - tipo de documento;
   - publico/produto;
   - informacoes comerciais;
   - regras relevantes;
   - perguntas de cliente que o documento ajuda a responder;
   - perguntas que continuam sem resposta;
   - campos candidatos para produto;
   - riscos de interpretacao;
   - prioridade para MVP.
4. Ao final, consolidar um mapa geral de quais documentos alimentam cada parte da experiencia.

## Inventario inicial

| Documento | Tipo | Prioridade inicial |
| --- | --- | --- |
| `Portfolio SPG.pdf` | portfolio comercial para empresas de 3 a 199 pessoas | alta |
| `260420_BRASAU_EfetivoPlus_SP-DF-RS-PR_AF_OP1.pdf` | material comercial especifico do Efetivo Plus | alta |
| `CE SPG - A+H+OB_01.04.2026.pdf` | condicoes gerais SPG ambulatorial + hospitalar com obstetricia | alta, mas juridico |
| `CE SPG - H+OB_01.04.2026.pdf` | condicoes gerais SPG hospitalar com obstetricia | media |
| `A.F.Dig.Formulario_DSC_Pediatria_100226.pdf` | formulario/declaracao complementar pediatrica | baixa para venda, util para pos-venda/contratacao |
| `Portfolio Empresarial.pdf` | portfolio comercial para empresas a partir de 200 pessoas | media/futura |
| `condicoes-gerais-maio/CE - A+H+OB_01.05.2026_RC.pdf` | condicoes gerais empresarial 200+ A+H+OB, modalidade RC | futura |
| `condicoes-gerais-maio/CE - A+H+OB_01.05.2026_RE.pdf` | condicoes gerais empresarial 200+ A+H+OB, modalidade RE | futura |
| `condicoes-gerais-maio/CE - H+OB_01.05.2026_RC.pdf` | condicoes gerais empresarial 200+ H+OB, modalidade RC | futura |
| `condicoes-gerais-maio/CE - H+OB_01.05.2026_RE.pdf` | condicoes gerais empresarial 200+ H+OB, modalidade RE | futura |

## Portfolio SPG.pdf

### Tipo de documento

Portfolio comercial do Bradesco Saude para o segmento SPG, direcionado a empresas de 3 a 199 pessoas.

Este e um dos documentos mais importantes para a experiencia inicial do produto porque traduz a familia Bradesco Saude em linguagem comercial. Ele nao e apenas juridico; ele explica posicionamento, segmentacao, beneficios e diferencas entre planos.

### Escopo e publico

- Segmento: SPG, Seguro para Grupos.
- Publico: empresas de 3 a 199 pessoas.
- Faixas de porte citadas:
  - SPG 3: 3 a 29 pessoas.
  - SPG 30: 30 a 99 pessoas.
  - SPG 100: 100 a 199 pessoas.
- O portfolio tambem menciona que empresas a partir de 200 pessoas ficam no segmento Empresarial, fora do foco principal deste PDF.

Implicacao para produto: a cotacao de Saude deve preservar o porte do grupo, porque ele influencia regras, oferta e linguagem comercial. Para o nosso PDF/link publico, o cliente deveria entender se a cotacao e SPG 3, SPG 30 ou SPG 100.

### Posicionamento geral da Bradesco Saude

O documento apresenta Bradesco Saude como uma operadora com:

- presenca nacional;
- rede de consultorios, clinicas, laboratorios e hospitais;
- possibilidade de reembolso fora da rede, conforme plano contratado;
- grande base de beneficiarios;
- grande rede referenciada.

Implicacao para UX: esses numeros e claims sao bons para contexto institucional, mas nao substituem perguntas praticas do cliente. O cliente ainda vai querer saber quais hospitais/laboratorios entram no plano escolhido na cidade dele.

### Planos citados no portfolio SPG

O documento apresenta uma escala comercial de planos, de maior economia para maior beneficio:

- Efetivo.
- Efetivo Plus.
- Flex.
- Ideal.
- Nacional.
- Nacional Plus.
- Premium.
- Planos regionais: Rio+ e Sao Paulo+.
- Plano Regional Goias.

Importante: o seletor observado no portal de cotacao mostrou nomes parecidos, mas nao identicos em todos os casos. Exemplo: na UI apareceu `Nacional Flex`, enquanto no portfolio aparece `Flex`. Tambem apareceu `Saude Efetivo IV` na UI, enquanto o portfolio fala em `Efetivo` e `Efetivo Plus`.

Implicacao para parser/schema: nao assumir que o nome comercial do portfolio e exatamente igual ao nome do plano no PDF de cotacao. Precisamos de uma camada de normalizacao ou catalogo versionado.

### Diferencas comerciais entre planos

#### Efetivo

Plano com caracteristicas regionais e foco em custo-beneficio. O material posiciona como uma rede pensada para quem vive e trabalha em cada localidade, com vantagem de rede nacional.

Uso no produto: pode ser explicado como opcao de entrada/custo-beneficio, mas sem prometer rede especifica sem validacao.

#### Efetivo Plus

Alternativa com mais opcoes de atendimento no Brasil, beneficios digitais e possibilidade de contratacao com ou sem coparticipacao.

Uso no produto: plano bom para explicar quando o cliente quer equilibrio entre custo e mais beneficios, especialmente se o PDF da cotacao indicar reembolso especifico e/ou coparticipacao.

#### Flex

O material associa Flex a maior flexibilidade na distribuicao da rede de medicos, hospitais, laboratorios, clinicas e consultorios.

Uso no produto: pode ser posicionado como rede mais flexivel/ampla que opcoes mais economicas, mas precisa de validacao de rede local.

#### Ideal

Plano direcionado a clientes dos estados do Rio de Janeiro, Sao Paulo e Distrito Federal, com rede de abrangencia nacional.

Uso no produto: se aparecer em cotacao fora dessas regioes, precisa validacao. Para nossa amostra de Pernambuco, nao assumir que Ideal se aplica.

#### Nacional

Plano de abrangencia nacional com rede referenciada composta por medicos, clinicas, hospitais e laboratorios em todo o Brasil.

Uso no produto: linguagem boa para explicar liberdade de atendimento em rede nacional, mas ainda sem listar hospitais concretos.

#### Nacional Plus

Plano com atendimento em hospitais de excelencia, Bradesco Saude Concierge em cidades especificas, reembolso diferenciado no Brasil e exterior, e beneficios premium.

Uso no produto: deve aparecer como tier superior. Na descoberta anterior do portal, Nacional Plus e Premium foram marcados como planos apenas com reembolso completo.

#### Premium

Plano mais completo citado no portfolio, com hospitais de excelencia, concierge em abrangencia nacional e multiplos superiores de reembolso, inclusive para atendimentos no exterior.

Uso no produto: tier maximo. Pode justificar preco maior por rede premium, concierge e reembolso superior, mas com cuidado para nao prometer cobertura sem contrato.

### Hospitais e rede

O portfolio nao parece ser uma tabela de rede referenciada completa, mas cita exemplos de hospitais exclusivos/associados aos planos Premium e Nacional Plus.

Exemplos de cidades/hospitais aparecem para:

- Brasilia.
- Rio de Janeiro.
- Goiania.
- Sao Paulo.

Tambem ha referencias a salas VIP e hospitais de referencia no contexto do Bradesco Saude Concierge.

Implicacao para produto:

- O PDF ajuda a dizer que Nacional Plus/Premium possuem rede/hospitais de excelencia.
- O PDF nao resolve a pergunta "o hospital X aceita este plano para esta empresa/regiao?".
- Para o link publico, a melhor experiencia seria mostrar uma area "Rede hospitalar: precisa validar" ou integrar futuramente com busca de rede.

Pergunta de cliente respondida parcialmente:

- "Esse plano tem hospitais bons?" Sim, em planos superiores ha exemplos e posicionamento.

Pergunta nao respondida:

- "O hospital especifico que eu uso aceita o plano cotado?" Nao.

### Planos regionais

O portfolio cita Rio+ e Sao Paulo+ com abrangencia regional em municipios do RJ/SP, e Regional Goias com cuidado regionalizado em municipios de Goias.

Uso no produto:

- Importante para nao tratar todo plano como nacional.
- Se o plano/regiao do PDF indicar regional, o link publico precisa avisar claramente a abrangencia.
- A cotacao atual analisada de Bradesco Saude veio com regiao `Pernambuco` e plano `Nacional II`, entao os regionais RJ/SP/GO nao devem contaminar a explicacao dessa amostra.

### Concierge e servicos exclusivos

Disponivel nos planos Premium e Nacional Plus.

Servicos citados incluem:

- salas VIP em centros de referencia medica;
- seguro viagem;
- vacinas do viajante;
- coleta de exames;
- marcacao de exames especiais;
- suporte para obtencao de vagas;
- welcome baby;
- welcome home;
- lista de referencias medicas;
- importacao de medicamentos;
- segunda opiniao medica internacional;
- coleta de documentos para reembolso.

Limitacao importante: o material indica que alguns servicos dependem de area de abrangencia e contratos/acordos vigentes.

Uso no produto:

- Pode ser uma secao de "beneficios extras do plano" para Nacional Plus/Premium.
- Nao deve aparecer como beneficio universal para Nacional II/Nacional Flex.

### Seguro Viagem Bradesco

O documento apresenta Seguro Viagem como disponivel nos planos Premium, Nacional Plus, Nacional e Regional Goias, com diferencas de cobertura por plano.

Uso no produto:

- Campo candidato: `travelInsurance`.
- Pode ser uma linha de beneficio na comparacao entre planos.
- Nao assumir que todos os planos SPG possuem o mesmo seguro viagem.

### Remissao

O portfolio cita cobertura para remissao em caso de falecimento do titular, com permanencia gratuita dos dependentes elegiveis por periodo determinado.

Planos citados como disponiveis:

- Premium.
- Nacional Plus.
- Nacional.
- Ideal.

Uso no produto:

- Beneficio importante para decisao familiar/empresarial.
- Deve ser explicado com linguagem simples e sempre com nota de que depende das condicoes contratuais.

### Coberturas extra rol

O material cita transplantes de coracao, pulmao e pancreas como coberturas extra rol disponiveis nos planos Premium e Nacional Plus.

Uso no produto:

- Diferencial forte para planos superiores.
- Alto risco de explicacao juridica/assistencial errada; deve ser tratado como destaque condicionado ao contrato, nao promessa isolada.

### Equipes de retaguarda em hospitais de referencia

Servico disponivel para Nacional Plus e Premium, com exemplos em Sao Paulo.

Uso no produto:

- Ajuda a explicar por que planos superiores podem ter mais valor que apenas "rede maior".
- Nao deve ser usado para planos intermediarios.

### Beneficios digitais e assistenciais para todos os beneficiarios

O portfolio cita funcionalidades e beneficios como:

- Aplicativo Bradesco Saude.
- Saude Digital/telemedicina.
- Psicologia online.
- Busca na rede.
- Reembolso digital.
- Carteirinha digital.
- Carteirinha e token offline.
- Acompanhamento de autorizacao de procedimentos.
- Agendamento em Meu Doutor Novamed.
- Agendamento de exames laboratoriais.
- Calendario de vacinas.
- Extrato de utilizacao.
- Caracteristicas do plano.
- Alteracao de dados cadastrais.

Uso no produto:

- Excelente para uma secao "facilidades de uso".
- Diferencia produto sem depender de valores.
- Deve ser validado se todos os itens sao realmente universais para o plano cotado ou se dependem de regiao/cobertura.

### Meu Doutor

O documento descreve:

- Meu Doutor como selecao de medicos que acompanham o beneficiario;
- agendamento online;
- menor tempo de espera;
- prontuario/historico integrado;
- Atencao Primaria a Saude;
- Especialidades;
- Linhas de Cuidado.

Especialidades e linhas citadas incluem pediatria, cardiologia, endocrinologia, pneumologia, ortopedia, infectologia, clinica medica, oncologia, cuidado emocional, obesidade, geriatria, entre outras.

Uso no produto:

- Pode virar beneficio explicativo, especialmente para cliente que pergunta "como uso o plano?".
- Nao resolve rede/hospital especifico.

### Meu Doutor Novamed

Rede de clinicas do grupo Bradesco Seguros com consultas, telemedicina, livre demanda em alguns casos, procedimentos ambulatoriais, exames laboratoriais e de imagem.

Especialidades citadas incluem:

- cardiologia;
- dermatologia;
- endocrinologia;
- fisioterapia;
- fonoaudiologia;
- gastroenterologia;
- ginecologia e obstetricia;
- medicina de familia;
- nutricao;
- oftalmologia;
- ortopedia;
- otorrinolaringologia;
- pediatria;
- psicologia;
- urologia.

Presenca citada:

- Pernambuco.
- Bahia.
- Minas Gerais.
- Sao Paulo.
- Rio de Janeiro.
- Parana.
- Rio Grande do Sul.

Uso no produto:

- Muito relevante para a nossa cotacao de Pernambuco: o portfolio indica presenca de Novamed em Pernambuco.
- Ainda assim, nao substitui busca de unidade/endereco/especialidade disponivel.

### Coparticipacao

O portfolio explica que coparticipacao e uma parte dos custos de procedimentos paga pelo beneficiario.

No segmento SPG, o material informa coparticipacao de 30% para:

- consultas;
- pronto-socorro;
- exames simples;
- exames especiais;
- procedimentos seriados;
- procedimentos ambulatoriais.

Tambem cita valor fixo por evento em caso de internacao.

Outras regras importantes:

- A empresa pode escolher planos com ou sem coparticipacao.
- Uma mesma apolice pode ter planos com e sem coparticipacao.

Uso no produto:

- Campo essencial: `coparticipation`.
- Nao basta mostrar "tem coparticipacao". Precisa mostrar quais eventos entram e que existe limite/tabela.
- Na demo, isso pode virar alerta: "confirmar se esta cotacao foi feita com ou sem coparticipacao".

Perguntas respondidas:

- "Tem coparticipacao?"
- "Em que eu pago coparticipacao?"
- "Da para contratar com e sem coparticipacao?"

Perguntas nao respondidas:

- "Qual valor maximo pago por evento?"
- "Qual tabela exata de coparticipacao?"

### Plano odontologico

O material informa opcao de contratacao do Bradesco Dental simultaneamente ao plano Bradesco Saude, com uma unica carteirinha.

Uso no produto:

- A cotacao extraida de Saude ja traz valores de Dental Conjugado.
- O link publico deve separar claramente:
  - premio Saude;
  - premio Dental;
  - total conjugado.
- Dental nao deve parecer obrigatorio se for opcional.

### Reembolso

O portfolio separa duas modalidades:

#### Reembolso especifico

Permite solicitar reembolso de:

- consultas medicas;
- honorarios medicos de paciente internado.

Pontos importantes:

- consulta deve ser realizada por medico com CRM ativo;
- honorarios de internacao se referem a profissionais de saude nao pertencentes a rede referenciada;
- para honorarios de paciente internado, o procedimento deve ser autorizado previamente e realizado em prestador da rede referenciada Bradesco Saude;
- reembolso segue a Tabela de Honorarios e Servicos Medicos;
- limites, condicoes contratuais e regioes habilitadas precisam ser conferidos.

Uso no produto:

- O alerta do portal e o PDF de cotacao observado indicam `Reembolso Especifico`.
- O link publico precisa explicar isso em linguagem direta: "nao e reembolso livre para qualquer procedimento; e limitado a consultas medicas e honorarios em contexto especifico".

#### Reembolso completo

Permite reembolso de procedimentos cobertos pelo plano contratado, de acordo com a segmentacao assistencial, quando realizados fora da rede referenciada e dentro dos limites contratuais.

Uso no produto:

- Diferencial importante para Nacional Plus/Premium e possivelmente outros planos conforme regiao/modalidade.
- Nao resumir como "reembolsa tudo"; sempre condicionar a cobertura, documentacao e limites.

Regra SPG citada:

- No segmento SPG, a contratacao de plano com reembolso especifico esta condicionada a origem do CNPJ da empresa contratante.
- Reembolso completo se aplica a empresas que nao se enquadram nos criterios de contratacao do reembolso especifico.

Uso no produto:

- O sistema nao deve permitir que o corretor escolha manualmente reembolso sem contexto; deve refletir o que veio da cotacao/PDF ou pedir validacao.

### Mudancas recentes em reembolso e extra rol

O portfolio avisa que processos de venda criados a partir da data de lancamento da nova modalidade possuem novos multiplos de reembolso e alteracoes em coberturas extra rol para SPG.

Uso no produto:

- Importante versionar material e regras por data.
- Um parser/catalogo estatico pode ficar errado se nao considerar atualizacao do PDF.

### Ferramentas de gestao

O documento cita:

- Sistema de Movimentacao Expressa: para empresa e corretora gerenciarem plano, beneficiarios e cadastro; disponivel para empresas com ate 199 pessoas.
- Sistema de Informacoes Gerenciais: relatorios com historico de 36 meses; disponivel para empresas com no minimo 100 pessoas.

Uso no produto:

- Pode aparecer como beneficio para decisor de RH/empresa.
- SIGE so deve aparecer para grupos com no minimo 100 pessoas.

### Matriz final de comparacao do portfolio

A pagina final traz uma matriz comparativa do segmento SPG com:

- nome do plano;
- abrangencia;
- acomodacoes;
- segmentacao ambulatorial + hospitalar com obstetricia;
- segmentacao hospitalar com obstetricia;
- inclusao compulsoria ou opcional;
- planos com coparticipacao;
- reembolso especifico;
- reembolso completo;
- Programa Meu Doutor;
- Clinicas Meu Doutor Novamed;
- Clube+Saude;
- plano odontologico;
- remissao;
- seguro viagem;
- coberturas extra rol;
- concierge;
- equipe de retaguarda em hospitais de referencia.

Problema de extracao: por ser uma matriz visual, o texto extraido pelo PDF lab perde associacao precisa entre colunas e planos. Para transformar em catalogo confiavel, provavelmente sera necessario:

- extrair a pagina com OCR/layout mais cuidadoso; ou
- capturar manualmente a matriz em tabela estruturada; ou
- pedir validacao humana plano a plano.

### Perguntas de cliente que este PDF ajuda a responder

- "Esse produto e para empresas pequenas?"
- "Qual a faixa de vidas do SPG?"
- "Quais familias de planos existem?"
- "Qual plano e mais basico e qual e mais completo?"
- "Esse plano tem abrangencia nacional?"
- "Tem telemedicina?"
- "Tem psicologia online?"
- "Tem app/carteirinha digital?"
- "Tem reembolso?"
- "Qual a diferenca entre reembolso especifico e completo?"
- "Existe coparticipacao?"
- "Dental pode entrar junto?"
- "Planos melhores tem hospitais diferenciados?"
- "Premium e Nacional Plus entregam o que a mais?"

### Perguntas que este PDF nao responde bem

- "O hospital X aceita este plano na minha cidade?"
- "Qual laboratorio perto da empresa atende?"
- "Quanto exatamente vou receber de reembolso por uma consulta de R$ X?"
- "Qual o limite exato de coparticipacao por procedimento?"
- "Quais carencias se aplicam neste contrato?"
- "O plano cotado no PDF esta com ou sem coparticipacao?"
- "Qual rede especifica vale para Pernambuco no plano Nacional II?"

### Campos candidatos para produto/schema

- `segment`: SPG.
- `spgRange`: SPG 3, SPG 30, SPG 100.
- `planFamily`: Efetivo, Efetivo Plus, Flex, Ideal, Nacional, Nacional Plus, Premium, Regional.
- `coverageScope`: nacional ou regional.
- `accommodationOptions`.
- `assistentialSegmentation`: A+H+OB ou H+OB.
- `admissionMode`: compulsoria/opcional.
- `coparticipationAvailable`.
- `coparticipationDetails`.
- `reimbursementMode`: especifico/completo.
- `reimbursementNotes`.
- `dentalAvailable`.
- `digitalBenefits`.
- `conciergeAvailable`.
- `travelInsuranceAvailable`.
- `remissionAvailable`.
- `extraRolCoverageAvailable`.
- `managementTools`.
- `networkValidationRequired`.

### UX para link publico

Este PDF sugere que o link publico de Saude Bradesco deve ter pelo menos quatro camadas:

1. Resumo da cotacao:
   - plano;
   - regiao;
   - vidas;
   - valores.
2. O que o plano significa:
   - familia do plano;
   - abrangencia;
   - acomodacao;
   - reembolso;
   - coparticipacao.
3. Beneficios que ajudam a decidir:
   - telemedicina;
   - psicologia online;
   - app/carteirinha;
   - Meu Doutor/Novamed;
   - dental, se contratado.
4. Pendencias que precisam de confirmacao:
   - rede hospitalar por cidade;
   - tabela de reembolso;
   - carencias;
   - coparticipacao detalhada;
   - regras contratuais especificas.

### Riscos de apresentacao

- Nao transformar material comercial em promessa contratual.
- Nao dizer que um hospital especifico aceita um plano sem fonte de rede.
- Nao aplicar beneficios de Premium/Nacional Plus em planos inferiores.
- Nao tratar reembolso especifico como reembolso completo.
- Nao assumir que todos os planos possuem seguro viagem, remissao, concierge ou extra rol.
- Nao confiar cegamente na matriz extraida por texto; ela precisa de estruturacao manual.
- Nao usar a data do material como regra eterna; o PDF e versao Fevereiro/2026.

### Prioridade para MVP

Alta.

Motivo: este PDF e o melhor material para construir a linguagem explicativa do link publico e para orientar uma conversa consultiva curta com corretora/cliente.

Para o primeiro fluxo Bradesco Saude, aproveitar:

- segmento SPG 3 a 199;
- familias de planos;
- explicacao de reembolso especifico/completo;
- coparticipacao opcional;
- dental conjugado;
- beneficios digitais;
- pendencia de rede/reembolso detalhado.

## 260420_BRASAU_EfetivoPlus_SP-DF-RS-PR_AF_OP1.pdf

### Tipo de documento

Material comercial especifico do plano Bradesco Saude Efetivo Plus, versao Abril/2026.

Ao contrario do `Portfolio SPG.pdf`, que apresenta a familia inteira de planos, este PDF aprofunda um produto especifico. Ele e muito util para construir uma ficha explicativa de plano no link publico.

### Escopo e publico

- Produto: Bradesco Saude Efetivo Plus.
- Publico: empresas, com contratos a partir de 3 pessoas.
- Abrangencia declarada: cobertura em todo o Brasil.
- Acomodacao: quarto ou enfermaria.
- Segmentacao assistencial: ambulatorial + hospitalar com obstetricia.
- Reembolso: especifico.
- Coparticipacao: opcional.

Implicacao para produto: este PDF conversa diretamente com a necessidade de explicar "o que esta sendo comprado", nao apenas mostrar preco.

### Cobertura assistencial

O material informa que o plano cobre:

- urgencia e emergencia;
- consultas;
- exames;
- terapias;
- internacao;
- cirurgias;
- parto.

Uso no produto:

- Pode alimentar um bloco simples de "Coberturas principais".
- Bom para explicar o plano em linguagem humana.
- Deve ser condicionado ao contrato e as regras do plano, principalmente porque materiais comerciais sao indicativos.

### Reembolso especifico

O Efetivo Plus e apresentado com modalidade de reembolso especifico.

O material informa possibilidade de solicitar reembolso para:

- consultas medicas;
- honorarios medicos de paciente internado.

O documento tambem aponta para regras e tabelas de multiplos do Efetivo Plus, mas nao traz a tabela completa no texto extraido.

Uso no produto:

- O link publico deve evitar a frase generica "tem reembolso" sem qualificacao.
- Para cliente final, a explicacao recomendada e: "Este plano possui reembolso especifico, voltado principalmente a consultas medicas e honorarios medicos em internacao, conforme regras e limites da seguradora."
- O produto deve marcar `reimbursementMode = specific`.
- Campo pendente importante: tabela de multiplos/valores de reembolso.

Perguntas que responde parcialmente:

- "Posso pedir reembolso?"
- "Reembolsa consulta?"
- "Reembolsa medico fora da rede em internacao?"

Perguntas que ainda nao responde:

- "Quanto recebo por uma consulta de R$ X?"
- "Qual e o limite de reembolso por especialidade?"
- "Como o multiplo do Efetivo Plus e calculado?"

### Coparticipacao

O material reforca que a coparticipacao no Efetivo Plus e opcional.

Quando contratada, a coparticipacao e de 30% para:

- consultas;
- exames simples;
- exames especiais;
- procedimentos seriados;
- pronto-socorro;
- procedimentos ambulatoriais.

Tambem ha regra de valor fixo por evento para internacoes.

O PDF destaca que existe limite de valor de coparticipacao por procedimento, e que o excedente acima do limite da tabela nao e cobrado.

Uso no produto:

- Campo candidato: `coparticipation.enabled`.
- Campo candidato: `coparticipation.rate = 30%`, se o PDF/cotacao confirmar que foi contratado com coparticipacao.
- Campo candidato: `coparticipation.appliesTo`.
- Campo candidato: `coparticipation.hasEventLimit`.
- O sistema deve perguntar ou extrair se a cotacao esta com ou sem coparticipacao.

Risco: o material fala que a coparticipacao e opcional, mas isso nao significa que toda cotacao Efetivo Plus tenha coparticipacao. O valor final no PDF de cotacao precisa indicar ou o corretor precisa confirmar.

### Beneficios do Efetivo Plus

O PDF lista beneficios associados ao plano:

- Saude Digital/telemedicina.
- Psicologia online.
- Programa Meu Doutor.
- Clinicas Meu Doutor Novamed.
- Clube+Saude.

Uso no produto:

- Bom para uma secao "Facilidades incluidas".
- Ajuda o cliente a perceber valor alem de preco.
- Deve ficar separado de "coberturas contratuais", porque sao beneficios/servicos sujeitos a disponibilidade e abrangencia.

### Rede Efetivo Plus

Este PDF traz exemplos de rede por estado, diferente do Portfolio SPG que era mais geral.

Estados/regioes explicitamente trabalhados:

- Sao Paulo.
- Distrito Federal.
- Rio Grande do Sul.
- Parana.

Para cada estado, o material lista principais hospitais e, em alguns casos, laboratorios. A tabela tambem indica acomodacao por prestador usando marcadores de quarto/enfermaria.

Uso no produto:

- Este documento prova que materiais de apoio podem sim trazer rede, mas de forma parcial e regional.
- Nao e uma rede completa nacional.
- Para a nossa amostra atual de Pernambuco, este PDF nao responde rede local, apesar de o Portfolio SPG mencionar presenca de Novamed em Pernambuco.
- Pode alimentar uma estrutura futura `networkHighlights`, mas nao `fullNetwork`.

Perguntas respondidas:

- "O Efetivo Plus tem exemplos de hospitais/laboratorios em SP, DF, RS e PR?"
- "Esse hospital aparece como destaque no material comercial?"

Perguntas nao respondidas:

- "Qual rede Efetivo Plus em Pernambuco?"
- "A lista esta completa e atualizada?"
- "O hospital X aceita quarto ou enfermaria para o plano cotado?"

### Acomodacao por prestador

O PDF mostra a legenda:

- QTO = quarto.
- ENF = enfermaria.

E recomenda verificar o tipo de acomodacao disponivel para cada prestador pela rede completa/QR Code.

Uso no produto:

- Campo de plano: `accommodationOptions = room | ward`.
- Campo futuro de rede: prestador pode ter acomodacao variavel.
- No link publico, nao basta dizer que o plano tem quarto ou enfermaria; o prestador especifico pode ter restricoes.

### Registros ANS

O material lista registros ANS separados por acomodacao e coparticipacao:

- Efetivo Plus E CE.
- Efetivo Plus E CE copart.
- Efetivo Plus Q CE.
- Efetivo Plus Q CE copart.

Uso no produto:

- A sigla provavelmente diferencia enfermaria/quarto e coparticipacao.
- Isso e util para catalogo interno, mas nao deve aparecer cru para cliente final sem traducao.
- Pode ajudar a validar se a cotacao corresponde a quarto/enfermaria e com/sem coparticipacao.

### Contatos e canais

O PDF traz central de relacionamento, WhatsApp, SAC, ouvidoria, Libras, site e redes sociais.

Uso no produto:

- Baixa prioridade para MVP.
- Pode compor rodape ou area "canais oficiais", mas nao ajuda muito na decisao de compra.

### Perguntas de cliente que este PDF ajuda a responder

- "O Efetivo Plus serve para empresa pequena?"
- "Tem cobertura nacional?"
- "Cobre consultas, exames, terapias, internacao e parto?"
- "Tem telemedicina?"
- "Tem psicologia online?"
- "Tem Meu Doutor ou Novamed?"
- "Tem reembolso?"
- "O reembolso e completo ou especifico?"
- "Tem coparticipacao?"
- "Em quais usos a coparticipacao se aplica?"
- "Existe limite de coparticipacao?"
- "Quais hospitais/laboratorios aparecem como destaque em alguns estados?"

### Perguntas que este PDF nao responde bem

- "Qual e a rede em Pernambuco?"
- "Qual e a tabela exata de reembolso?"
- "Qual e o valor maximo de coparticipacao por procedimento?"
- "Quais carencias se aplicam?"
- "O meu PDF de cotacao esta com coparticipacao ou sem?"
- "O cliente pode escolher quarto ou enfermaria livremente, ou isso depende do plano/prestador?"

### Campos candidatos para produto/schema

- `planFamily`: Efetivo Plus.
- `minLives`: 3.
- `coverageScope`: nacional.
- `assistentialSegmentation`: ambulatorial + hospitalar com obstetricia.
- `accommodationOptions`: quarto ou enfermaria.
- `reimbursementMode`: especifico.
- `coparticipationAvailable`: true.
- `coparticipationOptional`: true.
- `coparticipationRate`: 30%, quando contratada.
- `coparticipationAppliesTo`: consultas, exames simples, exames especiais, procedimentos seriados, pronto-socorro, procedimentos ambulatoriais, internacao por valor fixo.
- `digitalBenefits`: telemedicina, psicologia online, app/area exclusiva.
- `carePrograms`: Meu Doutor.
- `clinicNetworkPrograms`: Meu Doutor Novamed.
- `wellbeingBenefits`: Clube+Saude.
- `networkHighlights`: lista parcial por UF/cidade, com fonte e data.
- `ansRegistrationCodes`: catalogo interno, nao necessariamente exibido ao cliente.

### UX para link publico

Se o plano cotado for Efetivo Plus, o link publico poderia mostrar:

1. Chamada curta:
   - "Plano com cobertura nacional, reembolso especifico e opcao de coparticipacao."
2. Coberturas principais:
   - consultas, exames, terapias, internacao, cirurgias e parto.
3. Reembolso:
   - explicar que e especifico e depende de regras/tabela.
4. Coparticipacao:
   - mostrar se a cotacao esta com ou sem coparticipacao; se estiver com, explicar eventos de 30% e limite por tabela.
5. Beneficios:
   - telemedicina, psicologia online, Meu Doutor, Novamed, Clube+Saude.
6. Rede:
   - se houver UF presente no material, listar "destaques de rede";
   - se nao houver, mostrar "rede precisa ser validada na busca oficial".

### Riscos de apresentacao

- Nao usar rede de SP/DF/RS/PR para explicar uma cotacao de Pernambuco.
- Nao afirmar coparticipacao se a cotacao nao indicar que ela foi contratada.
- Nao prometer valor de reembolso sem tabela.
- Nao tratar os hospitais listados como rede completa.
- Nao expor registros ANS como se fossem nomes comerciais compreensiveis.
- Nao apresentar beneficios digitais como garantia universal sem mencionar disponibilidade/contrato.

### Prioridade para MVP

Alta, se o primeiro fluxo incluir ou puder incluir Efetivo Plus.

Mesmo quando a cotacao atual nao for Efetivo Plus, este PDF ensina um formato de ficha de plano que pode ser replicado:

- resumo comercial;
- cobertura;
- reembolso;
- coparticipacao;
- beneficios;
- rede parcial;
- pendencias de validacao.

## CE SPG - A+H+OB_01.04.2026.pdf e CE SPG - H+OB_01.04.2026.pdf

### Tipo de documento

Condicoes Gerais contratuais do Bradesco Saude para o segmento SPG, versao 01.04.2026.

Foram analisados em conjunto porque os documentos sao irmaos:

- `CE SPG - A+H+OB_01.04.2026.pdf`: cobertura assistencial Ambulatorial + Hospitalar com Obstetricia, Coletivo Empresarial SPG 03 a 199 segurados.
- `CE SPG - H+OB_01.04.2026.pdf`: cobertura assistencial Hospitalar com Obstetricia, Coletivo Empresarial SPG 03 a 199 segurados.

Estes PDFs nao sao bons para apresentacao direta ao cliente final, mas sao muito importantes para evitar que o produto simplifique demais informacoes sensiveis como reembolso, carencia, preexistencia, rede e transferencia de plano.

### Leitura geral

Os dois documentos tratam de:

- objeto do seguro;
- definicoes contratuais;
- coberturas;
- exclusoes de cobertura;
- carencias;
- doencas ou lesoes preexistentes;
- modalidades de atendimento;
- rede referenciada;
- livre escolha/reembolso;
- condicoes de aceitacao e admissao;
- pagamento do premio;
- coparticipacao;
- regras de inclusao/exclusao;
- transferencia de planos;
- protecao de dados;
- anexos e servicos complementares, incluindo Seguro Viagem em partes do documento.

Uso no produto: servem como base de validacao e alertas. A camada de UX deve traduzir o que importa sem tentar substituir a corretora ou o contrato oficial.

### Diferenca principal entre A+H+OB e H+OB

| Documento | Segmentacao | Leitura pratica |
| --- | --- | --- |
| A+H+OB | Ambulatorial + Hospitalar com Obstetricia | Cobre atendimento ambulatorial e hospitalar dentro do Rol/contrato. Conversa melhor com consultas, exames, terapias, internacoes, cirurgias e parto. |
| H+OB | Hospitalar com Obstetricia | Foco hospitalar com obstetricia. A parte de consultas/reembolso especifico aparece muito mais restrita, especialmente vinculada a pre-natal/parto/puerperio no reembolso especifico. |

Implicacao para produto: `assistentialSegmentation` e campo critico. Nao basta mostrar plano e preco. Dois PDFs com nomes parecidos podem responder de forma diferente a pergunta "esse plano cobre consulta/exame/terapia?".

### Objeto do seguro

Ambos os documentos dizem que o seguro garante cobertura de despesas medicas/hospitalares cobertas, dentro dos termos, limites, Rol ANS, diretrizes aplicaveis e area de abrangencia contratada.

No A+H+OB, o objeto e a cobertura deixam claro o conjunto ambulatorial e hospitalar com obstetricia.

No H+OB, o foco e hospitalar com obstetricia.

Uso no produto:

- Campo candidato: `assistentialSegmentation`.
- O link publico deveria exibir algo como:
  - "Segmentacao: Ambulatorial + Hospitalar com Obstetricia"; ou
  - "Segmentacao: Hospitalar com Obstetricia".
- A descricao ao cliente precisa explicar o impacto: o primeiro e mais amplo para uso cotidiano; o segundo e mais voltado a internacao/obstetricia, conforme contrato.

### Rede referenciada

Os dois contratos reforcam que a rede referenciada e a forma primaria de uso do plano:

- a seguradora disponibiliza lista de profissionais e instituicoes da rede do plano contratado;
- na rede referenciada, as despesas cobertas sao pagas diretamente ao prestador;
- nao ha reembolso quando o segurado usa a rede referenciada;
- a lista de rede atualizada fica no portal/app da Bradesco Saude;
- a rede pode ser alterada conforme legislacao.

Uso no produto:

- Campo candidato: `networkSource = officialPortalOrApp`.
- O sistema deve evitar prometer rede a partir de material estatico.
- O link publico pode dizer: "A rede deve ser validada na busca oficial Bradesco Saude para o plano/regiao."

Pergunta respondida:

- "Onde consulto a rede atualizada?" No portal/app oficial e canais da Bradesco Saude.

Pergunta nao respondida:

- "O hospital X aceita exatamente este plano hoje?" O contrato nao responde; precisa consulta atualizada.

### Livre escolha e reembolso

Os dois documentos separam:

- atendimento na rede referenciada;
- acesso a livre escolha de prestadores, quando houver modalidade de reembolso contratada.

Reembolso completo:

- reembolsa procedimentos cobertos pelo plano contratado, quando realizados fora da rede, respeitando limites, area de abrangencia/atuacao, documentacao e regras contratuais.

Reembolso especifico:

- e limitado e nao deve ser tratado como reembolso livre.

### Diferenca importante no reembolso especifico

No A+H+OB, o reembolso especifico aparece como exclusivo para:

- consultas medicas eletivas realizadas por medico com CRM ativo;
- honorarios medicos de paciente internado com previa autorizacao de internacao em rede referenciada.

No H+OB, o reembolso especifico aparece mais restrito:

- consultas medicas eletivas relacionadas ao pre-natal, realizadas em consultorio, por medico com CRM ativo;
- assistencia ao parto e puerperio;
- honorarios medicos de paciente internado com previa autorizacao de internacao em rede referenciada.

Implicacao enorme para UX:

- Se a cotacao/PDF indicar reembolso especifico, ainda precisamos saber a segmentacao do plano.
- "Reembolso especifico" em A+H+OB nao parece ter a mesma amplitude pratica que em H+OB.
- O link publico deve evitar frase unica para todos os reembolsos especificos.

Texto seguro para cliente:

```txt
Esta cotacao indica reembolso especifico. Isso nao significa reembolso livre para qualquer procedimento fora da rede. A regra depende da segmentacao do plano e dos Atributos do Plano. Antes de apresentar como beneficio, confirme se a cotacao e A+H+OB ou H+OB e consulte a tabela de reembolso.
```

### Honorarios medicos de paciente internado

Ambos os documentos tratam honorarios medicos de paciente internado como item reembolsavel no reembolso especifico, mas com condicoes:

- internacao previamente autorizada;
- atendimento em rede referenciada do plano contratado;
- visita medica registrada em prontuario;
- pagamento a profissionais como cirurgiao, medico assistente, instrumentador e anestesista, conforme tabela;
- exames complementares nao entram como honorarios, exceto situacoes especificas como anestesista.

Uso no produto:

- Campo candidato: `reimbursementSpecific.inpatientMedicalFees`.
- Na UI, isso deve ser explicado com cuidado, porque cliente pode entender errado como "posso internar fora da rede e reembolsar tudo".

### Documentacao para reembolso

Os contratos detalham documentos necessarios para solicitar reembolso, incluindo nota fiscal/recibo Receita Saude, comprovante de pagamento, dados do paciente, procedimento, profissional, registro no conselho e CNES ativo/regularizado em alguns casos.

Uso no produto:

- Nao precisa aparecer inteiro no MVP.
- Pode virar checklist futuro "para pedir reembolso".
- Para corretora, pode gerar alerta: "reembolso exige comprovantes formais e documentos digitais".

### Carencia

No A+H+OB foi localizado:

- 24 horas para urgencia e emergencia;
- 300 dias para parto a termo;
- 180 dias para demais casos.

Tambem ha regra de isencao para apolices com 30 ou mais vidas, desde que o pedido de inclusao seja feito dentro dos prazos previstos.

O H+OB segue estrutura semelhante de carencia e preexistencia, mas deve ser validado no contrato especifico quando a cotacao usar essa segmentacao.

Uso no produto:

- Campo candidato: `waitingPeriods`.
- Campo candidato: `waitingPeriodWaiverRules`.
- Para o link publico, nao basta dizer "tem carencia"; melhor apresentar como "carencia depende do tamanho do grupo e prazo de inclusao".

Pergunta respondida:

- "Pode ter isencao de carencia?" Sim, em cenarios especificos de 30+ vidas e inclusao no prazo.

Pergunta nao respondida pelo PDF de cotacao:

- "Esta empresa/vida especifica tera carencia?" Precisa dados de implantacao/inclusao e validacao da corretora.

### Doencas ou lesoes preexistentes

Os contratos tratam de DLP e Cobertura Parcial Temporaria (CPT).

Pontos importantes:

- pode haver Declaracao de Saude;
- a seguradora pode exigir exame medico para avaliacao de risco;
- omissao de informacao pode gerar processo e consequencias;
- ha regras que reduzem/apagam aplicacao de CPT em cenarios de 30+ vidas e inclusao no prazo.

Uso no produto:

- Campo candidato: `preExistingConditionRules`.
- Para UX, isso nao deve virar promessa automatica.
- Pode virar alerta interno: "validar DLP/CPT quando grupo abaixo de 30 vidas ou inclusao fora do prazo".

### Condicoes de aceitacao e admissao

Os documentos reforcam que e seguro coletivo empresarial, vinculado a pessoa juridica contratante.

Pontos importantes:

- cobertura se estende a populacao delimitada e vinculada a PJ/empresario individual;
- proposta e documentos de inclusao formalizam aceitacao;
- grupo homogeneo deve ter padrao de seguro unico;
- grupo homogeneo envolve igualdade ou similaridade de salario, cargo ou funcao;
- inclusao de titular/dependentes tem prazo de 30 dias em eventos de elegibilidade;
- recem-nascido/filho adotivo tem regras especificas de inclusao;
- nao pode haver impedimento por idade ou deficiencia, respeitadas as condicoes de dependente.

Uso no produto:

- Campo candidato: `eligiblePopulation`.
- Campo candidato: `functionalCategory`.
- Campo candidato: `inclusionDeadlineDays = 30`.
- Isso conversa diretamente com o portal, que ja pede categoria funcional e tipo de adesao.

### Transferencia de planos

Os contratos tratam de transferencia entre planos durante vigencia.

Pontos relevantes:

- transferencia pode estar limitada a acomodacao e/ou multiplo de reembolso;
- nao ha livre opcao de transferencia para Nacional Plus e Premium;
- transferencia por promocao de categoria funcional pode ocorrer se houver planos por categoria;
- nao e permitida transferencia/retorno para plano inferior.

Uso no produto:

- Isso e importante para perguntas de pos-venda e RH.
- Pode virar alerta: "mudancas futuras de plano tem regras; nao trate como troca livre".

### Pagamento do premio

O premio e responsabilidade do estipulante.

Pontos importantes:

- valor do premio e preestabelecido;
- vencimento mensal segue regra da primeira parcela/proposta;
- atraso pode gerar multa, juros e atualizacao monetaria;
- seguradora nao pode distinguir valor de premio entre novos segurados e segurados ja vinculados, conforme regra contratual localizada.

Uso no produto:

- Para MVP, manter apenas valores da cotacao.
- Para fase futura, pode alimentar explicacao para decisor financeiro/RH.

### Coparticipacao

Os contratos trazem regra contratual mais precisa que os materiais comerciais:

- percentuais, valores limites e grupos de procedimentos ficam previstos na Proposta de Seguro;
- tabela de procedimentos sujeitos a coparticipacao fica no portal da Bradesco Saude e pode ser atualizada;
- quando houver limite e percentual, prevalece o que for menor;
- valores/percentuais podem ser alterados por acordo entre as partes, respeitando norma ANS;
- para rede referenciada, coparticipacao e cobrada do estipulante;
- para livre escolha/reembolso, coparticipacao pode ser deduzida do reembolso;
- estipulante e responsavel por pagar integralmente a seguradora e cobrar dos segurados vinculados;
- apos cancelamento, pode haver cobranca de coparticipacao pendente por ate 12 meses.

Uso no produto:

- Campo candidato: `coparticipationSource = proposal`.
- Campo candidato: `coparticipationTableSource = bradescoPortal`.
- O link publico deve mostrar coparticipacao apenas se a cotacao/proposta indicar.
- A demo pode ter um estado "coparticipacao: confirmar na proposta".

### Exclusoes de cobertura

Os documentos possuem lista extensa de exclusoes.

Para produto/MVP, nao faz sentido exibir tudo. Mas algumas categorias importam como alerta:

- procedimentos experimentais;
- home care/assistencia domiciliar fora das condicoes previstas;
- procedimentos fora do Rol/contrato;
- transplantes nao previstos no Rol, salvo coberturas extra rol especificas de certos planos;
- despesas/documentos fora dos criterios contratuais;
- em reembolso especifico, limitacoes de honorarios ligados a exames complementares.

Uso no produto:

- Criar area "limites importantes" com linguagem curta.
- Nunca transformar "cobre X" em promessa ampla sem ressalva contratual.

### Seguro Viagem e anexos

Os contratos tambem trazem informacoes de Seguro Viagem Bradesco, limites e regras. Isso aparece mais como anexo/beneficio complementar e nao como nucleo da cotacao de Saude.

Uso no produto:

- Beneficio opcional/por plano, nao universal.
- Melhor vir do catalogo do plano do que do PDF de cotacao.

### Perguntas de cliente que estes PDFs ajudam a responder

- "Qual a diferenca entre plano ambulatorial + hospitalar e somente hospitalar?"
- "O que significa reembolso especifico?"
- "Em reembolso especifico, posso reembolsar qualquer consulta?"
- "A rede referenciada e atualizada onde?"
- "Tem carencia?"
- "Existe isencao de carencia para empresas maiores?"
- "Como entram dependentes e recem-nascidos?"
- "Tem regra para doenca preexistente?"
- "A empresa pode ter planos por categoria funcional?"
- "Posso trocar para outro plano depois?"
- "Coparticipacao e cobrada como?"

### Perguntas que continuam sem resposta operacional

- "Qual hospital atende este plano hoje em Recife/Pernambuco?"
- "Qual tabela de reembolso se aplica ao plano Nacional II/TREN?"
- "A cotacao atual e A+H+OB ou H+OB?"
- "A cotacao atual foi emitida com coparticipacao?"
- "Quais carencias serao aplicadas a esta empresa especifica?"
- "Quais dependentes concretos sao elegiveis neste CNPJ?"

### Campos candidatos para produto/schema

- `assistentialSegmentation`: `ambulatory_hospital_obstetrics` ou `hospital_obstetrics`.
- `coverageArea`.
- `networkSource`.
- `reimbursementMode`.
- `reimbursementSpecificScope`.
- `reimbursementRequiresPriorAuthorization`.
- `reimbursementDocumentationChecklist`.
- `waitingPeriods`.
- `waitingPeriodWaiverRules`.
- `preExistingConditionRules`.
- `eligiblePopulation`.
- `functionalCategoryRules`.
- `dependentInclusionRules`.
- `newbornInclusionDeadlineDays`.
- `planTransferRules`.
- `coparticipationSource`.
- `coparticipationBillingRules`.
- `exclusionsSummary`.
- `contractVersion`.

### UX para link publico

Estes contratos sugerem que o link publico nao deve tentar resolver tudo. Ele deveria mostrar:

1. O que veio da cotacao:
   - plano;
   - codigo;
   - regiao;
   - vidas;
   - valores;
   - reembolso;
   - dental, se houver.
2. O que precisa ser confirmado:
   - segmentacao A+H+OB vs H+OB;
   - coparticipacao;
   - carencia;
   - rede atualizada;
   - tabela de reembolso.
3. Explicacao simples:
   - reembolso especifico nao e reembolso livre;
   - rede referenciada deve ser consultada no portal/app;
   - carencia depende do grupo e prazo de inclusao.

### Riscos de apresentacao

- Misturar regras de A+H+OB com H+OB.
- Explicar reembolso especifico como se fosse igual em toda segmentacao.
- Prometer isencao de carencia sem saber tamanho do grupo e prazo de inclusao.
- Dizer que ha coparticipacao sem confirmar na proposta/cotacao.
- Usar lista de rede de material comercial como fonte atualizada.
- Exibir juriquiques demais para cliente final.
- Esconder ressalvas essenciais e criar expectativa errada.

### Prioridade para MVP

Alta para validacao conceitual, media para exibicao direta.

Esses documentos devem alimentar:

- regras de alerta;
- perguntas para a corretora preencher;
- tooltips e explicacoes;
- checklist de pendencias;
- validacao de linguagem.

Nao devem alimentar diretamente uma tela cheia de clausulas.

## A.F.Dig.Formulario_DSC_Pediatria_100226.pdf

### Tipo de documento

Formulario operacional de Declaracao de Saude Complementar Pediatrica, versao 02/2026.

Nao e material de venda. E um documento medico/operacional para criancas menores de 12 anos, a ser preenchido exclusivamente por medico pediatra, com assinatura/carimbo ou assinatura digital.

### Escopo e publico

- Publico: beneficiario pediatrico, menor de 12 anos.
- Responsavel: pai/mae/responsavel legal autoriza tratamento dos dados.
- Preenchimento medico: exclusivamente por pediatra.
- Finalidade: complementar a declaracao de saude da proposta.

Implicacao para produto: este documento pertence mais ao fluxo de contratacao/aceitacao do que ao fluxo de comparacao de planos.

### Conteudo solicitado

O formulario pergunta sobre:

- pre-natal;
- anormalidades na gravidez;
- anormalidades no exame fisico apos nascimento;
- choro ao nascer;
- internacao em CTI;
- outras internacoes;
- doenca cardiaca;
- doenca neurologica;
- doenca ortopedica;
- hernias, fimose, hidrocele e similares;
- doencas oftalmologicas;
- doenca renal;
- desenvolvimento neuropsicomotor;
- doencas respiratorias e de ouvido;
- doenca genetica;
- fisioterapia, psicoterapia, terapia ocupacional e fonoaudiologia;
- medicamento ou nutricao especial;
- internacao clinica ou cirurgica nao mencionada antes;
- observacoes e informacoes complementares.

Anexos solicitados:

- teste do pezinho;
- cartao de vacinacao;
- resultados de exames realizados.

### Privacidade e dados sensiveis

O proprio formulario avisa que contem dados pessoais sensiveis e deve ser tratado com confidencialidade.

Uso no produto:

- Este tipo de PDF nunca deve ser usado como material de demo publica.
- Se no futuro houver upload desse documento, precisa de regras duras de privacidade, mascaramento, controle de acesso e retencao.
- Para o momento, o documento deve servir apenas para entender possiveis pendencias operacionais da proposta.

### Perguntas de cliente/corretora que este PDF ajuda a responder

- "Quando uma crianca precisa de formulario complementar?"
- "Quem deve preencher?"
- "Quais anexos costumam ser pedidos?"
- "Que tipo de historico medico pode ser solicitado pela seguradora?"
- "Por que a implantacao pode travar mesmo depois da cotacao?"

### Perguntas que este PDF nao responde

- "O plano e bom?"
- "Qual hospital atende?"
- "Qual o valor do premio?"
- "Qual reembolso se aplica?"
- "A crianca sera aceita?" O formulario so coleta informacoes; a aceitacao depende da analise.

### Campos candidatos para produto/schema

- `requiresPediatricSupplementalDeclaration`.
- `beneficiaryAge`.
- `medicalFormRequired`.
- `medicalFormResponsible = pediatrician`.
- `requiredAttachments`: teste do pezinho, cartao de vacinacao, exames.
- `sensitiveDocument = true`.
- `privacyLevel = high`.
- `workflowStage = contracting_or_underwriting`.

### UX para produto

Este PDF sugere uma area futura de "Pendencias para contratacao":

- "Para menores de 12 anos, pode ser solicitada declaracao complementar pediatrica."
- "O preenchimento deve ser feito por medico pediatra."
- "Podem ser necessarios anexos como teste do pezinho, cartao de vacinacao e exames."

No link publico de venda, isso deve aparecer no maximo como aviso discreto, nao como destaque principal. Para corretora, pode virar checklist interno.

### Riscos

- Expor dados medicos/sensiveis em discovery, demo ou link publico.
- Tratar o formulario como garantia de aceitacao.
- Transformar perguntas medicas em scoring automatico sem governanca.
- Guardar documentos sensiveis sem politica clara.

### Prioridade para MVP

Baixa para a demo de venda.

Alta para maturidade futura de fluxo operacional/pos-venda, especialmente se o sistema evoluir para acompanhar implantacao de proposta.

## Portfolio Empresarial.pdf

### Tipo de documento

Portfolio comercial Bradesco Saude para empresas a partir de 200 pessoas, versao Fevereiro/2026.

E parecido com o `Portfolio SPG.pdf`, mas direcionado ao segmento Empresarial. Serve como comparativo futuro e como prova de que algumas regras mudam conforme porte da empresa.

### Escopo e publico

- Segmento: Empresarial.
- Publico: empresas a partir de 200 pessoas.
- Contrasta com SPG, que atende 3 a 199 pessoas.

Uso no produto:

- Nao deve guiar a primeira demo se a cotacao atual estiver em SPG.
- Deve ficar como base futura para quando o produto Saude suportar grandes empresas.

### Planos citados

O portfolio Empresarial cita essencialmente a mesma familia comercial:

- Efetivo.
- Efetivo Plus.
- Flex.
- Ideal.
- Nacional.
- Nacional Plus.
- Premium.
- Rio+ e Sao Paulo+.
- Regional Goias.

Uso no produto:

- Reforca a necessidade de catalogo por segmento.
- O mesmo nome de plano pode existir em SPG e Empresarial, mas regras de contratacao, coparticipacao e gestao podem diferir.

### Diferencas relevantes contra SPG

#### Porte e personalizacao

No segmento Empresarial, o material indica mais possibilidade de personalizacao, especialmente em coparticipacao e coberturas citadas na matriz.

Uso no produto:

- Campo candidato: `segment = enterprise`.
- Campo candidato: `customizableBenefits = true`.
- Para empresas 200+, o produto deve evitar usar regras SPG como se fossem universais.

#### Comite de Saude

O portfolio Empresarial apresenta Comite de Saude para empresas a partir de 500 pessoas.

Finalidade:

- analise periodica de indicadores dos planos contratados;
- apoio a gestao ativa do contrato;
- visao estrategica para politica de beneficios.

Uso no produto:

- Beneficio importante para decisores de RH/beneficios em empresas maiores.
- Campo candidato: `healthCommitteeAvailableFromLives = 500`.
- Nao relevante para SPG atual.

#### Juntos pela Saude

Programa para empresas a partir de 200 pessoas, com pacotes de promocao da saude.

Servicos citados:

- gerenciamento de pacientes com doencas cronicas;
- palestras;
- imunizacao;
- campanha anual de vacinacao;
- programas para gestantes;
- saude emocional;
- orientacao nutricional.

Uso no produto:

- Diferencial de venda para grandes empresas.
- Pode virar secao "gestao de saude corporativa".
- Nao deve aparecer para SPG sem validacao.

#### Coparticipacao mais personalizavel

O portfolio Empresarial diz que e possivel personalizar coparticipacao de acordo com necessidades do cliente, modificando percentuais, limites e outros pontos.

Eventos em que pode incidir:

- consultas;
- pronto-socorro;
- exames simples;
- exames especiais;
- procedimentos seriados;
- procedimentos ambulatoriais;
- internacao com valor fixo por evento.

Uso no produto:

- Em Empresarial, a pergunta "tem coparticipacao?" nao basta.
- Precisa capturar desenho negociado: percentuais, limites e grupos.

#### Reembolso no Empresarial

O material explica reembolso especifico e completo em termos parecidos com SPG, mas traz uma regra comercial diferente:

- no Empresarial, e possivel escolher entre reembolso especifico e/ou reembolso completo;
- formacao do preco de plano com reembolso especifico depende da distribuicao geografica dos beneficiarios;
- quanto mais pessoas em regiao de reembolso especifico, mais economico pode ser o plano.

Uso no produto:

- Campo candidato: `beneficiaryGeographicDistribution`.
- Isso pode virar uma pergunta futura em fluxo de cotacao empresarial.
- Nao aplicar essa regra ao SPG sem confirmacao.

### Beneficios e servicos similares ao SPG

O portfolio Empresarial tambem cita:

- Saude Digital/telemedicina;
- Psicologia Online;
- app Bradesco Saude;
- busca na rede;
- reembolso digital;
- carteirinha digital;
- autorizacao de procedimentos;
- Meu Doutor;
- Meu Doutor Novamed;
- Clube+Saude;
- Seguro Viagem;
- remissao;
- coberturas extra rol;
- Bradesco Saude Concierge;
- equipe de retaguarda em hospitais de referencia;
- plano odontologico opcional/conjugado.

Uso no produto:

- Muitos textos e blocos de UX podem ser compartilhados entre SPG e Empresarial.
- Mas a exibicao deve ser filtrada por segmento, plano e disponibilidade.

### Ferramentas de gestao

O material cita:

- SIGE: relatorios com historico dos ultimos 36 meses, disponivel para empresa com minimo de 100 pessoas.
- SSBE: inclusao, exclusao e alteracao cadastral de beneficiarios, disponivel para empresas com minimo de 200 pessoas, conforme analise da area de relacionamento.

Uso no produto:

- Para decisor empresarial, essas ferramentas sao relevantes.
- Para SPG, o material anterior falava em Sistema de Movimentacao Expressa ate 199 pessoas; aqui aparece SSBE para 200+.

### Matriz final Empresarial

A matriz do portfolio Empresarial mostra:

- planos;
- abrangencia;
- acomodacoes;
- segmentacao A+H+OB;
- segmentacao H+OB;
- inclusao compulsoria/opcional;
- planos com coparticipacao;
- reembolso especifico;
- reembolso completo;
- Programa Meu Doutor;
- Clinicas Meu Doutor Novamed;
- Clube+Saude;
- dental;
- Juntos pela Saude;
- remissao;
- Seguro Viagem;
- extra rol;
- Concierge;
- equipe de retaguarda.

Observacao: a extracao textual da matriz perde colunas e relacoes. Assim como no SPG, a matriz precisa de captura manual ou OCR/layout mais sofisticado para virar catalogo confiavel.

### Perguntas de cliente/corretora que este PDF ajuda a responder

- "O que muda para empresas acima de 200 vidas?"
- "Grandes empresas podem personalizar coparticipacao?"
- "Existe algum suporte de gestao de saude para RH?"
- "Tem programa de promocao de saude?"
- "Como reembolso especifico pode impactar preco em empresas grandes?"
- "Quais ferramentas ajudam a gerir beneficiarios?"

### Perguntas que este PDF nao responde

- "Qual regra se aplica a uma cotacao SPG de 3 a 199 vidas?"
- "Qual rede especifica do plano em Pernambuco?"
- "Qual tabela exata de reembolso?"
- "Qual desenho de coparticipacao foi negociado para uma empresa especifica?"

### Campos candidatos para produto/schema

- `segment`: Empresarial.
- `minLives`: 200.
- `healthCommitteeAvailableFromLives`: 500.
- `corporateHealthPrograms`: Juntos pela Saude.
- `coparticipationCustomizable`.
- `beneficiaryGeographicDistribution`.
- `managementTools`: SIGE, SSBE.
- `dentalAvailable`.
- `remissionAvailable`.
- `travelInsuranceAvailable`.
- `conciergeAvailable`.
- `extraRolCoverageAvailable`.

### UX para produto

O portfolio Empresarial aponta para uma experiencia diferente da SPG:

- para SPG, o foco e explicar plano, vidas, reembolso e preco;
- para Empresarial, o foco tambem inclui gestao de beneficios, indicadores, programas de saude e personalizacao.

Em uma demo atual, este PDF deve ficar como "fora do escopo imediato", mas ele ajuda a desenhar o futuro modulo para empresas maiores.

### Riscos

- Misturar regras de Empresarial com SPG.
- Mostrar Comite de Saude ou Juntos pela Saude para clientes pequenos.
- Assumir que coparticipacao empresarial e padronizada como SPG.
- Usar matriz extraida automaticamente sem validacao.

### Prioridade para MVP

Media/futura.

Baixa para o primeiro fluxo Bradesco Saude SPG, mas importante para arquitetura porque mostra que o produto Saude precisa distinguir segmento por porte.

## Condicoes Gerais Maio/2026 - Empresarial 200+

### Documentos analisados

Foram analisados os quatro PDFs restantes da pasta `condicoes-gerais-maio`:

- `CE - A+H+OB_01.05.2026_RC.pdf`.
- `CE - A+H+OB_01.05.2026_RE.pdf`.
- `CE - H+OB_01.05.2026_RC.pdf`.
- `CE - H+OB_01.05.2026_RE.pdf`.

Todos sao Condicoes Gerais para Coletivo Empresarial a partir de 200 segurados, versao 01.05.2026.

### Interpretacao dos sufixos

Pela leitura dos documentos:

- `RC` corresponde a uma estrutura de Reembolso Completo.
- `RE` corresponde a uma estrutura de Reembolso Especifico.
- `A+H+OB` corresponde a Ambulatorial + Hospitalar com Obstetricia.
- `H+OB` corresponde a Hospitalar com Obstetricia.

Implicacao para produto: esses quatro arquivos provam que o contrato precisa ser classificado por pelo menos tres dimensoes:

- segmento/porte: SPG ou Empresarial;
- segmentacao assistencial: A+H+OB ou H+OB;
- modalidade de reembolso: completo ou especifico.

### Escopo e prioridade

Estes documentos sao importantes para arquitetura futura, mas nao devem guiar o primeiro MVP Bradesco Saude SPG.

Uso imediato:

- validar que o sistema nao pode tratar "Bradesco Saude" como produto unico;
- reforcar que a mesma familia de plano pode ter regras distintas por porte e modalidade;
- inspirar campos de catalogo, nao tela final.

### Diferenca RC vs RE

#### RC - Reembolso Completo

Nos documentos `RC`, o objeto do seguro e estruturado ao redor do reembolso das despesas medicas/hospitalares cobertas, com liberdade de escolha de medicos e estabelecimentos dentro da area de abrangencia contratada.

A rede referenciada aparece como alternativa facilitadora, em que a seguradora paga diretamente ao prestador.

Leitura pratica:

- o reembolso completo e parte central do contrato;
- o cliente pode usar livre escolha dentro dos limites contratuais;
- a rede referenciada continua existindo e evita desembolso/reembolso;
- o calculo do reembolso usa CRS, valor vigente do CRS e multiplo do plano;
- existe tabela de reembolso completo registrada e vinculada aos Atributos do Plano.

Uso no produto:

- Campo candidato: `reimbursementMode = complete`.
- Campo candidato: `reimbursementCalculation = CRS * currentCRSValue * planMultiplier`.
- Campo candidato: `reimbursementTableType = complete`.
- Campo candidato: `freeChoiceAvailable = true`.

#### RE - Reembolso Especifico

Nos documentos `RE`, a livre escolha e muito mais limitada.

No A+H+OB_RE, o reembolso especifico aparece vinculado a:

- consultas medicas eletivas por medico com CRM ativo;
- honorarios medicos de paciente internado com previa autorizacao em rede referenciada.

No H+OB_RE, o reembolso especifico fica ainda mais restrito:

- consultas medicas eletivas relacionadas a pre-natal, assistencia ao parto e puerperio;
- honorarios medicos de paciente internado com previa autorizacao em rede referenciada.

O calculo tambem usa CRS, valor vigente e multiplo do plano, mas a tabela e a de reembolso especifico.

Uso no produto:

- Campo candidato: `reimbursementMode = specific`.
- Campo candidato: `reimbursementSpecificScope`.
- Campo candidato: `reimbursementTableType = specific`.
- Campo candidato: `requiresPlanAttributes = true`.

### Diferenca A+H+OB vs H+OB

#### A+H+OB

Representa Ambulatorial + Hospitalar com Obstetricia.

No uso comercial, conversa com:

- consultas;
- exames;
- terapias;
- internacoes;
- cirurgias;
- parto.

Mesmo assim, a cobertura real continua limitada por contrato, Rol ANS, area de abrangencia e Atributos do Plano.

#### H+OB

Representa Hospitalar com Obstetricia.

No H+OB_RE, a parte ambulatorial no reembolso especifico e especialmente sensivel, porque aparece ligada a pre-natal/parto/puerperio e nao como consulta eletiva ampla.

Uso no produto:

- Se a cotacao nao trouxer segmentacao assistencial, o sistema deve pedir confirmacao.
- A explicacao de reembolso especifico precisa variar conforme A+H+OB vs H+OB.

### Rede referenciada

Os quatro documentos reafirmam:

- rede atualizada no portal/app Bradesco Saude;
- rede pode mudar conforme legislacao;
- na rede referenciada, o segurado nao deve desembolsar pelos servicos cobertos;
- quando usa rede, nao ha reembolso, pois o pagamento e direto ao prestador;
- substituicoes de prestadores podem ser consultadas por canais oficiais.

Uso no produto:

- Campo candidato: `networkValidationRequired = true`.
- A rede precisa vir de fonte oficial atualizada, nao de portfolio estatico.

### Reembolso e perda de direito

Os documentos detalham praticas que podem gerar perda do direito ao reembolso, como:

- fracionamento de recibo/nota fiscal;
- divergencia entre valor documentado e valor efetivamente pago;
- ausencia de comprovante de desembolso;
- solicitacao por terceiro sem legitimidade;
- documentacao inconsistente.

Uso no produto:

- Para MVP, isto vira um tooltip ou checklist interno: "Reembolso exige documentacao formal e comprovante de pagamento."
- Para produto futuro, pode virar assistente de conferencia de reembolso.

### Carencia, DLP e inclusao

Os documentos seguem a mesma familia de regras ja observada:

- carencias dependem do contrato e do prazo de inclusao;
- recem-nascido/filho adotivo tem regras especificas de inclusao em ate 30 dias;
- DLP/CPT podem se aplicar em determinadas condicoes;
- ha alivio/nao aplicacao de CPT em cenarios de 30+ vidas e inclusao no prazo.

Mesmo em Empresarial 200+, as regras de prazo e documentacao continuam relevantes.

Uso no produto:

- Campo candidato: `inclusionDeadlineDays = 30`.
- Campo candidato: `preExistingConditionRules`.
- Campo candidato: `waitingPeriodRules`.

### Coparticipacao

Os quatro documentos mantem estrutura semelhante:

- percentuais e limites ficam na Proposta de Seguro;
- a tabela de referencia fica no portal Bradesco Saude;
- quando houver percentual e limite, prevalece o menor;
- para rede referenciada, coparticipacao e cobrada do estipulante;
- para livre escolha/reembolso, coparticipacao pode ser deduzida do reembolso;
- internacao pode ter valor fixo por evento;
- internacao psiquiatrica pode ter regras especificas;
- valores limites podem ser reajustados anualmente.

Uso no produto:

- Em Empresarial, coparticipacao deve ser tratada como configuracao negociada.
- Nao assumir 30% como regra universal em 200+.
- Campo candidato: `coparticipationFromProposal = true`.

### Manutencao de demitido e aposentado

Os documentos incluem bloco sobre manutencao da condicao de demitido e aposentado, conforme artigos 30 e 31 da Lei 9.656/98.

Uso no produto:

- Baixa prioridade para venda inicial.
- Importante para modulo futuro de pos-venda/RH.

### Seguro Viagem e anexos

Assim como em outros documentos, os PDFs trazem anexos/trechos sobre Seguro Viagem Bradesco, com limites, condicoes e possibilidade de alteracao/descontinuacao.

Uso no produto:

- Beneficio deve ser exibido por plano/segmento quando confirmado.
- Nao e dado central da cotacao de Saude.

### Perguntas de cliente/corretora que estes PDFs ajudam a responder

- "Qual e a diferenca entre RC e RE?"
- "Reembolso completo funciona como livre escolha?"
- "Reembolso especifico cobre quais eventos?"
- "A regra de reembolso muda entre A+H+OB e H+OB?"
- "Como o reembolso e calculado?"
- "Existe tabela de reembolso registrada?"
- "A coparticipacao sai na fatura ou desconta do reembolso?"
- "Quem paga a coparticipacao para a seguradora?"
- "O que pode fazer perder direito ao reembolso?"
- "Empresas grandes seguem regras diferentes de SPG?"

### Perguntas que continuam sem resposta operacional

- "Qual multiplo de reembolso do plano cotado?"
- "Qual valor atual do CRS?"
- "Qual tabela exata esta nos Atributos do Plano?"
- "A empresa cotada esta em RC ou RE?"
- "A cotacao e A+H+OB ou H+OB?"
- "Qual desenho de coparticipacao foi negociado?"
- "Qual rede atualizada na cidade do beneficiario?"

### Campos candidatos para produto/schema

- `contractSegment`: `enterprise_200_plus`.
- `contractVersion`: `2026-05-01`.
- `assistentialSegmentation`: `A_H_OB` ou `H_OB`.
- `reimbursementContractType`: `RC` ou `RE`.
- `reimbursementMode`: `complete` ou `specific`.
- `reimbursementTableType`: `complete` ou `specific`.
- `reimbursementCalculationFactors`: CRS, valor do CRS, multiplo do plano.
- `planAttributesRequired`: true.
- `freeChoiceAvailable`.
- `networkDirectPayment`.
- `reimbursementLossRules`.
- `coparticipationBillingMode`.
- `retireeAndDismissedRules`.

### UX para produto

Para clientes Empresarial 200+, a experiencia deve ser diferente:

- antes de mostrar reembolso, confirmar se o contrato e RC ou RE;
- antes de explicar cobertura, confirmar A+H+OB ou H+OB;
- mostrar que o reembolso depende de Atributos do Plano, CRS e multiplo;
- mostrar coparticipacao como configuracao da proposta, nao regra fixa;
- separar beneficios de venda de regras juridicas.

Para o MVP SPG:

- usar estes documentos apenas como alerta arquitetural;
- nao usar regras Empresarial 200+ para explicar cotacoes SPG;
- manter foco nos documentos SPG e no PDF de cotacao.

### Riscos

- Confundir RC e RE.
- Tratar RE como reembolso completo.
- Confundir A+H+OB e H+OB.
- Levar regra Empresarial 200+ para SPG.
- Prometer valor de reembolso sem CRS/multiplo/tabela.
- Exibir texto contratual demais no link publico.
- Ignorar que Atributos do Plano sao parte essencial da resposta.

### Prioridade para MVP

Baixa para exibicao no primeiro fluxo SPG.

Alta para modelagem futura, porque estes PDFs mostram que a saude Bradesco exige um catalogo multidimensional:

- segmento;
- produto;
- plano;
- codigo do plano;
- segmentacao assistencial;
- modalidade de reembolso;
- atributos do plano;
- coparticipacao negociada;
- rede atualizada.

## Consolidacao dos materiais analisados

### Materiais mais uteis para o primeiro fluxo SPG

1. `Portfolio SPG.pdf`.
2. `260420_BRASAU_EfetivoPlus_SP-DF-RS-PR_AF_OP1.pdf`, se Efetivo Plus entrar na demo.
3. `CE SPG - A+H+OB_01.04.2026.pdf`.
4. `CE SPG - H+OB_01.04.2026.pdf`.

### Materiais fora do escopo imediato

- `Portfolio Empresarial.pdf`.
- Condicoes Gerais Empresarial 200+ de maio.
- Formulario Pediatrico, salvo como checklist operacional.

### Decisoes de produto sugeridas

- Separar cotacao de Saude em "dados extraidos" e "explicacoes assistidas".
- Tratar rede hospitalar como pendencia de validacao oficial.
- Tratar reembolso especifico com muito cuidado, sempre condicionado a segmentacao e Atributos do Plano.
- Perguntar/armazenar se a cotacao tem coparticipacao.
- Perguntar/armazenar segmentacao assistencial quando nao vier clara no PDF.
- Evitar comparar planos automaticamente por "melhor/pior" sem rede, reembolso e carencia.
- Para MVP, entregar clareza e checklist, nao decisao automatica.
