// Testes opcionais: node verificar-calculos.cjs. O site não depende de Node.
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const script = fs.readFileSync('public/script.js','utf8').replace(/iniciar\(\);\s*$/, '');
const contexto = vm.createContext({ Intl, Date, console });
vm.runInContext(script, contexto);
const executar = codigo => vm.runInContext(codigo, contexto);
const objeto = codigo => JSON.parse(JSON.stringify(executar(codigo)));
const amostra = [
 {id_venda:'1',data:'2025-01-10',produto:'A',categoria:'Lanche',regiao:'Sul',quantidade:'2',preco_unitario:'10'},
 {id_venda:'1',data:'2025-01-10',produto:'B',categoria:'Bebida',regiao:'Sul',quantidade:'1',preco_unitario:'5'},
 {id_venda:'2',data:'2025-03-11',produto:'A',categoria:'Lanche',regiao:'Norte',quantidade:'3',preco_unitario:'10'}
];
executar(`dados = validarLinhas(${JSON.stringify(amostra)}, COLUNAS).validas`);
assert.deepEqual(objeto('calcularIndicadores(dados)'),{faturamento:55,vendas:2,unidades:6,ticket:27.5});
assert.deepEqual(objeto('serieMensal(dados)'),[['2025-01',25],['2025-02',0],['2025-03',30]]);
const filtros={inicio:'2025-01-01',fim:'2025-01-31',categoria:'Lanche',local:'Sul',busca:''};
executar(`filtrados=filtrarLinhas(dados,${JSON.stringify(filtros)},'regiao')`);
assert.deepEqual(objeto('calcularIndicadores(filtrados)'),{faturamento:20,vendas:1,unidades:2,ticket:20});
filtros.busca='inexistente';
assert.equal(executar(`filtrarLinhas(dados,${JSON.stringify(filtros)},'regiao').length`),0);
assert.deepEqual(objeto('calcularIndicadores([])'),{faturamento:0,vendas:0,unidades:0,ticket:0});
assert.equal(executar(`filtrarLinhas(dados,{inicio:'',fim:'',categoria:'',local:'',busca:''},'regiao').length`),3);
executar(`filtrados=dados;ordenacao={chave:'centavos',direcao:-1}`);
assert.equal(executar('linhasOrdenadas()[0].centavos'),3000);
const invalidas=amostra.map(v=>({...v}));invalidas[0].quantidade='';invalidas[1].data='2025-02-30';invalidas[2].preco_unitario='-1';
assert.equal(executar(`validarLinhas(${JSON.stringify(invalidas)},COLUNAS).descartadas`),3);
assert.equal(executar(`validarLinhas([{...${JSON.stringify(amostra[0])},quantidade:'0',preco_unitario:'0'}],COLUNAS).validas.length`),1);
assert.equal(executar(`lerNumero('2,50')`),2.5);
assert.equal(executar(`lerNumero('')`),null);
assert.equal(executar(`dataValida('2025-02-29')`),false);
assert.equal(executar(`dataValida('2024-02-29')`),true);
assert.throws(()=>executar('validarLinhas([],[])'),/Colunas obrigatórias/);
assert.equal(executar('DADOS_EXEMPLO.length'),200);
assert.equal(executar('new Set(DADOS_EXEMPLO.map(v=>v.data.slice(0,7))).size'),12);
assert.equal(executar('new Set(DADOS_EXEMPLO.map(v=>v.id_venda)).size'),200);
const csv=fs.readFileSync('public/dados-exemplo.csv','utf8').trim().split(/\r?\n/); const campos=csv.shift().split(',');
const registros=csv.map(linha=>Object.fromEntries(linha.split(',').map((valor,i)=>[campos[i],valor])));
assert.deepEqual(objeto('DADOS_EXEMPLO'),registros);
assert.equal(executar('validarLinhas(DADOS_HAMBURGUERIA,CAMPOS_HAMBURGUERIA).local'),'canal');
assert.equal(executar('validarLinhas(DADOS_HAMBURGUERIA,CAMPOS_HAMBURGUERIA).validas.length'),1367);
assert.equal(executar('validarLinhas(DADOS_HAMBURGUERIA,CAMPOS_HAMBURGUERIA).descartadas'),0);
console.log('OK: amostra conhecida, IDs repetidos, filtros combinados, pesquisa, filtros vazios, ausência de resultados, ordenação, datas, números, zero, valores ausentes, 200 registros/12 meses, igualdade CSV/base incorporada e adaptação por canal.');
console.log('Demonstração:',objeto('calcularIndicadores(validarLinhas(DADOS_EXEMPLO,COLUNAS).validas)'));
console.log('Hamburgueria:',objeto('calcularIndicadores(validarLinhas(DADOS_HAMBURGUERIA,CAMPOS_HAMBURGUERIA).validas)'));
const produtosTeste = [
 {id_venda:'1',data:'2025-01-05',produto:'X-Burger',categoria:'Lanche',regiao:'Nordeste',quantidade:'2',preco_unitario:'10'},
 {id_venda:'1',data:'2025-01-05',produto:'X-Bacon',categoria:'Lanche',regiao:'Nordeste',quantidade:'1',preco_unitario:'15'},
 {id_venda:'2',data:'2025-01-06',produto:'X-Burger',categoria:'Hambúrguer',regiao:'Sul',quantidade:'3',preco_unitario:'10'},
 {id_venda:'3',data:'2025-01-20',produto:'X-Burger',categoria:'Lanche',regiao:'Nordeste',quantidade:'1',preco_unitario:'10'},
 {id_venda:'4',data:'2025-02-02',produto:'Suco',categoria:'Bebida',regiao:'Nordeste',quantidade:'3',preco_unitario:'5'},
 {id_venda:'5',data:'2025-02-02',produto:'Refrigerante',categoria:'Bebida',regiao:'Nordeste',quantidade:'1',preco_unitario:'5'},
 {id_venda:'6',data:'2025-02-02',produto:'Suco',categoria:'Bebida',regiao:'Sul',quantidade:'9',preco_unitario:'5'}
];
executar(`dados=validarLinhas(${JSON.stringify(produtosTeste)},COLUNAS).validas;filtrados=dados;dimensao='regiao'`);
assert.deepEqual(objeto('seriesProdutos(dados,"regiao").semanal'),[['2024-12-30',1],['2025-01-06',1],['2025-01-13',0],['2025-01-20',1]]);
assert.deepEqual(objeto('seriesProdutos(dados,"regiao").mensal'),[['2025-01',75]]);
assert.deepEqual(objeto('seriesProdutos(dados,"regiao").hamburguerNordeste'),[['X-Burger',3],['X-Bacon',1]]);
assert.deepEqual(objeto('seriesProdutos(dados,"regiao").bebidaNordeste'),[['Suco',3],['Refrigerante',1]]);
assert.deepEqual(objeto('seriesProdutos(dados,"canal").bebidaNordeste'),[]);
assert.deepEqual(objeto('seriesProdutos([],"regiao").semanal'),[]);
assert.equal(executar('inicioDaSemana("2025-01-05")'),'2024-12-30');
// Simula somente a API do Chart.js para conferir configuração e atualizações dos dados.
const elementos=new Map();
contexto.document={getElementById:id=>{if(!elementos.has(id))elementos.set(id,{textContent:''});return elementos.get(id);}};
contexto.Chart=class {constructor(elemento,config){this.data=config.data;this.options=config.options;}update(){this.atualizado=true;}};
executar('atualizarGraficosProdutos()');
assert.deepEqual(objeto('graficos["burger-weekly-chart"].data.datasets[0].data'),[1,1,0,1]);
assert.deepEqual(objeto('graficos["drink-northeast-chart"].data.datasets[0].data'),[3,1]);
assert.equal(executar('graficos["drink-northeast-chart"].options.plugins.tooltip.callbacks.label({label:"Suco",parsed:3,dataset:{data:[3,1]}})'), 'Suco: 3 unidades (75%)');
executar('filtrados=[];atualizarGraficosProdutos()');
assert.deepEqual(objeto('graficos["burger-weekly-chart"].data.datasets[0].data'),[]);
assert.equal(executar('graficos["burger-weekly-chart"].atualizado'),true);
executar('dimensao="canal";atualizarGraficosProdutos()');
assert.match(elementos.get('burger-northeast-note').textContent,/não possui região/);
console.log('OK: quatro novos gráficos; semana segunda/domingo e virada de ano, IDs únicos, semana vazia, receita mensal, unidades no Nordeste, pizza 75%/25%, ausência de região e atualização após filtros (API do Chart.js simulada).');
executar(`dados=validarLinhas(${JSON.stringify(produtosTeste)},COLUNAS).validas`);
assert.deepEqual(objeto('dadosMapaCalor(dados,"regiao")'), {
 meses:['2025-01','2025-02'], produtos:['Refrigerante','Suco'],
 matriz:[[null,{unidades:1,registros:1}],[null,{unidades:3,registros:1}]], maximo:3
});
assert.equal(executar('dadosMapaCalor(dados,"canal")'),null);
assert.deepEqual(objeto('dadosMapaCalor([],"regiao")'),{meses:[],produtos:[],matriz:[],maximo:0});
executar(`dados.push({...dados[4],quantidade:0});dados.push({...dados[4],quantidade:2})`);
assert.deepEqual(objeto('dadosMapaCalor(dados,"regiao").matriz[1][1]'),{unidades:5,registros:3});
assert.deepEqual(objeto('dadosMapaCalor([{...dados[4],quantidade:0}],"regiao").matriz[0][0]'),{unidades:0,registros:1});
const filtrosCalor={inicio:'2025-02-01',fim:'2025-02-28',categoria:'Bebida',local:'Nordeste',busca:'Refrigerante'};
assert.deepEqual(objeto(`dadosMapaCalor(filtrarLinhas(dados,${JSON.stringify(filtrosCalor)},'regiao'),'regiao').matriz`),[[{unidades:1,registros:1}]]);
console.log('OK: mapa de calor — unidades por produto/mês, exclusão de outras regiões, ausência versus zero, somas, filtros combinados, vazio e base sem região.');
assert.deepEqual(objeto(`rankingFevereiro(validarLinhas(${JSON.stringify(produtosTeste)},COLUNAS).validas,'2025')`),{mais:[['Suco',12],['Refrigerante',1]],menos:[['Refrigerante',1],['Suco',12]]});
assert.deepEqual(objeto('rankingFevereiro([],"2025")'),{mais:[],menos:[]});
assert.deepEqual(objeto(`rankingFevereiro(validarLinhas(${JSON.stringify(produtosTeste)},COLUNAS).validas,'2026')`),{mais:[],menos:[]});
const rankingTeste=Array.from({length:7},(_,i)=>({produto:String.fromCharCode(65+i),data:'2025-02-10',quantidade:i}));
assert.deepEqual(objeto(`rankingFevereiro(${JSON.stringify(rankingTeste)},'2025').mais`),[['G',6],['F',5],['E',4],['D',3],['C',2]]);
assert.deepEqual(objeto(`rankingFevereiro(${JSON.stringify(rankingTeste)},'2025').menos`),[['A',0],['B',1],['C',2],['D',3],['E',4]]);
assert.deepEqual(objeto(`rankingFevereiro([{produto:'B',data:'2025-02-01',quantidade:2},{produto:'A',data:'2025-02-02',quantidade:2}], '2025').mais`),[['A',2],['B',2]]);
console.log('OK: rankings de fevereiro — agregação por produto, ano/mês, limite de 5, ordem crescente/decrescente, empates, zero registrado e ausência de resultados.');
