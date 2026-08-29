const accessToken = localStorage.getItem("access_token");

let loggedUser = null;
let selectedDocument = null;
let currentSchedule = null;
let pointHistory = [];

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

let todayPoint = createEmptyPoint();

function createEmptyPoint() {
    return {
        id: null,
        data: null,
        entrada: null,
        intervalo: null,
        retorno: null,
        saida: null,
        horas_trabalhadas: 0,
        horas_extras: 0,
        atraso_entrada_minutos: 0,
        atraso_retorno_minutos: 0,
        status: "",
        documento_url: null,
        documento_nome: null,
        observacao_admin: null
    };
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
    if (response.status !== 401) {
        return false;
    }

    clearSession();

    alert(
        "Sua sessão expirou. Faça login novamente."
    );

    window.location.href = "/login/";

    return true;
}

async function getResponseData(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
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

function renderLoggedUser() {
    if (!loggedUser) {
        return;
    }

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
    const formatted =
        date.toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

    return (
        formatted.charAt(0).toUpperCase() +
        formatted.slice(1)
    );
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const parts =
        String(value)
            .substring(0, 10)
            .split("-");

    if (parts.length !== 3) {
        return String(value);
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getCurrentTime() {
    return new Date()
        .toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        );
}

function normalizeTime(value) {
    if (!value) {
        return null;
    }

    return String(value)
        .substring(0, 5);
}

function normalizeSchedule(schedule) {
    if (!schedule) {
        return null;
    }

    return {
        id:
            schedule.id || null,

        entrada_prevista:
            normalizeTime(
                schedule.entrada_prevista
            ),

        intervalo_inicio:
            normalizeTime(
                schedule.intervalo_inicio
            ),

        retorno_previsto:
            normalizeTime(
                schedule.retorno_previsto
            ),

        saida_prevista:
            normalizeTime(
                schedule.saida_prevista
            ),

        tolerancia_minutos:
            Number(
                schedule.tolerancia_minutos ??
                10
            )
    };
}

function mapApiPoint(point) {
    if (!point) {
        return createEmptyPoint();
    }

    return {
        id:
            point.id || null,

        data:
            point.data || null,

        entrada:
            normalizeTime(
                point.entrada
            ),

        intervalo:
            normalizeTime(
                point.intervalo
            ),

        retorno:
            normalizeTime(
                point.retorno
            ),

        saida:
            normalizeTime(
                point.saida
            ),

        horas_trabalhadas:
            Number(
                point.horas_trabalhadas ||
                0
            ),

        horas_extras:
            Number(
                point.horas_extras ||
                0
            ),

        atraso_entrada_minutos:
            Number(
                point.atraso_entrada_minutos ||
                0
            ),

        atraso_retorno_minutos:
            Number(
                point.atraso_retorno_minutos ||
                0
            ),

        status:
            point.status || "",

        documento_url:
            point.documento_url ||
            null,

        documento_nome:
            point.documento_nome ||
            null,

        observacao_admin:
            point.observacao_admin ||
            null
    };
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

async function loadTodayPoint(
    showError = true
) {
    try {
        const response =
            await fetch(
                `/api/ponto/${encodeURIComponent(
                    loggedUser.id
                )}`,
                {
                    method: "GET",
                    headers:
                        getAuthHeaders()
                }
            );

        if (
            handleUnauthorized(
                response
            )
        ) {
            return;
        }

        const result =
            await getResponseData(
                response
            );

        if (!response.ok) {
            throw new Error(
                result.error ||
                result.details ||
                "Não foi possível carregar o ponto de hoje."
            );
        }

        currentSchedule =
            normalizeSchedule(
                result.jornada
            );

        todayPoint =
            mapApiPoint(
                result.ponto
            );

        if (result.usuario) {
            loggedUser = {
                ...loggedUser,
                ...result.usuario
            };
        }

        syncHistoryWithToday();

        renderLoggedUser();
        renderTodayPoint();
        renderMonthlySummary();
        renderHistory();

    } catch (error) {
        console.error(
            "Erro ao carregar ponto:",
            error
        );

        todayPoint =
            createEmptyPoint();

        currentSchedule = null;
        pointHistory = [];

        renderTodayPoint();
        renderMonthlySummary();
        renderHistory();

        if (showError) {
            showGlobalMessage(
                error.message,
                "error"
            );
        }
    }
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
        todayPoint.documento_url
            ? 1
            : 0
    );
}

function renderTimelineItem(
    itemId,
    timeId,
    value
) {
    const item =
        document.getElementById(
            itemId
        );

    setText(
        timeId,
        value || "--:--"
    );

    if (!item) {
        return;
    }

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

function timeToMinutes(value) {
    if (!value) {
        return null;
    }

    const [
        hour,
        minute
    ] =
        String(value)
            .substring(0, 5)
            .split(":")
            .map(Number);

    if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute)
    ) {
        return null;
    }

    return (
        hour * 60 +
        minute
    );
}

function isEntryDelayed(time) {
    if (
        !time ||
        !currentSchedule?.entrada_prevista
    ) {
        return (
            Number(
                todayPoint
                    .atraso_entrada_minutos ||
                0
            ) > 0
        );
    }

    const expected =
        timeToMinutes(
            currentSchedule
                .entrada_prevista
        );

    const actual =
        timeToMinutes(time);

    const tolerance =
        Number(
            currentSchedule
                .tolerancia_minutos ??
            10
        );

    if (
        expected === null ||
        actual === null
    ) {
        return false;
    }

    return (
        actual >
        expected + tolerance
    );
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

        timelineEntry
            ?.classList
            .remove("delay");

        return;
    }

    if (
        isEntryDelayed(
            todayPoint.entrada
        )
    ) {
        setText(
            "entryStatus",
            "Entrada com atraso"
        );

        timelineEntry
            ?.classList
            .add("delay");

        return;
    }

    setText(
        "entryStatus",
        "Registrado no horário"
    );

    timelineEntry
        ?.classList
        .remove("delay");
}

function renderNextPunch() {
    const next =
        getNextPunch();

    const button =
        document.getElementById(
            "registerPointButton"
        );

    if (!button) {
        return;
    }

    if (!currentSchedule) {
        setText(
            "nextPunchText",
            "Jornada não configurada"
        );

        setText(
            "nextPunchDescription",
            "Solicite ao administrador a configuração da sua jornada."
        );

        setText(
            "registerPointButtonText",
            "Jornada não configurada"
        );

        setText(
            "daySituation",
            "Aguardando configuração"
        );

        button.disabled = true;

        setTodayBadge();

        return;
    }

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

        setText(
            "daySituation",
            getTodaySituation()
        );

        button.disabled = true;

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

    setText(
        "daySituation",
        todayPoint.entrada
            ? "Jornada em andamento"
            : "Aguardando entrada"
    );

    setTodayBadge();
}

function setTodayBadge() {
    const badge =
        document.getElementById(
            "todayStatusBadge"
        );

    if (!badge) {
        return;
    }

    if (!currentSchedule) {
        badge.className =
            "status-badge neutral";

        badge.textContent =
            "Sem jornada";

        return;
    }

    if (!todayPoint.entrada) {
        badge.className =
            "status-badge neutral";

        badge.textContent =
            "Não iniciado";

        return;
    }

    if (todayPoint.saida) {
        const status =
            String(
                todayPoint.status ||
                ""
            ).toLowerCase();

        if (status === "delay") {
            badge.className =
                "status-badge warning";

            badge.textContent =
                "Atraso";

            return;
        }

        if (
            status === "overtime" ||
            Number(
                todayPoint
                    .horas_extras ||
                0
            ) > 0
        ) {
            badge.className =
                "status-badge info";

            badge.textContent =
                "Hora extra";

            return;
        }

        badge.className =
            "status-badge success";

        badge.textContent =
            "Concluído";

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
    const status =
        String(
            todayPoint.status ||
            ""
        ).toLowerCase();

    if (status === "delay") {
        return "Jornada concluída com atraso";
    }

    if (
        status === "overtime" ||
        Number(
            todayPoint
                .horas_extras ||
            0
        ) > 0
    ) {
        return "Jornada com hora extra";
    }

    if (status === "incomplete") {
        return "Jornada incompleta";
    }

    return "Jornada concluída";
}

function getMinutesDifference(
    start,
    end
) {
    const startMinutes =
        timeToMinutes(start);

    const endMinutes =
        timeToMinutes(end);

    if (
        startMinutes === null ||
        endMinutes === null
    ) {
        return 0;
    }

    return Math.max(
        0,
        endMinutes -
        startMinutes
    );
}

function calculateWorkedMinutes() {
    if (!todayPoint.entrada) {
        return 0;
    }

    let total = 0;

    const firstEnd =
        todayPoint.intervalo ||
        getCurrentTime();

    total +=
        getMinutesDifference(
            todayPoint.entrada,
            firstEnd
        );

    if (todayPoint.retorno) {
        const secondEnd =
            todayPoint.saida ||
            getCurrentTime();

        total +=
            getMinutesDifference(
                todayPoint.retorno,
                secondEnd
            );
    }

    return Math.max(
        0,
        total
    );
}

function getExpectedWorkMinutes() {
    if (!currentSchedule) {
        return 0;
    }

    return (
        getMinutesDifference(
            currentSchedule
                .entrada_prevista,
            currentSchedule
                .intervalo_inicio
        ) +
        getMinutesDifference(
            currentSchedule
                .retorno_previsto,
            currentSchedule
                .saida_prevista
        )
    );
}

function formatMinutes(minutes) {
    const safeMinutes =
        Math.max(
            0,
            Math.floor(
                Number(minutes) ||
                0
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

function decimalHoursToMinutes(value) {
    return Math.round(
        Number(value || 0) *
        60
    );
}

function renderWorkedHours() {
    const calculatedWorked =
        calculateWorkedMinutes();

    const worked =
        todayPoint.saida
            ? decimalHoursToMinutes(
                todayPoint
                    .horas_trabalhadas
            )
            : calculatedWorked;

    const expected =
        getExpectedWorkMinutes();

    const overtime =
        todayPoint.saida
            ? decimalHoursToMinutes(
                todayPoint
                    .horas_extras
            )
            : Math.max(
                0,
                worked - expected
            );

    const percentage =
        expected > 0
            ? Math.min(
                100,
                Math.round(
                    worked /
                    expected *
                    100
                )
            )
            : 0;

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

function syncHistoryWithToday() {
    pointHistory = [];

    if (!todayPoint.id) {
        return;
    }

    const status =
        getPointStatusData(
            todayPoint
        );

    pointHistory.push({
        date:
            formatDate(
                todayPoint.data
            ),

        entrada:
            todayPoint.entrada ||
            "--",

        intervalo:
            todayPoint.intervalo ||
            "--",

        retorno:
            todayPoint.retorno ||
            "--",

        saida:
            todayPoint.saida ||
            "--",

        worked:
            formatMinutes(
                decimalHoursToMinutes(
                    todayPoint
                        .horas_trabalhadas
                )
            ),

        overtimeMinutes:
            decimalHoursToMinutes(
                todayPoint
                    .horas_extras
            ),

        status:
            status.className,

        statusLabel:
            status.label,

        document:
            todayPoint
                .documento_url,

        documentName:
            todayPoint
                .documento_nome ||
            "Documento anexado"
    });
}

function getPointStatusData(point) {
    const status =
        String(
            point.status ||
            ""
        ).toLowerCase();

    if (status === "absence") {
        return {
            className: "absence",
            label: "Falta"
        };
    }

    if (
        status === "delay" ||
        Number(
            point
                .atraso_entrada_minutos ||
            0
        ) > 0 ||
        Number(
            point
                .atraso_retorno_minutos ||
            0
        ) > 0
    ) {
        return {
            className: "delay",
            label: "Atraso"
        };
    }

    if (
        status === "overtime" ||
        Number(
            point.horas_extras ||
            0
        ) > 0
    ) {
        return {
            className: "overtime",
            label: "Hora extra"
        };
    }

    if (status === "incomplete") {
        return {
            className: "incomplete",
            label: "Incompleto"
        };
    }

    return {
        className: "normal",
        label: "Normal"
    };
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

    const overtimeMinutes =
        pointHistory.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item
                        .overtimeMinutes ||
                    0
                ),
            0
        );

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
            overtimeMinutes
        )
    );
}

function renderHistory() {
    const body =
        document.getElementById(
            "pointHistoryBody"
        );

    if (!body) {
        return;
    }

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
            .map(
                item => `
                    <tr>

                        <td>
                            ${escapeHTML(
                                item.date
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.entrada
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.intervalo
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.retorno
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.saida
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                item.worked
                            )}
                        </td>

                        <td>
                            <span
                                class="
                                    history-status
                                    ${escapeHTML(
                                        item.status
                                    )}
                                "
                            >
                                ${escapeHTML(
                                    item.statusLabel
                                )}
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
                                            data-document-name="${escapeHTML(
                                                item.documentName
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
                `
            )
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
                        button.dataset
                            .documentName ||
                        "Documento",

                        button.dataset
                            .document
                    );
                }
            );
        });
}

function openPointModal() {
    const next =
        getNextPunch();

    if (
        !next ||
        !currentSchedule
    ) {
        return;
    }

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
        ?.classList
        .add("show");

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

    modal
        ?.classList
        .remove("show");

    modal
        ?.setAttribute(
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
        selectedDocument = null;

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
        selectedDocument = null;

        return;
    }

    selectedDocument = file;

    setText(
        "documentFileName",
        file.name
    );

    hideModalMessage();
}

async function confirmPoint() {
    const next =
        getNextPunch();

    if (!next) {
        return;
    }

    if (!currentSchedule) {
        showModalMessage(
            "Sua jornada ainda não foi configurada pelo administrador.",
            "error"
        );

        return;
    }

    const button =
        document.getElementById(
            "confirmPointButton"
        );

    const original =
        button?.innerHTML;

    if (button) {
        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Registrando...
        `;
    }

    hideModalMessage();

    try {
        const response =
            await fetch(
                "/api/ponto",
                {
                    method: "POST",

                    headers:
                        getAuthHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            tipo:
                                next.key
                        })
                }
            );

        if (
            handleUnauthorized(
                response
            )
        ) {
            return;
        }

        const result =
            await getResponseData(
                response
            );

        if (!response.ok) {
            throw new Error(
                result.error ||
                result.details ||
                "Não foi possível registrar o ponto."
            );
        }

        todayPoint =
            mapApiPoint(
                result.ponto
            );

        currentSchedule =
            normalizeSchedule(
                result.jornada
            ) ||
            currentSchedule;

        syncHistoryWithToday();

        closePointModal();

        renderTodayPoint();
        renderMonthlySummary();
        renderHistory();

        const registeredTime =
            todayPoint[next.key] ||
            getCurrentTime();

        showGlobalMessage(
            `${next.label} registrada às ${registeredTime} e salva com sucesso.`,
            "success"
        );

    } catch (error) {
        console.error(
            "Erro ao registrar ponto:",
            error
        );

        showModalMessage(
            error.message,
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;

            button.innerHTML =
                original;
        }
    }
}

function openDocumentModal(
    name,
    url = null
) {
    setText(
        "documentModalName",
        name || "Documento"
    );

    const modal =
        document.getElementById(
            "documentModal"
        );

    modal
        ?.classList
        .add("show");

    modal
        ?.setAttribute(
            "aria-hidden",
            "false"
        );

    if (url) {
        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    }
}

function closeDocumentModal() {
    const modal =
        document.getElementById(
            "documentModal"
        );

    modal
        ?.classList
        .remove("show");

    modal
        ?.setAttribute(
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

    if (!element) {
        return;
    }

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
        4500
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

    if (!element) {
        return;
    }

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

    if (!element) {
        return;
    }

    element.textContent = "";

    element.className =
        "modal-message";
}

function escapeHTML(value) {
    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
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
            "historyMonth"
        )
        ?.addEventListener(
            "change",
            () => {
                renderMonthlySummary();
                renderHistory();
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

    if (!input) {
        return;
    }

    const now =
        new Date();

    input.value =
        `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;
}

async function initializePointPage() {
    if (!validateSession()) {
        return;
    }

    renderLoggedUser();

    configureEvents();

    configureCurrentMonth();

    updateClock();

    await loadTodayPoint();

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