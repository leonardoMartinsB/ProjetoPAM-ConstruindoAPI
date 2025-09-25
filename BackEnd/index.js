const db = require("./conf/autenticacao.js");
const express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");
let methodOvirride = require("method-override");
const app = express();
const port = 3000;

// Permite que você use verbos HTTP
app.use(methodOvirride("X-HTTP-Method"));
app.use(methodOvirride("X-HTTP-Method-Override"));
app.use(methodOvirride("X-Method-Override"));
app.use(methodOvirride("_method"));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  const results = await db.selectFull();
  console.log(results);
  res.json(results);
});

app.get("/clientes/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido. Deve ser um número.",
      });
    }

    const results = await db.selectById(id);
    console.log(results);

    if (!results || results.length === 0) {
      return res.status(404).json({
        error: "Cliente não encontrado.",
      });
    }

    res.json(results);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    res.status(500).json({
      error: "Erro interno do servidor.",
    });
  }
});


app.post("/clientes/", async (req, res) => {
  const Nome = req.body.Nome;
  const Idade = req.body.Idade;
  const UF = req.body.UF;

  const results = await db.insertCliente(Nome, Idade, UF);
  console.log(results);
  res.json(results);
});

app.put("/clientes/:id", async (req, res) => {
  const id = req.params.id;
  const Nome = req.body.Nome;
  const Idade = req.body.Idade;
  const UF = req.body.UF;

  console.log("PUT - ID recebido:", id);
  console.log("PUT - Dados recebidos:", { Nome, Idade, UF });

  try {
    const results = await db.updateCliente(Nome, Idade, UF, id);
    console.log("PUT - Resultado:", results);
    res.json(results);
  } catch (error) {
    console.error("PUT - Erro:", error);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

app.delete("/clientes/:id", async (req, res) => {
  const id = req.params.id;

  console.log("DELETE - ID recebido:", id);

  try {
    const results = await db.deleteById(id);
    console.log("DELETE - Resultado:", results);
    res.json(results);
  } catch (error) {
    console.error("DELETE - Erro:", error);
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
