const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('API de pesquisa cientifica rodando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
const axios = require('axios');

app.get('/teste-pubmed', async (req, res) => {
  try {
    const termo = 'atividade fisica hipertensao';
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(termo)}&retmode=json&retmax=5`;
    const resposta = await axios.get(url);
    res.json(resposta.data);
  } catch (erro) {
    res.status(500).json({ erro: 'Falha ao consultar PubMed' });
  }
});