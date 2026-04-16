import fs from 'fs';
import path from 'path';

function parseReport(txt: string) {
  const blocks = txt.split(/---+\n/).map(b => b.trim()).filter(Boolean);
  const vulnRows: string[] = [];
  const eslintRows: string[] = [];
  let meta: any = {};
  for (const block of blocks) {
    if (block.startsWith('## npm audit')) {
      const jsonMatch = block.match(/\{[\s\S]+\}/);
      if (jsonMatch) {
        try {
          const audit = JSON.parse(jsonMatch[0]);
          meta = audit.metadata?.vulnerabilities || audit.vulnerabilities;
          if (audit.vulnerabilities) {
            for (const [dep, v] of Object.entries<any>(audit.vulnerabilities)) {
              if (v.via && v.via.length > 0) {
                let description = '';
                let url = '';
                let fix = '';
                for (const via of v.via) {
                  if (typeof via === 'object') {
                    description += `${via.title || via.name} [${via.severity}]\n`;
                    if (via.url) url = via.url;
                  } else {
                    description += `${via}\n`;
                  }
                }
                if (v.fixAvailable) {
                  fix = typeof v.fixAvailable === 'object' ? `${v.fixAvailable.name}@${v.fixAvailable.version}` : 'sim';
                }
                vulnRows.push(`| ${dep} | ${v.severity} | ${description.replace(/\n/g, '<br>')} | ${url ? `[advisory](${url})` : ''} | ${v.nodes?.join('<br>') || ''} | ${fix} |`);
              }
            }
          }
        } catch (e) { /* ignore */ }
      }
    }
    if (block.startsWith('## eslint')) {
      // Captura linhas do tipo: caminho:linha:coluna  error|warning  mensagem
      const lines = block.split('\n');
      for (const line of lines) {
        const m = line.match(/^(.*):(\d+):(\d+)\s+(error|warning)\s+(.*)$/i);
        if (m) {
          const [, file, row, col, level, msg] = m;
          eslintRows.push(`| ${file} | ${row} | ${col} | ${level} | ${msg} |`);
        }
      }
    }
  }
  const summary: string[] = [];
  summary.push('# Relatório de Segurança — Detalhado');
  summary.push('');
  summary.push('## Resumo de Vulnerabilidades');
  summary.push('');
  summary.push('| Severidade | Qtde |');
  summary.push('|------------|------|');
  summary.push(`| Crítica    | ${meta.critical || 0} |`);
  summary.push(`| Alta       | ${meta.high || 0} |`);
  summary.push(`| Moderada   | ${meta.moderate || 0} |`);
  summary.push(`| Baixa      | ${meta.low || 0} |`);
  summary.push(`| Total      | ${meta.total || 0} |`);
  summary.push('');
  summary.push('---');
  summary.push('');
  summary.push('## Vulnerabilidades em Dependências');
  summary.push('');
  summary.push('| Dependência | Severidade | Descrição | Advisory | Caminho | Correção |');
  summary.push('|-------------|------------|-----------|----------|---------|----------|');
  if (vulnRows.length) summary.push(...vulnRows);
  else summary.push('| _Nenhuma vulnerabilidade encontrada_ | | | | | |');
  summary.push('');
  summary.push('---');
  summary.push('');
  summary.push('## Problemas de Código (ESLint)');
  summary.push('');
  summary.push('| Arquivo | Linha | Coluna | Nível | Mensagem |');
  summary.push('|---------|-------|--------|-------|----------|');
  if (eslintRows.length) summary.push(...eslintRows);
  else summary.push('| _Nenhum problema encontrado_ | | | | |');
  summary.push('');
  summary.push('---');
  summary.push('');
  summary.push('Relatório completo disponível em `.security-reports/security-report.txt`.');
  return summary;
}


function main() {
  const src = path.join('.security-reports', 'security-report.txt');
  if (!fs.existsSync(src)) {
    console.error('Relatório não encontrado:', src);
    process.exit(1);
  }
  const txt = fs.readFileSync(src, 'utf8');
  const summary = parseReport(txt);
  const date = new Date().toISOString().slice(0, 10);
  const destDir = path.join('security', 'analysis');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  // Tenta incluir também o relatório avançado
  let advanced = '';
  const advPath = path.join(destDir, `relatorio-seguranca-avancado-${date}.md`);
  if (fs.existsSync(advPath)) {
    advanced = fs.readFileSync(advPath, 'utf8');
    advanced = '\n---\n\n## Scanner Avançado\n\n' + advanced;
  }
  const dest = path.join(destDir, `relatorio-seguranca-${date}.md`);
  const md = summary.join('\n') + advanced;
  fs.writeFileSync(dest, md);
  // Remove o relatório txt bruto após gerar o markdown
  try {
    fs.unlinkSync(src);
    console.log('🗑️  Relatório bruto removido:', src);
  } catch (e) {
    console.warn('Não foi possível remover o relatório bruto:', e);
  }
  console.log('✅ Resumo gerado em', dest);
}

main();
