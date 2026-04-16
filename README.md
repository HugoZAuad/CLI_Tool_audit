# 🔐 Security Audit Toolkit

![npm version](https://img.shields.io/npm/v/@hugozauad/security-audit-toolkit)
![license](https://img.shields.io/npm/l/@hugozauad/security-audit-toolkit)
![node](https://img.shields.io/node/v/@hugozauad/security-audit-toolkit)

Toolkit para auditoria e análise de segurança em projetos Node.js.  
Disponível como **CLI** e também como **biblioteca TypeScript**.

---

## 🚀 Why use this?

Este toolkit foi criado para resolver um problema comum:

> 🔍 *“Como auditar rapidamente segurança e qualidade de um projeto Node sem depender de várias ferramentas separadas?”*

### ✔️ O que ele resolve

- Centraliza ferramentas como `npm audit`, `eslint` e `ts-prune`
- Adiciona **scan inteligente de código**
- Gera **relatórios legíveis em Markdown**
- Funciona como **CLI e biblioteca**
- Pronto para uso em **scripts e CI/CD**

---

## 🎥 Demonstração

> ⚠️ Substitua pelo seu GIF depois

![CLI Demo](./docs/demo.gif)

---

## 🚀 Instalação

### Uso direto com npx
```sh
npx security-audit
```

### Instalar no projeto
```sh
npm install @hugozauad/security-audit-toolkit
```

---

## 💻 Uso via CLI

### 🧭 Modo interativo
```sh
npx security-audit
```

---

### ⚡ Comandos diretos

```sh
npx security-audit deps-audit
npx security-audit code-scan
npx security-audit full-check
```

---

### 📦 Uso em scripts do package.json

```json
{
  "scripts": {
    "security:audit": "security-audit deps-audit",
    "security:scan": "security-audit code-scan",
    "security:full": "security-audit full-check"
  }
}
```

---

## 📊 Funcionalidades

### 🔍 Auditoria de dependências (`deps-audit`)
- `npm audit --json`
- `npm outdated`
- `eslint`
- `ts-prune`

Gera relatório:
```
.security-reports/<data>/audit-report.md
```

---

### 🛡️ Scan avançado de código (`code-scan`)

Detecta padrões como:

- uso de `eval`
- tokens hardcoded
- regras permissivas (ex: Firestore)
- possíveis webhooks sem validação

Gera relatório:
```
.security-reports/<data>/scan-report.md
```

---

### 🔄 Auditoria completa (`full-check`)

Executa:
- auditoria de dependências
- scan de código

---

## 📄 Exemplo real de saída

### 🔎 Resumo de vulnerabilidades

```md
## Resumo de Vulnerabilidades

| Severidade | Qtde |
|------------|------|
| Crítica    | 1    |
| Alta       | 2    |
| Moderada   | 3    |
| Baixa      | 5    |
| Total      | 11   |
```

---

### 🚨 Scan de código

```md
## Uso de eval
Risco: Execução arbitrária de código

| Arquivo       | Linha | Trecho            |
|--------------|------|------------------|
| src/app.ts   | 12   | eval("danger")   |
```

---

## 📚 Uso como biblioteca

```ts
import { auditProject, scanProject } from '@hugozauad/security-audit-toolkit';

const audit = auditProject();
const findings = scanProject();

console.log(audit);
console.log(findings);
```

---

## 📁 Estrutura de saída

```
.security-reports/
  └── 2026-04-16/
      ├── audit-report.md
      └── scan-report.md
```

---

## ⚙️ Tecnologias

- Node.js
- TypeScript
- Inquirer
- ESLint
- ts-prune

---

## 🧪 Testes

```sh
npm test
```

---

## 📌 Requisitos

- Node.js >= 18
- npm >= 8

---

## ⚠️ Observações

- ESLint e ts-prune precisam estar disponíveis no projeto alvo
- O scan analisa diretórios comuns (`src`, `functions`, `scripts`)
- Pode gerar falsos positivos dependendo do contexto

---

## 🛠️ Roadmap

- [ ] Configuração customizada (`security-audit.config.json`)
- [ ] Integração com CI/CD
- [ ] Exportação JSON estruturada
- [ ] Regras customizadas de segurança
- [ ] Dashboard web

---

## 📄 Licença

MIT

---

## 👨‍💻 Autor

Hugo Zeymer Auad