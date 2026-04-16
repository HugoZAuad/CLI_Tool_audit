/// <reference types="node" />
import { beforeEach, describe, expect, it, vi } from 'vitest';
// process é global em Node.js

const promptMock = vi.fn();
const existsSyncMock = vi.fn();
const mkdirSyncMock = vi.fn();
const writeFileSyncMock = vi.fn();
const auditProjectMock = vi.fn();
const generateMarkdownReportMock = vi.fn();
const scanProjectMock = vi.fn();

vi.mock('inquirer', () => ({
  default: {
    prompt: promptMock
  }
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
    writeFileSync: writeFileSyncMock
  }
}));

vi.mock('../src/audit.js', () => ({
  auditProject: auditProjectMock
}));

vi.mock('../src/report.js', () => ({
  generateMarkdownReport: generateMarkdownReportMock
}));

vi.mock('../src/scan.js', () => ({
  scanProject: scanProjectMock,
  buildScanSummaryMarkdown: vi.fn(() => '# Scan Markdown')
}));

describe('integração CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T10:00:00.000Z'));
    existsSyncMock.mockReturnValue(false);
    generateMarkdownReportMock.mockReturnValue('.security-reports/2026-04-16/audit-report.md');
  });

  it('gera relatório markdown ao auditar via comando direto', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const argvSpy = vi.spyOn(process, 'argv', 'get').mockReturnValue([
      'node',
      'cli.js',
      'deps-audit'
    ]);

    auditProjectMock.mockReturnValue({
      'npm audit': '{}',
      'npm outdated': 'ok',
      eslint: 'ok',
      'ts-prune': 'ok'
    });

    const { runCli } = await import('../src/cli.js');

    await runCli();

    expect(auditProjectMock).toHaveBeenCalledTimes(1);
    expect(generateMarkdownReportMock).toHaveBeenCalledTimes(1);
    expect(generateMarkdownReportMock).toHaveBeenCalledWith(
      {
        'npm audit': '{}',
        'npm outdated': 'ok',
        eslint: 'ok',
        'ts-prune': 'ok'
      },
      '.security-reports/2026-04-16/audit-report.md'
    );

    argvSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('scan retorna findings via comando direto', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const argvSpy = vi.spyOn(process, 'argv', 'get').mockReturnValue([
      'node',
      'cli.js',
      'code-scan'
    ]);

    scanProjectMock.mockReturnValue([
      {
        arquivo: 'src/index.ts',
        linha: 10,
        trecho: 'eval("x")',
        tipo: 'Uso de eval',
        risco: 'Execução arbitrária de código',
        correcao: 'Evite usar eval, utilize funções seguras.'
      }
    ]);

    const { runCli } = await import('../src/cli.js');

    await runCli();

    expect(scanProjectMock).toHaveBeenCalledTimes(1);
    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);

    argvSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});