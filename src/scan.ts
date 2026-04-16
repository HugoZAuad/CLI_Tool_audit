import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = [
  'node_modules', '.git', '.next', 'public', 'build', '.security-reports', 'security/analysis'
];

type Finding = {
  arquivo: string;
  linha: number;
  trecho: string;
  tipo: string;
  risco: string;
  correcao: string;
};

const PATTERNS = [
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
    fix: 'Remova tokens do código-fonte.'
  }
];

function walk(dir: string, exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.rules']): string[] {
  let results: string[] = [];
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return results;
  }
  for (const file of files) {
    const full = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch (e) {
      continue;
    }
    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(file) && !file.startsWith('.')) {
        results = results.concat(walk(full, exts));
      }
    } else if (exts.some(e => full.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

export function scanProject(root: string = process.cwd()): Finding[] {
  const findings: Finding[] = [];
  const files = walk(root);
  for (const file of files) {
    let lines: string[] = [];
    try {
      lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    } catch (e) {
      continue;
    }
    lines.forEach((line, i) => {
      for (const p of PATTERNS) {
        if (p.regex.test(line)) {
          findings.push({
            arquivo: file.replace(/.*src[\\/]/, 'src/'),
            linha: i + 1,
            trecho: line.trim(),
            tipo: p.name,
            risco: p.risk,
            correcao: p.fix
          });
        }
      }
    });
  }
  return findings;
}
