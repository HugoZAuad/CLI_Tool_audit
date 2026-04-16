import fs from 'fs';
import path from 'path';

// Helpers para busca
// Ignorar pastas pesadas/desnecessárias
const IGNORED_DIRS = [
  'node_modules', '.git', '.next', 'public', 'build', '.security-reports', 'security/analysis'
];

function walk(dir: string, exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.rules']) {
  let results: string[] = [];
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    // Ignora diretórios inacessíveis
    return results;
  }
  for (const file of files) {
    const full = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch (e) {
      // Ignora arquivos/pastas inacessíveis
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

function scanFile(file: string, patterns: {name: string, regex: RegExp, risk: string, fix: string}[]) {
  let lines: string[] = [];
  try {
    lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  } catch (e) {
    // Ignora arquivos que não podem ser lidos
    return [];
  }
  const findings: any[] = [];
  lines.forEach((line, i) => {
    for (const p of patterns) {
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
  return findings;
}

function main() {
  // Padrões básicos (pode ser expandido)
  // Padrões customizados/contextuais NÃO cobertos pelo ESLint
  const patterns = [
    // Exemplo: regras permissivas em Firestore
    { name: 'Regras Firestore permissivas', regex: /allow\s+read,\s*write:\s*if\s*true/, risk: 'Acesso total ao banco', fix: 'Nunca usar em produção' },
    // Exemplo: endpoints de webhook sem assinatura (caso não seja coberto por regra customizada no lint)
    { name: 'Webhook sem assinatura', regex: /webhook/i, risk: 'Possível endpoint sem validação', fix: 'Validar assinatura/HMAC' },
    // Adicione aqui outros padrões específicos do projeto que não fazem sentido como regra global de lint
  ];

  // Caminhos principais do projeto (sem varrer a raiz)
  const dirs = ['src', 'functions', 'scripts'];
  // Arquivos soltos
  const files = ['firestore.rules', 'storage.rules'];
  let findings: any[] = [];
  for (const dir of dirs) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      findings = findings.concat(walk(dir).flatMap(f => scanFile(f, patterns)));
    }
  }
  // Varre arquivos soltos
  for (const file of files) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      findings = findings.concat(scanFile(file, patterns));
    }
  }

  // Agrupa findings por tipo (tipagem explícita)
  const grouped: Record<string, any[]> = {};
  for (const f of findings) {
    if (!grouped[f.tipo]) grouped[f.tipo] = [];
    grouped[f.tipo].push(f);
  }

  // Sumário
  let md = '# Relatório de Vulnerabilidades — Sootz-frontend-v2\n\n';
  if (findings.length === 0) {
    md += '_Nenhuma vulnerabilidade encontrada nos padrões automatizados._\n';
  } else {
    md += '## Sumário\n\n';
    (Object.entries(grouped) as [string, any[]][]).forEach(([tipo, arr]) => {
      md += `- **${tipo}**: ${arr.length} ocorrência(s)\n`;
    });
    md += '\n---\n';
    // Detalhes agrupados
    (Object.entries(grouped) as [string, any[]][]).forEach(([tipo, arr]) => {
      const risco = arr[0].risco;
      const correcao = arr[0].correcao;
      md += `\n## ${tipo}\n`;
      md += `**Risco:** ${risco}\n\n`;
      md += `**Correção sugerida:** ${correcao}\n\n`;
      md += '| Arquivo | Linha | Trecho |\n|---|---|---|\n';
      arr.forEach(f => {
        const trecho = f.trecho.length > 80 ? f.trecho.slice(0, 77) + '...' : f.trecho;
        md += `| ${f.arquivo} | ${f.linha} | \`${trecho.replace(/\|/g, '¦')}\` |\n`;
      });
      md += '\n';
    });
  }
  const destDir = 'security/analysis';
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(destDir, `relatorio-seguranca-avancado-${date}.md`), md);
  console.log('✅ Relatório avançado gerado em', path.join(destDir, `relatorio-seguranca-avancado-${date}.md`));
}

main();
