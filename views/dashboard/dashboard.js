const accessToken = localStorage.getItem("access_token");

let loggedUser = null;

try {
    const storedUser = localStorage.getItem("usuario_logado");

    if (storedUser) {
        loggedUser = JSON.parse(storedUser);
    }
} catch (error) {
    console.error(
        "Erro ao recuperar usuário logado:",
        error
    );
}

function clearSession() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario_logado");
}

function validateSession() {
    if (!accessToken || !loggedUser) {
        window.location.href = "/login/";
        return false;
    }

    if (
        loggedUser.perfil === "admin_principal" ||
        loggedUser.perfil === "admin_setor"
    ) {
        window.location.href = "/admin/";
        return false;
    }

    if (
        loggedUser.perfil !== "colaborador" ||
        loggedUser.ativo === false
    ) {
        clearSession();
        window.location.href = "/login/";
        return false;
    }

    return true;
}

function getAuthHeaders() {
    return {
        Authorization: `Bearer ${accessToken}`
    };
}

function getInitials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) {
        return "--";
    }

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}

function getFirstName(name) {
    return String(name || "")
        .trim()
        .split(/\s+/)[0] || "";
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function renderLoggedUser() {
    if (!loggedUser) return;

    const initials =
        getInitials(loggedUser.nome);

    const role =
        loggedUser.cargo ||
        loggedUser.setor ||
        "Colaborador";

    setText(
        "welcomeTitle",
        `Olá, ${getFirstName(loggedUser.nome)}!`
    );

    setText("userAvatar", initials);
    setText(
        "userName",
        loggedUser.nome || "Colaborador"
    );
    setText("userRole", role);

    setText("profileAvatar", initials);
    setText(
        "profileName",
        loggedUser.nome || "Colaborador"
    );

    setText(
        "profileRole",
        role
    );

    setText(
        "profileSector",
        loggedUser.setor ||
        "Não informado"
    );

    setText(
        "profileJob",
        loggedUser.cargo ||
        "Não informado"
    );

    setText(
        "profileEmail",
        loggedUser.email ||
        "Não informado"
    );
}

async function loadVacationSummary() {
    try {
        const response = await fetch(
            "/api/ferias/minhas",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (response.status === 401) {
            clearSession();
            window.location.href = "/login/";
            return;
        }

        const result = await response.json();

        if (!response.ok || !result.periodo) {
            setText("vacationDays", "0 dias");

            setText(
                "vacationDescription",
                "Nenhum período disponível"
            );

            return;
        }

        const days = Number(
            result.periodo.dias_disponiveis || 0
        );

        setText(
            "vacationDays",
            `${days} ${
                days === 1
                    ? "dia"
                    : "dias"
            }`
        );

        const status =
            result.periodo.status_calculado ||
            result.periodo.status;

        if (status === "em_aquisicao") {
            setText(
                "vacationDescription",
                "Período aquisitivo em andamento"
            );
        } else if (status === "disponivel") {
            setText(
                "vacationDescription",
                "Disponível para solicitação"
            );
        } else {
            setText(
                "vacationDescription",
                "Consulte seu período de férias"
            );
        }

    } catch (error) {
        console.error(
            "Erro ao carregar resumo de férias:",
            error
        );

        setText("vacationDays", "--");
    }
}

function configureNavigation() {
    document
        .querySelectorAll(
            ".main-content [data-link]"
        )
        .forEach(element => {
            element.addEventListener(
                "click",
                () => {
                    const destination =
                        element.dataset.link;

                    if (destination) {
                        window.location.href =
                            destination;
                    }
                }
            );
        });
}

function configureLogout() {
    document
        .getElementById("logoutButton")
        ?.addEventListener(
            "click",
            () => {
                const confirmed =
                    confirm(
                        "Deseja sair do Evolua+?"
                    );

                if (!confirmed) return;

                clearSession();

                window.location.href =
                    "/login/";
            }
        );
}

async function initializeDashboard() {
    if (!validateSession()) return;

    renderLoggedUser();
    configureNavigation();
    configureLogout();

    await loadVacationSummary();
}

initializeDashboard();