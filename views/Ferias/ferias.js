const accessToken = localStorage.getItem("access_token");

let currentUser = null;
let currentVacationPeriod = null;
let currentAvailableDays = 0;
let currentRequests = [];

try {
    const storedUser = localStorage.getItem("usuario_logado");
    if (storedUser) currentUser = JSON.parse(storedUser);
} catch (error) {
    console.error("Erro ao recuperar usuário logado:", error);
}

function clearSession() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario_logado");
}

function validateSession() {
    if (!accessToken || !currentUser) {
        window.location.href = "/login/";
        return false;
    }

    if (["admin_principal", "admin_setor"].includes(currentUser.perfil)) {
        window.location.href = "/admin/";
        return false;
    }

    if (currentUser.perfil !== "colaborador" || currentUser.ativo === false) {
        clearSession();
        window.location.href = "/login/";
        return false;
    }

    return true;
}

function getAuthHeaders(includeJson = false) {
    const headers = {
        Authorization: `Bearer ${accessToken}`
    };

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function handleUnauthorized(response) {
    if (response.status !== 401) return false;

    clearSession();
    alert("Sua sessão expirou. Faça login novamente.");
    window.location.href = "/login/";

    return true;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getInitials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) return "--";

    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}

function renderLoggedUser() {
    if (!currentUser) return;

    setText("userAvatar", getInitials(currentUser.nome));
    setText("userName", currentUser.nome || "Colaborador");

    setText(
        "userRole",
        currentUser.cargo ||
        currentUser.setor ||
        "Colaborador"
    );
}

function formatDate(value) {
    if (!value) return "--";

    const parts = String(value)
        .substring(0, 10)
        .split("-");

    if (parts.length !== 3) return value;

    const [year, month, day] = parts;

    return `${day}/${month}/${year}`;
}

function createDateFromInput(value) {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function calculateDaysBetween(start, end) {
    const startDate = createDateFromInput(start);
    const endDate = createDateFromInput(end);

    if (!startDate || !endDate || endDate < startDate) {
        return 0;
    }

    return Math.floor(
        (endDate.getTime() - startDate.getTime()) / 86400000
    ) + 1;
}

function showPageMessage(message, type = "info") {
    const container = document.getElementById("vacationPageMessage");
    if (!container) return;

    container.textContent = message;
    container.className = `page-message ${type}`;
}

function clearPageMessage() {
    const container = document.getElementById("vacationPageMessage");
    if (!container) return;

    container.textContent = "";
    container.className = "page-message";
}

async function loadVacationData() {
    try {
        clearPageMessage();

        const response = await fetch("/api/ferias/minhas", {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (handleUnauthorized(response)) return;

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Não foi possível carregar suas férias."
            );
        }

        if (result.usuario) {
            currentUser = {
                ...currentUser,
                ...result.usuario
            };

            localStorage.setItem(
                "usuario_logado",
                JSON.stringify(currentUser)
            );

            renderLoggedUser();
        }

        if (!result.periodo) {
            currentVacationPeriod = null;
            currentAvailableDays = 0;
            renderNoVacationPeriod();
            return;
        }

        currentVacationPeriod = result.periodo;

        currentAvailableDays = Number(
            result.periodo.dias_disponiveis || 0
        );

        renderVacationPeriod(result.periodo);

    } catch (error) {
        console.error("Erro ao carregar férias:", error);
        showPageMessage(error.message, "error");
        disableVacationRequestButtons();
    }
}

function renderNoVacationPeriod() {
    setText("availableDays", "0 dias");
    setText(
        "availableDaysDescription",
        "Nenhum período de férias foi cadastrado."
    );

    setText("usedDays", "0 dias");
    setText("expirationDate", "--");
    setText("vacationStatus", "Não cadastrado");

    setText(
        "vacationStatusDescription",
        "A empresa ainda não cadastrou seu período aquisitivo."
    );

    setText("periodStart", "--");
    setText("periodEnd", "--");
    setText("entitledDays", "0 dias");
    setText("periodUsedDays", "0 dias");
    setText("acquisitionProgressText", "0%");

    setText(
        "acquisitionMessage",
        "Seu período aquisitivo ainda não foi cadastrado pela empresa."
    );

    setProgressBar(0);
    setPeriodBadge("Não cadastrado", "neutral");
    disableVacationRequestButtons();

    showPageMessage(
        "Seu período de férias ainda não foi cadastrado pelo administrador do seu setor.",
        "info"
    );
}

function renderVacationPeriod(periodo) {
    const entitledDays = Number(periodo.dias_direito || 0);
    const usedDays = Number(periodo.dias_usados || 0);
    const availableDays = Number(periodo.dias_disponiveis || 0);

    setText("availableDays", formatDays(availableDays));
    setText("usedDays", formatDays(usedDays));
    setText("expirationDate", formatDate(periodo.data_vencimento));

    setText("periodStart", formatDate(periodo.periodo_inicio));
    setText("periodEnd", formatDate(periodo.periodo_fim));
    setText("entitledDays", formatDays(entitledDays));
    setText("periodUsedDays", formatDays(usedDays));

    renderVacationStatus(periodo);
    renderAcquisitionProgress(periodo);

    if (
        periodo.periodo_concluido === true &&
        availableDays > 0
    ) {
        enableVacationRequestButtons();

        setText(
            "availableDaysDescription",
            "Saldo disponível para solicitação."
        );
    } else {
        disableVacationRequestButtons();

        setText(
            "availableDaysDescription",
            periodo.periodo_concluido !== true
                ? "O período aquisitivo ainda está em andamento."
                : "Seu saldo atual foi totalmente utilizado."
        );
    }
}

function renderVacationStatus(periodo) {
    const status =
        periodo.status_calculado ||
        periodo.status ||
        "";

    const statusData = {
        em_aquisicao: {
            label: "Em aquisição",
            description:
                "Você ainda está completando o período aquisitivo.",
            className: "warning"
        },
        disponivel: {
            label: "Disponível",
            description:
                "Você já possui férias disponíveis para solicitação.",
            className: "success"
        },
        utilizado: {
            label: "Utilizado",
            description:
                "O saldo deste período foi utilizado.",
            className: "neutral"
        }
    };

    const data = statusData[status] || {
        label: "Em análise",
        description: "Verificando situação do período.",
        className: "info"
    };

    setText("vacationStatus", data.label);
    setText(
        "vacationStatusDescription",
        data.description
    );

    setPeriodBadge(
        data.label,
        data.className
    );
}

function renderAcquisitionProgress(periodo) {
    if (!periodo.periodo_inicio || !periodo.periodo_fim) {
        setProgressBar(0);
        setText("acquisitionProgressText", "0%");
        return;
    }

    const start = createDateFromInput(
        String(periodo.periodo_inicio).substring(0, 10)
    );

    const end = createDateFromInput(
        String(periodo.periodo_fim).substring(0, 10)
    );

    if (!start || !end) return;

    if (periodo.periodo_concluido === true) {
        setProgressBar(100);
        setText("acquisitionProgressText", "100%");
        setText(
            "acquisitionMessage",
            "Período aquisitivo concluído."
        );

        return;
    }

    const today = new Date();

    if (today < start) {
        setProgressBar(0);
        setText("acquisitionProgressText", "0%");

        setText(
            "acquisitionMessage",
            `Seu período começa em ${formatDate(
                periodo.periodo_inicio
            )}.`
        );

        return;
    }

    const total = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();

    let percentage = total > 0
        ? Math.floor((elapsed / total) * 100)
        : 0;

    percentage = Math.max(
        0,
        Math.min(percentage, 100)
    );

    setProgressBar(percentage);

    setText(
        "acquisitionProgressText",
        `${percentage}%`
    );

    setText(
        "acquisitionMessage",
        `Período em andamento até ${formatDate(
            periodo.periodo_fim
        )}.`
    );
}

async function loadVacationRequests() {
    try {
        const response = await fetch(
            "/api/ferias/solicitacoes",
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (handleUnauthorized(response)) return;

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Não foi possível carregar suas solicitações."
            );
        }

        currentRequests = Array.isArray(result)
            ? result
            : [];

        renderVacationRequests();

    } catch (error) {
        console.error(
            "Erro ao carregar solicitações:",
            error
        );

        renderRequestLoadError();
    }
}

function renderVacationRequests() {
    const pending = currentRequests.filter(
        request => request.status === "pendente"
    );

    const history = currentRequests.filter(
        request => request.status !== "pendente"
    );

    renderPendingRequests(pending);
    renderVacationHistory(history);
}

function renderPendingRequests(requests) {
    const tbody = document.getElementById(
        "pendingRequestsTableBody"
    );

    if (!tbody) return;

    if (!requests.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    Nenhuma solicitação em andamento.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = requests
        .map(request => `
            <tr>
                <td>
                    ${formatDate(request.data_inicio)}
                    até
                    ${formatDate(request.data_fim)}
                </td>

                <td>
                    ${formatDays(request.quantidade_dias)}
                </td>

                <td>
                    ${formatDate(request.created_at)}
                </td>

                <td>
                    <span class="status-badge warning">
                        Pendente
                    </span>
                </td>

                <td>
                    ${
                        request.observacoes
                            ? escapeHTML(request.observacoes)
                            : "—"
                    }
                </td>
            </tr>
        `)
        .join("");
}

function renderVacationHistory(requests) {
    const tbody = document.getElementById(
        "vacationHistoryTableBody"
    );

    if (!tbody) return;

    if (!requests.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    Nenhum histórico disponível.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = requests
        .map(request => {
            const statusData =
                getRequestStatusData(request.status);

            return `
                <tr>
                    <td>
                        ${formatDate(request.data_inicio)}
                        até
                        ${formatDate(request.data_fim)}
                    </td>

                    <td>
                        ${formatDays(request.quantidade_dias)}
                    </td>

                    <td>
                        <span class="status-badge ${statusData.className}">
                            ${statusData.label}
                        </span>
                    </td>

                    <td>
                        ${
                            request.data_avaliacao
                                ? formatDate(request.data_avaliacao)
                                : "—"
                        }
                    </td>

                    <td>
                        ${
                            request.observacao_admin
                                ? escapeHTML(request.observacao_admin)
                                : "—"
                        }
                    </td>
                </tr>
            `;
        })
        .join("");
}

function getRequestStatusData(status) {
    const data = {
        aprovada: {
            label: "Aprovada",
            className: "success"
        },
        aprovada_com_ressalvas: {
            label: "Aprovada com ressalvas",
            className: "info"
        },
        recusada: {
            label: "Recusada",
            className: "danger"
        },
        reprovada: {
            label: "Recusada",
            className: "danger"
        }
    };

    return data[status] || {
        label: status || "Desconhecido",
        className: "neutral"
    };
}

function renderRequestLoadError() {
    const html = `
        <tr>
            <td colspan="5" class="empty-table">
                Não foi possível carregar as solicitações.
            </td>
        </tr>
    `;

    const pending = document.getElementById(
        "pendingRequestsTableBody"
    );

    const history = document.getElementById(
        "vacationHistoryTableBody"
    );

    if (pending) pending.innerHTML = html;

    if (history) {
        history.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    Não foi possível carregar o histórico.
                </td>
            </tr>
        `;
    }
}

function setVacationButtonsDisabled(disabled) {
    const mainButton =
        document.getElementById(
            "openVacationRequestButton"
        );

    const secondaryButton =
        document.getElementById(
            "secondaryVacationRequestButton"
        );

    if (mainButton) {
        mainButton.disabled = disabled;
    }

    if (secondaryButton) {
        secondaryButton.disabled = disabled;
    }
}

function enableVacationRequestButtons() {
    setVacationButtonsDisabled(false);
}

function disableVacationRequestButtons() {
    setVacationButtonsDisabled(true);
}

function openVacationRequestModal() {
    if (currentAvailableDays <= 0) {
        showPageMessage(
            "Você não possui saldo disponível para solicitar férias.",
            "info"
        );

        return;
    }

    const modal = document.getElementById(
        "vacationRequestModal"
    );

    const form = document.getElementById(
        "vacationRequestForm"
    );

    if (form) form.reset();

    setText("requestDays", "0 dias");

    setText(
        "modalAvailableDays",
        formatDays(currentAvailableDays)
    );

    clearRequestMessage();

    if (modal) {
        modal.classList.add("show");
        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";
    }
}

function closeVacationRequestModal() {
    const modal = document.getElementById(
        "vacationRequestModal"
    );

    if (!modal) return;

    modal.classList.remove("show");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";
    clearRequestMessage();
}

function updateRequestDays() {
    const startInput =
        document.getElementById(
            "requestStartDate"
        );

    const endInput =
        document.getElementById(
            "requestEndDate"
        );

    if (!startInput || !endInput) return;

    const days = calculateDaysBetween(
        startInput.value,
        endInput.value
    );

    setText(
        "requestDays",
        formatDays(days)
    );

    clearRequestMessage();

    if (
        startInput.value &&
        endInput.value &&
        days === 0
    ) {
        showRequestMessage(
            "A data final deve ser igual ou posterior à data inicial.",
            "error"
        );

        return;
    }

    if (days > currentAvailableDays) {
        showRequestMessage(
            `Você possui somente ${currentAvailableDays} dias disponíveis.`,
            "error"
        );
    }
}

async function submitVacationRequest(event) {
    event.preventDefault();

    const startInput =
        document.getElementById(
            "requestStartDate"
        );

    const endInput =
        document.getElementById(
            "requestEndDate"
        );

    const observationInput =
        document.getElementById(
            "requestObservation"
        );

    const submitButton =
        document.getElementById(
            "submitVacationRequest"
        );

    const submitText =
        document.getElementById(
            "submitVacationRequestText"
        );

    const start = startInput?.value || "";
    const end = endInput?.value || "";

    const observation =
        observationInput?.value.trim() || "";

    if (!start || !end) {
        showRequestMessage(
            "Informe a data de início e a data de término.",
            "error"
        );

        return;
    }

    const days = calculateDaysBetween(
        start,
        end
    );

    if (days <= 0) {
        showRequestMessage(
            "O período informado é inválido.",
            "error"
        );

        return;
    }

    if (days > currentAvailableDays) {
        showRequestMessage(
            `Você possui somente ${currentAvailableDays} dias disponíveis.`,
            "error"
        );

        return;
    }

    const originalText =
        submitText?.textContent ||
        "Enviar solicitação";

    try {
        if (submitButton) {
            submitButton.disabled = true;
        }

        if (submitText) {
            submitText.textContent =
                "Enviando...";
        }

        const response = await fetch(
            "/api/ferias/solicitacoes",
            {
                method: "POST",
                headers: getAuthHeaders(true),

                body: JSON.stringify({
                    data_inicio: start,
                    data_fim: end,
                    observacoes:
                        observation || null
                })
            }
        );

        if (handleUnauthorized(response)) {
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                result.details ||
                "Não foi possível enviar a solicitação."
            );
        }

        showRequestMessage(
            result.message ||
            "Solicitação enviada com sucesso.",
            "success"
        );

        await loadVacationRequests();

        setTimeout(
            closeVacationRequestModal,
            800
        );

    } catch (error) {
        console.error(
            "Erro ao solicitar férias:",
            error
        );

        showRequestMessage(
            error.message,
            "error"
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }

        if (submitText) {
            submitText.textContent =
                originalText;
        }
    }
}

function showRequestMessage(message, type) {
    const container =
        document.getElementById(
            "vacationRequestMessage"
        );

    if (!container) return;

    container.textContent = message;

    container.className =
        `form-message ${type}`;
}

function clearRequestMessage() {
    const container =
        document.getElementById(
            "vacationRequestMessage"
        );

    if (!container) return;

    container.textContent = "";
    container.className = "form-message";
}

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatDays(value) {
    const number = Number(value || 0);

    return `${number} ${
        number === 1
            ? "dia"
            : "dias"
    }`;
}

function setProgressBar(percentage) {
    const bar =
        document.getElementById(
            "acquisitionProgressBar"
        );

    if (bar) {
        bar.style.width =
            `${percentage}%`;
    }
}

function setPeriodBadge(text, className) {
    const badge =
        document.getElementById(
            "periodStatusBadge"
        );

    if (!badge) return;

    badge.textContent = text;

    badge.className =
        `status-badge ${className}`;
}

document
    .getElementById(
        "openVacationRequestButton"
    )
    ?.addEventListener(
        "click",
        openVacationRequestModal
    );

document
    .getElementById(
        "secondaryVacationRequestButton"
    )
    ?.addEventListener(
        "click",
        openVacationRequestModal
    );

document
    .getElementById(
        "closeVacationRequestModal"
    )
    ?.addEventListener(
        "click",
        closeVacationRequestModal
    );

document
    .getElementById(
        "cancelVacationRequest"
    )
    ?.addEventListener(
        "click",
        closeVacationRequestModal
    );

document
    .getElementById(
        "requestStartDate"
    )
    ?.addEventListener(
        "change",
        updateRequestDays
    );

document
    .getElementById(
        "requestEndDate"
    )
    ?.addEventListener(
        "change",
        updateRequestDays
    );

document
    .getElementById(
        "vacationRequestForm"
    )
    ?.addEventListener(
        "submit",
        submitVacationRequest
    );

document
    .getElementById(
        "vacationRequestModal"
    )
    ?.addEventListener(
        "click",
        event => {
            if (
                event.target.id ===
                "vacationRequestModal"
            ) {
                closeVacationRequestModal();
            }
        }
    );

document.addEventListener(
    "keydown",
    event => {
        if (event.key === "Escape") {
            closeVacationRequestModal();
        }
    }
);

document
    .getElementById(
        "logoutButton"
    )
    ?.addEventListener(
        "click",
        () => {
            if (
                !confirm(
                    "Deseja sair do Evolua+?"
                )
            ) {
                return;
            }

            clearSession();

            window.location.href =
                "/login/";
        }
    );

async function initializeVacationPage() {
    if (!validateSession()) return;

    renderLoggedUser();
    disableVacationRequestButtons();

    await loadVacationData();
    await loadVacationRequests();
}

document.addEventListener(
    "DOMContentLoaded",
    initializeVacationPage
);