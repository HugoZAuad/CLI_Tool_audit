import fs from 'fs';
import path from 'path';
import type { AuditResults, AuditToolResult } from './audit.js';

type ParsedAuditSummary = {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  total: number;
};

type ParsedVulnerabilityRow = {
  dependency: string;
  severity: string;
  description: string;
  advisory: string;
  paths: string;
  fix: string;
};

type ParsedEslintRow = {
  file: string;
  line: string;
  column: string;
  level: string;
  message: string;
};

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function truncate(value: string, max = 180): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function parseNpmAudit(result?: AuditToolResult): {
  summary: ParsedAuditSummary;
  rows: ParsedVulnerabilityRow[];
} {
  const emptySummary: ParsedAuditSummary = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    total: 0
  };

  if (!result?.output) {
    return { summary: emptySummary, rows: [] };
  }

  try {
    const audit = JSON.parse(result.output);
    const metadata = audit?.metadata?.vulnerabilities ?? {};
    const vulnerabilities = audit?.vulnerabilities ?? {};

    const rows: ParsedVulnerabilityRow[] = [];

    for (const [dependency, vulnerability] of Object.entries(vulnerabilities as Record<string, any>)) {
      const via = Array.isArray(vulnerability?.via) ? vulnerability.via : [];
      let description = '';
      let advisory = '';
      let fix = '';

      for (const item of via) {
        if (typeof item === 'object' && item !== null) {
          const title = item.title || item.name || 'Sem descrição';
          const severity = item.severity ? ` [${item.severity}]` : '';
          description += `${title}${severity}\n`;

          if (!advisory && item.url) {
            advisory = item.url;
          }
        } else if (typeof item === 'string') {
          description += `${item}\n`;
        }
      }

      if (vulnerability?.fixAvailable) {
        if (typeof vulnerability.fixAvailable === 'object') {
          const name = vulnerability.fixAvailable.name || dependency;
          const version = vulnerability.fixAvailable.version || '?';
          fix = `${name}@${version}`;
        } else {
          fix = 'Sim';
        }
      }

      rows.push({
        dependency,
        severity: vulnerability?.severity || 'unknown',
        description: description.trim() || 'Sem detalhes',
        advisory,
        paths: Array.isArray(vulnerability?.nodes) ? vulnerability.nodes.join('<br>') : '',
        fix: fix || 'Não informado'
      });
    }

    return {
      summary: {
        critical: metadata.critical || 0,
        high: metadata.high || 0,
        moderate: metadata.moderate || 0,
        low: metadata.low || 0,
        total: metadata.total || 0
      },
      rows
    };
  } catch {
    return { summary: emptySummary, rows: [] };
  }
}

function parseEslint(result?: AuditToolResult): ParsedEslintRow[] {
  if (!result?.output) return [];

  const rows: ParsedEslintRow[] = [];
  const lines = result.output.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^(.*):(\d+):(\d+)\s+(error|warning)\s+(.*)$/i);

    if (match) {
      const [, file, row, column, level, message] = match;
      rows.push({
        file,
        line: row,
        column,
        level,
        message
      });
    }
  }

  return rows;
}

function buildVulnerabilitySummaryTable(summary: ParsedAuditSummary): string {
  return [
    '## Resumo de Vulnerabilidades',
    '',
    '| Severidade | Qtde |',
    '|------------|------|',
    `| Crítica | ${summary.critical} |`,
    `| Alta | ${summary.high} |`,
    `| Moderada | ${summary.moderate} |`,
    `| Baixa | ${summary.low} |`,
    `| Total | ${summary.total} |`
  ].join('\n');
}

function buildVulnerabilityTable(rows: ParsedVulnerabilityRow[]): string {
  const content = [
    '## Vulnerabilidades em Dependências',
    '',
    '| Dependência | Severidade | Descrição | Advisory | Caminho | Correção |',
    '|-------------|------------|-----------|----------|---------|----------|'
  ];

  if (!rows.length) {
    content.push('| _Nenhuma vulnerabilidade encontrada_ | | | | | |');
    return content.join('\n');
  }

  for (const row of rows) {
    content.push(
      `| ${escapeTableCell(row.dependency)} | ${escapeTableCell(row.severity)} | ${escapeTableCell(truncate(row.description))} | ${row.advisory ? `[advisory](${row.advisory})` : ''} | ${escapeTableCell(row.paths)} | ${escapeTableCell(row.fix)} |`
    );
  }

  return content.join('\n');
}

function buildEslintTable(rows: ParsedEslintRow[]): string {
  const content = [
    '## Problemas de Código (ESLint)',
    '',
    '| Arquivo | Linha | Coluna | Nível | Mensagem |',
    '|---------|-------|--------|-------|----------|'
  ];

  if (!rows.length) {
    content.push('| _Nenhum problema encontrado_ | | | | |');
    return content.join('\n');
  }

  for (const row of rows) {
    content.push(
      `| ${escapeTableCell(row.file)} | ${row.line} | ${row.column} | ${escapeTableCell(row.level)} | ${escapeTableCell(truncate(row.message))} |`
    );
  }

  return content.join('\n');
}

function buildToolOutputSection(toolName: string, result: AuditToolResult): string {
  return [
    `## Saída bruta — ${toolName}`,
    '',
    `**Comando:** \`${result.command}\``,
    '',
    `**Status:** ${result.success ? 'Sucesso' : 'Falha'}`,
    '',
    '```',
    result.output || '(sem saída)',
    '```'
  ].join('\n');
}

export function buildMarkdownReport(results: AuditResults, date = new Date()): string {
  const npmAudit = parseNpmAudit(results['npm audit']);
  const eslintRows = parseEslint(results.eslint);

  const sections: string[] = [
    '# Relatório de Auditoria de Segurança',
    `Data: ${date.toISOString()}`,
    '',
    buildVulnerabilitySummaryTable(npmAudit.summary),
    '',
    '---',
    '',
    buildVulnerabilityTable(npmAudit.rows),
    '',
    '---',
    '',
    buildEslintTable(eslintRows)
  ];

  for (const [toolName, result] of Object.entries(results)) {
    sections.push('', '---', '', buildToolOutputSection(toolName, result));
  }

  return sections.join('\n');
}

export function generateMarkdownReport(
  results: AuditResults,
  filePath = '.security-reports/security-report.md'
): string {
  const report = buildMarkdownReport(results);
  const dir = path.dirname(filePath);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, report, 'utf-8');

  return filePath;
}