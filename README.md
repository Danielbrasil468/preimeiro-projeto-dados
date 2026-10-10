# Vendas em foco

Dashboard para uma atividade de Fundamentos de IA e Análise de Dados. Usa HTML, CSS e JavaScript puro, sem backend, banco de dados, instalação de dependências ou compilação.

## Abrir e explorar

1. Abra `public/index.html` com dois cliques no navegador.
2. A demonstração aparece imediatamente: **200 vendas fictícias, de janeiro a dezembro de 2025**. Cada linha tem um ID único e representa a venda de um produto. Não são resultados reais.
3. Combine período, categoria e região. A pesquisa também filtra os indicadores, os gráficos e os registros exportados.
4. Clique nos cabeçalhos da tabela para ordenar; use a paginação para percorrer os registros. **Exportar filtrados** inclui todas as páginas do resultado, na ordem selecionada.
5. **Limpar filtros** também limpa a pesquisa e restaura a ordenação inicial.

Chart.js **4.4.8** e Papa Parse **5.5.3** são carregados pelo CDN jsDelivr e **exigem internet** para gráficos, importação e exportação. Se as bibliotecas não carregarem, a base incorporada, os indicadores, filtros e tabela continuam disponíveis; há uma mensagem para os gráficos indisponíveis. Não há `fetch` para carregar arquivos locais.

## Bases e arquivos

- `AGENTS.md`: orientações do projeto, preservadas.
- `public/index.html`: estrutura e controles acessíveis.
- `public/styles.css`: aparência, contraste e layout responsivo.
- `public/script.js`: validação, cálculos, filtros, gráficos, tabela e cópias incorporadas das bases.
- `public/dados-exemplo.csv`: a mesma demonstração de 200 registros incorporada no JavaScript.
- `vendas_hamburgueria.csv`: arquivo original, preservado na raiz.
- `verificar-calculos.cjs`: verificações locais opcionais das regras de análise.
- `verificar-dashboard.cjs`: verificações opcionais em Chrome, com capturas de tela no diretório temporário.

Para modificar a demonstração, atualize tanto o CSV quanto `DADOS_EXEMPLO` no final do JavaScript. O teste de cálculos compara essas duas versões. Os scripts de verificação são ferramentas opcionais de desenvolvimento: não são necessários para executar nem publicar o site.

### Base da hamburgueria

Foi encontrado `vendas_hamburgueria.csv` com **1.367 registros entre 01/07/2026 e 30/09/2026**. Não há `vendas.csv`. A base contém `id_venda`, `data`, `dia_semana`, `periodo`, `produto`, `categoria`, `quantidade`, `preco_unitario`, `forma_pagamento`, `canal`, `tempo_espera_min` e `avaliacao`.

Clique em **Analisar hamburgueria** para explorar a cópia incorporada dessa base. As categorias são Lanche, Bebida, Acompanhamento e Sobremesa. Como não há região, o filtro e o gráfico usam **canal** (Delivery/Balcão), sem atribuir regiões fictícias. A interface informa a adaptação. A origem e a veracidade dos registros não foram auditadas.

Colunas adicionais, como avaliação e tempo de espera, não entram nos indicadores de vendas e não são exportadas. Ausências nessas colunas opcionais não descartam registros. IDs repetidos são mantidos: podem representar itens de uma mesma venda; a quantidade de vendas conta IDs únicos. Nada é deduplicado automaticamente.

## Importar uma base própria

Use **Importar CSV** e selecione um arquivo UTF-8 com cabeçalho. O Papa Parse detecta separadores comuns, como vírgula e ponto e vírgula. O arquivo é processado localmente no navegador, sem envio a um servidor e sem persistência após recarregar a página. A seleção substitui a análise atual; uma estrutura inválida mantém a base anterior. **Usar demonstração** restaura a base fictícia.

| Coluna | Conteúdo esperado |
| --- | --- |
| `id_venda` | Identificador obrigatório; texto ou número, mantido como texto |
| `data` | Data válida no formato `AAAA-MM-DD` |
| `produto` | Nome obrigatório do produto |
| `categoria` | Categoria obrigatória |
| `regiao` | Região obrigatória; na ausência dessa coluna, aceita-se `canal` |
| `quantidade` | Número inteiro não negativo de unidades |
| `preco_unitario` | Número não negativo, sem símbolo monetário |

Exemplo:

```csv
id_venda,data,produto,categoria,regiao,quantidade,preco_unitario
1,2025-01-10,X-Burger,Lanche,Sul,2,10.00
2,2025-01-11,Suco,Bebida,Norte,1,5.00
```

Cabeçalhos são normalizados para minúsculas, removendo espaços externos e BOM. Números aceitam ponto ou vírgula decimal, **sem separador de milhar**. Com CSV separado por vírgula, valores com vírgula decimal devem estar entre aspas; alternativamente use ponto e vírgula como delimitador.

Linhas com campos obrigatórios vazios, datas impossíveis, quantidade fracionária/negativa ou preço inválido são descartadas, com contagem e motivos na interface. Uma mesma linha pode ter vários motivos. **Zero é válido e não equivale a ausência.** Valores negativos não são tratados como devoluções; adapte as regras explicitamente se precisar analisar estornos. CSV com erros de estrutura é rejeitado para evitar deslocamento silencioso das colunas. Valores que ultrapassem o limite de cálculo seguro também são rejeitados.

Exportação gera CSV UTF-8 com BOM, cabeçalhos, as sete colunas analisadas (com `canal` no lugar de `regiao` quando aplicável) e números sem símbolos monetários. Campos textuais que poderiam ser interpretados como fórmulas por planilhas recebem proteção por apóstrofo.

## Indicadores e gráficos

### Hambúrgueres e bebidas

Os gráficos **Itens mais vendidos em fevereiro** e **Itens menos vendidos em fevereiro** mostram até cinco produtos, pela soma das unidades, respectivamente em ordem decrescente e crescente. Selecione o ano no controle próprio desses gráficos; inicialmente é usado o ano mais recente da base. Ambos também respeitam período, categoria, região/canal e pesquisa. Limpar filtros restaura o ano mais recente. Empates são ordenados alfabeticamente. O ranking considera apenas produtos com registros no recorte; não presume que um produto ausente teve zero vendas. A base original só contém julho a setembro de 2026 e por isso exibe uma mensagem de ausência de dados de fevereiro. A demonstração permite explorar fevereiro de 2025.

O **mapa de calor de bebidas no Nordeste** cruza produtos (linhas) e meses (colunas), somando as unidades vendidas em cada célula. Tons mais escuros de lilás indicam mais unidades; a escala é relativa ao maior valor do recorte filtrado. Os números aparecem nas células, sem depender apenas de cores. `—` indica ausência de registros naquela combinação, enquanto `0` indica quantidade zero em registros existentes. Os meses abrangem o primeiro ao último mês dos registros filtrados. O mapa acompanha filtros e pesquisa; bases sem `regiao` apresentam uma mensagem de indisponibilidade. No celular, a matriz pode ser percorrida horizontalmente.

Quatro gráficos adicionais acompanham os mesmos filtros e a pesquisa:

- **Vendas semanais de hambúrgueres:** IDs únicos por semana, de segunda a domingo; o eixo mostra a data de início da semana. Semanas sem vendas entre a primeira e a última são preenchidas com zero.
- **Faturamento mensal de hambúrgueres:** soma de quantidade × preço unitário por ano/mês. É receita bruta, sem descontar custos; não representa lucro.
- **Hambúrgueres no Nordeste:** soma das unidades por produto, apenas em registros com `regiao` igual a Nordeste.
- **Pizza de bebidas no Nordeste:** unidades por produto e participação percentual no total de unidades de bebidas do recorte, em tons de lilás.

Hambúrgueres são identificados pelas categorias Lanche/Lanches ou Hambúrguer/Hambúrgueres (ignorando acentos e caixa); essa convenção corresponde aos produtos da base atual. Ao importar uma base em que Lanche inclua outros alimentos, ajuste `ehHamburguer` em `public/script.js` ou classifique os hambúrgueres em categoria própria. Bebidas usam Bebida/Bebidas. Os gráficos não atribuem regiões a dados que possuem apenas canal: a base original da hamburgueria apresenta uma mensagem de ausência de região nos dois gráficos do Nordeste. A demonstração fictícia permite visualizar os quatro gráficos.

Os testes locais também conferem limites de semana/ano, IDs repetidos, semanas vazias, receita mensal específica de hambúrgueres, unidades no Nordeste e participação de bebidas de 75%/25% em uma amostra conhecida. A configuração e atualização dos novos gráficos foi verificada com uma simulação da API do Chart.js; a renderização real no navegador continua pendente devido às limitações do ambiente.

- **Faturamento por linha:** `quantidade × preco_unitario`, arredondado para centavos por linha. A soma usa centavos inteiros para reduzir erros decimais.
- **Faturamento total:** soma do faturamento das linhas que passam por todos os filtros e pela pesquisa.
- **Quantidade de vendas:** contagem de `id_venda` distintos nessas linhas.
- **Unidades vendidas:** soma de `quantidade` nessas linhas.
- **Ticket médio:** faturamento total dividido pela quantidade de vendas; se não há vendas, exibe R$ 0,00.

Quando uma venda possui vários itens e o filtro seleciona apenas uma categoria, o ticket considera apenas a receita dos itens selecionados e os IDs presentes nesse recorte, não o valor integral dos pedidos.

A linha mensal agrega o faturamento por ano/mês e inclui meses sem registros como zero entre o primeiro e o último mês dos registros filtrados. Barras comparam receita por categoria e região/canal em ordem decrescente. O gráfico de pizza mostra a participação das categorias no faturamento filtrado, com tons de lilás consistentes ao aplicar filtros e valores/percentuais ao passar o cursor. A participação é calculada como receita da categoria ÷ receita total filtrada × 100; quando o total é zero, uma mensagem informa que não há participação calculável. Valores são apresentados em reais e no padrão brasileiro. Comparações são descritivas: não demonstram relações de causa e efeito.

## Publicar no Render pelo GitHub

1. Crie um repositório no GitHub e envie a raiz do projeto, incluindo a pasta `public`.
2. No Render, selecione **New → Static Site** e conecte esse repositório.
3. Preencha as configurações:

| Campo | Valor |
| --- | --- |
| Tipo de serviço | **Static Site** |
| Branch | A branch que contém o projeto (por exemplo, `main`) |
| Root Directory | Deixe vazio |
| Build Command | `echo "Site pronto"` |
| Publish Directory | `public` |

4. Crie o site e aguarde a publicação. Abra a URL fornecida pelo Render. Nenhuma variável de ambiente é necessária. O comando apenas imprime uma mensagem: não há etapa de compilação.

Referência: [documentação oficial de Static Sites do Render](https://render.com/docs/static-sites). A publicação não foi executada neste ambiente.

## Verificação

Execute opcionalmente `node verificar-calculos.cjs` se tiver Node instalado. Amostra conhecida: duas linhas do ID 1 com receitas de R$ 20 e R$ 5, e uma linha do ID 2 com receita de R$ 30. Esperado: **R$ 55 de faturamento, 2 vendas, 6 unidades e ticket de R$ 27,50**. O filtro janeiro + Lanche + Sul retorna **R$ 20, 1 venda e 2 unidades**.

Foram conferidos os cálculos, IDs repetidos, filtros combinados, pesquisa, filtros vazios, ausência de resultados, divisão por zero, ordenação, datas inválidas, valores ausentes e zero. Também foi conferida a correspondência exata do CSV de exemplo com a base incorporada, seus 200 IDs únicos/12 meses e a validação dos 1.367 registros da hamburgueria.

**Limitações da verificação:** o ambiente bloqueou a execução do navegador (EPERM) e o download direto dos CDNs. Não foi possível verificar visualmente telas grandes/pequenas, erros de execução no navegador, a interação do botão de limpeza nem importação/exportação reais com Papa Parse. A sintaxe JavaScript foi verificada. O CSS inclui regras para computador e celular.

Com Chrome e Node disponíveis, execute `node verificar-dashboard.cjs` para testar as interações e gerar capturas de tela. Esse teste depende do Chrome no caminho padrão do Windows e do acesso aos CDNs. Antes da atividade, abra o HTML com internet e confira: importação do exemplo, filtro combinado, limpeza, pesquisa sem resultado, ordenação, exportação/reimportação e layout no celular.
