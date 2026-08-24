const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('API de pesquisa cientifica rodando!');
});

app.get('/buscar', async (req, res) => {
  try {
    const tema = req.query.tema;
    if (!tema) {
      return res.status(400).json({ erro: 'informe o parametro tema, ex: /buscar?tema=atividade fisica' });
    }

    const urlBusca = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(tema)}&retmode=json&retmax=10`;
    const respostaBusca = await axios.get(urlBusca);
    const ids = respostaBusca.data.esearchresult.idlist;

    if (ids.length === 0) {
      return res.json({ tema, artigos: [] });
    }

    const urlDetalhes = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const respostaDetalhes = await axios.get(urlDetalhes);
    const dados = respostaDetalhes.data.result;

    const artigos = ids.map((id) => {
      const item = dados[id];
      return {
        pmid: id,
        titulo: item.title,
        autores: item.authors ? item.authors.map((a) => a.name).join(', ') : 'nao informado',
        ano: item.pubdate ? item.pubdate.split(' ')[0] : 'nao informado',
        link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      };
    });

    res.json({ tema, total: artigos.length, artigos });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Falha ao buscar artigos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});