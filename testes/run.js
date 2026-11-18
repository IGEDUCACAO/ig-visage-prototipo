'use strict';
/* Runner dos testes: node testes/run.js  (equivalente a `node --test testes/`).
   Rodar `node --test testes/` direto estoura MODULE_NOT_FOUND no Node 20+, que trata o
   argumento como modulo e nao como diretorio. Este arquivo faz o papel de entrada: le o
   diretorio ao lado e delega cada *.test.js ao test runner nativo, com caminho absoluto —
   assim funciona de qualquer pasta. Se nao houver nenhum arquivo, falha em vez de sair 0
   com a suuite vazia. */

const { readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DIR_TESTES = __dirname;

let arquivos;
try {
  arquivos = readdirSync(DIR_TESTES)
    .filter((nome) => nome.endsWith('.test.js'))
    .sort();
} catch (erro) {
  console.error('nao consegui ler o diretorio de testes: ' + erro.message);
  process.exit(1);
}

if (arquivos.length === 0) {
  console.error('nenhum *.test.js em ' + DIR_TESTES + ' — nada foi provado.');
  process.exit(1);
}

console.log('rodando ' + arquivos.length + ' arquivo(s) de teste de ' + DIR_TESTES);

const filho = spawnSync(
  process.execPath,
  ['--test', ...arquivos.map((nome) => path.join(DIR_TESTES, nome))],
  { stdio: 'inherit' }
);

process.exit(filho.status === null ? 1 : filho.status);
