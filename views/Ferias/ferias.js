// ==========================================================
// EVOLUA+
// FÉRIAS - FRONTEND DO COLABORADOR
// ==========================================================
//
// RESPONSABILIDADES:
//
// - validar sessão;
// - recuperar colaborador logado;
// - preencher sidebar;
// - buscar período de férias;
// - mostrar saldo e status;
// - calcular progresso do período aquisitivo;
// - carregar solicitações;
// - separar pendências e histórico;
// - abrir modal;
// - calcular quantidade de dias;
// - enviar solicitação;
// - realizar logout.
//
// ==========================================================



// ==========================================================
// SESSÃO
// ==========================================================

const accessToken =
  localStorage.getItem(
    "access_token"
  );


let currentUser =
  null;


// ==========================================================
// DADOS ATUAIS DE FÉRIAS
// ==========================================================

let currentVacationPeriod =
  null;


let currentAvailableDays =
  0;


let currentRequests =
  [];



// ==========================================================
// RECUPERAR USUÁRIO DO LOCALSTORAGE
// ==========================================================

try {

  const storedUser =
    localStorage.getItem(
      "usuario_logado"
    );


  if (storedUser) {

    currentUser =
      JSON.parse(
        storedUser
      );

  }

} catch (error) {

  console.error(
    "Erro ao recuperar usuário logado:",
    error
  );

}



// ==========================================================
// VALIDAR SESSÃO
// ==========================================================

function validateSession() {

  // ========================================================
  // SEM SESSÃO
  // ========================================================

  if (
    !accessToken ||
    !currentUser
  ) {

    window.location.href =
      "/login/";

    return false;

  }


  // ========================================================
  // ADMIN NÃO DEVE FICAR NA TELA DO COLABORADOR
  // ========================================================

  if (
    currentUser.perfil ===
      "admin_principal"
    ||
    currentUser.perfil ===
      "admin_setor"
  ) {

    window.location.href =
      "/admin/";

    return false;

  }


  // ========================================================
  // SOMENTE COLABORADOR
  // ========================================================

  if (
    currentUser.perfil !==
    "colaborador"
  ) {

    clearSession();


    window.location.href =
      "/login/";

    return false;

  }


  // ========================================================
  // USUÁRIO INATIVO
  // ========================================================

  if (
    currentUser.ativo ===
    false
  ) {

    clearSession();


    window.location.href =
      "/login/";

    return false;

  }


  return true;

}



// ==========================================================
// LIMPAR SESSÃO
// ==========================================================

function clearSession() {

  localStorage.removeItem(
    "access_token"
  );


  localStorage.removeItem(
    "usuario_logado"
  );

}



// ==========================================================
// HEADERS AUTENTICADOS
// ==========================================================

function getAuthHeaders(
  includeJson = false
) {

  const headers = {

    Authorization:
      `Bearer ${accessToken}`

  };


  if (includeJson) {

    headers[
      "Content-Type"
    ] =
      "application/json";

  }


  return headers;

}



// ==========================================================
// TRATAR SESSÃO EXPIRADA
// ==========================================================

function handleUnauthorized(
  response
) {

  if (
    response.status ===
    401
  ) {

    clearSession();


    alert(
      "Sua sessão expirou. Faça login novamente."
    );


    window.location.href =
      "/login/";


    return true;

  }


  return false;

}



// ==========================================================
// ESCAPAR HTML
// ==========================================================

function escapeHTML(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(
    value
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



// ==========================================================
// INICIAIS DO USUÁRIO
// ==========================================================

function getInitials(
  name
) {

  if (!name) {

    return "--";

  }


  return name

    .split(
      " "
    )

    .filter(
      word =>
        word.length > 0
    )

    .slice(
      0,
      2
    )

    .map(
      word =>
        word[0]
    )

    .join(
      ""
    )

    .toUpperCase();

}



// ==========================================================
// PREENCHER USUÁRIO NA SIDEBAR
// ==========================================================

function renderLoggedUser() {

  if (
    !currentUser
  ) {

    return;

  }


  const avatar =
    document.getElementById(
      "sidebarUserAvatar"
    );


  const name =
    document.getElementById(
      "sidebarUserName"
    );


  const sector =
    document.getElementById(
      "sidebarUserSector"
    );


  if (avatar) {

    avatar.textContent =
      getInitials(
        currentUser.nome
      );

  }


  if (name) {

    name.textContent =
      currentUser.nome ||
      "Colaborador";

  }


  if (sector) {

    sector.textContent =
      currentUser.setor ||
      "Setor não informado";

  }

}



// ==========================================================
// FORMATAR DATA
// ==========================================================
//
// Recebe:
//
// 2026-08-23
//
// Retorna:
//
// 23/08/2026
//
// ==========================================================

function formatDate(
  value
) {

  if (!value) {

    return "--";

  }


  const dateOnly =
    String(value)
      .substring(
        0,
        10
      );


  const parts =
    dateOnly.split(
      "-"
    );


  if (
    parts.length !==
    3
  ) {

    return value;

  }


  const [
    year,
    month,
    day
  ] =
    parts;


  return (
    `${day}/${month}/${year}`
  );

}



// ==========================================================
// CRIAR DATA LOCAL SEGURA
// ==========================================================

function createDateFromInput(
  value
) {

  if (!value) {

    return null;

  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date;

}



// ==========================================================
// CALCULAR DIAS ENTRE DUAS DATAS
// ==========================================================
//
// Incluímos o dia inicial e o dia final.
//
// Exemplo:
//
// 01/09 até 05/09
// = 5 dias.
//
// ==========================================================

function calculateDaysBetween(
  start,
  end
) {

  const startDate =
    createDateFromInput(
      start
    );


  const endDate =
    createDateFromInput(
      end
    );


  if (
    !startDate ||
    !endDate
  ) {

    return 0;

  }


  if (
    endDate <
    startDate
  ) {

    return 0;

  }


  const difference =
    endDate.getTime() -
    startDate.getTime();


  return (
    Math.floor(
      difference /
      86400000
    ) + 1
  );

}



// ==========================================================
// MOSTRAR MENSAGEM DA PÁGINA
// ==========================================================

function showPageMessage(
  message,
  type = "info"
) {

  const container =
    document.getElementById(
      "vacationPageMessage"
    );


  if (!container) {

    return;

  }


  container.textContent =
    message;


  container.className =
    `page-message ${type}`;

}



// ==========================================================
// LIMPAR MENSAGEM DA PÁGINA
// ==========================================================

function clearPageMessage() {

  const container =
    document.getElementById(
      "vacationPageMessage"
    );


  if (!container) {

    return;

  }


  container.textContent =
    "";


  container.className =
    "page-message";

}



// ==========================================================
// BUSCAR DADOS DE FÉRIAS
// ==========================================================

async function loadVacationData() {

  try {

    clearPageMessage();


    const response =
      await fetch(
        "/api/ferias/minhas",
        {

          method:
            "GET",

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
      await response.json();


    if (
      !response.ok
    ) {

      throw new Error(
        result.error ||
        "Não foi possível carregar suas férias."
      );

    }


    // ======================================================
    // ATUALIZAR USUÁRIO COM DADOS DO BACKEND
    // ======================================================

    if (
      result.usuario
    ) {

      currentUser =
        {

          ...currentUser,

          ...result.usuario

        };


      localStorage.setItem(
        "usuario_logado",
        JSON.stringify(
          currentUser
        )
      );


      renderLoggedUser();

    }


    // ======================================================
    // SEM PERÍODO CADASTRADO
    // ======================================================

    if (
      !result.periodo
    ) {

      currentVacationPeriod =
        null;


      currentAvailableDays =
        0;


      renderNoVacationPeriod();


      return;

    }


    // ======================================================
    // PERÍODO
    // ======================================================

    currentVacationPeriod =
      result.periodo;


    currentAvailableDays =
      Number(
        result.periodo
          .dias_disponiveis || 0
      );


    renderVacationPeriod(
      result.periodo
    );


  } catch (error) {

    console.error(
      "Erro ao carregar férias:",
      error
    );


    showPageMessage(
      error.message,
      "error"
    );


    disableVacationRequestButtons();

  }

}



// ==========================================================
// SEM PERÍODO CADASTRADO
// ==========================================================

function renderNoVacationPeriod() {

  setText(
    "availableDays",
    "0 dias"
  );


  setText(
    "availableDaysDescription",
    "Nenhum período de férias foi cadastrado."
  );


  setText(
    "usedDays",
    "0 dias"
  );


  setText(
    "expirationDate",
    "--"
  );


  setText(
    "vacationStatus",
    "Não cadastrado"
  );


  setText(
    "vacationStatusDescription",
    "A empresa ainda não cadastrou seu período aquisitivo."
  );


  setText(
    "periodStart",
    "--"
  );


  setText(
    "periodEnd",
    "--"
  );


  setText(
    "entitledDays",
    "0 dias"
  );


  setText(
    "periodUsedDays",
    "0 dias"
  );


  setText(
    "acquisitionProgressText",
    "0%"
  );


  setText(
    "acquisitionMessage",
    "Seu período aquisitivo ainda não foi cadastrado pela empresa."
  );


  setProgressBar(
    0
  );


  setPeriodBadge(
    "Não cadastrado",
    "neutral"
  );


  disableVacationRequestButtons();


  showPageMessage(
    "Seu período de férias ainda não foi cadastrado pelo administrador do seu setor.",
    "info"
  );

}



// ==========================================================
// RENDERIZAR PERÍODO
// ==========================================================

function renderVacationPeriod(
  periodo
) {

  const entitledDays =
    Number(
      periodo.dias_direito || 0
    );


  const usedDays =
    Number(
      periodo.dias_usados || 0
    );


  const availableDays =
    Number(
      periodo.dias_disponiveis || 0
    );


  // ========================================================
  // RESUMO
  // ========================================================

  setText(
    "availableDays",
    formatDays(
      availableDays
    )
  );


  setText(
    "usedDays",
    formatDays(
      usedDays
    )
  );


  setText(
    "expirationDate",
    formatDate(
      periodo.data_vencimento
    )
  );


  // ========================================================
  // PERÍODO
  // ========================================================

  setText(
    "periodStart",
    formatDate(
      periodo.periodo_inicio
    )
  );


  setText(
    "periodEnd",
    formatDate(
      periodo.periodo_fim
    )
  );


  setText(
    "entitledDays",
    formatDays(
      entitledDays
    )
  );


  setText(
    "periodUsedDays",
    formatDays(
      usedDays
    )
  );


  // ========================================================
  // STATUS
  // ========================================================

  renderVacationStatus(
    periodo
  );


  // ========================================================
  // PROGRESSO
  // ========================================================

  renderAcquisitionProgress(
    periodo
  );


  // ========================================================
  // BOTÕES
  // ========================================================

  if (
    periodo.periodo_concluido ===
      true
    &&
    availableDays > 0
  ) {

    enableVacationRequestButtons();


    setText(
      "availableDaysDescription",
      "Saldo disponível para solicitação."
    );

  } else {

    disableVacationRequestButtons();


    if (
      periodo.periodo_concluido !==
      true
    ) {

      setText(
        "availableDaysDescription",
        "O período aquisitivo ainda está em andamento."
      );

    } else {

      setText(
        "availableDaysDescription",
        "Seu saldo atual foi totalmente utilizado."
      );

    }

  }

}



// ==========================================================
// RENDERIZAR STATUS
// ==========================================================

function renderVacationStatus(
  periodo
) {

  const status =
    periodo.status_calculado ||
    periodo.status ||
    "";


  // ========================================================
  // EM AQUISIÇÃO
  // ========================================================

  if (
    status ===
    "em_aquisicao"
  ) {

    setText(
      "vacationStatus",
      "Em aquisição"
    );


    setText(
      "vacationStatusDescription",
      "Você ainda está completando o período aquisitivo."
    );


    setPeriodBadge(
      "Em aquisição",
      "warning"
    );


    return;

  }


  // ========================================================
  // DISPONÍVEL
  // ========================================================

  if (
    status ===
    "disponivel"
  ) {

    setText(
      "vacationStatus",
      "Disponível"
    );


    setText(
      "vacationStatusDescription",
      "Você já possui férias disponíveis para solicitação."
    );


    setPeriodBadge(
      "Disponível",
      "success"
    );


    return;

  }


  // ========================================================
  // UTILIZADO
  // ========================================================

  if (
    status ===
    "utilizado"
  ) {

    setText(
      "vacationStatus",
      "Utilizado"
    );


    setText(
      "vacationStatusDescription",
      "O saldo deste período foi utilizado."
    );


    setPeriodBadge(
      "Utilizado",
      "neutral"
    );


    return;

  }


  // ========================================================
  // FALLBACK
  // ========================================================

  setText(
    "vacationStatus",
    "Em análise"
  );


  setText(
    "vacationStatusDescription",
    "Verificando situação do período."
  );


  setPeriodBadge(
    "Em análise",
    "info"
  );

}



// ==========================================================
// PROGRESSO DO PERÍODO AQUISITIVO
// ==========================================================

function renderAcquisitionProgress(
  periodo
) {

  if (
    !periodo.periodo_inicio ||
    !periodo.periodo_fim
  ) {

    setProgressBar(
      0
    );


    setText(
      "acquisitionProgressText",
      "0%"
    );


    return;

  }


  const start =
    createDateFromInput(
      String(
        periodo.periodo_inicio
      ).substring(
        0,
        10
      )
    );


  const end =
    createDateFromInput(
      String(
        periodo.periodo_fim
      ).substring(
        0,
        10
      )
    );


  const today =
    new Date();


  if (
    !start ||
    !end
  ) {

    return;

  }


  // ========================================================
  // JÁ CONCLUÍDO
  // ========================================================

  if (
    periodo.periodo_concluido ===
    true
  ) {

    setProgressBar(
      100
    );


    setText(
      "acquisitionProgressText",
      "100%"
    );


    setText(
      "acquisitionMessage",
      "Período aquisitivo concluído."
    );


    return;

  }


  // ========================================================
  // AINDA NÃO COMEÇOU
  // ========================================================

  if (
    today <
    start
  ) {

    setProgressBar(
      0
    );


    setText(
      "acquisitionProgressText",
      "0%"
    );


    setText(
      "acquisitionMessage",
      `Seu período começa em ${formatDate(
        periodo.periodo_inicio
      )}.`
    );


    return;

  }


  // ========================================================
  // CALCULAR PERCENTUAL
  // ========================================================

  const total =
    end.getTime() -
    start.getTime();


  const elapsed =
    today.getTime() -
    start.getTime();


  let percentage =
    total > 0

      ? Math.floor(
          (
            elapsed /
            total
          ) * 100
        )

      : 0;


  percentage =
    Math.max(
      0,
      Math.min(
        percentage,
        100
      )
    );


  setProgressBar(
    percentage
  );


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



// ==========================================================
// BUSCAR SOLICITAÇÕES
// ==========================================================

async function loadVacationRequests() {

  try {

    const response =
      await fetch(
        "/api/ferias/solicitacoes",
        {

          method:
            "GET",

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
      await response.json();


    if (
      !response.ok
    ) {

      throw new Error(
        result.error ||
        "Não foi possível carregar suas solicitações."
      );

    }


    currentRequests =
      Array.isArray(
        result
      )
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



// ==========================================================
// RENDERIZAR SOLICITAÇÕES
// ==========================================================

function renderVacationRequests() {

  const pending =
    currentRequests.filter(
      request =>
        request.status ===
        "pendente"
    );


  const history =
    currentRequests.filter(
      request =>
        request.status !==
        "pendente"
    );


  renderPendingRequests(
    pending
  );


  renderVacationHistory(
    history
  );

}



// ==========================================================
// PENDÊNCIAS
// ==========================================================

function renderPendingRequests(
  requests
) {

  const tbody =
    document.getElementById(
      "pendingRequestsTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML =
    "";


  if (
    requests.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="empty-table"
        >

          Nenhuma solicitação em andamento.

        </td>

      </tr>

    `;


    return;

  }


  requests.forEach(
    request => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>

          ${formatDate(
            request.data_inicio
          )}

          até

          ${formatDate(
            request.data_fim
          )}

        </td>


        <td>

          ${formatDays(
            request.quantidade_dias
          )}

        </td>


        <td>

          ${formatDate(
            request.created_at
          )}

        </td>


        <td>

          <span
            class="
              status-badge
              warning
            "
          >

            Pendente

          </span>

        </td>


        <td>

          ${
            request.observacoes

              ? escapeHTML(
                  request.observacoes
                )

              : "—"
          }

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}



// ==========================================================
// HISTÓRICO
// ==========================================================

function renderVacationHistory(
  requests
) {

  const tbody =
    document.getElementById(
      "vacationHistoryTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML =
    "";


  if (
    requests.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="empty-table"
        >

          Nenhum histórico disponível.

        </td>

      </tr>

    `;


    return;

  }


  requests.forEach(
    request => {

      const row =
        document.createElement(
          "tr"
        );


      const statusData =
        getRequestStatusData(
          request.status
        );


      row.innerHTML = `

        <td>

          ${formatDate(
            request.data_inicio
          )}

          até

          ${formatDate(
            request.data_fim
          )}

        </td>


        <td>

          ${formatDays(
            request.quantidade_dias
          )}

        </td>


        <td>

          <span
            class="
              status-badge
              ${statusData.className}
            "
          >

            ${statusData.label}

          </span>

        </td>


        <td>

          ${
            request.data_avaliacao

              ? formatDate(
                  request.data_avaliacao
                )

              : "—"
          }

        </td>


        <td>

          ${
            request.observacao_admin

              ? escapeHTML(
                  request.observacao_admin
                )

              : "—"
          }

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}



// ==========================================================
// STATUS DE SOLICITAÇÃO
// ==========================================================

function getRequestStatusData(
  status
) {

  if (
    status ===
    "aprovada"
  ) {

    return {

      label:
        "Aprovada",

      className:
        "success"

    };

  }


  if (
    status ===
    "aprovada_com_ressalvas"
  ) {

    return {

      label:
        "Aprovada com ressalvas",

      className:
        "info"

    };

  }


  if (
    status ===
      "recusada"
    ||
    status ===
      "reprovada"
  ) {

    return {

      label:
        "Recusada",

      className:
        "danger"

    };

  }


  return {

    label:
      status || "Desconhecido",

    className:
      "neutral"

  };

}



// ==========================================================
// ERRO AO CARREGAR SOLICITAÇÕES
// ==========================================================

function renderRequestLoadError() {

  const pending =
    document.getElementById(
      "pendingRequestsTableBody"
    );


  const history =
    document.getElementById(
      "vacationHistoryTableBody"
    );


  if (pending) {

    pending.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="empty-table"
        >

          Não foi possível carregar as solicitações.

        </td>

      </tr>

    `;

  }


  if (history) {

    history.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="empty-table"
        >

          Não foi possível carregar o histórico.

        </td>

      </tr>

    `;

  }

}



// ==========================================================
// HABILITAR BOTÕES
// ==========================================================

function enableVacationRequestButtons() {

  const mainButton =
    document.getElementById(
      "openVacationRequestButton"
    );


  const secondaryButton =
    document.getElementById(
      "secondaryVacationRequestButton"
    );


  if (mainButton) {

    mainButton.disabled =
      false;

  }


  if (secondaryButton) {

    secondaryButton.disabled =
      false;

  }

}



// ==========================================================
// DESABILITAR BOTÕES
// ==========================================================

function disableVacationRequestButtons() {

  const mainButton =
    document.getElementById(
      "openVacationRequestButton"
    );


  const secondaryButton =
    document.getElementById(
      "secondaryVacationRequestButton"
    );


  if (mainButton) {

    mainButton.disabled =
      true;

  }


  if (secondaryButton) {

    secondaryButton.disabled =
      true;

  }

}



// ==========================================================
// ABRIR MODAL
// ==========================================================

function openVacationRequestModal() {

  if (
    currentAvailableDays <= 0
  ) {

    showPageMessage(
      "Você não possui saldo disponível para solicitar férias.",
      "info"
    );


    return;

  }


  const modal =
    document.getElementById(
      "vacationRequestModal"
    );


  const form =
    document.getElementById(
      "vacationRequestForm"
    );


  if (
    form
  ) {

    form.reset();

  }


  setText(
    "requestDays",
    "0 dias"
  );


  setText(
    "modalAvailableDays",
    formatDays(
      currentAvailableDays
    )
  );


  clearRequestMessage();


  if (
    modal
  ) {

    modal.classList.add(
      "show"
    );


    modal.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.style.overflow =
      "hidden";

  }

}



// ==========================================================
// FECHAR MODAL
// ==========================================================

function closeVacationRequestModal() {

  const modal =
    document.getElementById(
      "vacationRequestModal"
    );


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "auto";


  clearRequestMessage();

}



// ==========================================================
// CALCULAR DIAS DO PEDIDO
// ==========================================================

function updateRequestDays() {

  const startInput =
    document.getElementById(
      "requestStartDate"
    );


  const endInput =
    document.getElementById(
      "requestEndDate"
    );


  if (
    !startInput ||
    !endInput
  ) {

    return;

  }


  const days =
    calculateDaysBetween(
      startInput.value,
      endInput.value
    );


  setText(
    "requestDays",
    formatDays(
      days
    )
  );


  clearRequestMessage();


  // ========================================================
  // PERÍODO INVÁLIDO
  // ========================================================

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


  // ========================================================
  // SALDO INSUFICIENTE
  // ========================================================

  if (
    days >
    currentAvailableDays
  ) {

    showRequestMessage(
      `Você possui somente ${currentAvailableDays} dias disponíveis.`,
      "error"
    );

  }

}



// ==========================================================
// ENVIAR SOLICITAÇÃO
// ==========================================================

async function submitVacationRequest(
  event
) {

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


  const start =
    startInput
      ? startInput.value
      : "";


  const end =
    endInput
      ? endInput.value
      : "";


  const observation =
    observationInput
      ? observationInput.value.trim()
      : "";


  // ========================================================
  // CAMPOS
  // ========================================================

  if (
    !start ||
    !end
  ) {

    showRequestMessage(
      "Informe a data de início e a data de término.",
      "error"
    );


    return;

  }


  const days =
    calculateDaysBetween(
      start,
      end
    );


  // ========================================================
  // DATAS INVÁLIDAS
  // ========================================================

  if (
    days <= 0
  ) {

    showRequestMessage(
      "O período informado é inválido.",
      "error"
    );


    return;

  }


  // ========================================================
  // SALDO
  // ========================================================

  if (
    days >
    currentAvailableDays
  ) {

    showRequestMessage(
      `Você possui somente ${currentAvailableDays} dias disponíveis.`,
      "error"
    );


    return;

  }


  const originalText =
    submitText
      ? submitText.textContent
      : "Enviar solicitação";


  try {

    if (
      submitButton
    ) {

      submitButton.disabled =
        true;

    }


    if (
      submitText
    ) {

      submitText.textContent =
        "Enviando...";

    }


    const response =
      await fetch(
        "/api/ferias/solicitacoes",
        {

          method:
            "POST",

          headers:
            getAuthHeaders(
              true
            ),

          body:
            JSON.stringify({

              data_inicio:
                start,

              data_fim:
                end,

              observacoes:
                observation ||
                null

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
      await response.json();


    if (
      !response.ok
    ) {

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


    // ======================================================
    // RECARREGAR SOLICITAÇÕES
    // ======================================================

    await loadVacationRequests();


    setTimeout(
      () => {

        closeVacationRequestModal();

      },
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

    if (
      submitButton
    ) {

      submitButton.disabled =
        false;

    }


    if (
      submitText
    ) {

      submitText.textContent =
        originalText;

    }

  }

}



// ==========================================================
// MENSAGEM DO MODAL
// ==========================================================

function showRequestMessage(
  message,
  type
) {

  const container =
    document.getElementById(
      "vacationRequestMessage"
    );


  if (!container) {

    return;

  }


  container.textContent =
    message;


  container.className =
    `form-message ${type}`;

}



// ==========================================================
// LIMPAR MENSAGEM DO MODAL
// ==========================================================

function clearRequestMessage() {

  const container =
    document.getElementById(
      "vacationRequestMessage"
    );


  if (!container) {

    return;

  }


  container.textContent =
    "";


  container.className =
    "form-message";

}



// ==========================================================
// FUNÇÕES AUXILIARES
// ==========================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}



function formatDays(
  value
) {

  const number =
    Number(
      value || 0
    );


  return (
    `${number} ${
      number === 1
        ? "dia"
        : "dias"
    }`
  );

}



function setProgressBar(
  percentage
) {

  const bar =
    document.getElementById(
      "acquisitionProgressBar"
    );


  if (bar) {

    bar.style.width =
      `${percentage}%`;

  }

}



function setPeriodBadge(
  text,
  className
) {

  const badge =
    document.getElementById(
      "periodStatusBadge"
    );


  if (!badge) {

    return;

  }


  badge.textContent =
    text;


  badge.className =
    `status-badge ${className}`;

}



// ==========================================================
// EVENTOS
// ==========================================================

// ==========================================================
// BOTÃO PRINCIPAL
// ==========================================================

const openVacationRequestButton =
  document.getElementById(
    "openVacationRequestButton"
  );


if (
  openVacationRequestButton
) {

  openVacationRequestButton
    .addEventListener(
      "click",
      openVacationRequestModal
    );

}



// ==========================================================
// BOTÃO SECUNDÁRIO
// ==========================================================

const secondaryVacationRequestButton =
  document.getElementById(
    "secondaryVacationRequestButton"
  );


if (
  secondaryVacationRequestButton
) {

  secondaryVacationRequestButton
    .addEventListener(
      "click",
      openVacationRequestModal
    );

}



// ==========================================================
// FECHAR MODAL
// ==========================================================

const closeVacationRequestButton =
  document.getElementById(
    "closeVacationRequestModal"
  );


if (
  closeVacationRequestButton
) {

  closeVacationRequestButton
    .addEventListener(
      "click",
      closeVacationRequestModal
    );

}



// ==========================================================
// CANCELAR
// ==========================================================

const cancelVacationRequestButton =
  document.getElementById(
    "cancelVacationRequest"
  );


if (
  cancelVacationRequestButton
) {

  cancelVacationRequestButton
    .addEventListener(
      "click",
      closeVacationRequestModal
    );

}



// ==========================================================
// DATAS
// ==========================================================

const requestStartDate =
  document.getElementById(
    "requestStartDate"
  );


const requestEndDate =
  document.getElementById(
    "requestEndDate"
  );


if (
  requestStartDate
) {

  requestStartDate
    .addEventListener(
      "change",
      updateRequestDays
    );

}


if (
  requestEndDate
) {

  requestEndDate
    .addEventListener(
      "change",
      updateRequestDays
    );

}



// ==========================================================
// FORMULÁRIO
// ==========================================================

const vacationRequestForm =
  document.getElementById(
    "vacationRequestForm"
  );


if (
  vacationRequestForm
) {

  vacationRequestForm
    .addEventListener(
      "submit",
      submitVacationRequest
    );

}



// ==========================================================
// CLICAR FORA DO MODAL
// ==========================================================

const vacationRequestModal =
  document.getElementById(
    "vacationRequestModal"
  );


if (
  vacationRequestModal
) {

  vacationRequestModal
    .addEventListener(
      "click",
      event => {

        if (
          event.target ===
          vacationRequestModal
        ) {

          closeVacationRequestModal();

        }

      }
    );

}



// ==========================================================
// ESC
// ==========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeVacationRequestModal();

    }

  }
);



// ==========================================================
// LOGOUT
// ==========================================================

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


if (
  logoutButton
) {

  logoutButton
    .addEventListener(
      "click",
      () => {

        const confirmLogout =
          confirm(
            "Deseja sair do Evolua+?"
          );


        if (
          !confirmLogout
        ) {

          return;

        }


        clearSession();


        window.location.href =
          "/login/";

      }
    );

}



// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

async function initializeVacationPage() {

  console.log(
    "Iniciando tela de Férias..."
  );


  // ========================================================
  // SESSÃO
  // ========================================================

  const validSession =
    validateSession();


  if (
    !validSession
  ) {

    return;

  }


  // ========================================================
  // USUÁRIO
  // ========================================================

  renderLoggedUser();


  // ========================================================
  // DESABILITAR ENQUANTO CARREGA
  // ========================================================

  disableVacationRequestButtons();


  // ========================================================
  // FÉRIAS
  // ========================================================

  await loadVacationData();


  // ========================================================
  // SOLICITAÇÕES
  // ========================================================

  await loadVacationRequests();


  console.log(
    "Tela de Férias carregada."
  );

}



// ==========================================================
// INICIAR
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeVacationPage
);