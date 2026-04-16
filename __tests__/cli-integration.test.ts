import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { auditProject } from '../src/audit';
import { generateMarkdownReport } from '../src/report';
import { scanProject } from '../src/scan';

describe('integração CLI', () => {
  it('gera relatório markdown ao auditar', () => {
    const result = auditProject();
    const file = generateMarkdownReport(result, '.security-reports/cli-integration.md');
    expect(fs.existsSync(file)).toBe(true);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('Relatório de Auditoria');
  });
  it('scan retorna findings ou vazio', () => {
    const findings = scanProject();
    expect(Array.isArray(findings)).toBe(true);
  });
});
