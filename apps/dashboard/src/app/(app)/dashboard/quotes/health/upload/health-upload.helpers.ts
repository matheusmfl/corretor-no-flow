import type { HealthMemberLife, HealthQuoteDraft } from '@corretor/types'

export interface FileSelectionResult {
  files: File[]
  rejected: File[]
  notice: string | null
}

function fileKey(file: File): string {
  return `${file.name.toLowerCase()}::${file.size}`
}

export function describeFileSelection(incoming: Iterable<File>, current: File[]): FileSelectionResult {
  const existing = new Set(current.map(fileKey))
  const files: File[] = []
  const rejected: File[] = []

  for (const file of incoming) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      rejected.push(file)
      continue
    }
    const key = fileKey(file)
    if (existing.has(key)) continue
    existing.add(key)
    files.push(file)
  }

  const notice = rejected.length
    ? `${rejected.length} arquivo${rejected.length > 1 ? 's' : ''} ignorado${rejected.length > 1 ? 's' : ''}: envie apenas PDFs de cotação.`
    : null

  return { files, rejected, notice }
}

function sameLifeBase(a: HealthMemberLife[], b: HealthMemberLife[]): boolean {
  if (a.length !== b.length) return false
  return a.every((life, index) => life.age === b[index]?.age)
}

export function buildCombinedHealthDraft(drafts: HealthQuoteDraft[]): HealthQuoteDraft {
  if (drafts.length === 0) {
    throw new Error('Nenhum PDF foi processado com sucesso.')
  }

  const [base, ...rest] = drafts
  const sourceFiles = Array.from(new Set(drafts.flatMap((draft) => draft.sourceFiles ?? [])))
  const warnings = drafts.flatMap((draft) => draft.warnings ?? [])
  const divergentLives = rest.some((draft) => !sameLifeBase(base.lives, draft.lives))

  if (divergentLives) {
    warnings.push(
      'Mais de um PDF trouxe uma base de vidas diferente. Usamos a primeira base como referência; confirme as vidas antes de gerar as saídas.',
    )
  }

  return {
    ...base,
    sourceFiles: sourceFiles.length > 0 ? sourceFiles : base.sourceFiles,
    quoteOptions: drafts.flatMap((draft) => draft.quoteOptions),
    tables: drafts.flatMap((draft) => draft.tables ?? []),
    warnings,
    reviewStatus: 'pending',
  }
}

export function friendlyHealthUploadError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '')
  const text = raw.toLowerCase()

  if (text.includes('property draft should not exist') || text.includes('bad request')) {
    return 'Recebemos uma resposta em formato inesperado. Tente novamente; se persistir, envie outro PDF ou avise o suporte.'
  }
  if (text.includes('rascunho') || text.includes('healthquotedraft') || text.includes('inválido') || text.includes('invalido')) {
    return 'Não consegui montar uma cotação de Saúde confiável a partir desse PDF. Confira se ele é uma proposta de plano de saúde com texto selecionável.'
  }
  if (text.includes('network') || text.includes('failed to fetch') || text.includes('fetch')) {
    return 'Não consegui falar com o servidor agora. Verifique a conexão e tente novamente.'
  }
  if (text.includes('pdf') || text.includes('arquivo')) {
    return 'Não consegui ler esse PDF. Tente reenviar o arquivo ou use uma versão com texto selecionável.'
  }

  return 'Não consegui processar esse arquivo. Tente novamente ou remova este PDF para continuar com os demais.'
}
