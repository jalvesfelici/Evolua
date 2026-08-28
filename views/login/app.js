const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("senha");
const passwordButton = document.getElementById("passwordButton");
const passwordIcon = document.getElementById("passwordIcon");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");

if (passwordButton && passwordInput && passwordIcon) {
    passwordButton.addEventListener("click", () => {
        const passwordHidden = passwordInput.type === "password";

        passwordInput.type = passwordHidden
            ? "text"
            : "password";

        passwordIcon.className = passwordHidden
            ? "fa-regular fa-eye-slash"
            : "fa-regular fa-eye";

        const buttonText = passwordHidden
            ? "Ocultar senha"
            : "Mostrar senha";

        passwordButton.title = buttonText;

        passwordButton.setAttribute(
            "aria-label",
            buttonText
        );
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = emailInput
            ? emailInput.value.trim().toLowerCase()
            : "";

        const senha = passwordInput
            ? passwordInput.value
            : "";

        if (!email || !senha) {
            showMessage(
                "Preencha e-mail e senha.",
                "error"
            );

            return;
        }

        const originalButtonHTML = loginButton
            ? loginButton.innerHTML
            : "Entrar";

        try {
            if (loginButton) {
                loginButton.disabled = true;

                loginButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Entrando...</span>
                `;
            }

            hideMessage();

            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        senha
                    })
                }
            );

            const result = await getResponseData(
                response
            );

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    result.message ||
                    "Não foi possível realizar o login."
                );
            }

            if (
                !result.access_token ||
                !result.usuario
            ) {
                throw new Error(
                    "O servidor não retornou os dados necessários para iniciar a sessão."
                );
            }

            if (result.usuario.ativo === false) {
                clearSession();

                throw new Error(
                    "Este usuário está inativo."
                );
            }

            const perfil = result.usuario.perfil;

            if (
                perfil !== "admin_principal" &&
                perfil !== "admin_setor" &&
                perfil !== "colaborador"
            ) {
                clearSession();

                throw new Error(
                    "Perfil de usuário não reconhecido pelo sistema."
                );
            }

            localStorage.setItem(
                "access_token",
                result.access_token
            );

            localStorage.setItem(
                "usuario_logado",
                JSON.stringify(
                    result.usuario
                )
            );

            if (
                perfil === "admin_principal" ||
                perfil === "admin_setor"
            ) {
                window.location.href = "/admin/";
                return;
            }

            window.location.href = "/dashboard/";

        } catch (error) {
            console.error(
                "Erro no login:",
                error
            );

            showMessage(
                error.message ||
                "Não foi possível realizar o login.",
                "error"
            );

        } finally {
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.innerHTML =
                    originalButtonHTML;
            }
        }
    });
}

async function getResponseData(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function clearSession() {
    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "usuario_logado"
    );
}

function showMessage(message, type = "error") {
    if (!loginMessage) return;

    loginMessage.textContent =
        message;

    loginMessage.className =
        `login-message ${type}`;
}

function hideMessage() {
    if (!loginMessage) return;

    loginMessage.textContent = "";

    loginMessage.className =
        "login-message";
}