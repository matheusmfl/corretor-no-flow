import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ─── Comparison Schemas ───────────────────────────────────────────────────

  await prisma.comparisonSchema.upsert({
    where: { product: 'AUTO' },
    update: {},
    create: {
      product: 'AUTO',
      fields: [
        { key: 'totalPremium', label: 'Prêmio total (anual)', type: 'LOWER_IS_BETTER' },
        { key: 'installmentAmount', label: 'Prêmio parcelado', type: 'LOWER_IS_BETTER' },
        { key: 'deductible', label: 'Franquia', type: 'LOWER_IS_BETTER' },
        { key: 'towing', label: 'Guincho (km)', type: 'HIGHER_IS_BETTER' },
        { key: 'rentalCar', label: 'Carro reserva (dias)', type: 'HIGHER_IS_BETTER' },
        {
          key: 'glassProtection',
          label: 'Cobertura de vidros',
          type: 'RANKED_ENUM',
          rankOrder: ['NO_DEDUCTIBLE', 'WITH_DEDUCTIBLE', 'NOT_COVERED'],
        },
        { key: 'thirdPartyMaterial', label: 'Proteção de terceiros (danos materiais)', type: 'HIGHER_IS_BETTER' },
        { key: 'thirdPartyBodily', label: 'Proteção de terceiros (danos corporais)', type: 'HIGHER_IS_BETTER' },
        { key: 'assistance24h', label: 'Assistência 24h', type: 'BOOLEAN_HAS_IS_BETTER' },
      ],
    },
  })

  await prisma.comparisonSchema.upsert({
    where: { product: 'HEALTH' },
    update: {},
    create: {
      product: 'HEALTH',
      fields: [
        { key: 'monthlyPerLife', label: 'Mensalidade por vida', type: 'LOWER_IS_BETTER' },
        {
          key: 'accommodation',
          label: 'Acomodação',
          type: 'RANKED_ENUM',
          rankOrder: ['APARTMENT', 'WARD'],
        },
        { key: 'dental', label: 'Cobertura odontológica', type: 'BOOLEAN_HAS_IS_BETTER' },
        { key: 'accreditedHospitals', label: 'Rede credenciada (nº hospitais)', type: 'HIGHER_IS_BETTER' },
        { key: 'copayment', label: 'Coparticipação', type: 'BOOLEAN_NONE_IS_BETTER' },
        {
          key: 'coverage',
          label: 'Abrangência',
          type: 'RANKED_ENUM',
          rankOrder: ['NATIONAL', 'STATE', 'CITY'],
        },
      ],
    },
  })

  // ─── Plans ────────────────────────────────────────────────────────────────

  await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      name: 'Gratuito',
      slug: 'free',
      quotesPerMonth: 5,
      products: ['AUTO'],
      insurers: ['BRADESCO'],
      features: {
        customBranding: false,
        whatsappButton: true,
        openTracking: false,
        comparison: false,
      },
      isActive: true,
    },
  })

  await prisma.plan.upsert({
    where: { slug: 'profissional' },
    update: {},
    create: {
      name: 'Profissional',
      slug: 'profissional',
      quotesPerMonth: 50,
      products: ['AUTO', 'HEALTH', 'LIFE'],
      insurers: ['BRADESCO', 'PORTO_SEGURO', 'TOKIO_MARINE', 'SULAMERICA'],
      features: {
        customBranding: true,
        whatsappButton: true,
        openTracking: true,
        comparison: true,
      },
      isActive: true,
    },
  })

  console.log('Seed concluído.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
