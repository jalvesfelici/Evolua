// ==========================================================
// EVOLUA+
// LOGIN - FRONTEND
// ==========================================================
//
// Este arquivo controla:
//
// - captura dos dados do formulário;
// - mostrar/esconder senha;
// - envio do login para o backend;
// - armazenamento da sessão;
// - redirecionamento conforme o perfil.
//
// ==========================================================



// ==========================================================
// ELEMENTOS DA TELA
// ==========================================================

const loginForm =
  document.getElementById(
    "loginForm"
  );


const emailInput =
  document.getElementById(
    "email"
  );


const passwordInput =
  document.getElementById(
    "senha"
  );


const passwordButton =
  document.getElementById(
    "passwordButton"
  );


const passwordIcon =
  document.getElementById(
    "passwordIcon"
  );


const loginMessage =
  document.getElementById(
    "loginMessage"
  );


const loginButton =
  document.getElementById(
    "loginButton"
  );



// ==========================================================
// MOSTRAR / ESCONDER SENHA
// ==========================================================

if (
  passwordButton &&
  passwordInput &&
  passwordIcon
) {

  passwordButton.addEventListener(
    "click",
    () => {

      // Verifica se a senha está escondida.
      const hidden =
        passwordInput.type ===
        "password";


      // Se estiver escondida,
      // mudamos para texto.
      //
      // Se estiver visível,
      // voltamos para password.

      passwordInput.type =
        hidden
          ? "text"
          : "password";


      // Alteramos o ícone.
      passwordIcon.className =
        hidden
          ? "fa-regular fa-eye-slash"
          : "fa-regular fa-eye";


      // Alteramos também o texto
      // exibido ao passar o mouse.

      passwordButton.title =
        hidden
          ? "Ocultar senha"
          : "Mostrar senha";

    }
  );

}



// ==========================================================
// LOGIN
// ==========================================================

if (
  loginForm
) {

  loginForm.addEventListener(
    "submit",
    async event => {

      // Impede o formulário de atualizar a página.
      event.preventDefault();



      // ====================================================
      // PEGAR DADOS
      // ====================================================

      const email =
        emailInput
          .value
          .trim()
          .toLowerCase();


      const senha =
        passwordInput
          .value;



      // ====================================================
      // VALIDAR CAMPOS
      // ====================================================

      if (
        !email ||
        !senha
      ) {

        showMessage(
          "Preencha e-mail e senha.",
          "error"
        );

        return;

      }



      // ====================================================
      // PREPARAR BOTÃO
      // ====================================================

      const originalButtonText =
        loginButton.textContent;


      try {

        loginButton.disabled =
          true;


        loginButton.textContent =
          "Entrando...";


        // Limpamos mensagens anteriores.
        hideMessage();



        // ==================================================
        // ENVIAR LOGIN PARA O BACKEND
        // ==================================================
        //
        // Fluxo:
        //
        // Login
        //   ↓
        // POST /api/auth/login
        //   ↓
        // Node.js
        //   ↓
        // Supabase Auth
        //   ↓
        // tabela usuario
        //
        // ==================================================

        const response =
          await fetch(
            "/api/auth/login",
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  email:
                    email,

                  senha:
                    senha

                })

            }
          );



        // ==================================================
        // PEGAR RESPOSTA
        // ==================================================

        const result =
          await response.json();



        // ==================================================
        // LOGIN COM ERRO
        // ==================================================

        if (
          !response.ok
        ) {

          throw new Error(
            result.error ||
            "Não foi possível realizar o login."
          );

        }



        // ==================================================
        // VALIDAR RESPOSTA DO BACKEND
        // ==================================================

        if (
          !result.access_token ||
          !result.usuario
        ) {

          throw new Error(
            "O servidor não retornou os dados necessários para iniciar a sessão."
          );

        }



        // ==================================================
        // GUARDAR TOKEN
        // ==================================================
        //
        // Esse token será utilizado posteriormente
        // para provar para o backend quem está logado.
        //
        // Exemplo:
        //
        // Authorization: Bearer TOKEN
        //
        // ==================================================

        localStorage.setItem(
          "access_token",
          result.access_token
        );



        // ==================================================
        // GUARDAR DADOS DO USUÁRIO
        // ==================================================
        //
        // Exemplo:
        //
        // {
        //   id,
        //   nome,
        //   email,
        //   matricula,
        //   cargo,
        //   setor,
        //   perfil,
        //   ativo
        // }
        //
        // ==================================================

        localStorage.setItem(
          "usuario_logado",
          JSON.stringify(
            result.usuario
          )
        );



        // ==================================================
        // PEGAR PERFIL
        // ==================================================

        const perfil =
          result.usuario.perfil;



        // ==================================================
        // ADMIN PRINCIPAL
        // ==================================================
        //
        // Vai para:
        //
        // /admin/
        //
        // ==================================================

        if (
          perfil ===
          "admin_principal"
        ) {

          window.location.href =
            "/admin/";

          return;

        }



        // ==================================================
        // ADMIN DE SETOR
        // ==================================================
        //
        // Também vai para:
        //
        // /admin/
        //
        // ==================================================

        if (
          perfil ===
          "admin_setor"
        ) {

          window.location.href =
            "/admin/";

          return;

        }



        // ==================================================
        // COLABORADOR
        // ==================================================
        //
        // Vai para:
        //
        // /treinamentos/
        //
        // ==================================================

        if (
          perfil ===
          "colaborador"
        ) {

          window.location.href =
            "/treinamentos/";

          return;

        }



        // ==================================================
        // PERFIL DESCONHECIDO
        // ==================================================
        //
        // Não deixamos entrar automaticamente
        // em nenhuma página.
        //
        // ==================================================

        localStorage.removeItem(
          "access_token"
        );


        localStorage.removeItem(
          "usuario_logado"
        );


        throw new Error(
          "Perfil de usuário não reconhecido pelo sistema."
        );



      } catch (error) {

        // ==================================================
        // EXIBIR ERRO
        // ==================================================

        console.error(
          "Erro no login:",
          error
        );


        showMessage(
          error.message,
          "error"
        );


      } finally {

        // ==================================================
        // RESTAURAR BOTÃO
        // ==================================================

        loginButton.disabled =
          false;


        loginButton.textContent =
          originalButtonText;

      }

    }
  );

}



// ==========================================================
// MOSTRAR MENSAGEM
// ==========================================================

function showMessage(
  message,
  type
) {

  if (
    !loginMessage
  ) {

    return;

  }


  loginMessage.textContent =
    message;


  loginMessage.className =
    `login-message ${type}`;

}



// ==========================================================
// ESCONDER MENSAGEM
// ==========================================================

function hideMessage() {

  if (
    !loginMessage
  ) {

    return;

  }


  loginMessage.textContent =
    "";


  loginMessage.className =
    "login-message";

}