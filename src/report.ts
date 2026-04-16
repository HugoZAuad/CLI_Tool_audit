import fs from 'fs';
import path from 'path';

export function generateMarkdownReport(results: Record<string, string>, filePath = '.security-reports/security-report.md') {
  const report = [
    '# Relatório de Auditoria de Segurança',
    `Data: ${new Date().toISOString()}`,
    '',
    ...Object.entries(results).map(
      ([tool, output]) => `## ${tool}\n\n\n\n\`\`\`\n${output}\n\`\`\`\n\n---\n`
    ),
  ].join('\n');
  // Garante a criação da pasta do caminho completo
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, report);
  return filePath;
}
