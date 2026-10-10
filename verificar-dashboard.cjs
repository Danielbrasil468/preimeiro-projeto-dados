// Verificação opcional com Node e Chrome instalados; não participa da publicação.
const fs = require('fs');
const assert = require('node:assert/strict');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const os = require('os');
const path = require('path');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'dashboard-browser-'));
const proc = spawn(chrome, ['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9337',`--user-data-dir=${perfil}`,'about:blank'], { windowsHide:true, stdio:'ignore' });
let erroInicial;
proc.on('error', erro => { erroInicial = erro; });
const pausa = ms => new Promise(resolve => setTimeout(resolve,ms));
(async () => {
 let ws;
 try {
  let tabs;
  for(let i=0;i<60;i++) { if (erroInicial) throw erroInicial; try { tabs = await (await fetch('http://127.0.0.1:9337/json')).json(); break; } catch { await pausa(200); } }
  if(!tabs) throw Error('Chrome não iniciou');
  ws = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open',resolve,{once:true}));
  let seq=0; const pending=new Map(); const errors=[];
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id) { const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result); } else if(m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text); });
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await call('Runtime.enable'); await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:pathToFileURL(path.resolve('public/index.html')).href});
  for(let i=0;i<60;i++){await pausa(250);if(await evaluate('typeof DADOS_EXEMPLO !== "undefined" && document.getElementById("revenue").textContent !== "—"'))break;}
  assert.equal(await evaluate('dados.length'),200);
  assert.equal(await evaluate('new Set(dados.map(v=>v.data.slice(0,7))).size'),12);
  const csv=fs.readFileSync('public/dados-exemplo.csv','utf8').trim().split(/\r?\n/); const fields=csv.shift().split(',');
  const records=csv.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[fields[i],v])));
  assert.deepEqual(await evaluate('DADOS_EXEMPLO'),records);
  const fixture = [
   {id_venda:'1',data:'2025-01-10',produto:'A',categoria:'Lanche',regiao:'Sul',quantidade:'2',preco_unitario:'10'},
   {id_venda:'1',data:'2025-01-10',produto:'B',categoria:'Bebida',regiao:'Sul',quantidade:'1',preco_unitario:'5'},
   {id_venda:'2',data:'2025-03-11',produto:'A',categoria:'Lanche',regiao:'Norte',quantidade:'3',preco_unitario:'10'}
  ];
  await evaluate(`carregarBase(${JSON.stringify(fixture)}, COLUNAS, 'Teste', 'Amostra conhecida')`);
  assert.deepEqual(await evaluate('calcularIndicadores(dados)'),{faturamento:55,vendas:2,unidades:6,ticket:27.5});
  assert.deepEqual(await evaluate('serieMensal(dados)'),[['2025-01',25],['2025-02',0],['2025-03',30]]);
  await evaluate(`$('start-date').value='2025-01-01';$('end-date').value='2025-01-31';$('category').value='Lanche';$('dimension').value='Sul';atualizar()`);
  assert.deepEqual(await evaluate('calcularIndicadores(filtrados)'),{faturamento:20,vendas:1,unidades:2,ticket:20});
  await evaluate(`$('search').value='inexistente';atualizar()`);
  assert.equal(await evaluate('filtrados.length'),0);assert.equal(await evaluate('$(' + JSON.stringify('empty-message') + ').hidden'),false);
  assert.equal(await evaluate('calcularIndicadores(filtrados).ticket'),0);
  await evaluate('limparFiltros()');assert.equal(await evaluate('filtrados.length'),3);
  await evaluate(`ordenacao={chave:'centavos',direcao:-1};atualizarTabela()`);assert.equal(await evaluate('linhasOrdenadas()[0].centavos'),3000);
  const invalid=fixture.map(r=>({...r}));invalid[0].quantidade='';invalid[1].data='2025-02-30';invalid[2].preco_unitario='-1';
  assert.equal(await evaluate(`validarLinhas(${JSON.stringify(invalid)},COLUNAS).descartadas`),3);
  assert.equal(await evaluate(`validarLinhas([{...${JSON.stringify(fixture[0])},quantidade:'0',preco_unitario:'0'}],COLUNAS).validas.length`),1);
  const papa=await evaluate('typeof Papa !== "undefined"');const chart=await evaluate('typeof Chart !== "undefined"');
  if(papa){
    const csvTeste=fields.join(',')+'\n'+fixture.map(v=>fields.map(c=>v[c]).join(',')).join('\n');
    await evaluate(`importarCSV(new File([${JSON.stringify(csvTeste)}],'amostra.csv',{type:'text/csv'}))`);
    await pausa(300);assert.equal(await evaluate('dados.length'),3);assert.equal(await evaluate('$(' + JSON.stringify('source-title') + ').textContent'),'Base importada · amostra.csv');
    const parsed=await evaluate('Papa.parse(criarCSV(dados),{header:true,skipEmptyLines:true}).data');assert.equal(parsed.length,3);assert.equal(parsed[0].preco_unitario,'10');
    await evaluate(`$('category').value='Lanche';atualizar()`);assert.equal(await evaluate('Papa.parse(criarCSV(filtrados),{header:true}).data.length'),2);
    await evaluate('exportarCSV()');
  }
  await evaluate(`$('original-button').click()`);assert.equal(await evaluate('dimensao'),'canal');assert.equal(await evaluate('dados.length'),1367);
  await evaluate(`$('demo-button').click()`);assert.equal(await evaluate('dados.length'),200);
  const report={calculations:'OK',filters:'OK',reset:'OK',empty:'OK',validation:'OK',sorting:'OK',embeddedCSV:'OK',originalBase:'OK',papa,chart,errors};
  for(const [name,width,height,mobile] of [['desktop',1440,1100,false],['mobile',390,844,true]]){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await pausa(400);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
    const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    const destino=path.join(os.tmpdir(),`dashboard-${name}.png`);fs.writeFileSync(destino,Buffer.from(screenshot.data,'base64'));report[name]=destino;
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify(report,null,2));
 } finally { if(ws)ws.close();proc.kill(); }
})().catch(e=>{console.error(e);process.exitCode=1});
