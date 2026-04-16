import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import { auditProject } from './audit.js';
import { generateMarkdownReport } from './report.js';
import { buildScanSummaryMarkdown, scanProject } from './scan.js';
import type { CliCommand, ScanType } from './types.js';

export function banner(): void {
  console.log(
    chalk.cyanBright.bold(`
 ███████╗███████╗ ██████╗██╗   ██╗ █████╗ ██████╗ 
 ██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██╔══██╗
 ███████╗█████╗  ██║     ██║   ██║███████║██████╔╝
 ╚════██║██╔══╝  ██║     ╚██╗ ██╔╝██╔══██║██╔══██╗
 ███████║███████╗╚██████╗ ╚████╔╝ ██║  ██║██║  ██║
 ╚══════╝╚══════╝ ╚═════╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝
`)
  );

  console.log(
    chalk.magentaBright.bold(
      'Security Audit Toolkit - CLI para auditoria e análise de segurança em Node.js\n'
    )
  );
}

export function ensureReportDir(baseDir = '.security-reports'): { dir: string; date: Date } {
  const date = new Date();
  const dateFolder = date.toISOString().slice(0, 10);
  const dir = `${baseDir}/${dateFolder}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return { dir, date };
}

export async function askMenu(): Promise<{ scanType: ScanType }> {
  console.log('\nSelecione o tipo de varredura:\n');

  return inquirer.prompt([
    {
      type: 'rawlist',
      name: 'scanType',
      message: '',
      choices: [
        {
          name: 'Auditoria de dependências (npm audit, eslint, ts-prune)',
          value: 'audit'
        },
        {
          name: 'Scan avançado de código (padrões de risco)',
          value: 'scan'
        },
        {
          name: 'Varredura completa (tudo)',
          value: 'full'
        },
        {
          name: 'Sair',
          value: 'exit'
        }
      ]
    }
  ]);
}

export function parseCliCommand(argv: string[]): CliCommand | null {
  const command = argv[2];

  if (!command) return null;

  if (command === 'deps-audit') return 'deps-audit';
  if (command === 'code-scan') return 'code-scan';
  if (command === 'full-check') return 'full-check';
  if (command === 'help' || command === '--help' || command === '-h') return 'help';

  return null;
}

export function printHelp(): void {
  console.log(`
Uso:
  security-audit              -> abre o menu interativo
  security-audit deps-audit   -> roda auditoria de dependências
  security-audit code-scan    -> roda scan avançado de código
  security-audit full-check   -> roda auditoria completa
  security-audit help         -> exibe esta ajuda
`);
}

export function printFindingsSummary(findingsCount: number): void {
  if (findingsCount === 0) {
    console.log('✅ Nenhum padrão de risco encontrado.');
    return;
  }

  console.log(`🚨 Total de riscos encontrados: ${findingsCount}`);
}

export async function executeSelection(scanType: Exclude<ScanType, 'exit'>): Promise<void> {
  const { dir, date } = ensureReportDir();

  if (scanType === 'audit' || scanType === 'full') {
    console.log('\n🔎 Rodando auditoria de dependências...');
    const result = auditProject();
    const file = `${dir}/audit-report.md`;
    const filePath = generateMarkdownReport(result, file);
    console.log(`✅ Auditoria concluída. Relatório salvo em ${filePath}`);
  }

  if (scanType === 'scan' || scanType === 'full') {
    console.log('\n🔎 Rodando scan avançado de código...');
    const findings = scanProject();

    printFindingsSummary(findings.length);

    const scanReport = buildScanSummaryMarkdown(findings, date);
    const filePath = `${dir}/scan-report.md`;

    fs.writeFileSync(filePath, scanReport, 'utf-8');
    console.log(`📝 Relatório de scan salvo em ${filePath}`);
  }
}

export async function runCli(): Promise<void> {
  banner();

  const command = parseCliCommand(process.argv);

  if (command === 'help') {
    printHelp();
    return;
  }

  if (command === 'deps-audit') {
    await executeSelection('audit');
    return;
  }

  if (command === 'code-scan') {
    await executeSelection('scan');
    return;
  }

  if (command === 'full-check') {
    await executeSelection('full');
    return;
  }

  while (true) {
    const { scanType } = await askMenu();

    if (scanType === 'exit') {
      console.log('\nSaindo...');
      process.exit(0);
    }

    await executeSelection(scanType);
  }
}

if (process.env.NODE_ENV !== 'test') {
  runCli().catch((error) => {
    console.error('\nErro ao executar CLI:');
    console.error(error);
    process.exit(1);
  });
}