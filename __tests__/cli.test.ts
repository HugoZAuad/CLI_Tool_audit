import { beforeEach, describe, expect, it, vi } from 'vitest';


const existsSyncMock = vi.fn();
const mkdirSyncMock = vi.fn();
const writeFileSyncMock = vi.fn();

vi.mock('node:fs', () => ({
  default: {
    existsSync: existsSyncMock,
    mkdirSync: mkdirSyncMock,
    writeFileSync: writeFileSyncMock
  }
}));


describe('cli.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T10:00:00.000Z'));
  });

  it('ensureReportDir cria pasta quando não existir', async () => {
    existsSyncMock.mockReturnValue(false);

    const { ensureReportDir } = await import('../src/cli.js');
    const result = ensureReportDir('.security-reports');

    expect(result.dir).toBe('.security-reports/2026-04-16');
    expect(mkdirSyncMock).toHaveBeenCalledWith('.security-reports/2026-04-16', {
      recursive: true
    });
  });

  it('parseCliCommand interpreta os comandos corretamente', async () => {
    const { parseCliCommand } = await import('../src/cli.js');

    expect(parseCliCommand(['node', 'cli.js', 'deps-audit'])).toBe('deps-audit');
    expect(parseCliCommand(['node', 'cli.js', 'code-scan'])).toBe('code-scan');
    expect(parseCliCommand(['node', 'cli.js', 'full-check'])).toBe('full-check');
    expect(parseCliCommand(['node', 'cli.js', 'help'])).toBe('help');
    expect(parseCliCommand(['node', 'cli.js'])).toBe(null);
  });

  it('buildScanSummaryMarkdown gera conteúdo com findings', async () => {
    const { buildScanSummaryMarkdown } = await import('../src/scan.js');

    const markdown = buildScanSummaryMarkdown(
      [
        {
          arquivo: 'src/index.ts',
          linha: 12,
          trecho: 'eval("x")',
          tipo: 'Uso de eval',
          risco: 'Execução arbitrária de código',
          correcao: 'Evite usar eval, utilize funções seguras.'
        }
      ],
      new Date('2026-04-16T10:00:00.000Z')
    );

    expect(markdown).toContain('src/index.ts');
    expect(markdown).toContain('Uso de eval');
    expect(markdown).toContain('Execução arbitrária de código');
    expect(markdown).toContain('Evite usar eval');
    expect(markdown).toContain('2026-04-16T10:00:00.000Z');
  });
});