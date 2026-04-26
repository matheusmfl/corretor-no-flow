# Corretor no Flow — Produto

## O que é

Plataforma SaaS para corretores de seguros transformarem PDFs de cotação de seguradoras em propostas profissionais e comparações inteligentes para o segurado. O corretor faz upload dos PDFs, o sistema extrai os dados via IA e gera: uma proposta individual por seguradora e uma tela de comparação consolidada acessível por link público.

---

## Regras de Negócio

Regras invariantes — o que nunca pode acontecer independente de qualquer feature.

### Isolamento de dados
- Corretor só acessa processos e cotações da própria empresa (`companyId`)
- Dados de segurados não são persistidos além do necessário para exibição
- PDF original é deletado do storage imediatamente após extração bem-sucedida (LGPD)
- Em caso de falha na extração, o PDF é deletado assim mesmo e a cotação entra em `pending_review`

### Processos de cotação
- Um processo agrupa N cotações do **mesmo ramo** (AUTO, SAÚDE, VIDA etc.)
- É permitido ter mais de uma cotação da mesma seguradora no mesmo processo — ex: Bradesco Franquia Reduzida vs Bradesco Franquia Normal
- Cada cotação recebe um **nome gerado automaticamente** a partir dos dados extraídos, seguindo padrões por ramo:
  - AUTO: `{Seguradora}-Auto-{TipoFranquia}` → ex: `Bradesco-Auto-Reduzida`
  - SAÚDE: `{Seguradora}-Saude-{NumVidas}-{TipoAcomodacao}` → ex: `Bradesco-Saude-3-Apartamento`
  - O nome é gerado como slug legível, mas o corretor pode editá-lo antes de gerar
  - O nome é o identificador visual usado na comparação — deve ser único dentro do processo
- Um processo só pode avançar para geração quando **todas** as cotações estiverem com status `ready` ou `pending_review` (nenhuma em `processing`)
- O corretor deve revisar e confirmar cotações em `pending_review` antes de gerar
- Um processo não pode ser gerado sem ao menos uma cotação

### Link público
- Cada processo gera um único link público — não um link por cotação
- O link expira após prazo configurável (padrão: 30 dias)
- O link mostra todas as cotações do processo com a comparação — o segurado nunca acessa cotações individualmente por link direto
- Abertura do link pelo segurado dispara notificação para o corretor

### Permissões e planos
- Todo upload verifica antes: o plano da empresa permite essa seguradora? esse ramo? ainda tem cota no mês?
- Cota mensal reseta no primeiro dia de cada mês, não na data de aniversário da assinatura
- Empresa sem assinatura ativa não pode criar processos
- Mudar de plano não retroage — aplica a partir do próximo ciclo

---

## Requisitos Funcionais

### Ator: Corretor

#### Criação de processo de cotação
1. Corretor acessa "Nova cotação"
2. Seleciona o ramo (AUTO, SAÚDE, VIDA, VIAGEM, RESIDENCIAL...)
3. Seleciona as seguradoras que vai comparar (multi-select — ex: Bradesco, Porto Seguro, Tokio Marine)
4. O sistema exibe N cards, um por seguradora selecionada
5. Corretor arrasta o PDF para o card da seguradora correspondente (desktop: drag-and-drop / mobile: tap no card abre file picker)
6. Cada card mostra o status do processamento em tempo real: aguardando upload → processando → pronto / requer revisão
7. Quando todos os cards estiverem prontos, o botão "Gerar comparação" fica disponível

#### Revisão de cotação com falha na extração
1. Card entra em `pending_review` quando a IA não consegue extrair com confiança
2. Corretor clica no card e vê os dados extraídos com os campos problemáticos destacados
3. Corretor corrige manualmente e confirma
4. Card passa para `ready`

#### Geração e envio
1. Corretor clica em "Gerar comparação"
2. Sistema gera: uma proposta PDF individual por seguradora + página de comparação
3. Corretor recebe o link público e pode copiar ou compartilhar direto via WhatsApp
4. Corretor pode personalizar mensagem antes de enviar (opcional)

#### Histórico
- Lista de processos com status, ramo, seguradoras envolvidas, data de criação e se o segurado já abriu
- Filtros por status, ramo e período
- Possibilidade de reenviar link ou arquivar processo

### Ator: Segurado (sem login)

#### Visualização da comparação
1. Acessa o link público recebido pelo corretor
2. Vê uma tela mobile-first com:
   - Dados do corretor (nome, foto, WhatsApp)
   - Para cada campo comparável do ramo, um ranking explícito:
     - "Melhor preço: Bradesco — R$ 1.240/ano"
     - "Melhor guincho: Porto Seguro — 500km (Bradesco: 200km)"
     - "Empate em carro reserva: Bradesco e Porto Seguro — 7 dias"
   - Cards individuais por seguradora com detalhes da cobertura
3. Botão de WhatsApp fixo para falar com o corretor
4. Abertura do link dispara notificação imediata para o corretor

---

## Seguradoras e Ramos

### Roadmap de seguradoras
| Fase | Seguradoras |
|------|-------------|
| MVP | Bradesco |
| V2 | Porto Seguro, Tokio Marine, SulAmérica |
| V3 | Suhai, Aliro, Allianz, Yellow |

### Seleção automática de seguradora (V3+)
Quando tivermos o mapeamento completo de cada PDF por seguradora, o sistema detectará automaticamente a seguradora e o ramo a partir do conteúdo do PDF — eliminando a etapa de seleção manual.

### Campos comparáveis por ramo

O sistema de comparação é **modular por produto** — cada ramo define seus próprios campos comparáveis, o tipo de comparação (menor é melhor, maior é melhor, enum rankeável) e como empates são tratados. Adicionar um novo ramo significa registrar seu schema de comparação, sem alterar código de negócio.

**AUTO**
| Campo | Tipo de comparação |
|-------|--------------------|
| Prêmio total (anual) | menor é melhor |
| Prêmio parcelado | menor é melhor |
| Franquia | menor é melhor |
| Guincho (km) | maior é melhor |
| Carro reserva (dias) | maior é melhor |
| Cobertura de vidros | enum: sem franquia > com franquia > não cobre |
| Proteção de terceiros (danos materiais) | maior é melhor |
| Proteção de terceiros (danos corporais) | maior é melhor |
| Assistência 24h | boolean: tem > não tem |

**SAÚDE**
| Campo | Tipo de comparação |
|-------|--------------------|
| Mensalidade por vida | menor é melhor |
| Acomodação | enum: apartamento > enfermaria |
| Cobertura odontológica | boolean |
| Rede credenciada (nº hospitais) | maior é melhor |
| Coparticipação | boolean: sem > com |
| Abrangência | enum: nacional > estadual > municipal |

*Outros ramos (VIDA, VIAGEM, RESIDENCIAL) serão mapeados conforme expansão.*

---

## Planos e Permissões

### Estrutura de um plano
Planos são configurados no banco — adicionar um novo plano não requer mudança de código.

```json
{
  "name": "Profissional",
  "quotesPerMonth": 50,
  "products": ["AUTO", "HEALTH", "LIFE"],
  "insurers": ["BRADESCO", "PORTO_SEGURO", "TOKIO_MARINE"],
  "features": {
    "customBranding": true,
    "whatsappButton": true,
    "openTracking": true,
    "comparison": true
  }
}
```

### Guards de permissão (verificados em cada upload)
1. Empresa tem assinatura ativa?
2. O ramo selecionado está no plano?
3. A seguradora selecionada está no plano?
4. O número de cotações no mês corrente está abaixo do limite?

---

## Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Processamento de PDF | Assíncrono via job queue | PDF pode levar 10–30s, não pode bloquear a UI |
| Extração de dados | pdfjs-dist (texto) + Claude Vision (fallback) | Maioria dos PDFs tem texto extraível; Vision só quando necessário |
| Geração de PDF | Puppeteer (HTML → PDF) | Permite personalização visual completa com CSS |
| Notificação de abertura | Webhook no link público + job | Simples e confiável sem precisar de WebSocket |
| PDF original | Deletado após extração | LGPD — dado sensível sem necessidade de retenção |
| Multi-cotação (PDF único com todas) | V2+ | MVP foca em cotações individuais por seguradora |
| Comparação automática | Campos fixos por ramo | Garante consistência — campos livres gerariam comparações inconsistentes |

---

## Status do Desenvolvimento

### Concluído
- Autenticação completa (registro, login, JWT via cookie, refresh token, logout)
- Onboarding de empresa (multi-step com dados legais, identidade visual e contato)
- Layout autenticado com sidebar e proteção de rotas
- Estrutura base de cotações no schema do banco

### Em desenvolvimento
- Upload de PDF e criação de processo de cotação
- Integração com Claude API para extração
- Geração de PDF com Puppeteer
- Link público para o segurado

### Planejado
- Comparação inteligente por campos do ramo
- Notificação de abertura do link
- Sistema de planos e permissões
- Histórico com filtros
- Multi-cotação (PDF consolidado)
- Detecção automática de seguradora
