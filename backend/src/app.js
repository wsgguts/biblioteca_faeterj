const express = require('express');
const cors = require('cors');
const rotas = require('./routes');
const tratarErros = require('./middlewares/tratarErros');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/saude', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', rotas);
app.use('/api', (_req, res) => res.status(404).json({ mensagem: 'Rota não encontrada.' }));
app.use(tratarErros);

module.exports = app;
