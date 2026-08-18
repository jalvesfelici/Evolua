// ==========================================================
// PORTAL DE CARREIRAS
// LOGIN - FRONTEND
// ==========================================================
//
// Neste momento ainda NÃO temos autenticação real.
//
// Este JavaScript prepara a interface para quando
// criarmos o sistema de usuários.
//
// ==========================================================



// ==========================================================
// PEGAR ELEMENTOS DA TELA
// ==========================================================

const loginForm =
  document.getElementById(
    "loginForm"
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

passwordButton.addEventListener(
  "click",
  () => {

    // Verificamos o tipo atual.
    const passwordIsHidden =
      passwordInput.type ===
      "password";


    if (
      passwordIsHidden
    ) {

      // Mostra a senha.
      passwordInput.type =
        "text";


      passwordIcon.className =
        "fa-regular fa-eye-slash";


      passwordButton.title =
        "Ocultar senha";

    } else {

      // Esconde novamente.
      passwordInput.type =
        "password";


      passwordIcon.className =
        "fa-regular fa-eye";


      passwordButton.title =
        "Mostrar senha";

    }

  }
);



// ==========================================================
// ENVIO DO FORMULÁRIO
// ==========================================================
//
// IMPORTANTE:
//
// Ainda não estamos autenticando.
//
// Apenas impedimos o formulário de atualizar a página.
//
// Na próxima etapa criaremos:
//
// POST /api/login
//
// ==========================================================

loginForm.addEventListener(
  "submit",
  event => {

    // Impede o comportamento padrão.
    event.preventDefault();


    const usuario =
      document
        .getElementById(
          "usuario"
        )
        .value
        .trim();


    const senha =
      passwordInput
        .value
        .trim();


    // ======================================================
    // VALIDAÇÃO BÁSICA
    // ======================================================

    if (
      !usuario ||
      !senha
    ) {

      showMessage(
        "Preencha usuário e senha.",
        "error"
      );


      return;

    }


    // ======================================================
    // SIMULAÇÃO TEMPORÁRIA
    // ======================================================

    showMessage(
      "Interface de login funcionando. A autenticação será conectada aos usuários posteriormente.",
      "success"
    );

  }
);



// ==========================================================
// MOSTRAR MENSAGEM
// ==========================================================

function showMessage(
  message,
  type
) {

  loginMessage.textContent =
    message;


  loginMessage.className =
    `login-message ${type}`;

}