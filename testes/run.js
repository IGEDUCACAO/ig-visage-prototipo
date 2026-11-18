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

function coletar(dir, prefixo) {
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch (erro) {
    console.error('nao consegui ler o diretorio de testes ' + dir + ': ' + erro.message);
    process.exit(1);
  }

  const arquivos = [];
  for (const entrada of entradas) {
    const relativo = prefixo ? prefixo + '/' + entrada.name : entrada.name;
    if (entrada.isDirectory()) {
      arquivos.push(...coletar(path.join(dir, entrada.name), relativo));
    } else if (entrada.isFile() && entrada.name.endsWith('.test.js')) {
      arquivos.push(relativo);
    }
  }
  return arquivos;
}

const relativos = coletar(DIR_TESTES, '').sort();

if (relativos.length === 0) {
  console.error('nenhum *.test.js em ' + DIR_TESTES + ' — nada foi provado.');
  process.exit(1);
}

console.log('rodando ' + relativos.length + ' arquivo(s) de teste de ' + DIR_TESTES);

const filho = spawnSync(
  process.execPath,
  ['--test', ...relativos.map((relativo) => path.join(DIR_TESTES, relativo))],
  { stdio: 'inherit' }
);

process.exit(filho.status === null ? 1 : filho.status);
