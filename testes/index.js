/* Agregador para `node --test testes/`.
   O runner do Node trata o diretório como entry point (resolve este index),
   então cada arquivo de teste roda em subprocesso próprio — mesmo isolamento
   de `node --test testes/*.js`, com o exit code agregado. */
'use strict';

var spawnSync = require('node:child_process').spawnSync;
var fs = require('node:fs');
var path = require('node:path');

var dir = __dirname;
var arquivos = fs.readdirSync(dir).filter(function (nome) {
  return /\.test\.js$/.test(nome);
}).sort();

if (!arquivos.length) {
  console.error('testes: nenhum arquivo *.test.js encontrado em ' + dir + '.');
  process.exitCode = 1;
} else {
  var falhas = [];
  arquivos.forEach(function (arquivo) {
    var resultado = spawnSync(process.execPath, [path.join(dir, arquivo)], { stdio: 'inherit' });
    if (resultado.status !== 0) {
      falhas.push(arquivo);
      console.error('FALHOU: ' + arquivo);
    }
  });

  console.log('testes: ' + (arquivos.length - falhas.length) + '/' + arquivos.length + ' arquivos ok');
  if (falhas.length) {
    console.error('testes com falha: ' + falhas.join(', '));
    process.exitCode = 1;
  }
}
