const accessToken = localStorage.getItem("access_token");

let loggedUser = null;
let selectedDocument = null;

try {
    const storedUser = localStorage.getItem("usuario_logado");

    if (storedUser) {
        loggedUser = JSON.parse(storedUser);
    }
} catch (error) {
    console.error("Erro ao recuperar usuário:", error);
}

const punchTypes = [
    {
        key: "entrada",
        label: "Entrada",
        button: "Registrar entrada",
        modalTitle: "Registrar entrada",
        description: "Registre o início da sua jornada."
    },
    {
        key: "intervalo",
        label: "Início do intervalo",
        button: "Iniciar intervalo",
        modalTitle: "Registrar intervalo",
        description: "Registre o início do seu intervalo."
    },
    {
        key: "retorno",
        label: "Retorno do intervalo",
        button: "Registrar retorno",
        modalTitle: "Registrar retorno",
        description: "Registre seu retorno ao trabalho."
    },
    {
        key: "saida",
        label: "Saída",
        button: "Registrar saída",
        modalTitle: "Registrar saída",
        description: "Registre o encerramento da sua jornada."
    }
];

let todayPoint = {
    entrada: null,
    intervalo: null,
    retorno: null,
    saida: null,
    documentos: [],
    observacoes: []
};

let pointHistory = [
    {
        date: "27/08/2026",
        entrada: "08:02",
        intervalo: "12:01",
        retorno: "13:00",
        saida: "17:08",
        worked: "8h 07min",
        status: "normal",
        statusLabel: "Normal",
        document: null
    },
    {
        date: "26/08/2026",
        entrada: "08:19",
        intervalo: "12:03",
        retorno: "13:04",
        saida: "17:13",
        worked: "7h 57min",
        status: "delay",
        statusLabel: "Atraso",
        document: null
    },
    {
        date: "25/08/2026",
        entrada: "07:55",
        intervalo: "12:00",
        retorno: "13:00",
        saida: "18:12",
        worked: "9h 17min",
        status: "overtime",
        statusLabel: "Hora extra",
        document: null
    },
    {
        date: "24/08/2026",
        entrada: "--",
        intervalo: "--",
        retorno: "--",
        saida: "--",
        worked: "0h 00min",
        status: "absence",
        statusLabel: "Falta justificada",
        document: "atestado-medico.pdf"
    },
    {
        date: "21/08/2026",
        entrada: "08:00",
        intervalo: "12:00",
        retorno: "13:00",
        saida: "17:00",
        worked: "8h 00min",
        status: "normal",
        statusLabel: "Normal",
        document: null
    }
];

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

function getInitials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) return "--";

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

function renderLoggedUser() {
    if (!loggedUser) return;

    setText(
        "userAvatar",
        getInitials(loggedUser.nome)
    );

    setText(
        "userName",
        loggedUser.nome || "Colaborador"
    );

    setText(
        "userRole",
        loggedUser.cargo ||
        loggedUser.setor ||
        "Colaborador"
    );
}

function updateClock() {
    const now = new Date();

    setText(
        "currentTime",
        now.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        )
    );

    setText(
        "currentDate",
        formatLongDate(now)
    );

    setText(
        "modalCurrentTime",
        now.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )
    );

    setText(
        "modalCurrentDate",
        formatLongDate(now)
    );
}

function formatLongDate(date) {
    const formatted = date.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

    return formatted.charAt(0).toUpperCase() +
        formatted.slice(1);
}

function getCurrentTime() {
    return new Date().toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function getNextPunch() {
    if (!todayPoint.entrada) {
        return punchTypes[0];
    }

    if (!todayPoint.intervalo) {
        return punchTypes[1];
    }

    if (!todayPoint.retorno) {
        return punchTypes[2];
    }

    if (!todayPoint.saida) {
        return punchTypes[3];
    }

    return null;
}

function renderTodayPoint() {
    renderTimelineItem(
        "timelineEntry",
        "entryTime",
        todayPoint.entrada
    );

    renderTimelineItem(
        "timelineBreak",
        "breakTime",
        todayPoint.intervalo
    );

    renderTimelineItem(
        "timelineReturn",
        "returnTime",
        todayPoint.retorno
    );

    renderTimelineItem(
        "timelineExit",
        "exitTime",
        todayPoint.saida
    );

    renderEntryStatus();
    renderNextPunch();
    renderWorkedHours();

    setText(
        "todayDocuments",
        todayPoint.documentos.length
    );
}

function renderTimelineItem(
    itemId,
    timeId,
    value
) {
    const item =
        document.getElementById(itemId);

    setText(
        timeId,
        value || "--:--"
    );

    if (!item) return;

    item.classList.toggle(
        "completed",
        Boolean(value)
    );

    const small =
        item.querySelector(
            ".timeline-content small"
        );

    if (
        small &&
        itemId !== "timelineEntry"
    ) {
        small.textContent =
            value
                ? "Registrado"
                : "Não registrado";
    }
}

function renderEntryStatus() {
    const timelineEntry =
        document.getElementById(
            "timelineEntry"
        );

    if (!todayPoint.entrada) {
        setText(
            "entryStatus",
            "Não registrado"
        );

        timelineEntry?.classList.remove(
            "delay"
        );

        return;
    }

    const delayed =
        isEntryDelayed(
            todayPoint.entrada
        );

    if (delayed) {
        setText(
            "entryStatus",
            "Entrada com atraso"
        );

        timelineEntry?.classList.add(
            "delay"
        );

        return;
    }

    setText(
        "entryStatus",
        "Registrado no horário"
    );

    timelineEntry?.classList.remove(
        "delay"
    );
}

function isEntryDelayed(time) {
    if (!time) return false;

    const [hour, minute] =
        time.split(":").map(Number);

    return hour > 8 ||
        (hour === 8 && minute > 10);
}

function renderNextPunch() {
    const next =
        getNextPunch();

    const button =
        document.getElementById(
            "registerPointButton"
        );

    if (!button) return;

    if (!next) {
        setText(
            "nextPunchText",
            "Jornada finalizada"
        );

        setText(
            "nextPunchDescription",
            "Todas as marcações do dia foram concluídas."
        );

        setText(
            "registerPointButtonText",
            "Ponto concluído"
        );

        button.disabled = true;

        setText(
            "daySituation",
            getTodaySituation()
        );

        setTodayBadge();

        return;
    }

    setText(
        "nextPunchText",
        next.label
    );

    setText(
        "nextPunchDescription",
        next.description
    );

    setText(
        "registerPointButtonText",
        next.button
    );

    button.disabled = false;

    if (!todayPoint.entrada) {
        setText(
            "daySituation",
            "Aguardando entrada"
        );
    } else {
        setText(
            "daySituation",
            "Jornada em andamento"
        );
    }

    setTodayBadge();
}

function setTodayBadge() {
    const badge =
        document.getElementById(
            "todayStatusBadge"
        );

    if (!badge) return;

    if (!todayPoint.entrada) {
        badge.className =
            "status-badge neutral";

        badge.textContent =
            "Não iniciado";

        return;
    }

    if (todayPoint.saida) {
        const overtime =
            calculateWorkedMinutes() > 480;

        badge.className =
            overtime
                ? "status-badge info"
                : "status-badge success";

        badge.textContent =
            overtime
                ? "Hora extra"
                : "Concluído";

        return;
    }

    if (
        isEntryDelayed(
            todayPoint.entrada
        )
    ) {
        badge.className =
            "status-badge warning";

        badge.textContent =
            "Atraso";
    } else {
        badge.className =
            "status-badge success";

        badge.textContent =
            "Em andamento";
    }
}

function getTodaySituation() {
    if (
        calculateWorkedMinutes() >
        480
    ) {
        return "Jornada com hora extra";
    }

    if (
        isEntryDelayed(
            todayPoint.entrada
        )
    ) {
        return "Jornada concluída com atraso";
    }

    return "Jornada concluída";
}

function calculateWorkedMinutes() {
    if (!todayPoint.entrada) {
        return 0;
    }

    let total = 0;

    const firstEnd =
        todayPoint.intervalo ||
        getCurrentTime();

    total += getMinutesDifference(
        todayPoint.entrada,
        firstEnd
    );

    if (todayPoint.retorno) {
        const secondEnd =
            todayPoint.saida ||
            getCurrentTime();

        total += getMinutesDifference(
            todayPoint.retorno,
            secondEnd
        );
    }

    return Math.max(
        0,
        total
    );
}

function getMinutesDifference(
    start,
    end
) {
    if (!start || !end) return 0;

    const [startHour, startMinute] =
        start.split(":").map(Number);

    const [endHour, endMinute] =
        end.split(":").map(Number);

    const startTotal =
        startHour * 60 +
        startMinute;

    const endTotal =
        endHour * 60 +
        endMinute;

    return Math.max(
        0,
        endTotal - startTotal
    );
}

function formatMinutes(minutes) {
    const safeMinutes =
        Math.max(
            0,
            Math.floor(
                Number(minutes) || 0
            )
        );

    const hours =
        Math.floor(
            safeMinutes / 60
        );

    const remaining =
        safeMinutes % 60;

    return `${hours}h ${String(
        remaining
    ).padStart(2, "0")}min`;
}

function renderWorkedHours() {
    const worked =
        calculateWorkedMinutes();

    const overtime =
        Math.max(
            0,
            worked - 480
        );

    const percentage =
        Math.min(
            100,
            Math.round(
                worked / 480 * 100
            )
        );

    setText(
        "todayWorkedHours",
        formatMinutes(worked)
    );

    setText(
        "todayOvertime",
        formatMinutes(overtime)
    );

    setText(
        "dailyProgressText",
        `${percentage}%`
    );

    const progress =
        document.getElementById(
            "dailyProgressBar"
        );

    if (progress) {
        progress.style.width =
            `${percentage}%`;
    }
}

function renderMonthlySummary() {
    const delays =
        pointHistory.filter(
            item =>
                item.status ===
                "delay"
        ).length;

    const absences =
        pointHistory.filter(
            item =>
                item.status ===
                "absence"
        ).length;

    let overtimeMinutes = 0;

    pointHistory.forEach(item => {
        if (
            item.status !==
            "overtime"
        ) {
            return;
        }

        overtimeMinutes +=
            parseWorkedMinutes(
                item.worked
            ) - 480;
    });

    setText(
        "monthlyDelays",
        delays
    );

    setText(
        "monthlyAbsences",
        absences
    );

    setText(
        "monthlyOvertime",
        formatMinutes(
            Math.max(
                overtimeMinutes,
                0
            )
        )
    );
}

function parseWorkedMinutes(value) {
    const match =
        String(value)
            .match(
                /(\d+)h\s*(\d+)min/
            );

    if (!match) return 0;

    return (
        Number(match[1]) * 60 +
        Number(match[2])
    );
}

function renderHistory() {
    const body =
        document.getElementById(
            "pointHistoryBody"
        );

    if (!body) return;

    if (!pointHistory.length) {
        body.innerHTML = `
            <tr>
                <td colspan="8">
                    Nenhum registro encontrado.
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML =
        pointHistory
            .map(item => `
                <tr>
                    <td>
                        ${item.date}
                    </td>

                    <td>
                        ${item.entrada}
                    </td>

                    <td>
                        ${item.intervalo}
                    </td>

                    <td>
                        ${item.retorno}
                    </td>

                    <td>
                        ${item.saida}
                    </td>

                    <td>
                        ${item.worked}
                    </td>

                    <td>
                        <span
                            class="history-status ${item.status}"
                        >
                            ${item.statusLabel}
                        </span>
                    </td>

                    <td>
                        ${
                            item.document
                                ? `
                                    <button
                                        type="button"
                                        class="document-button"
                                        data-document="${escapeHTML(
                                            item.document
                                        )}"
                                    >
                                        <i class="fa-solid fa-paperclip"></i>
                                        Ver
                                    </button>
                                `
                                : `
                                    <span class="no-document">
                                        -
                                    </span>
                                `
                        }
                    </td>
                </tr>
            `)
            .join("");

    body
        .querySelectorAll(
            "[data-document]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    openDocumentModal(
                        button.dataset.document
                    );
                }
            );
        });
}

function openPointModal() {
    const next =
        getNextPunch();

    if (!next) return;

    setText(
        "pointModalTitle",
        next.modalTitle
    );

    setText(
        "pointModalDescription",
        next.description
    );

    setText(
        "confirmPointButtonText",
        `Confirmar ${next.label.toLowerCase()}`
    );

    document
        .getElementById(
            "pointModal"
        )
        ?.classList.add(
            "show"
        );

    document
        .getElementById(
            "pointModal"
        )
        ?.setAttribute(
            "aria-hidden",
            "false"
        );

    updateClock();
}

function closePointModal() {
    const modal =
        document.getElementById(
            "pointModal"
        );

    modal?.classList.remove(
        "show"
    );

    modal?.setAttribute(
        "aria-hidden",
        "true"
    );

    clearPointForm();
}

function clearPointForm() {
    const observation =
        document.getElementById(
            "pointObservation"
        );

    const documentInput =
        document.getElementById(
            "pointDocument"
        );

    if (observation) {
        observation.value = "";
    }

    if (documentInput) {
        documentInput.value = "";
    }

    selectedDocument = null;

    setText(
        "documentFileName",
        "Anexar documento"
    );

    hideModalMessage();
}

function handleDocumentSelection() {
    const input =
        document.getElementById(
            "pointDocument"
        );

    const file =
        input?.files?.[0];

    if (!file) {
        selectedDocument = null;

        setText(
            "documentFileName",
            "Anexar documento"
        );

        return;
    }

    const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {
        showModalMessage(
            "Envie um documento em PDF, PNG ou JPG.",
            "error"
        );

        input.value = "";

        return;
    }

    if (
        file.size >
        10 * 1024 * 1024
    ) {
        showModalMessage(
            "O documento deve possuir no máximo 10 MB.",
            "error"
        );

        input.value = "";

        return;
    }

    selectedDocument = file;

    setText(
        "documentFileName",
        file.name
    );

    hideModalMessage();
}

function confirmPoint() {
    const next =
        getNextPunch();

    if (!next) return;

    const time =
        getCurrentTime();

    const observation =
        document
            .getElementById(
                "pointObservation"
            )
            ?.value
            .trim() || "";

    todayPoint[next.key] =
        time;

    if (observation) {
        todayPoint.observacoes.push({
            tipo: next.key,
            texto: observation
        });
    }

    if (selectedDocument) {
        todayPoint.documentos.push({
            tipo: next.key,
            nome: selectedDocument.name
        });
    }

    closePointModal();

    renderTodayPoint();

    showGlobalMessage(
        `${next.label} registrada às ${time}.`,
        "success"
    );
}

function openDocumentModal(name) {
    setText(
        "documentModalName",
        name || "Documento"
    );

    const modal =
        document.getElementById(
            "documentModal"
        );

    modal?.classList.add(
        "show"
    );

    modal?.setAttribute(
        "aria-hidden",
        "false"
    );
}

function closeDocumentModal() {
    const modal =
        document.getElementById(
            "documentModal"
        );

    modal?.classList.remove(
        "show"
    );

    modal?.setAttribute(
        "aria-hidden",
        "true"
    );
}

function showGlobalMessage(
    message,
    type = "info"
) {
    const element =
        document.getElementById(
            "globalMessage"
        );

    if (!element) return;

    element.textContent =
        message;

    element.className =
        `global-message show ${type}`;

    window.setTimeout(
        () => {
            element.textContent = "";
            element.className =
                "global-message";
        },
        4000
    );
}

function showModalMessage(
    message,
    type = "error"
) {
    const element =
        document.getElementById(
            "pointModalMessage"
        );

    if (!element) return;

    element.textContent =
        message;

    element.className =
        `modal-message ${type}`;
}

function hideModalMessage() {
    const element =
        document.getElementById(
            "pointModalMessage"
        );

    if (!element) return;

    element.textContent = "";
    element.className =
        "modal-message";
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}

function configureEvents() {
    document
        .getElementById(
            "registerPointButton"
        )
        ?.addEventListener(
            "click",
            openPointModal
        );

    document
        .getElementById(
            "closePointModalButton"
        )
        ?.addEventListener(
            "click",
            closePointModal
        );

    document
        .getElementById(
            "cancelPointButton"
        )
        ?.addEventListener(
            "click",
            closePointModal
        );

    document
        .getElementById(
            "confirmPointButton"
        )
        ?.addEventListener(
            "click",
            confirmPoint
        );

    document
        .getElementById(
            "pointDocument"
        )
        ?.addEventListener(
            "change",
            handleDocumentSelection
        );

    document
        .getElementById(
            "closeDocumentModalButton"
        )
        ?.addEventListener(
            "click",
            closeDocumentModal
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

    document
        .getElementById(
            "pointModal"
        )
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target.id ===
                    "pointModal"
                ) {
                    closePointModal();
                }
            }
        );

    document
        .getElementById(
            "documentModal"
        )
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target.id ===
                    "documentModal"
                ) {
                    closeDocumentModal();
                }
            }
        );

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key !==
                "Escape"
            ) {
                return;
            }

            closePointModal();
            closeDocumentModal();
        }
    );
}

function configureCurrentMonth() {
    const input =
        document.getElementById(
            "historyMonth"
        );

    if (!input) return;

    const now =
        new Date();

    input.value =
        `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;
}

function initializePointPage() {
    if (!validateSession()) {
        return;
    }

    renderLoggedUser();
    configureEvents();
    configureCurrentMonth();

    updateClock();
    renderTodayPoint();
    renderMonthlySummary();
    renderHistory();

    window.setInterval(
        () => {
            updateClock();

            if (
                todayPoint.entrada &&
                !todayPoint.saida
            ) {
                renderWorkedHours();
            }
        },
        1000
    );
}

initializePointPage();