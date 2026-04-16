import { beforeEach, describe, expect, it, vi } from 'vitest';

const mkdirSyncMock = vi.fn();
const writeFileSyncMock = vi.fn();

vi.mock('node:fs', () => ({
  default: {
    mkdirSync: mkdirSyncMock,
    writeFileSync: writeFileSyncMock
  }
}));

describe('report.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buildMarkdownReport monta o markdown corretamente', async () => {
    const { buildMarkdownReport } = await import('../src/report.js');

    const result = buildMarkdownReport(
      {
        'npm audit': {
          command: 'npm audit --json',
          output: 'saida audit',
          success: true
        },
        eslint: {
          command: 'npx eslint --ext .ts,.tsx,.js,.jsx src/',
          output: 'saida eslint',
          success: true
        }
      },
      new Date('2026-01-01T00:00:00.000Z')
    );

    expect(result).toContain('# Relatório de Auditoria de Segurança');
    expect(result).toContain('Data: 2026-01-01T00:00:00.000Z');
    expect(result).toContain('## Resumo de Vulnerabilidades');
    expect(result).toContain('| Severidade | Qtde |');
    expect(result).toContain('## Vulnerabilidades em Dependências');
    expect(result).toContain('## Problemas de Código (ESLint)');
    expect(result).toContain('## Saída bruta — npm audit');
    expect(result).toContain('saida audit');
    expect(result).toContain('## Saída bruta — eslint');
    expect(result).toContain('saida eslint');
  });

  it('generateMarkdownReport cria diretório e escreve arquivo', async () => {
    const { generateMarkdownReport } = await import('../src/report.js');

    const filePath = generateMarkdownReport(
      {
        eslint: {
          command: 'npx eslint --ext .ts,.tsx,.js,.jsx src/',
          output: 'ok',
          success: true
        }
      },
      '.security-reports/2026-01-01/audit-report.md'
    );

    expect(filePath).toBe('.security-reports/2026-01-01/audit-report.md');
    expect(mkdirSyncMock).toHaveBeenCalled();
    expect(writeFileSyncMock).toHaveBeenCalledWith(
      '.security-reports/2026-01-01/audit-report.md',
      expect.stringContaining('# Relatório de Auditoria de Segurança'),
      'utf-8'
    );
  });
});