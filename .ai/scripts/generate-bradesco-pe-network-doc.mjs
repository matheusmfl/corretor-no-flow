import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const inputPath = path.join(rootDir, '.ai/pdf-lab/output/bradesco_health_pe_network_inventory.json');
const outputPath = path.join(rootDir, '.ai/discovery/BRADESCO-HEALTH-PE-NETWORK-LIST.md');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function groupsByY(file) {
  const groups = [];

  for (const page of file.pages) {
    const byY = new Map();

    for (const item of page.items || []) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.y * 10) / 10;
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y).push(item);
    }

    for (const [y, items] of byY.entries()) {
      groups.push({
        page: page.pageNumber,
        y,
        items: items.sort((a, b) => a.x - b.x),
      });
    }
  }

  return groups.sort((a, b) => a.page - b.page || b.y - a.y);
}

const skipRe =
  /Lista de|Referência|CIDADE|ENFERMARIA|NACIONAL|EFETIVO|FLEX|IDEAL|PREMIUM|H = Hospital|A rede hospitalar|Para consultar|bradescosaude|Central|SAC|Ouvidoria|www\./i;
const hospitalValueRe = /^(H|HDIA)(\/|$)|^H$/;
const labBulletRe = /[•â€¢]/;

const hospitalColumns = [
  ['Efetivo Enfermaria', 732],
  ['Efetivo Quarto', 798],
  ['Efetivo Plus Enfermaria', 864],
  ['Efetivo Plus Quarto', 930],
  ['Flex Enfermaria', 996],
  ['Flex Quarto', 1062],
  ['Ideal Enfermaria', 1128],
  ['Ideal Quarto', 1190],
  ['Nacional II Enfermaria', 1252],
  ['Nacional II Quarto', 1317],
  ['Nacional Plus Quarto', 1387],
  ['Premium Quarto', 1455],
];

const labColumns = [
  ['Efetivo', 922],
  ['Efetivo Plus Enfermaria', 1019],
  ['Efetivo Plus Quarto', 1143],
  ['Flex', 1228],
  ['Ideal', 1280],
  ['Nacional II', 1334],
  ['Nacional III', 1404],
  ['Nacional Plus', 1493],
  ['Premium', 1580],
];

function nearestColumn(x, columns) {
  let best = null;

  for (const [name, cx] of columns) {
    const d = Math.abs(x - cx);
    if (!best || d < best.d) best = { name, d };
  }

  return best && best.d < 35 ? best.name : null;
}

function parseHospitals(file) {
  const rows = [];
  let currentCity = '';

  for (const group of groupsByY(file)) {
    const text = group.items.map((item) => item.str).join(' ');
    if (skipRe.test(text)) continue;

    const values = group.items.filter((item) => item.x > 700 && hospitalValueRe.test(item.str));
    const cityItems = group.items.filter((item) => item.x < 290 && item.str.trim().length > 2);
    const nameItems = group.items.filter(
      (item) => item.x >= 290 && item.x < 700 && item.str.trim().length > 1,
    );

    if (!values.length) {
      if (cityItems.length && !nameItems.length) {
        const city = cityItems
          .map((item) => item.str.trim())
          .join(' ')
          .replace(/\s+/g, ' ');

        if (rows.length && !rows[rows.length - 1].city) rows[rows.length - 1].city = city;
        currentCity = city;
      }

      continue;
    }

    const city = cityItems.length
      ? cityItems
          .map((item) => item.str.trim())
          .join(' ')
          .replace(/\s+/g, ' ')
      : currentCity;

    if (city) currentCity = city;

    const providerName = nameItems
      .map((item) => item.str.trim())
      .join(' ')
      .replace(/\s+/g, ' ');

    const coverage = {};
    for (const item of values) {
      const column = nearestColumn(item.x, hospitalColumns);
      if (column) coverage[column] = item.str.trim();
    }

    rows.push({ city, providerName, coverage });
  }

  return rows.filter((row) => row.providerName);
}

function parseLabs(file) {
  const rows = [];
  let currentCity = '';
  let currentDistrict = '';

  for (const group of groupsByY(file)) {
    const text = group.items.map((item) => item.str).join(' ');
    if (skipRe.test(text)) continue;

    const bullets = group.items.filter((item) => item.x > 850 && labBulletRe.test(item.str));
    if (!bullets.length) continue;

    const cityItems = group.items.filter((item) => item.x < 300 && item.str.trim().length > 1);
    const districtItems = group.items.filter(
      (item) => item.x >= 300 && item.x < 520 && item.str.trim().length > 1,
    );
    const nameItems = group.items.filter(
      (item) => item.x >= 520 && item.x < 850 && item.str.trim().length > 1,
    );

    const city = cityItems.length
      ? cityItems
          .map((item) => item.str.trim())
          .join(' ')
          .replace(/\s+/g, ' ')
      : currentCity;
    const district = districtItems.length
      ? districtItems
          .map((item) => item.str.trim())
          .join(' ')
          .replace(/\s+/g, ' ')
      : currentDistrict;

    if (city) currentCity = city;
    if (district) currentDistrict = district;

    const providerName = nameItems
      .map((item) => item.str.trim())
      .join(' ')
      .replace(/\s+/g, ' ');
    const plans = [
      ...new Set(bullets.map((item) => nearestColumn(item.x, labColumns)).filter(Boolean)),
    ];

    rows.push({ city, district, providerName, plans });
  }

  return rows.filter((row) => row.providerName);
}

function groupByCity(rows) {
  const map = new Map();

  for (const row of rows) {
    const city = row.city || 'Cidade nao capturada';
    if (!map.has(city)) map.set(city, []);
    map.get(city).push(row);
  }

  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
}

function mdEscape(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

function coverageSummary(coverage) {
  const entries = Object.entries(coverage);
  if (!entries.length) return '-';
  return entries.map(([column, value]) => `${column}: ${value}`).join('; ');
}

const hospitalFile = data.files.find((file) => /Hospitais/i.test(file.fileName));
const labFile = data.files.find((file) => /Lab/i.test(file.fileName));
const hospitals = parseHospitals(hospitalFile);
const labs = parseLabs(labFile);

let md = '# Bradesco Saude - Rede Referenciada PE Extraida\n\n';
md +=
  'Lista inicial extraida dos PDFs de Pernambuco com referencia de abril/2026. Esta e uma base de discovery: os dados ainda precisam de validacao por amostra antes de uso comercial ou exibicao como rede final do plano.\n\n';
md += 'Fontes locais analisadas:\n\n';
md += '- `.ai/pdf-lab/input/bradesco-health-materials/PE__Hospitais_Abril_26.pdf`\n';
md += '- `.ai/pdf-lab/input/bradesco-health-materials/PE__Lab_Abril_26.pdf`\n\n';
md += '## Observacoes importantes\n\n';
md += '- A rede e referencia de abril/2026 e pode mudar.\n';
md += '- A extracao abaixo usa coordenadas do PDF, nao apenas texto corrido.\n';
md +=
  '- No PDF de hospitais, a coluna `Nacional III` aparece no cabecalho principal, mas a linha de subcolunas extraida fica comprimida nas colunas finais. Nesta primeira lista, as colunas finais foram mantidas de forma conservadora como `Nacional Plus Quarto` e `Premium Quarto`; validar visualmente antes de modelar contrato de dados.\n';
md +=
  '- Legenda hospitalar: H = Hospital; P.S = Pronto Socorro; M = Maternidade; A = Ambulatorio; HDIA = Hospital Dia.\n\n';
md += `## Hospitais\n\nTotal extraido: ${hospitals.length} referenciados.\n\n`;

for (const [city, rows] of groupByCity(hospitals)) {
  md += `### ${city}\n\n`;
  md += '| Referenciado | Cobertura por plano/acomodacao |\n';
  md += '| --- | --- |\n';

  for (const row of rows) {
    md += `| ${mdEscape(row.providerName)} | ${mdEscape(coverageSummary(row.coverage))} |\n`;
  }

  md += '\n';
}

md += `## Laboratorios\n\nTotal extraido: ${labs.length} referenciados.\n\n`;

for (const [city, rows] of groupByCity(labs)) {
  md += `### ${city}\n\n`;
  md += '| Bairro | Referenciado | Planos marcados |\n';
  md += '| --- | --- | --- |\n';

  for (const row of rows) {
    md += `| ${mdEscape(row.district)} | ${mdEscape(row.providerName)} | ${mdEscape(
      row.plans.join(', '),
    )} |\n`;
  }

  md += '\n';
}

fs.writeFileSync(outputPath, md, 'utf8');

console.log(`wrote ${path.relative(rootDir, outputPath)}`);
console.log(`hospitals=${hospitals.length}`);
console.log(`labs=${labs.length}`);
