/* Teste do fluxo final — ordem das 12 telas ditada pela cliente (Ilda Guimarães)
   e os textos ajustados. Node puro, sem framework e sem npm. */
'use strict';

const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(raiz, 'assets', 'app.js'), 'utf8');
const leitura = fs.readFileSync(path.join(raiz, 'assets', 'telas-leitura.js'), 'utf8');
const prescricao = fs.readFileSync(path.join(raiz, 'assets', 'telas-prescricao.js'), 'utf8');

let falhas = 0;
function conferir(cond, msg) {
  if (!cond) { falhas++; console.error('FALHA: ' + msg); }
}

/* ---------- ordem das telas ---------- */
const blocoTelas = app.slice(app.indexOf('var TELAS = ['), app.indexOf('];', app.indexOf('var TELAS = [')));
const itens = [...blocoTelas.matchAll(/titulo: '([^']+)'/g)].map(m => m[1]);

const esperado = [
  'Quem está na cadeira?',
  'Qual é o desejo dela?',
  'Rota escolhida',
  'Profundidade da pele',
  'Base natural',
  'Contraste',
  'Família',
  'Formato de rosto',
  'O que o seu formato direciona',
  'Percentual de cabelos brancos',
  'Como ficou o teste',
  'Cor final',
  'Dossiê final'
];

conferir(itens.length === esperado.length,
  'o fluxo deve ter ' + esperado.length + ' etapas (12 telas + dossiê); tem ' + itens.length);
esperado.forEach((titulo, i) => {
  conferir(itens[i] === titulo, 'posição ' + (i + 1) + ' deveria ser "' + titulo + '"; veio "' + itens[i] + '"');
});

const chaves = [...blocoTelas.matchAll(/chave: (\d+)/g)].map(m => Number(m[1]));
conferir(chaves.length === esperado.length, 'cada etapa precisa declarar a chave registrada.');
conferir(new Set(chaves).size === chaves.length, 'não pode haver chave repetida no fluxo.');

/* ---------- avanço sequencial ---------- */
const prox = app.slice(app.indexOf('function proximaTela('), app.indexOf('function avancar('));
conferir(prox.length > 50, 'proximaTela não foi encontrada.');
conferir(!/return 14;/.test(prox), 'proximaTela ainda salta para a numeração antiga (14).');
conferir(!/n === 18/.test(prox), 'proximaTela ainda referencia a numeração antiga (18).');
conferir(/n >= TELAS\.length/.test(prox), 'proximaTela precisa encerrar no fim do fluxo.');

/* ---------- tela 3: Rota escolhida ---------- */
const render3 = leitura.slice(leitura.indexOf('function render3('), leitura.indexOf('function render4('));
conferir(render3.length > 100, 'render3 não foi encontrada.');
conferir(!/RN-24/.test(render3), 'a tela 3 (Rota escolhida) ainda menciona RN-24.');
conferir(!/Nomenclatura/.test(render3), 'a tela 3 ainda traz a nota de nomenclatura.');
conferir(render3.indexOf('Rota escolhida') !== -1, 'a tela 3 não tem o título Rota escolhida.');

/* ---------- tela 4: Profundidade da pele ---------- */
const render4 = leitura.slice(leitura.indexOf('function render4('), leitura.indexOf('function render5('));
conferir(render4.indexOf('Profundidade de pele é uma medida: o quão clara ou escura é a pele.') !== -1,
  'a tela 4 não traz a frase nova sobre profundidade.');
conferir(!/medida isolada/.test(render4), 'a tela 4 ainda traz a frase antiga (medida isolada).');
conferir(!/sem comparar com o cabelo/.test(render4), 'a tela 4 ainda compara com o cabelo.');
conferir(!/O que esta tela não faz/.test(render4), 'a tela 4 ainda traz o bloco "O que esta tela não faz".');

/* ---------- tela 12: Cor final ---------- */
conferir(prescricao.indexOf('Sugestões de cores para a sua família') !== -1,
  'a tela 12 não tem o rótulo "Sugestões de cores para a sua família".');
conferir(prescricao.indexOf('Cor escolhida pela cliente') !== -1,
  'a tela 12 não tem o rótulo "Cor escolhida pela cliente".');

/* ---------- telas fora do fluxo continuam registradas ---------- */
const totalRegistros = (leitura + prescricao).match(/registrarTela\(/g) || [];
conferir(totalRegistros.length >= 12,
  'as telas registradas caíram demais: ' + totalRegistros.length);
conferir(/registrarTela\(12,/.test(prescricao), 'a tela 12 (regra dos 4 tons) deve continuar registrada, fora do fluxo.');
conferir(/registrarTela\(13,/.test(prescricao), 'a tela 13 (conflito) deve continuar registrada, fora do fluxo.');

if (falhas) {
  console.error('\n' + falhas + ' verificação(ões) falharam.');
  process.exit(1);
}
console.log('OK — fluxo de 12 telas na ordem da cliente, textos ajustados e chaves preservadas.');
