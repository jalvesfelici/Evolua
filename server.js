// ==========================================================
// EVOLUA+
// SERVIDOR PRINCIPAL
// ==========================================================
//
// Este arquivo é responsável por:
//
// - iniciar o servidor Node.js;
// - configurar o Express;
// - permitir o recebimento de JSON;
// - disponibilizar as telas;
// - conectar as rotas da API;
// - iniciar o sistema na porta 3000.
//
// ==========================================================



// ==========================================================
// IMPORTAÇÕES
// ==========================================================

// Framework utilizado para criar o backend.
const express =
  require("express");


// Módulo nativo do Node.js utilizado
// para trabalhar com caminhos de arquivos.
const path =
  require("path");



// ==========================================================
// CRIAR APLICAÇÃO EXPRESS
// ==========================================================

const app =
  express();



// ==========================================================
// PORTA DO SERVIDOR
// ==========================================================
//
// Se existir uma porta definida no ambiente,
// utilizamos ela.
//
// Caso contrário:
//
// porta 3000.
//
// ==========================================================

const PORT =
  process.env.PORT || 3000;



// ==========================================================
// PERMITIR RECEBER JSON
// ==========================================================
//
// Isso permite que o backend receba informações
// enviadas pelo frontend.
//
// Exemplo:
//
// fetch("/api/usuarios", {
//
//   method: "POST",
//
//   headers: {
//     "Content-Type": "application/json"
//   },
//
//   body: JSON.stringify(...)
//
// });
//
// ==========================================================

app.use(
  express.json()
);



// ==========================================================
// DISPONIBILIZAR AS TELAS
// ==========================================================
//
// Estrutura:
//
// views/
//
// ├── login/
// │   ├── index.html
// │   ├── style.css
// │   └── app.js
// │
//
// ├── admin/
// │   ├── index.html
// │   ├── style.css
// │   └── app.js
// │
//
// └── treinamentos/
//     ├── index.html
//     ├── style.css
//     └── app.js
//
// O Express disponibiliza esses arquivos
// diretamente para o navegador.
//
// ==========================================================

app.use(
  express.static(
    path.join(
      __dirname,
      "views"
    )
  )
);



// ==========================================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================================
//
// Arquivo:
//
// routes/auth.js
//
// Endereço:
//
// /api/auth
//
// Exemplo:
//
// POST /api/auth/login
//
// ==========================================================

const authRoutes =
  require(
    "./routes/auth"
  );


app.use(
  "/api/auth",
  authRoutes
);



// ==========================================================
// ROTAS DOS CURSOS
// ==========================================================
//
// Arquivo:
//
// routes/cursos.js
//
// Endereço:
//
// /api/cursos
//
// Exemplos:
//
// GET /api/cursos
// POST /api/cursos
//
// ==========================================================

const cursosRoutes =
  require(
    "./routes/cursos"
  );


app.use(
  "/api/cursos",
  cursosRoutes
);



// ==========================================================
// ROTAS DOS USUÁRIOS
// ==========================================================
//
// Arquivo:
//
// routes/usuarios.js
//
// Endereço:
//
// /api/usuarios
//
// Exemplos:
//
// GET /api/usuarios
//
// POST /api/usuarios
//
// ==========================================================

const usuariosRoutes =
  require(
    "./routes/usuarios"
  );


app.use(
  "/api/usuarios",
  usuariosRoutes
);



// ==========================================================
// ROTA INICIAL
// ==========================================================
//
// Agora que estamos criando autenticação real,
// a primeira tela do sistema será o Login.
//
// Ao acessar:
//
// http://localhost:3000
//
// o usuário será enviado para:
//
// http://localhost:3000/login/
//
// ==========================================================

app.get(
  "/",
  (req, res) => {

    res.redirect(
      "/login/"
    );

  }
);



// ==========================================================
// ROTA DE TESTE DA API
// ==========================================================
//
// Pode acessar:
//
// http://localhost:3000/api/status
//
// para confirmar se o servidor está funcionando.
//
// ==========================================================

app.get(
  "/api/status",
  (req, res) => {

    res.json({

      status:
        "ok",

      mensagem:
        "Servidor do Evolua+ funcionando."

    });

  }
);



// ==========================================================
// TRATAMENTO DE ROTA DE API NÃO ENCONTRADA
// ==========================================================
//
// Se alguém tentar acessar:
//
// /api/alguma-rota-inexistente
//
// retornamos um JSON claro.
//
// IMPORTANTE:
//
// Esta configuração deve ficar DEPOIS
// das rotas reais da API.
//
// ==========================================================

app.use(
  "/api",
  (req, res) => {

    res
      .status(404)
      .json({

        erro:
          "Rota da API não encontrada."

      });

  }
);



// ==========================================================
// INICIAR SERVIDOR
// ==========================================================

app.listen(
  PORT,
  () => {

    console.log(
      "=============================================="
    );

    console.log(
      "EVOLUA+ - Portal de Gestão de Carreira"
    );

    console.log(
      "=============================================="
    );


    console.log(
      `Servidor: http://localhost:${PORT}`
    );


    console.log(
      `Login: http://localhost:${PORT}/login/`
    );


    console.log(
      `Admin: http://localhost:${PORT}/admin/`
    );


    console.log(
      `Treinamentos: http://localhost:${PORT}/treinamentos/`
    );


    console.log(
      `API Login: http://localhost:${PORT}/api/auth/login`
    );


    console.log(
      `API Cursos: http://localhost:${PORT}/api/cursos`
    );


    console.log(
      `API Usuários: http://localhost:${PORT}/api/usuarios`
    );


    console.log(
      `Status: http://localhost:${PORT}/api/status`
    );


    console.log(
      "=============================================="
    );

  }
);