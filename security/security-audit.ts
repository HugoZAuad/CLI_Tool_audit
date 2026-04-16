import { execSync } from 'child_process';
import fs from 'fs';

function run(cmd: string) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString();
  } catch (err: any) {
    return err.stdout?.toString() || err.message;
  }
}

function main() {
  const results: Record<string, string> = {};

  console.log('🔒 Rodando auditoria de segurança...');

  // npm audit
  results['npm audit'] = run('npm audit --json');

  // npm outdated
  results['npm outdated'] = run('npm outdated || echo "Nenhuma dependência desatualizada"');

  // eslint
  results['eslint'] = run('npx eslint --ext .ts,.tsx src/ || echo "ESLint encontrou problemas"');

  // ts-prune
  results['ts-prune'] = run('npx ts-prune || echo "ts-prune encontrou código morto"');

  // Salva relatório em pasta ignorada pelo git
  const dir = '.security-reports';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const report = [
    '# Relatório de Auditoria de Segurança',
    `Data: ${new Date().toISOString()}`,
    '',
    ...Object.entries(results).map(
      ([tool, output]) => `## ${tool}\n\n${output}\n\n---\n`
    ),
  ].join('\n');

  fs.writeFileSync(`${dir}/security-report.txt`, report);
  console.log('✅ Auditoria concluída. Veja o arquivo .security-reports/security-report.txt');
}

main();
