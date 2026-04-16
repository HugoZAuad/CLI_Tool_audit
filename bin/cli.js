#!/usr/bin/env node
import inquirer from 'inquirer';
import { auditProject } from '../dist/audit.js';
import { generateMarkdownReport } from '../dist/report.js';
import { scanProject } from '../dist/scan.js';

async function main() {
  while (true as const) {
    const { scanType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'scanType',
        message: 'Selecione o tipo de varredura:',
        choices: [
          { name: 'Auditoria de dependências (npm audit, eslint, ts-prune)', value: 'audit' },
          { name: 'Scan avançado de código (padrões de risco)', value: 'scan' },
          { name: 'Varredura completa (tudo)', value: 'full' },
          { name: 'Sair', value: 'exit' }
        ]
      }
    ]);

    if (scanType === 'exit') {
      console.log('\nSaindo...');
      process.exit(0);
    }

    // Garante pasta e data única para ambos relatórios
    const date = new Date();
    const dateFolder = date.toISOString().slice(0, 10);
    const dir = `.security-reports/${dateFolder}`;
    const fs = await import('fs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (scanType === 'audit' || scanType === 'full') {
      console.log('\n🔎 Rodando auditoria de dependências...');
      const result = auditProject();
      const file = `${dir}/audit-report.md`;
      const filePath = generateMarkdownReport(result, file);
      console.log('✅ Auditoria concluída. Relatório salvo em', filePath);
    }

    if (scanType === 'scan' || scanType === 'full') {
      console.log('\n🔎 Rodando scan avançado de código...');
      const findings = scanProject();
      if (findings.length === 0) {
        console.log('✅ Nenhum padrão de risco encontrado.');
      } else {
        console.log('\n🚨 Riscos encontrados:');
        findings.forEach((f, idx) => {
          console.log(`\n${idx + 1}. Arquivo: ${f.arquivo}`);
          console.log(`   Linha: ${f.linha}`);
          console.log(`   Tipo: ${f.tipo}`);
          console.log(`   Risco: ${f.risco}`);
          console.log(`   Trecho: ${f.trecho}`);
          console.log(`   Correção sugerida: ${f.correcao}`);
        });
        console.log(`\nTotal de riscos encontrados: ${findings.length}`);
      }
      // Gera relatório markdown do scan em pasta por data
      const scanReport = [
        '# Relatório de Scan Avançado',
        `Data: ${date.toISOString()}`,
        '',
        ...findings.map((f, idx) =>
          `## ${idx + 1}. ${f.arquivo} (linha ${f.linha})\n- Tipo: ${f.tipo}\n- Risco: ${f.risco}\n- Trecho: ${f.trecho}\n- Correção sugerida: ${f.correcao}`
        )
      ].join('\n\n');
      const filePath = `${dir}/scan-report.md`;
      fs.writeFileSync(filePath, scanReport);
      console.log(`📝 Relatório de scan salvo em ${filePath}`);
    }
  }
}
  const { scanType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scanType',
      message: 'Selecione o tipo de varredura:',
      choices: [
        { name: 'Auditoria de dependências (npm audit, eslint, ts-prune)', value: 'audit' },
        { name: 'Scan avançado de código (padrões de risco)', value: 'scan' },
        { name: 'Varredura completa (tudo)', value: 'full' }
      ]
    }
  ]);

  if (scanType === 'audit' || scanType === 'full') {
    console.log('🔎 Rodando auditoria de dependências...');
    const result = auditProject();
    const file = generateMarkdownReport(result);
    console.log('✅ Auditoria concluída. Relatório salvo em', file);
  }

  if (scanType === 'scan' || scanType === 'full') {
    console.log('🔎 Rodando scan avançado de código...');
    const findings = scanProject();
    if (findings.length === 0) {
      console.log('✅ Nenhum padrão de risco encontrado.');
    } else {
      console.log('\n🚨 Riscos encontrados:');
      findings.forEach((f, idx) => {
        console.log(`\n${idx + 1}. Arquivo: ${f.arquivo}`);
        console.log(`   Linha: ${f.linha}`);
        console.log(`   Tipo: ${f.tipo}`);
        console.log(`   Risco: ${f.risco}`);
        console.log(`   Trecho: ${f.trecho}`);
        console.log(`   Correção sugerida: ${f.correcao}`);
      });
      console.log(`\nTotal de riscos encontrados: ${findings.length}`);
    }
  }

main();
