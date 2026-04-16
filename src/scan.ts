import fs from 'fs';
import path from 'path';
import type { Finding, Pattern } from './types.js';

export const IGNORED_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'public',
  'build',
  '.security-reports',
  'security',
  'dist',
  'coverage'
];

export const PATTERNS: Pattern[] = [
  {
    name: 'Uso de eval',
    regex: /eval\s*\(/,
    risk: 'Execução arbitrária de código',
    fix: 'Evite usar eval, utilize funções seguras.'
  },
  {
    name: 'Token hardcoded',
    regex: /token\s*[:=]\s*['"][A-Za-z0-9\-_.]{16,}/i,
    risk: 'Vazamento de segredo',
    fix: 'Remova tokens do código-fonte e use variáveis de ambiente.'
  },
  {
    name: 'Regras Firestore permissivas',
    regex: /allow\s+read,\s*write:\s*if\s*true/,
    risk: 'Acesso total ao banco de dados.',
    fix: 'Nunca use regras permissivas em produção.'
  },
  {
    name: 'Webhook sem assinatura',
    regex: /webhook/i,
    risk: 'Possível endpoint de webhook sem validação de assinatura.',
    fix: 'Valide assinatura, HMAC ou origem do provedor.'
  }
];

const DEFAULT_SCAN_DIRS = ['src', 'functions', 'scripts'];
const DEFAULT_SCAN_FILES = ['firestore.rules', 'storage.rules'];

export function normalizeFilePath(file: string, root: string): string {
  const relative = path.relative(root, file);
  return (relative || file).replace(/\\/g, '/');
}

export function walk(
  dir: string,
  exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.rules']
): string[] {
  let results: string[] = [];

  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return results;
  }

  for (const file of files) {
    const full = path.join(dir, file);

    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(file) && !file.startsWith('.')) {
        results = results.concat(walk(full, exts));
      }
      continue;
    }

    if (exts.some((ext) => full.endsWith(ext))) {
      results.push(full);
    }
  }

  return results;
}

export function scanFile(file: string, root: string, patterns: Pattern[] = PATTERNS): Finding[] {
  let lines: string[] = [];

  try {
    lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
  } catch {
    return [];
  }

  const findings: Finding[] = [];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        findings.push({
          arquivo: normalizeFilePath(file, root),
          linha: index + 1,
          trecho: line.trim(),
          tipo: pattern.name,
          risco: pattern.risk,
          correcao: pattern.fix
        });
      }
    }
  });

  return findings;
}

export function getScanTargets(root: string): string[] {
  const targets: string[] = [];

  for (const dir of DEFAULT_SCAN_DIRS) {
    const fullDir = path.join(root, dir);

    try {
      if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
        targets.push(...walk(fullDir));
      }
    } catch {
    }
  }

  for (const file of DEFAULT_SCAN_FILES) {
    const fullFile = path.join(root, file);

    try {
      if (fs.existsSync(fullFile) && fs.statSync(fullFile).isFile()) {
        targets.push(fullFile);
      }
    } catch {
    }
  }

  return targets;
}

export function groupFindingsByType(findings: Finding[]): Record<string, Finding[]> {
  const grouped: Record<string, Finding[]> = {};

  for (const finding of findings) {
    if (!grouped[finding.tipo]) {
      grouped[finding.tipo] = [];
    }

    grouped[finding.tipo].push(finding);
  }

  return grouped;
}

export function buildScanSummaryMarkdown(findings: Finding[], date = new Date()): string {
  const grouped = groupFindingsByType(findings);

  let markdown = '# Relatório de Scan Avançado\n\n';
  markdown += `Data: ${date.toISOString()}\n\n`;

  if (!findings.length) {
    markdown += '_Nenhum padrão de risco encontrado nos arquivos analisados._\n';
    return markdown;
  }

  markdown += '## Sumário\n\n';

  for (const [type, items] of Object.entries(grouped)) {
    markdown += `- **${type}**: ${items.length} ocorrência(s)\n`;
  }

  markdown += '\n---\n';

  for (const [type, items] of Object.entries(grouped)) {
    const first = items[0];

    markdown += `\n## ${type}\n`;
    markdown += `**Risco:** ${first.risco}\n\n`;
    markdown += `**Correção sugerida:** ${first.correcao}\n\n`;
    markdown += '| Arquivo | Linha | Trecho |\n';
    markdown += '|---|---|---|\n';

    for (const item of items) {
      const trecho =
        item.trecho.length > 120 ? `${item.trecho.slice(0, 117)}...` : item.trecho;

      markdown += `| ${item.arquivo} | ${item.linha} | \`${trecho.replace(/\|/g, '¦')}\` |\n`;
    }

    markdown += '\n';
  }

  return markdown;
}

export function scanProject(root: string = process.cwd()): Finding[] {
  const findings: Finding[] = [];
  const targets = getScanTargets(root);

  for (const file of targets) {
    findings.push(...scanFile(file, root, PATTERNS));
  }

  return findings;
}