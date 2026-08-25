const express = require('express');
const axios = require('axios');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());

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

    const { error: erroSupabase } = await supabase.from('buscas').insert({ tema, resultado: artigos });
    if (erroSupabase) {
      console.error('Erro ao salvar no Supabase:', erroSupabase);
    }

    res.json({ tema, total: artigos.length, artigos });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Falha ao buscar artigos' });
  }
});

app.post('/registrar', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'informe email e senha' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const { error } = await supabase.from('usuarios').insert({ email, senha_hash: senhaHash });
    if (error) {
      return res.status(500).json({ erro: 'nao foi possivel registrar', detalhe: error.message });
    }

    res.status(201).json({ mensagem: 'usuario registrado com sucesso' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'falha ao registrar' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'informe email e senha' });
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ erro: 'email ou senha invalidos' });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaConfere) {
      return res.status(401).json({ erro: 'email ou senha invalidos' });
    }

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'falha ao fazer login' });
  }
});

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ erro: 'token nao fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'token invalido' });
  }
}

app.get('/perfil', autenticar, (req, res) => {
  res.json({ mensagem: 'autenticado com sucesso', usuario: req.usuario });
});

app.post('/favoritos', autenticar, async (req, res) => {
  try {
    const { pmid, titulo, link } = req.body;
    if (!pmid || !titulo || !link) {
      return res.status(400).json({ erro: 'informe pmid, titulo e link' });
    }

    const usuarioId = req.usuario.id;

    const { data: existente } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('pmid', pmid)
      .maybeSingle();

    if (existente) {
      return res.status(409).json({ erro: 'artigo ja favoritado' });
    }

    const { error } = await supabase
      .from('favoritos')
      .insert({ usuario_id: usuarioId, pmid, titulo, link });

    if (error) {
      return res.status(500).json({ erro: 'nao foi possivel favoritar', detalhe: error.message });
    }

    res.status(201).json({ mensagem: 'artigo favoritado com sucesso' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'falha ao favoritar artigo' });
  }
});

app.get('/favoritos', autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const { data, error } = await supabase
      .from('favoritos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ erro: 'nao foi possivel listar favoritos' });
    }

    res.json({ total: data.length, favoritos: data });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'falha ao listar favoritos' });
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}