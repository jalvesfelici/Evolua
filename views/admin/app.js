const SECTORS = [
  "Operacional",
  "Logística",
  "Administrativo",
  "Tecnologia",
  "RH",
  "Financeiro",
  "Marketing"
];

const VACATION_DEFAULT_DAYS = 30;
const accessToken = localStorage.getItem("access_token");

let loggedAdmin = null;

try {
  const storedUser = localStorage.getItem("usuario_logado");

  if (storedUser) {
    loggedAdmin = JSON.parse(storedUser);
  }
} catch (error) {
  console.error(
    "Erro ao recuperar usuário salvo:",
    error
  );
}

let employees = [];
let courses = [];
let vacationRequests = [];
let evaluations = [];
let feedbackRequests = [];
let sentFeedbacks = [];
let feedbackEmployees = [];
let pointRecords = [];

let currentFeedback = null;
let currentVacationRequest = null;
let currentEvaluation = null;
let currentPointRecord = null;
let currentEditedEmployee = null;
let currentWorkScheduleEmployee = null;
let coursePendingRemoval = null;
let userPendingRemoval = null;

let temporaryActivities = [];
let currentUserCreationProfile = "colaborador";
let activeFeedbackAdminTab = "requests";

function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("usuario_logado");
}

function validateSession() {
  if (!accessToken || !loggedAdmin) {
    window.location.href = "/login/";
    return false;
  }

  if (
    ![
      "admin_principal",
      "admin_setor"
    ].includes(loggedAdmin.perfil)
  ) {
    window.location.href = "/dashboard/";
    return false;
  }

  if (loggedAdmin.ativo === false) {
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

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const parts = String(value)
    .substring(0, 10)
    .split("-");

  return parts.length === 3
    ? `${parts[2]}/${parts[1]}/${parts[0]}`
    : String(value);
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );
}

function truncateText(
  value,
  limit = 180
) {
  const text = String(value || "").trim();

  return text.length <= limit
    ? text
    : `${text.substring(0, limit)}...`;
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

  element.textContent = message;

  element.className =
    `global-message show ${type}`;

  window.setTimeout(
    () => {
      element.className =
        "global-message";

      element.textContent = "";
    },
    4500
  );
}

function setCounterValue(
  elementId,
  value
) {
  const element =
    document.getElementById(
      elementId
    );

  if (element) {
    element.textContent =
      String(value);
  }
}

function openModal(modalId) {
  const modal =
    document.getElementById(
      modalId
    );

  if (!modal) {
    return;
  }

  modal.classList.add("show");

  document.body.classList.add(
    "modal-open"
  );
}

function closeModal(modalId) {
  const modal =
    document.getElementById(
      modalId
    );

  if (!modal) {
    return;
  }

  modal.classList.remove("show");

  if (
    !document.querySelector(
      ".modal-overlay.show"
    )
  ) {
    document.body.classList.remove(
      "modal-open"
    );
  }

  if (modalId === "evaluationModal") {
    currentEvaluation = null;
  }

  if (
    modalId ===
    "vacationDecisionModal"
  ) {
    currentVacationRequest = null;
  }

  if (
    [
      "feedbackRequestDetailsModal",
      "sentFeedbackDetailsModal",
      "answerFeedbackRequestModal"
    ].includes(modalId)
  ) {
    currentFeedback = null;
  }

  if (modalId === "pointEditModal") {
    currentPointRecord = null;
  }

  if (modalId === "userDeleteModal") {
    userPendingRemoval = null;
  }

  if (modalId === "employeeEditModal") {
    currentEditedEmployee = null;
  }

  if (modalId === "workScheduleModal") {
    currentWorkScheduleEmployee = null;
  }
}

document
  .querySelectorAll(
    ".modal-overlay"
  )
  .forEach(modal => {
    modal.addEventListener(
      "click",
      event => {
        if (event.target === modal) {
          closeModal(modal.id);
        }
      }
    );
  });

document.addEventListener(
  "keydown",
  event => {
    if (event.key !== "Escape") {
      return;
    }

    const openedModal =
      document.querySelector(
        ".modal-overlay.show"
      );

    if (openedModal) {
      closeModal(openedModal.id);
    }
  }
);

function renderLoggedAdmin() {
  if (!loggedAdmin) {
    return;
  }

  const values = {
    adminName:
      loggedAdmin.nome ||
      "Administrador",

    adminRole:
      loggedAdmin.cargo ||
      (
        loggedAdmin.perfil ===
        "admin_principal"
          ? "Administrador Principal"
          : "Administrador"
      ),

    adminAvatar:
      getInitials(
        loggedAdmin.nome
      ),

    adminSector:
      loggedAdmin.setor ||
      "Setor não definido",

    vacationAdminSector:
      loggedAdmin.setor || "-",

    feedbackAdminSector:
      loggedAdmin.setor || "-",

    courseAdminSector:
      loggedAdmin.setor ||
      "Setor não definido"
  };

  Object.entries(values)
    .forEach(
      ([id, value]) => {
        const element =
          document.getElementById(id);

        if (element) {
          element.textContent = value;
        }
      }
    );
}

function configureAdminPermissions() {
  if (
    loggedAdmin?.perfil ===
    "admin_principal"
  ) {
    return;
  }

  document
    .querySelectorAll(
      `[onclick*="openUserModal('admin_setor')"]`
    )
    .forEach(
      button => {
        button.style.display = "none";
      }
    );
}

const pageData = {
  dashboard: {
    title: "Visão Geral",
    subtitle:
      "Acompanhe as principais informações do seu setor."
  },

  employees: {
    title: "Funcionários",
    subtitle:
      "Gerencie os colaboradores cadastrados no seu setor."
  },

  vacations: {
    title: "Férias",
    subtitle:
      "Analise as solicitações de férias dos seus colaboradores."
  },

  trainings: {
    title: "Treinamentos",
    subtitle:
      "Crie e gerencie os treinamentos disponibilizados pelo seu setor."
  },

  evaluations: {
    title: "Avaliações",
    subtitle:
      "Analise as atividades enviadas pelos colaboradores."
  },

  feedbacks: {
    title: "Feedbacks",
    subtitle:
      "Envie feedbacks e responda às solicitações dos colaboradores do seu setor."
  },

  point: {
    title: "Ponto",
    subtitle:
      "Consulte e corrija os registros de ponto dos colaboradores do seu setor."
  }
};

function changePage(pageName) {
  const data = pageData[pageName];

  if (!data) {
    return;
  }

  document
    .querySelectorAll(
      ".page-section"
    )
    .forEach(
      page => {
        page.classList.remove(
          "active-page"
        );
      }
    );

  document
    .querySelectorAll(
      ".menu-item[data-page]"
    )
    .forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset.page ===
            pageName
        );
      }
    );

  document
    .getElementById(
      `${pageName}Page`
    )
    ?.classList
    .add("active-page");

  const title =
    document.getElementById(
      "pageTitle"
    );

  const subtitle =
    document.getElementById(
      "pageSubtitle"
    );

  if (title) {
    title.textContent =
      data.title;
  }

  if (subtitle) {
    subtitle.textContent =
      data.subtitle;
  }

  if (pageName === "vacations") {
    loadVacationRequests();
  }

  if (pageName === "trainings") {
    loadCourses();
  }

  if (pageName === "evaluations") {
    loadEvaluations();
  }

  if (pageName === "feedbacks") {
    loadFeedbacksAdmin();
  }

  if (pageName === "point") {
    loadPointRecords();
  }
}

document
  .querySelectorAll(
    ".menu-item[data-page]"
  )
  .forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          changePage(
            button.dataset.page
          );
        }
      );
    }
  );

function mapApiEmployee(employee) {
  const schedule =
    employee.jornada ||
    employee.jornada_ponto ||
    employee.work_schedule ||
    {};

  return {
    id: employee.id,
    name: employee.nome || "",
    registration:
      employee.matricula || "",
    email: employee.email || "",
    role: employee.cargo || "",
    sector: employee.setor || "",
    profile:
      employee.perfil ||
      "colaborador",
    active:
      employee.ativo !== false,
    status:
      employee.ativo === false
        ? "Inativo"
        : "Ativo",

    schedule: {
      entry:
        schedule.entrada_prevista ||
        schedule.entrada ||
        "",
      breakTime:
        schedule.intervalo_inicio ||
        schedule.inicio_intervalo ||
        schedule.intervalo ||
        "",
      returnTime:
        schedule.retorno_previsto ||
        schedule.retorno ||
        "",
      exit:
        schedule.saida_prevista ||
        schedule.saida ||
        "",
      tolerance:
        Number(
          schedule.tolerancia_minutos ??
          schedule.tolerancia ??
          10
        ),
      configured:
        Boolean(
          schedule.id ||
          schedule.entrada_prevista ||
          schedule.entrada
        )
    }
  };
}

function canManageEmployee(employee) {
  return Boolean(
    employee &&
    employee.profile === "colaborador" &&
    employee.active &&
    employee.sector === loggedAdmin?.setor &&
    String(employee.id) !==
      String(loggedAdmin?.id)
  );
}

function getScheduleSummary(employee) {
  const schedule =
    employee?.schedule || {};

  if (
    !schedule.configured ||
    !schedule.entry ||
    !schedule.exit
  ) {
    return `
      <div class="work-schedule-summary unconfigured">
        <strong>Não configurada</strong>
        <span>Defina a jornada</span>
      </div>
    `;
  }

  return `
    <div class="work-schedule-summary">
      <strong>
        ${escapeHTML(schedule.entry)}
        -
        ${escapeHTML(schedule.exit)}
      </strong>

      <span>
        Intervalo:
        ${escapeHTML(
          schedule.breakTime || "--:--"
        )}
        -
        ${escapeHTML(
          schedule.returnTime || "--:--"
        )}
      </span>
    </div>
  `;
}

async function loadEmployees() {
  const tbody =
    document.getElementById(
      "employeesTableBody"
    );

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="table-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Carregando funcionários...
          </div>
        </td>
      </tr>
    `;
  }

  try {
    const response =
      await fetch(
        "/api/usuarios",
        {
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
        "Não foi possível carregar os funcionários."
      );
    }

    employees =
      (
        Array.isArray(result)
          ? result
          : result.usuarios || []
      ).map(mapApiEmployee);

    await loadWorkSchedules(false);

    renderEmployees();
    populatePointEmployeeFilter();
    updateDashboardCounters();

  } catch (error) {
    console.error(
      "Erro ao carregar funcionários:",
      error
    );

    employees = [];

    renderEmployees();
    updateDashboardCounters();

    showGlobalMessage(
      error.message,
      "error"
    );
  }
}

function canDeleteUser(employee) {
  return canManageEmployee(employee);
}

function renderEmployees() {
  const tbody =
    document.getElementById(
      "employeesTableBody"
    );

  if (!tbody) {
    return;
  }

  const search =
    document
      .getElementById(
        "employeeSearch"
      )
      ?.value
      ?.trim()
      ?.toLowerCase() || "";

  const filtered =
    employees.filter(
      employee => {
        if (!search) {
          return true;
        }

        return [
          employee.name,
          employee.registration,
          employee.email,
          employee.role,
          employee.sector
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      }
    );

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="table-loading">
            Nenhum funcionário encontrado.
          </div>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    filtered
      .map(
        employee => `
          <tr>

            <td>
              <div class="employee-cell">

                <div class="table-avatar">
                  ${escapeHTML(
                    getInitials(
                      employee.name
                    )
                  )}
                </div>

                <strong>
                  ${escapeHTML(
                    employee.name
                  )}
                </strong>

              </div>
            </td>

            <td>
              ${escapeHTML(
                employee.registration
              )}
            </td>

            <td>
              ${escapeHTML(
                employee.email
              )}
            </td>

            <td>
              ${escapeHTML(
                employee.role
              )}
            </td>

            <td>
              ${escapeHTML(
                employee.sector
              )}
            </td>

            <td class="work-schedule-cell">
              ${getScheduleSummary(employee)}
            </td>

            <td>
              <span
                class="
                  status-badge
                  ${
                    employee.active
                      ? "success"
                      : "danger"
                  }
                "
              >
                ${escapeHTML(
                  employee.status
                )}
              </span>
            </td>

            <td>
              <div class="employee-actions">

                ${
                  canManageEmployee(employee)
                    ? `
                      <button
                        type="button"
                        class="table-action edit-action"
                        title="Editar funcionário"
                        onclick="
                          openEmployeeEditModal(
                            '${employee.id}'
                          )
                        "
                      >
                        <i class="fa-solid fa-user-pen"></i>
                      </button>

                      <button
                        type="button"
                        class="table-action schedule-action"
                        title="Configurar jornada"
                        onclick="
                          openWorkScheduleModal(
                            '${employee.id}'
                          )
                        "
                      >
                        <i class="fa-solid fa-business-time"></i>
                      </button>

                      <button
                        type="button"
                        class="table-action vacation-action"
                        title="Configurar férias"
                        onclick="
                          openVacationPeriodModal(
                            '${employee.id}'
                          )
                        "
                      >
                        <i class="fa-solid fa-umbrella-beach"></i>
                      </button>
                    `
                    : ""
                }

                ${
                  canDeleteUser(employee)
                    ? `
                      <button
                        type="button"
                        class="table-action delete-action"
                        title="Excluir usuário"
                        onclick="
                          openUserDeleteModal(
                            '${employee.id}'
                          )
                        "
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    `
                    : ""
                }

              </div>
            </td>

          </tr>
        `
      )
      .join("");
}

document
  .getElementById(
    "employeeSearch"
  )
  ?.addEventListener(
    "input",
    renderEmployees
  );

function populateSectorSelects() {
  const select =
    document.getElementById(
      "employeeSector"
    );

  if (!select) {
    return;
  }

  select.innerHTML =
    SECTORS
      .map(
        sector => `
          <option
            value="${escapeHTML(sector)}"
          >
            ${escapeHTML(sector)}
          </option>
        `
      )
      .join("");
}

function openUserModal(
  profile = "colaborador"
) {
  if (
    profile === "admin_setor" &&
    loggedAdmin?.perfil !==
      "admin_principal"
  ) {
    showGlobalMessage(
      "Somente o administrador principal pode criar administradores de setor.",
      "error"
    );

    return;
  }

  currentUserCreationProfile =
    profile;

  const form =
    document.getElementById(
      "employeeForm"
    );

  const title =
    document.getElementById(
      "employeeModalTitle"
    );

  const description =
    document.getElementById(
      "employeeModalDescription"
    );

  const icon =
    document.getElementById(
      "employeeModalIcon"
    );

  const sector =
    document.getElementById(
      "employeeSector"
    );

  const profileInput =
    document.getElementById(
      "employeeProfile"
    );

  form?.reset();

  if (profileInput) {
    profileInput.value =
      profile;
  }

  if (
    profile ===
    "admin_setor"
  ) {
    if (title) {
      title.textContent =
        "Novo administrador";
    }

    if (description) {
      description.textContent =
        "Crie um administrador e defina o setor pelo qual ele será responsável.";
    }

    if (icon) {
      icon.className =
        "fa-solid fa-user-shield";
    }

    if (sector) {
      sector.disabled = false;
    }

  } else {
    if (title) {
      title.textContent =
        "Novo funcionário";
    }

    if (description) {
      description.textContent =
        "Cadastre um colaborador para o seu próprio setor.";
    }

    if (icon) {
      icon.className =
        "fa-solid fa-user-plus";
    }

    if (sector) {
      sector.value =
        loggedAdmin?.setor || "";

      sector.disabled = true;
    }
  }

  openModal("employeeModal");
}

async function createEmployee(event) {
  event.preventDefault();

  const button =
    document.getElementById(
      "employeeSubmitButton"
    );

  if (button?.disabled) {
    return;
  }

  if (
    currentUserCreationProfile ===
      "admin_setor" &&
    loggedAdmin?.perfil !==
      "admin_principal"
  ) {
    alert(
      "Você não possui permissão para criar administradores."
    );

    return;
  }

  const payload = {
    nome:
      document
        .getElementById(
          "employeeName"
        )
        .value
        .trim(),

    matricula:
      document
        .getElementById(
          "employeeRegistration"
        )
        .value
        .trim(),

    email:
      document
        .getElementById(
          "employeeEmail"
        )
        .value
        .trim()
        .toLowerCase(),

    senha:
      document
        .getElementById(
          "employeePassword"
        )
        .value,

    cargo:
      document
        .getElementById(
          "employeeRole"
        )
        .value
        .trim(),

    setor:
      currentUserCreationProfile ===
      "colaborador"
        ? loggedAdmin.setor
        : document
            .getElementById(
              "employeeSector"
            )
            .value,

    perfil:
      currentUserCreationProfile
  };

  if (
    !payload.nome ||
    !payload.matricula ||
    !payload.email ||
    !payload.senha ||
    !payload.cargo ||
    !payload.setor
  ) {
    alert(
      "Preencha todos os campos."
    );

    return;
  }

  if (
    payload.senha.length < 6
  ) {
    alert(
      "A senha inicial deve possuir pelo menos 6 caracteres."
    );

    return;
  }

  const original =
    button.innerHTML;

  button.disabled = true;

  button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Criando...
  `;

  try {
    const response =
      await fetch(
        "/api/usuarios",
        {
          method: "POST",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify(
              payload
            )
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
      let message =
        result.error ||
        result.details ||
        "Não foi possível criar o usuário.";

      if (
        /already|email_exists/i
          .test(
            String(message)
          )
      ) {
        message =
          "Já existe um usuário cadastrado com este e-mail.";
      }

      throw new Error(message);
    }

    closeModal(
      "employeeModal"
    );

    await loadEmployees();

    showGlobalMessage(
      result.message ||
      "Usuário criado com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao criar usuário:",
      error
    );

    alert(error.message);

  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

function showEmployeeEditMessage(
  message,
  type = "error"
) {
  const element =
    document.getElementById(
      "employeeEditMessage"
    );

  if (!element) {
    return;
  }

  element.textContent = message;
  element.className =
    `modal-message ${type}`;
}

function hideEmployeeEditMessage() {
  const element =
    document.getElementById(
      "employeeEditMessage"
    );

  if (!element) {
    return;
  }

  element.textContent = "";
  element.className =
    "modal-message";
}

function openEmployeeEditModal(
  employeeId
) {
  const employee =
    employees.find(
      item =>
        String(item.id) ===
        String(employeeId)
    );

  if (
    !employee ||
    !canManageEmployee(employee)
  ) {
    showGlobalMessage(
      "Você não possui permissão para editar este colaborador.",
      "error"
    );

    return;
  }

  currentEditedEmployee =
    employee;

  const values = {
    employeeEditId:
      employee.id,

    employeeEditName:
      employee.name,

    employeeEditRegistration:
      employee.registration,

    employeeEditEmail:
      employee.email,

    employeeEditRole:
      employee.role,

    employeeEditPassword:
      ""
  };

  Object.entries(values)
    .forEach(
      ([id, value]) => {
        const element =
          document.getElementById(id);

        if (element) {
          element.value =
            value || "";
        }
      }
    );

  hideEmployeeEditMessage();

  openModal(
    "employeeEditModal"
  );
}

async function saveEmployeeEdit(event) {
  event.preventDefault();

  if (
    !currentEditedEmployee ||
    !canManageEmployee(
      currentEditedEmployee
    )
  ) {
    return;
  }

  const password =
    document
      .getElementById(
        "employeeEditPassword"
      )
      ?.value || "";

  if (
    password &&
    password.length < 6
  ) {
    showEmployeeEditMessage(
      "A nova senha deve possuir pelo menos 6 caracteres.",
      "error"
    );

    return;
  }

  const payload = {
    nome:
      document
        .getElementById(
          "employeeEditName"
        )
        ?.value
        ?.trim() || "",

    matricula:
      document
        .getElementById(
          "employeeEditRegistration"
        )
        ?.value
        ?.trim() || "",

    email:
      document
        .getElementById(
          "employeeEditEmail"
        )
        ?.value
        ?.trim()
        ?.toLowerCase() || "",

    cargo:
      document
        .getElementById(
          "employeeEditRole"
        )
        ?.value
        ?.trim() || ""
  };

  if (password) {
    payload.senha = password;
  }

  if (
    !payload.nome ||
    !payload.matricula ||
    !payload.email ||
    !payload.cargo
  ) {
    showEmployeeEditMessage(
      "Preencha todos os dados do colaborador.",
      "error"
    );

    return;
  }

  const button =
    document.getElementById(
      "saveEmployeeEditButton"
    );

  const original =
    button?.innerHTML;

  if (button) {
    button.disabled = true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Salvando...
    `;
  }

  hideEmployeeEditMessage();

  try {
    const response =
      await fetch(
        `/api/usuarios/${currentEditedEmployee.id}`,
        {
          method: "PUT",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify(
              payload
            )
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
        "Não foi possível alterar o colaborador."
      );
    }

    closeModal(
      "employeeEditModal"
    );

    await loadEmployees();

    showGlobalMessage(
      result.message ||
      "Dados do colaborador atualizados com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao editar colaborador:",
      error
    );

    showEmployeeEditMessage(
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

document
  .getElementById(
    "employeeEditForm"
  )
  ?.addEventListener(
    "submit",
    saveEmployeeEdit
  );

function normalizeSchedule(schedule = {}) {
  return {
    entry:
      schedule.entrada_prevista ||
      schedule.entry ||
      "",

    breakTime:
      schedule.intervalo_inicio ||
      schedule.inicio_intervalo ||
      schedule.breakTime ||
      "",

    returnTime:
      schedule.retorno_previsto ||
      schedule.returnTime ||
      "",

    exit:
      schedule.saida_prevista ||
      schedule.exit ||
      "",

    tolerance:
      Number(
        schedule.tolerancia_minutos ??
        schedule.tolerance ??
        10
      ),

    configured:
      Boolean(
        schedule.id ||
        schedule.entrada_prevista ||
        schedule.entry
      )
  };
}

async function loadWorkSchedules(
  showError = false
) {
  try {
    const response =
      await fetch(
        "/api/ponto/admin/jornadas",
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

    if (response.status === 404) {
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
        "Não foi possível carregar as jornadas."
      );
    }

    const schedules =
      Array.isArray(result)
        ? result
        : (
            result.jornadas ||
            []
          );

    employees =
      employees.map(
        employee => {
          const schedule =
            schedules.find(
              item =>
                String(
                  item.usuario_id ||
                  item.employeeId ||
                  ""
                ) ===
                String(employee.id)
            );

          if (!schedule) {
            return employee;
          }

          return {
            ...employee,
            schedule:
              normalizeSchedule(
                schedule
              )
          };
        }
      );

  } catch (error) {
    console.error(
      "Erro ao carregar jornadas:",
      error
    );

    if (showError) {
      showGlobalMessage(
        error.message,
        "error"
      );
    }
  }
}

function showWorkScheduleMessage(
  message,
  type = "error"
) {
  const element =
    document.getElementById(
      "workScheduleMessage"
    );

  if (!element) {
    return;
  }

  element.textContent = message;

  element.className =
    `modal-message ${type}`;
}

function hideWorkScheduleMessage() {
  const element =
    document.getElementById(
      "workScheduleMessage"
    );

  if (!element) {
    return;
  }

  element.textContent = "";

  element.className =
    "modal-message";
}

async function openWorkScheduleModal(
  employeeId
) {
  const employee =
    employees.find(
      item =>
        String(item.id) ===
        String(employeeId)
    );

  if (
    !employee ||
    !canManageEmployee(employee)
  ) {
    showGlobalMessage(
      "Você não possui permissão para configurar a jornada deste colaborador.",
      "error"
    );

    return;
  }

  currentWorkScheduleEmployee =
    employee;

  const name =
    document.getElementById(
      "workScheduleEmployeeName"
    );

  if (name) {
    name.textContent =
      `${employee.name} • ${employee.role}`;
  }

  const setFormValues =
    schedule => {
      const values = {
        workScheduleEmployeeId:
          employee.id,

        workScheduleEntry:
          schedule.entry || "",

        workScheduleBreak:
          schedule.breakTime || "",

        workScheduleReturn:
          schedule.returnTime || "",

        workScheduleExit:
          schedule.exit || "",

        workScheduleTolerance:
          10
      };

      Object.entries(values)
        .forEach(
          ([id, value]) => {
            const element =
              document.getElementById(id);

            if (element) {
              element.value =
                value;
            }
          }
        );
    };

  setFormValues(
    employee.schedule ||
    normalizeSchedule()
  );

  hideWorkScheduleMessage();

  openModal(
    "workScheduleModal"
  );

  try {
    const response =
      await fetch(
        `/api/ponto/admin/jornadas/${employee.id}`,
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

    if (response.status === 404) {
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
        "Não foi possível carregar a jornada."
      );
    }

    const schedule =
      normalizeSchedule(
        result.jornada ||
        result
      );

    employee.schedule =
      schedule;

    setFormValues(schedule);

  } catch (error) {
    console.error(
      "Erro ao carregar jornada:",
      error
    );

    showWorkScheduleMessage(
      error.message,
      "error"
    );
  }
}

function timeToMinutes(value) {
  if (
    !value ||
    !String(value).includes(":")
  ) {
    return null;
  }

  const [
    hours,
    minutes
  ] =
    String(value)
      .substring(0, 5)
      .split(":")
      .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  return (
    hours * 60 +
    minutes
  );
}

function validateWorkSchedule(payload) {
  const entry =
    timeToMinutes(
      payload.entrada_prevista
    );

  const breakStart =
    timeToMinutes(
      payload.intervalo_inicio
    );

  const returnTime =
    timeToMinutes(
      payload.retorno_previsto
    );

  const exit =
    timeToMinutes(
      payload.saida_prevista
    );

  if (
    [
      entry,
      breakStart,
      returnTime,
      exit
    ].some(
      value => value === null
    )
  ) {
    return "Preencha todos os horários da jornada.";
  }

  if (
    !(
      entry < breakStart &&
      breakStart < returnTime &&
      returnTime < exit
    )
  ) {
    return "Os horários devem seguir a ordem: entrada, intervalo, retorno e saída.";
  }

  return "";
}

async function saveWorkSchedule(event) {
  event.preventDefault();

  if (
    !currentWorkScheduleEmployee ||
    !canManageEmployee(
      currentWorkScheduleEmployee
    )
  ) {
    return;
  }

  const payload = {
    entrada_prevista:
      document
        .getElementById(
          "workScheduleEntry"
        )
        ?.value || "",

    intervalo_inicio:
      document
        .getElementById(
          "workScheduleBreak"
        )
        ?.value || "",

    retorno_previsto:
      document
        .getElementById(
          "workScheduleReturn"
        )
        ?.value || "",

    saida_prevista:
      document
        .getElementById(
          "workScheduleExit"
        )
        ?.value || "",

    tolerancia_minutos: 10
  };

  const validation =
    validateWorkSchedule(
      payload
    );

  if (validation) {
    showWorkScheduleMessage(
      validation,
      "error"
    );

    return;
  }

  const button =
    document.getElementById(
      "saveWorkScheduleButton"
    );

  const original =
    button?.innerHTML;

  if (button) {
    button.disabled = true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Salvando...
    `;
  }

  hideWorkScheduleMessage();

  try {
    const response =
      await fetch(
        `/api/ponto/admin/jornadas/${currentWorkScheduleEmployee.id}`,
        {
          method: "PUT",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify(
              payload
            )
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
        "Não foi possível salvar a jornada."
      );
    }

    const schedule =
      normalizeSchedule(
        result.jornada ||
        {
          ...payload,
          id: true
        }
      );

    const index =
      employees.findIndex(
        employee =>
          String(employee.id) ===
          String(
            currentWorkScheduleEmployee.id
          )
      );

    if (index >= 0) {
      employees[index] = {
        ...employees[index],
        schedule
      };
    }

    closeModal(
      "workScheduleModal"
    );

    renderEmployees();

    await loadPointRecords(false);

    showGlobalMessage(
      result.message ||
      "Jornada configurada com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao salvar jornada:",
      error
    );

    showWorkScheduleMessage(
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

document
  .getElementById(
    "workScheduleForm"
  )
  ?.addEventListener(
    "submit",
    saveWorkSchedule
  );

function openUserDeleteModal(
  userId
) {
  const employee =
    employees.find(
      item =>
        String(item.id) ===
        String(userId)
    );

  if (
    !employee ||
    !canDeleteUser(employee)
  ) {
    showGlobalMessage(
      "Você não possui permissão para excluir este usuário.",
      "error"
    );

    return;
  }

  userPendingRemoval =
    employee;

  const id =
    document.getElementById(
      "deleteUserId"
    );

  const name =
    document.getElementById(
      "deleteUserName"
    );

  if (id) {
    id.value = employee.id;
  }

  if (name) {
    name.textContent =
      employee.name;
  }

  openModal(
    "userDeleteModal"
  );
}

async function confirmUserDelete() {
  if (!userPendingRemoval) {
    return;
  }

  const button =
    document.getElementById(
      "confirmUserDeleteButton"
    );

  if (
    !button ||
    button.disabled
  ) {
    return;
  }

  const original =
    button.innerHTML;

  button.disabled = true;

  button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Excluindo...
  `;

  try {
    const response =
      await fetch(
        `/api/usuarios/${userPendingRemoval.id}`,
        {
          method: "DELETE",
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
        "Não foi possível excluir o usuário."
      );
    }

    closeModal(
      "userDeleteModal"
    );

    userPendingRemoval = null;

    await loadEmployees();

    loadFeedbackEmployees();

    showGlobalMessage(
      result.message ||
      "Usuário excluído com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao excluir usuário:",
      error
    );

    alert(error.message);

  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

document
  .getElementById(
    "cancelUserDeleteButton"
  )
  ?.addEventListener(
    "click",
    () => {
      closeModal(
        "userDeleteModal"
      );
    }
  );

document
  .getElementById(
    "confirmUserDeleteButton"
  )
  ?.addEventListener(
    "click",
    confirmUserDelete
  );

async function openVacationPeriodModal(
  employeeId
) {
  const employee =
    employees.find(
      item =>
        String(item.id) ===
        String(employeeId)
    );

  if (!employee) {
    alert(
      "Funcionário não encontrado."
    );

    return;
  }

  const form =
    document.getElementById(
      "vacationPeriodForm"
    );

  form?.reset();

  document
    .getElementById(
      "vacationEmployeeId"
    )
    .value =
      employee.id;

  document
    .getElementById(
      "vacationEmployeeName"
    )
    .textContent =
      `${employee.name} • ${employee.role}`;

  document
    .getElementById(
      "vacationUsedDays"
    )
    .value = 0;

  updateVacationPreview();

  openModal(
    "vacationPeriodModal"
  );

  try {
    const response =
      await fetch(
        `/api/ferias/admin/periodos/${employee.id}`,
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

    if (
      response.status === 404
    ) {
      return;
    }

    if (!response.ok) {
      throw new Error(
        result.error ||
        "Não foi possível carregar o período de férias."
      );
    }

    const period =
      result.periodo ||
      result;

    if (!period) {
      return;
    }

    document
      .getElementById(
        "vacationPeriodStart"
      )
      .value =
        period.periodo_inicio
          ?.substring(0, 10) || "";

    document
      .getElementById(
        "vacationPeriodEnd"
      )
      .value =
        period.periodo_fim
          ?.substring(0, 10) || "";

    document
      .getElementById(
        "vacationUsedDays"
      )
      .value =
        Number(
          period.dias_usados ||
          0
        );

    document
      .getElementById(
        "vacationExpirationDate"
      )
      .value =
        period.data_vencimento
          ?.substring(0, 10) || "";

    updateVacationPreview(
      period
    );

  } catch (error) {
    console.error(
      "Erro ao carregar período de férias:",
      error
    );

    showGlobalMessage(
      error.message,
      "error"
    );
  }
}

function updateVacationPreview(
  backendPeriod = null
) {
  const start =
    document
      .getElementById(
        "vacationPeriodStart"
      )
      ?.value;

  const end =
    document
      .getElementById(
        "vacationPeriodEnd"
      )
      ?.value;

  const used =
    Number(
      document
        .getElementById(
          "vacationUsedDays"
        )
        ?.value || 0
    );

  let rights = 0;
  let status =
    "Aguardando dados";

  if (backendPeriod) {
    rights =
      Number(
        backendPeriod.dias_direito ??
        0
      );

    status =
      backendPeriod.status ||
      (
        rights > 0
          ? "Disponível"
          : "Em aquisição"
      );

  } else if (
    start &&
    end
  ) {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const endDate =
      new Date(
        `${end}T00:00:00`
      );

    if (endDate < today) {
      rights =
        VACATION_DEFAULT_DAYS;

      status =
        "Disponível";

    } else {
      status =
        "Em aquisição";
    }
  }

  const balance =
    Math.max(
      rights - used,
      0
    );

  setCounterValue(
    "vacationPreviewRights",
    `${rights} dias`
  );

  setCounterValue(
    "vacationPreviewBalance",
    `${balance} dias`
  );

  setCounterValue(
    "vacationPreviewStatus",
    status
  );
}

[
  "vacationPeriodStart",
  "vacationPeriodEnd",
  "vacationUsedDays",
  "vacationExpirationDate"
]
  .forEach(
    id => {
      document
        .getElementById(id)
        ?.addEventListener(
          "input",
          () => {
            updateVacationPreview();
          }
        );
    }
  );

document
  .getElementById(
    "vacationPeriodForm"
  )
  ?.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const employeeId =
        document
          .getElementById(
            "vacationEmployeeId"
          )
          .value;

      const payload = {
        periodo_inicio:
          document
            .getElementById(
              "vacationPeriodStart"
            )
            .value,

        periodo_fim:
          document
            .getElementById(
              "vacationPeriodEnd"
            )
            .value,

        dias_usados:
          Number(
            document
              .getElementById(
                "vacationUsedDays"
              )
              .value || 0
          ),

        data_vencimento:
          document
            .getElementById(
              "vacationExpirationDate"
            )
            .value
      };

      if (
        !payload.periodo_inicio ||
        !payload.periodo_fim ||
        !payload.data_vencimento
      ) {
        alert(
          "Preencha todas as datas."
        );

        return;
      }

      const button =
        document.getElementById(
          "saveVacationPeriodButton"
        );

      const original =
        button.innerHTML;

      button.disabled = true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Salvando...
      `;

      try {
        const response =
          await fetch(
            `/api/ferias/admin/periodos/${employeeId}`,
            {
              method: "PUT",

              headers:
                getAuthHeaders(true),

              body:
                JSON.stringify(
                  payload
                )
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
            "Não foi possível salvar o período."
          );
        }

        closeModal(
          "vacationPeriodModal"
        );

        showGlobalMessage(
          result.message ||
          "Período de férias salvo com sucesso.",
          "success"
        );

      } catch (error) {
        console.error(
          "Erro ao salvar período de férias:",
          error
        );

        alert(error.message);

      } finally {
        button.disabled = false;
        button.innerHTML =
          original;
      }
    }
  );

async function loadVacationRequests() {
  const list =
    document.getElementById(
      "vacationRequestList"
    );

  if (list) {
    list.innerHTML = `
      <div class="loading-state">

        <i class="fa-solid fa-spinner fa-spin"></i>

        <span>
          Carregando solicitações...
        </span>

      </div>
    `;
  }

  try {
    const response =
      await fetch(
        "/api/ferias/admin/solicitacoes",
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
        "Não foi possível carregar as solicitações."
      );
    }

    vacationRequests =
      (
        Array.isArray(result)
          ? result
          : []
      )
        .filter(
          request =>
            request.status ===
            "pendente"
        );

    renderVacationRequests();
    updateDashboardCounters();

  } catch (error) {
    console.error(
      "Erro ao carregar solicitações de férias:",
      error
    );

    vacationRequests = [];

    renderVacationRequests();
    updateDashboardCounters();

    showGlobalMessage(
      error.message,
      "error"
    );
  }
}

function renderVacationRequests() {
  const list =
    document.getElementById(
      "vacationRequestList"
    );

  const dashboardList =
    document.getElementById(
      "dashboardVacationList"
    );

  if (list) {
    list.innerHTML = "";
  }

  if (dashboardList) {
    dashboardList.innerHTML = "";
  }

  if (!vacationRequests.length) {
    if (list) {
      list.innerHTML = `
        <div class="empty-state">

          <i class="fa-solid fa-umbrella-beach"></i>

          <strong>
            Nenhuma solicitação pendente
          </strong>

          <span>
            Não existem solicitações de férias aguardando análise.
          </span>

        </div>
      `;
    }

    if (dashboardList) {
      dashboardList.innerHTML = `
        <div class="empty-state">

          <i class="fa-solid fa-circle-check"></i>

          <strong>
            Tudo em dia
          </strong>

          <span>
            Nenhuma solicitação de férias pendente.
          </span>

        </div>
      `;
    }

    return;
  }

  vacationRequests
    .forEach(
      request => {
        const user =
          request.usuario || {};

        if (list) {
          const card =
            document.createElement(
              "article"
            );

          card.className =
            "vacation-request-card";

          card.innerHTML = `
            <div class="vacation-request-avatar">
              ${escapeHTML(
                getInitials(
                  user.nome
                )
              )}
            </div>

            <div class="vacation-request-content">

              <h3>
                ${escapeHTML(
                  user.nome ||
                  "Colaborador"
                )}
              </h3>

              <span>
                ${escapeHTML(
                  user.cargo || ""
                )}
                •
                ${escapeHTML(
                  user.setor || ""
                )}
              </span>

              <div class="vacation-request-meta">

                <span>
                  <i class="fa-regular fa-calendar"></i>

                  ${formatDate(
                    request.data_inicio
                  )}

                  até

                  ${formatDate(
                    request.data_fim
                  )}
                </span>

                <span>
                  <i class="fa-regular fa-clock"></i>

                  ${Number(
                    request.quantidade_dias ||
                    0
                  )}
                  dias
                </span>

              </div>

            </div>

            <div class="vacation-request-actions">

              <button
                type="button"
                class="primary-button"
                onclick="
                  openVacationDecisionModal(
                    '${request.id}'
                  )
                "
              >
                Analisar
              </button>

            </div>
          `;

          list.appendChild(card);
        }
      }
    );

  if (dashboardList) {
    vacationRequests
      .slice(0, 3)
      .forEach(
        request => {
          const user =
            request.usuario || {};

          const item =
            document.createElement(
              "div"
            );

          item.className =
            "simple-list-item";

          item.innerHTML = `
            <div class="list-avatar">
              ${escapeHTML(
                getInitials(
                  user.nome
                )
              )}
            </div>

            <div class="list-main">

              <strong>
                ${escapeHTML(
                  user.nome ||
                  "Colaborador"
                )}
              </strong>

              <span>
                ${formatDate(
                  request.data_inicio
                )}
                até
                ${formatDate(
                  request.data_fim
                )}
              </span>

            </div>
          `;

          dashboardList
            .appendChild(item);
        }
      );
  }
}

function openVacationDecisionModal(
  requestId
) {
  currentVacationRequest =
    vacationRequests.find(
      request =>
        String(request.id) ===
        String(requestId)
    );

  if (!currentVacationRequest) {
    return;
  }

  const request =
    currentVacationRequest;

  const user =
    request.usuario || {};

  const content =
    document.getElementById(
      "vacationDecisionContent"
    );

  if (!content) {
    return;
  }

  content.innerHTML = `
    <div class="modal-header">

      <div class="modal-title-icon">
        <i class="fa-solid fa-umbrella-beach"></i>
      </div>

      <div>

        <h2>
          Analisar solicitação
        </h2>

        <p>
          Revise o período solicitado pelo colaborador.
        </p>

      </div>

    </div>

    <div class="vacation-decision-profile">

      <div class="list-avatar">
        ${escapeHTML(
          getInitials(
            user.nome
          )
        )}
      </div>

      <div>

        <strong>
          ${escapeHTML(
            user.nome ||
            "Colaborador"
          )}
        </strong>

        <span>
          ${escapeHTML(
            user.cargo || ""
          )}
          •
          ${escapeHTML(
            user.setor || ""
          )}
        </span>

      </div>

    </div>

    <div class="vacation-details-grid">

      <div class="vacation-detail-card">
        <span>Início</span>

        <strong>
          ${formatDate(
            request.data_inicio
          )}
        </strong>
      </div>

      <div class="vacation-detail-card">
        <span>Término</span>

        <strong>
          ${formatDate(
            request.data_fim
          )}
        </strong>
      </div>

      <div class="vacation-detail-card">
        <span>Quantidade</span>

        <strong>
          ${Number(
            request.quantidade_dias ||
            0
          )}
          dias
        </strong>
      </div>

      <div class="vacation-detail-card">
        <span>Solicitado em</span>

        <strong>
          ${formatDateTime(
            request.created_at
          )}
        </strong>
      </div>

    </div>

    ${
      request.observacoes
        ? `
          <div class="form-information">

            <i class="fa-solid fa-comment"></i>

            <p>
              ${escapeHTML(
                request.observacoes
              )}
            </p>

          </div>
        `
        : ""
    }

    <div
      class="form-group"
      style="margin-top: 16px;"
    >

      <label>
        Observação do administrador
      </label>

      <textarea
        id="vacationAdminObservation"
        rows="4"
        placeholder="Obrigatório em caso de recusa ou aprovação com ressalvas..."
      ></textarea>

    </div>

    <div class="vacation-decision-options">

      <button
        type="button"
        class="
          vacation-decision-option
          approve
        "
        data-vacation-decision="aprovada"
      >
        <i class="fa-solid fa-check"></i>
        Aprovar
      </button>

      <button
        type="button"
        class="
          vacation-decision-option
          reservation
        "
        data-vacation-decision="aprovada_com_ressalvas"
      >
        <i class="fa-solid fa-triangle-exclamation"></i>
        Com ressalvas
      </button>

      <button
        type="button"
        class="
          vacation-decision-option
          reject
        "
        data-vacation-decision="recusada"
      >
        <i class="fa-solid fa-xmark"></i>
        Recusar
      </button>

    </div>
  `;

  content
    .querySelectorAll(
      "[data-vacation-decision]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            answerVacationRequest(
              button.dataset
                .vacationDecision,
              button
            );
          }
        );
      }
    );

  openModal(
    "vacationDecisionModal"
  );
}

async function answerVacationRequest(
  status,
  button
) {
  if (!currentVacationRequest) {
    return;
  }

  const observation =
    document
      .getElementById(
        "vacationAdminObservation"
      )
      ?.value
      ?.trim() || "";

  if (
    [
      "recusada",
      "aprovada_com_ressalvas"
    ].includes(status) &&
    !observation
  ) {
    alert(
      "Informe uma observação para esta decisão."
    );

    return;
  }

  const original =
    button.innerHTML;

  button.disabled = true;

  button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Salvando...
  `;

  try {
    const response =
      await fetch(
        `/api/ferias/admin/solicitacoes/${currentVacationRequest.id}`,
        {
          method: "PATCH",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify({
              status,
              observacao_admin:
                observation
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
        "Não foi possível responder à solicitação."
      );
    }

    closeModal(
      "vacationDecisionModal"
    );

    currentVacationRequest = null;

    await loadVacationRequests();

    showGlobalMessage(
      result.message ||
      "Solicitação respondida com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao responder férias:",
      error
    );

    alert(error.message);

      } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

document
  .getElementById(
    "refreshVacationButton"
  )
  ?.addEventListener(
    "click",
    loadVacationRequests
  );

/* =========================================================
   TREINAMENTOS
========================================================= */

function mapApiCourse(course) {
  return {
    id: course.id,
    title: course.titulo || "",
    description: course.descricao || "",
    hours: Number(
      course.carga_horaria || 0
    ),
    level: course.nivel || "",

    sector:
      course.setor ||
      course.setor_responsavel ||
      course.setor_destino ||
      loggedAdmin?.setor ||
      "",

    requirement:
      course.classificacao ||
      "Recomendado",

    external:
      course.curso_externo === true,

    externalLink:
      course.link_externo || "",

    active:
      course.ativo !== false,

    createdAt:
      course.created_at || null,

    activities:
      Array.isArray(
        course.atividades_curso
      )
        ? course.atividades_curso
        : []
  };
}

async function loadCourses() {
  const container =
    document.getElementById(
      "adminTrainingGrid"
    );

  if (container) {
    container.innerHTML = `
      <div class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>

        <span>
          Carregando treinamentos...
        </span>
      </div>
    `;
  }

  try {
    const response =
      await fetch(
        "/api/cursos",
        {
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
        "Não foi possível carregar os treinamentos."
      );
    }

    courses =
      (
        Array.isArray(result)
          ? result
          : result.cursos || []
      ).map(
        mapApiCourse
      );

    renderCourses();
    renderDashboardCourses();
    updateDashboardCounters();

  } catch (error) {
    console.error(
      "Erro ao carregar cursos:",
      error
    );

    courses = [];

    renderCourses();
    renderDashboardCourses();
    updateDashboardCounters();

    showGlobalMessage(
      error.message,
      "error"
    );
  }
}

function getFilteredAdminCourses() {
  const search =
    document
      .getElementById(
        "trainingSearch"
      )
      ?.value
      ?.trim()
      ?.toLowerCase() || "";

  if (!search) {
    return courses;
  }

  return courses.filter(
    course =>
      [
        course.title,
        course.description,
        course.level,
        course.requirement,
        course.sector
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
  );
}

function renderCourses() {
  const container =
    document.getElementById(
      "adminTrainingGrid"
    );

  if (!container) {
    return;
  }

  const filtered =
    getFilteredAdminCourses();

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-graduation-cap"></i>

        <strong>
          Nenhum treinamento encontrado
        </strong>

        <span>
          Não existem treinamentos correspondentes à pesquisa.
        </span>
      </div>
    `;

    return;
  }

  container.innerHTML =
    filtered
      .map(
        course => `
          <article class="admin-training-card">

            <div class="admin-training-card-header">

              <div class="admin-course-icon">
                <i class="fa-solid fa-graduation-cap"></i>
              </div>

              <span
                class="
                  requirement-badge
                  ${
                    course.requirement ===
                    "Obrigatório"
                      ? "mandatory"
                      : "recommended"
                  }
                "
              >
                ${escapeHTML(
                  course.requirement
                )}
              </span>

            </div>

            <div class="admin-training-card-body">

              <span class="admin-training-category">
                ${escapeHTML(
                  course.sector ||
                  loggedAdmin?.setor ||
                  "Treinamento"
                )}
              </span>

              <h3>
                ${escapeHTML(
                  course.title
                )}
              </h3>

              <p>
                ${escapeHTML(
                  course.description
                )}
              </p>

              <div class="admin-training-meta">

                <span>
                  <i class="fa-regular fa-clock"></i>
                  ${course.hours}h
                </span>

                <span>
                  <i class="fa-solid fa-signal"></i>

                  ${escapeHTML(
                    course.level
                  )}
                </span>

                <span>
                  <i class="fa-solid fa-building"></i>

                  ${escapeHTML(
                    course.sector ||
                    loggedAdmin?.setor ||
                    "-"
                  )}
                </span>

                <span>
                  <i class="fa-solid fa-globe"></i>

                  ${
                    course.external
                      ? "Externo"
                      : "Interno"
                  }
                </span>

              </div>

              <div class="admin-training-actions">

                <button
                  type="button"
                  class="secondary-button"
                  onclick="
                    openCourseDetails(
                      '${course.id}'
                    )
                  "
                >
                  <i class="fa-regular fa-eye"></i>
                  Ver
                </button>

                <button
                  type="button"
                  class="danger-button"
                  onclick="
                    prepareCourseRemoval(
                      '${course.id}'
                    )
                  "
                >
                  <i class="fa-solid fa-trash"></i>
                  Remover
                </button>

              </div>

            </div>

          </article>
        `
      )
      .join("");
}

document
  .getElementById(
    "trainingSearch"
  )
  ?.addEventListener(
    "input",
    renderCourses
  );

function openCourseModal() {
  temporaryActivities = [];

  document
    .getElementById(
      "courseForm"
    )
    ?.reset();

  document
    .getElementById(
      "externalLinkArea"
    )
    ?.classList
    .remove("show");

  document
    .getElementById(
      "courseActivitiesSection"
    )
    ?.classList
    .remove("hidden");

  const sector =
    document.getElementById(
      "courseAdminSector"
    );

  if (sector) {
    sector.textContent =
      loggedAdmin?.setor ||
      "Setor não definido";
  }

  renderActivityBuilder();

  openModal(
    "courseModal"
  );
}

function toggleExternalCourse() {
  const checkbox =
    document.getElementById(
      "externalCourse"
    );

  const externalArea =
    document.getElementById(
      "externalLinkArea"
    );

  const activitiesSection =
    document.getElementById(
      "courseActivitiesSection"
    );

  const externalLink =
    document.getElementById(
      "externalCourseLink"
    );

  if (!checkbox) {
    return;
  }

  externalArea
    ?.classList
    .toggle(
      "show",
      checkbox.checked
    );

  activitiesSection
    ?.classList
    .toggle(
      "hidden",
      checkbox.checked
    );

  if (externalLink) {
    externalLink.required =
      checkbox.checked;

    if (!checkbox.checked) {
      externalLink.value = "";
    }
  }

  if (checkbox.checked) {
    temporaryActivities = [];
    renderActivityBuilder();
  }
}

function addActivity() {
  temporaryActivities.push({
    temporaryId:
      Date.now() +
      Math.random(),

    title: "",
    description: "",
    type: "Texto",
    resource: ""
  });

  renderActivityBuilder();
}

function removeActivity(
  activityId
) {
  temporaryActivities =
    temporaryActivities.filter(
      activity =>
        activity.temporaryId !==
        activityId
    );

  renderActivityBuilder();
}

function updateActivity(
  activityId,
  field,
  value
) {
  const activity =
    temporaryActivities.find(
      item =>
        item.temporaryId ===
        activityId
    );

  if (!activity) {
    return;
  }

  activity[field] = value;

  if (field === "type") {
    activity.resource = "";
    renderActivityBuilder();
  }
}

function renderActivityBuilder() {
  const container =
    document.getElementById(
      "activityBuilderList"
    );

  if (!container) {
    return;
  }

  if (!temporaryActivities.length) {
    container.innerHTML = `
      <div class="empty-activities">

        <i class="fa-regular fa-clipboard"></i>

        <strong>
          Nenhuma atividade adicionada
        </strong>

        <span>
          Clique em "Adicionar atividade" para começar.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML = "";

  temporaryActivities.forEach(
    (activity, index) => {
      const element =
        document.createElement(
          "article"
        );

      element.className =
        "activity-builder-card";

      const resourceLabel =
        activity.type === "Link"
          ? "Link de referência"
          : activity.type ===
            "Arquivo"
            ? "Nome / orientação do material"
            : "Orientação complementar";

      const resourceInput =
        activity.type === "Texto"
          ? `
            <textarea
              rows="3"
              placeholder="Opcional..."
              data-activity-resource="${activity.temporaryId}"
            >${escapeHTML(
              activity.resource
            )}</textarea>
          `
          : `
            <input
              type="${
                activity.type ===
                "Link"
                  ? "url"
                  : "text"
              }"
              value="${escapeHTML(
                activity.resource
              )}"
              placeholder="${
                activity.type ===
                "Link"
                  ? "https://..."
                  : "Ex.: material-introdutorio.pdf"
              }"
              data-activity-resource="${activity.temporaryId}"
            >
          `;

      element.innerHTML = `
        <div class="activity-builder-header">

          <strong>
            Atividade ${index + 1}
          </strong>

          <button
            type="button"
            class="remove-activity-button"
            data-remove-activity="${activity.temporaryId}"
          >
            <i class="fa-solid fa-trash"></i>
          </button>

        </div>

        <div class="activity-builder-grid">

          <div class="form-group full">

            <label>
              Título
            </label>

            <input
              type="text"
              value="${escapeHTML(
                activity.title
              )}"
              placeholder="Ex.: Criar planilha financeira"
              data-activity-title="${activity.temporaryId}"
            >

          </div>

          <div class="form-group full">

            <label>
              Descrição
            </label>

            <textarea
              rows="3"
              placeholder="Explique o que o colaborador deve fazer..."
              data-activity-description="${activity.temporaryId}"
            >${escapeHTML(
              activity.description
            )}</textarea>

          </div>

          <div class="form-group">

            <label>
              Tipo
            </label>

            <select
              data-activity-type="${activity.temporaryId}"
            >

              <option
                value="Texto"
                ${
                  activity.type ===
                  "Texto"
                    ? "selected"
                    : ""
                }
              >
                Texto
              </option>

              <option
                value="Arquivo"
                ${
                  activity.type ===
                  "Arquivo"
                    ? "selected"
                    : ""
                }
              >
                Arquivo
              </option>

              <option
                value="Link"
                ${
                  activity.type ===
                  "Link"
                    ? "selected"
                    : ""
                }
              >
                Link
              </option>

            </select>

          </div>

          <div
            class="
              form-group
              full
              activity-extra-field
            "
          >

            <label>
              ${resourceLabel}
            </label>

            ${resourceInput}

          </div>

        </div>
      `;

      element
        .querySelector(
          `[data-remove-activity="${activity.temporaryId}"]`
        )
        ?.addEventListener(
          "click",
          () => {
            removeActivity(
              activity.temporaryId
            );
          }
        );

      element
        .querySelector(
          `[data-activity-title="${activity.temporaryId}"]`
        )
        ?.addEventListener(
          "input",
          event => {
            updateActivity(
              activity.temporaryId,
              "title",
              event.target.value
            );
          }
        );

      element
        .querySelector(
          `[data-activity-description="${activity.temporaryId}"]`
        )
        ?.addEventListener(
          "input",
          event => {
            updateActivity(
              activity.temporaryId,
              "description",
              event.target.value
            );
          }
        );

      element
        .querySelector(
          `[data-activity-type="${activity.temporaryId}"]`
        )
        ?.addEventListener(
          "change",
          event => {
            updateActivity(
              activity.temporaryId,
              "type",
              event.target.value
            );
          }
        );

      element
        .querySelector(
          `[data-activity-resource="${activity.temporaryId}"]`
        )
        ?.addEventListener(
          "input",
          event => {
            updateActivity(
              activity.temporaryId,
              "resource",
              event.target.value
            );
          }
        );

      container.appendChild(
        element
      );
    }
  );
}

function validateTemporaryActivities() {
  for (
    let index = 0;
    index <
    temporaryActivities.length;
    index++
  ) {
    const activity =
      temporaryActivities[index];

    if (
      !String(
        activity.title || ""
      ).trim()
    ) {
      return {
        valid: false,

        message:
          `Informe o título da atividade ${index + 1}.`
      };
    }

    if (
      !String(
        activity.description || ""
      ).trim()
    ) {
      return {
        valid: false,

        message:
          `Informe a descrição da atividade ${index + 1}.`
      };
    }

    if (
      activity.type === "Link"
    ) {
      const link =
        String(
          activity.resource || ""
        ).trim();

      if (!link) {
        return {
          valid: false,

          message:
            `Informe o link da atividade ${index + 1}.`
        };
      }

      try {
        new URL(link);
      } catch {
        return {
          valid: false,

          message:
            `O link da atividade ${index + 1} é inválido.`
        };
      }
    }
  }

  return {
    valid: true
  };
}

async function createCourse(event) {
  event.preventDefault();

  const button =
    document.getElementById(
      "courseSubmitButton"
    );

  if (button?.disabled) {
    return;
  }

  const title =
    document
      .getElementById(
        "courseTitle"
      )
      .value
      .trim();

  const description =
    document
      .getElementById(
        "courseDescription"
      )
      .value
      .trim();

  const hours =
    Number(
      document
        .getElementById(
          "courseHours"
        )
        .value
    );

  const level =
    document
      .getElementById(
        "courseLevel"
      )
      .value;

  const requirement =
    document
      .getElementById(
        "courseRequirement"
      )
      .value;

  const external =
    document
      .getElementById(
        "externalCourse"
      )
      .checked;

  const externalLink =
    document
      .getElementById(
        "externalCourseLink"
      )
      .value
      .trim();

  const sector =
    loggedAdmin?.setor || "";

  if (
    !title ||
    !description ||
    !hours ||
    !level ||
    !requirement
  ) {
    alert(
      "Preencha todos os dados do treinamento."
    );

    return;
  }

  if (!sector) {
    alert(
      "O administrador precisa possuir um setor definido para criar treinamentos."
    );

    return;
  }

  if (
    external &&
    !externalLink
  ) {
    alert(
      "Informe o link do curso externo."
    );

    return;
  }

  if (external) {
    try {
      new URL(externalLink);
    } catch {
      alert(
        "Informe um link externo válido."
      );

      return;
    }
  }

  if (!external) {
    if (
      !temporaryActivities.length
    ) {
      alert(
        "Adicione pelo menos uma atividade ao curso interno."
      );

      return;
    }

    const validation =
      validateTemporaryActivities();

    if (!validation.valid) {
      alert(
        validation.message
      );

      return;
    }
  }

  const payload = {
    titulo: title,

    descricao:
      description,

    carga_horaria:
      hours,

    area:
      sector,

    nivel:
      level,

    setor_destino:
      sector,

    setor_responsavel:
      sector,

    classificacao:
      requirement,

    curso_externo:
      external,

    link_externo:
      external
        ? externalLink
        : null,

    atividades:
      external
        ? []
        : temporaryActivities.map(
            (
              activity,
              index
            ) => ({
              titulo:
                activity.title.trim(),

              descricao:
                activity.description
                  .trim(),

              tipo:
                activity.type,

              recurso:
                String(
                  activity.resource ||
                  ""
                ).trim() || null,

              ordem:
                index + 1
            })
          )
  };

  const original =
    button.innerHTML;

  button.disabled = true;

  button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Publicando...
  `;

  try {
    const response =
      await fetch(
        "/api/cursos",
        {
          method: "POST",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify(
              payload
            )
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
        "Não foi possível criar o treinamento."
      );
    }

    closeModal(
      "courseModal"
    );

    temporaryActivities = [];

    await loadCourses();

    showGlobalMessage(
      result.message ||
      "Treinamento criado com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao criar treinamento:",
      error
    );

    alert(
      error.message
    );

  } finally {
    button.disabled = false;

    button.innerHTML =
      original;
  }
}

function openCourseDetails(
  courseId
) {
  const course =
    courses.find(
      item =>
        String(item.id) ===
        String(courseId)
    );

  if (!course) {
    alert(
      "Treinamento não encontrado."
    );

    return;
  }

  const content =
    document.getElementById(
      "courseDetailsContent"
    );

  if (!content) {
    return;
  }

  let activitiesHTML = "";

  if (course.external) {
    activitiesHTML = `
      <div class="form-information">

        <i class="fa-solid fa-arrow-up-right-from-square"></i>

        <p>
          Este treinamento é realizado externamente.

          ${
            course.externalLink
              ? `
                <a
                  href="${escapeHTML(
                    course.externalLink
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir curso
                </a>
              `
              : ""
          }
        </p>

      </div>
    `;

  } else {
    activitiesHTML = `
      <div class="details-activities">

        <h3>
          Atividades
        </h3>

        ${
          course.activities.length
            ? course.activities
                .map(
                  (
                    activity,
                    index
                  ) => `
                    <div class="details-activity-item">

                      <strong>
                        ${index + 1}.

                        ${escapeHTML(
                          activity.titulo ||
                          "Atividade"
                        )}
                      </strong>

                      <span>
                        ${escapeHTML(
                          activity.tipo ||
                          "-"
                        )}
                      </span>

                    </div>
                  `
                )
                .join("")
            : `
              <div class="empty-state">

                <strong>
                  Nenhuma atividade cadastrada
                </strong>

              </div>
            `
        }

      </div>
    `;
  }

  content.innerHTML = `
    <div class="details-course-header">

      <div class="course-icon-large">
        <i class="fa-solid fa-graduation-cap"></i>
      </div>

      <h2>
        ${escapeHTML(
          course.title
        )}
      </h2>

      <p>
        ${escapeHTML(
          course.description
        )}
      </p>

    </div>

    <div class="details-grid">

      <div class="detail-item">
        <span>
          Setor
        </span>

        <strong>
          ${escapeHTML(
            course.sector ||
            loggedAdmin?.setor ||
            "-"
          )}
        </strong>
      </div>

      <div class="detail-item">
        <span>
          Nível
        </span>

        <strong>
          ${escapeHTML(
            course.level
          )}
        </strong>
      </div>

      <div class="detail-item">
        <span>
          Carga horária
        </span>

        <strong>
          ${course.hours} horas
        </strong>
      </div>

      <div class="detail-item">
        <span>
          Classificação
        </span>

        <strong>
          ${escapeHTML(
            course.requirement
          )}
        </strong>
      </div>

      <div class="detail-item">
        <span>
          Tipo
        </span>

        <strong>
          ${
            course.external
              ? "Externo"
              : "Interno"
          }
        </strong>
      </div>

      <div class="detail-item">
        <span>
          Status
        </span>

        <strong>
          ${
            course.active
              ? "Ativo"
              : "Inativo"
          }
        </strong>
      </div>

    </div>

    ${activitiesHTML}
  `;

  openModal(
    "courseDetailsModal"
  );
}

function prepareCourseRemoval(
  courseId
) {
  coursePendingRemoval =
    courses.find(
      course =>
        String(course.id) ===
        String(courseId)
    ) || null;

  if (
    coursePendingRemoval
  ) {
    openModal(
      "confirmationModal"
    );
  }
}

document
  .getElementById(
    "confirmDeleteButton"
  )
  ?.addEventListener(
    "click",
    async event => {
      if (
        !coursePendingRemoval
      ) {
        return;
      }

      const button =
        event.currentTarget;

      const original =
        button.innerHTML;

      button.disabled = true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Removendo...
      `;

      try {
        const response =
          await fetch(
            `/api/cursos/${coursePendingRemoval.id}/desativar`,
            {
              method: "PATCH",

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
            "Não foi possível remover o treinamento."
          );
        }

        closeModal(
          "confirmationModal"
        );

        coursePendingRemoval =
          null;

        await loadCourses();

        showGlobalMessage(
          result.message ||
          "Treinamento removido com sucesso.",
          "success"
        );

      } catch (error) {
        console.error(
          "Erro ao remover treinamento:",
          error
        );

        alert(
          error.message
        );

      } finally {
        button.disabled =
          false;

        button.innerHTML =
          original;
      }
    }
  );

document
  .getElementById(
    "cancelDeleteButton"
  )
  ?.addEventListener(
    "click",
    () => {
      coursePendingRemoval =
        null;

      closeModal(
        "confirmationModal"
      );
    }
  );

function renderDashboardCourses() {
  const container =
    document.getElementById(
      "dashboardTrainingList"
    );

  if (!container) {
    return;
  }

  const active =
    courses
      .filter(
        course =>
          course.active
      )
      .slice(
        0,
        3
      );

  if (!active.length) {
    container.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-graduation-cap"></i>

        <strong>
          Nenhum treinamento ativo
        </strong>

        <span>
          Crie um treinamento para começar.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    active
      .map(
        course => `
          <article class="training-mini-card">

            <h3>
              ${escapeHTML(
                course.title
              )}
            </h3>

            <p>
              ${escapeHTML(
                truncateText(
                  course.description,
                  90
                )
              )}
            </p>

            <div class="training-mini-meta">

              <span>
                <i class="fa-regular fa-clock"></i>
                ${course.hours}h
              </span>

              <span>
                <i class="fa-solid fa-signal"></i>

                ${escapeHTML(
                  course.level
                )}
              </span>

              <span>
                ${escapeHTML(
                  course.requirement
                )}
              </span>

            </div>

          </article>
        `
      )
      .join("");
}

/* =========================================================
   AVALIAÇÕES
========================================================= */

function mapApiEvaluation(item) {
  const enrollment =
    item.inscricao || {};

  const user =
    item.usuario || {};

  const course =
    item.curso || {};

  return {
    enrollmentId:
      enrollment.id,

    userId:
      user.id ||
      enrollment.usuario_id,

    userName:
      user.nome ||
      "Colaborador",

    userRole:
      user.cargo || "",

    userSector:
      user.setor || "",

    courseId:
      course.id ||
      enrollment.curso_id,

    courseTitle:
      course.titulo ||
      "Treinamento",

    courseDescription:
      course.descricao || "",

    courseHours:
      Number(
        course.carga_horaria ||
        0
      ),

    sector:
      course.setor ||
      course.setor_responsavel ||
      loggedAdmin?.setor ||
      "",

    external:
      course.curso_externo ===
      true,

    status:
      enrollment.status ||
      "aguardando_avaliacao",

    submittedAt:
      enrollment.enviado_em ||
      enrollment.created_at ||
      null
  };
}

async function loadEvaluations() {
  const container =
    document.getElementById(
      "evaluationList"
    );

  if (container) {
    container.innerHTML = `
      <div class="loading-state">

        <i class="fa-solid fa-spinner fa-spin"></i>

        <span>
          Carregando avaliações...
        </span>

      </div>
    `;
  }

  try {
    const response =
      await fetch(
        "/api/treinamentos/admin/avaliacoes",
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
        "Não foi possível carregar as avaliações."
      );
    }

    evaluations =
      (
        Array.isArray(result)
          ? result
          : []
      ).map(
        mapApiEvaluation
      );

    renderEvaluations();
    renderDashboardEvaluations();
    updateDashboardCounters();

  } catch (error) {
    console.error(
      "Erro ao carregar avaliações:",
      error
    );

    evaluations = [];

    renderEvaluations();
    renderDashboardEvaluations();
    updateDashboardCounters();

    showGlobalMessage(
      error.message,
      "error"
    );
  }
}

function renderEvaluations() {
  const container =
    document.getElementById(
      "evaluationList"
    );

  if (!container) {
    return;
  }

  if (!evaluations.length) {
    container.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-clipboard-check"></i>

        <strong>
          Nenhuma avaliação pendente
        </strong>

        <span>
          Não existem treinamentos aguardando sua análise.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    evaluations
      .map(
        evaluation => `
          <article class="evaluation-card">

            <div class="evaluation-user-avatar">
              ${escapeHTML(
                getInitials(
                  evaluation.userName
                )
              )}
            </div>

            <div class="evaluation-content">

              <h3>
                ${escapeHTML(
                  evaluation.userName
                )}
              </h3>

              <span class="evaluation-course-name">
                ${escapeHTML(
                  evaluation.courseTitle
                )}
              </span>

              <div class="evaluation-meta">

                <span>
                  <i class="fa-solid fa-building"></i>

                  ${escapeHTML(
                    evaluation.userSector ||
                    "-"
                  )}
                </span>

                <span>
                  <i class="fa-regular fa-clock"></i>
                  ${evaluation.courseHours}h
                </span>

                <span>
                  <i class="fa-regular fa-calendar"></i>

                  ${formatDateTime(
                    evaluation.submittedAt
                  )}
                </span>

              </div>

            </div>

            <div class="evaluation-card-actions">

              <span
                class="
                  status-badge
                  ${
                    evaluation.external
                      ? "info"
                      : "purple-status"
                  }
                "
              >
                ${
                  evaluation.external
                    ? "Curso externo"
                    : "Curso interno"
                }
              </span>

              <button
                type="button"
                class="primary-button"
                onclick="
                  openEvaluationModal(
                    '${evaluation.enrollmentId}'
                  )
                "
              >
                <i class="fa-regular fa-eye"></i>
                Avaliar
              </button>

            </div>

          </article>
        `
      )
      .join("");
}

function renderDashboardEvaluations() {
  const container =
    document.getElementById(
      "dashboardEvaluationList"
    );

  if (!container) {
    return;
  }

  if (!evaluations.length) {
    container.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-circle-check"></i>

        <strong>
          Nenhuma avaliação pendente
        </strong>

        <span>
          Sua fila de avaliações está em dia.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    evaluations
      .slice(
        0,
        3
      )
      .map(
        evaluation => `
          <div class="simple-list-item">

            <div class="list-avatar">
              ${escapeHTML(
                getInitials(
                  evaluation.userName
                )
              )}
            </div>

            <div class="list-main">

              <strong>
                ${escapeHTML(
                  evaluation.userName
                )}
              </strong>

              <span>
                ${escapeHTML(
                  evaluation.courseTitle
                )}
              </span>

            </div>

          </div>
        `
      )
      .join("");
}

async function openEvaluationModal(
  enrollmentId
) {
  const container =
    document.getElementById(
      "evaluationModalContent"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="loading-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <span>
        Carregando avaliação...
      </span>

    </div>
  `;

  openModal(
    "evaluationModal"
  );

  try {
    const response =
      await fetch(
        `/api/treinamentos/admin/avaliacoes/${enrollmentId}`,
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
        "Não foi possível carregar a avaliação."
      );
    }

    currentEvaluation = {
      enrollment:
        result.inscricao || {},

      user:
        result.usuario || {},

      course:
        result.curso || {},

      activities:
        Array.isArray(
          result.atividades
        )
          ? result.atividades
          : [],

      deliveries:
        Array.isArray(
          result.entregas
        )
          ? result.entregas
          : [],

      certificate:
        result.certificado ||
        null
    };

    renderEvaluationModal();

  } catch (error) {
    console.error(
      "Erro ao abrir avaliação:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Não foi possível abrir a avaliação
        </strong>

        <span>
          ${escapeHTML(
            error.message
          )}
        </span>

      </div>
    `;
  }
}

function getEvaluationActivity(
  activityId
) {
  return (
    currentEvaluation
      ?.activities
      ?.find(
        activity =>
          Number(activity.id) ===
          Number(activityId)
      ) ||
    null
  );
}

function renderEvaluationModal() {
  if (!currentEvaluation) {
    return;
  }

  if (
    currentEvaluation
      .course
      ?.curso_externo === true
  ) {
    renderExternalEvaluationModal();

    return;
  }

  renderInternalEvaluationModal();
}

function renderInternalEvaluationModal() {
  const container =
    document.getElementById(
      "evaluationModalContent"
    );

  if (!container) {
    return;
  }

  const enrollment =
    currentEvaluation.enrollment ||
    {};

  const user =
    currentEvaluation.user ||
    {};

  const course =
    currentEvaluation.course ||
    {};

  const deliveriesHTML =
    currentEvaluation.deliveries
      .map(
        (
          delivery,
          index
        ) =>
          createEvaluationActivityHTML(
            delivery,
            index
          )
      )
      .join("");

  const sector =
    course.setor ||
    course.setor_responsavel ||
    loggedAdmin?.setor ||
    "-";

  container.innerHTML = `
    <div class="modal-header">

      <div class="modal-title-icon">
        <i class="fa-solid fa-clipboard-check"></i>
      </div>

      <div>

        <h2>
          Avaliar treinamento
        </h2>

        <p>
          Analise cada atividade enviada pelo colaborador.
        </p>

      </div>

    </div>

    <div class="evaluation-profile">

      <div class="list-avatar">
        ${escapeHTML(
          getInitials(
            user.nome
          )
        )}
      </div>

      <div class="evaluation-profile-info">

        <strong>
          ${escapeHTML(
            user.nome ||
            "Colaborador"
          )}
        </strong>

        <span>
          ${escapeHTML(
            user.cargo || ""
          )}

          •

          ${escapeHTML(
            user.setor || ""
          )}
        </span>

      </div>

    </div>

    <div class="evaluation-summary-grid">

      <div class="evaluation-summary-item">

        <span>
          Treinamento
        </span>

        <strong>
          ${escapeHTML(
            course.titulo ||
            "-"
          )}
        </strong>

      </div>

      <div class="evaluation-summary-item">

        <span>
          Carga horária
        </span>

        <strong>
          ${Number(
            course.carga_horaria ||
            0
          )}h
        </strong>

      </div>

      <div class="evaluation-summary-item">

        <span>
          Setor
        </span>

        <strong>
          ${escapeHTML(
            sector
          )}
        </strong>

      </div>

      <div class="evaluation-summary-item">

        <span>
          Enviado em
        </span>

        <strong>
          ${formatDateTime(
            enrollment.enviado_em
          )}
        </strong>

      </div>

    </div>

    <div class="evaluation-section-title">

      <h3>
        Atividades
      </h3>

      <p>
        Cada atividade deve ser analisada individualmente.
      </p>

    </div>

    <div class="submission-list">

      ${
        deliveriesHTML ||
        `
          <div class="empty-state">

            <strong>
              Nenhuma entrega encontrada
            </strong>

          </div>
        `
      }

    </div>

    <div class="form-group">

      <label>
        Observação geral
      </label>

      <textarea
        id="evaluationGeneralObservation"
        rows="4"
        placeholder="Comentário geral sobre a avaliação..."
      ></textarea>

    </div>

    <div class="evaluation-decision-actions">

      <button
        type="button"
        class="warning-button"
        id="requestEvaluationCorrectionButton"
      >
        <i class="fa-solid fa-rotate-left"></i>
        Solicitar correção
      </button>

      <button
        type="button"
        class="success-button"
        id="approveEvaluationButton"
      >
        <i class="fa-solid fa-check"></i>
        Aprovar treinamento
      </button>

    </div>
  `;

  bindEvaluationActivityEvents();

  document
    .getElementById(
      "requestEvaluationCorrectionButton"
    )
    ?.addEventListener(
      "click",
      event => {
        finishInternalEvaluation(
          "correcao_solicitada",
          event.currentTarget
        );
      }
    );

  document
    .getElementById(
      "approveEvaluationButton"
    )
    ?.addEventListener(
      "click",
      event => {
        finishInternalEvaluation(
          "aprovado",
          event.currentTarget
        );
      }
    );
}

function createEvaluationActivityHTML(
  delivery,
  index
) {
  const activity =
    getEvaluationActivity(
      delivery.atividade_id
    ) || {};

  const status =
    delivery.status ||
    "";

  const deliveryValue =
    delivery.resposta_texto ||
    delivery.arquivo_url ||
    delivery.link_enviado ||
    "";

  return `
    <article
      class="submission-item"
      data-delivery-id="${delivery.id}"
    >

      <div class="submission-item-header">

        <div>

          <span class="submission-number">
            Atividade ${index + 1}
          </span>

          <h4>
            ${escapeHTML(
              activity.titulo ||
              "Atividade"
            )}
          </h4>

        </div>

        <span class="submission-type-badge">
          ${escapeHTML(
            activity.tipo ||
            "-"
          )}
        </span>

      </div>

      ${
        activity.descricao
          ? `
            <p class="submission-activity-description">
              ${escapeHTML(
                activity.descricao
              )}
            </p>
          `
          : ""
      }

      <div class="submission-answer">

        <span>
          Entrega do colaborador
        </span>

        ${
          deliveryValue
            ? (
                delivery.arquivo_url ||
                delivery.link_enviado
              )
                ? `
                  <a
                    href="${escapeHTML(
                      deliveryValue
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    Abrir entrega
                  </a>
                `
                : `
                  <p>
                    ${escapeHTML(
                      deliveryValue
                    )}
                  </p>
                `
            : `
              <p>
                Nenhuma resposta encontrada.
              </p>
            `
        }

      </div>

      <div class="submission-review">

        <div class="submission-review-buttons">

          <button
            type="button"
            class="
              evaluation-activity-decision
              ok
              ${
                status === "ok"
                  ? "selected"
                  : ""
              }
            "
            data-delivery-status="ok"
            data-delivery-id="${delivery.id}"
          >
            <i class="fa-solid fa-check"></i>
            OK
          </button>

          <button
            type="button"
            class="
              evaluation-activity-decision
              not-ok
              ${
                status === "nao_ok"
                  ? "selected"
                  : ""
              }
            "
            data-delivery-status="nao_ok"
            data-delivery-id="${delivery.id}"
          >
            <i class="fa-solid fa-xmark"></i>
            Não OK
          </button>

        </div>

        <textarea
          rows="3"
          data-delivery-observation="${delivery.id}"
          placeholder="Observação sobre esta atividade..."
        >${escapeHTML(
          delivery.observacao_admin ||
          ""
        )}</textarea>

      </div>

    </article>
  `;
}

function bindEvaluationActivityEvents() {
  document
    .querySelectorAll(
      "[data-delivery-status]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            const deliveryId =
              button.dataset
                .deliveryId;

            const status =
              button.dataset
                .deliveryStatus;

            const delivery =
              currentEvaluation
                ?.deliveries
                ?.find(
                  item =>
                    String(item.id) ===
                    String(deliveryId)
                );

            if (!delivery) {
              return;
            }

            delivery.status =
              status;

            document
              .querySelectorAll(
                `[data-delivery-id="${deliveryId}"][data-delivery-status]`
              )
              .forEach(
                item => {
                  item.classList.remove(
                    "selected"
                  );
                }
              );

            button.classList.add(
              "selected"
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      "[data-delivery-observation]"
    )
    .forEach(
      textarea => {
        textarea.addEventListener(
          "input",
          () => {
            const deliveryId =
              textarea.dataset
                .deliveryObservation;

            const delivery =
              currentEvaluation
                ?.deliveries
                ?.find(
                  item =>
                    String(item.id) ===
                    String(deliveryId)
                );

            if (delivery) {
              delivery
                .observacao_admin =
                textarea.value;
            }
          }
        );
      }
    );
}

async function saveDeliveryEvaluation(
  delivery
) {
  const response =
    await fetch(
      `/api/treinamentos/admin/entregas/${delivery.id}`,
      {
        method: "PATCH",

        headers:
          getAuthHeaders(true),

        body:
          JSON.stringify({
            status:
              delivery.status,

            observacao_admin:
              delivery
                .observacao_admin ||
              ""
          })
      }
    );

  if (
    handleUnauthorized(
      response
    )
  ) {
    throw new Error(
      "Sua sessão expirou."
    );
  }

  const result =
    await getResponseData(
      response
    );

  if (!response.ok) {
    throw new Error(
      result.error ||
      result.details ||
      "Não foi possível avaliar a atividade."
    );
  }

  return result;
}

async function finishInternalEvaluation(
  finalStatus,
  button
) {
  if (!currentEvaluation) {
    return;
  }

  const deliveries =
    currentEvaluation.deliveries ||
    [];

  if (!deliveries.length) {
    alert(
      "Nenhuma atividade foi encontrada para avaliação."
    );

    return;
  }

  for (
    let index = 0;
    index < deliveries.length;
    index++
  ) {
    const delivery =
      deliveries[index];

    if (
      ![
        "ok",
        "nao_ok"
      ].includes(
        delivery.status
      )
    ) {
      alert(
        `Avalie a atividade ${index + 1} como OK ou Não OK.`
      );

      return;
    }

    if (
      delivery.status ===
        "nao_ok" &&
      !String(
        delivery
          .observacao_admin ||
        ""
      ).trim()
    ) {
      alert(
        `Informe o motivo do "Não OK" na atividade ${index + 1}.`
      );

      return;
    }
  }

  const hasRejected =
    deliveries.some(
      delivery =>
        delivery.status ===
        "nao_ok"
    );

  if (
    finalStatus ===
      "aprovado" &&
    hasRejected
  ) {
    alert(
      'Todas as atividades precisam estar marcadas como "OK" para aprovar o treinamento.'
    );

    return;
  }

  if (
    finalStatus ===
      "correcao_solicitada" &&
    !hasRejected
  ) {
    alert(
      'Marque pelo menos uma atividade como "Não OK" para solicitar correção.'
    );

    return;
  }

  const observation =
    document
      .getElementById(
        "evaluationGeneralObservation"
      )
      ?.value
      ?.trim() || "";

  if (
    finalStatus ===
      "correcao_solicitada" &&
    !observation
  ) {
    alert(
      "Informe uma orientação geral para o colaborador."
    );

    return;
  }

  const original =
    button.innerHTML;

  button.disabled = true;

  button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Salvando...
  `;

  try {
    for (
      const delivery of
      deliveries
    ) {
      await saveDeliveryEvaluation(
        delivery
      );
    }

    const response =
      await fetch(
        `/api/treinamentos/admin/avaliacoes/${currentEvaluation.enrollment.id}`,
        {
          method: "PATCH",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify({
              status:
                finalStatus,

              observacao:
                observation
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
        "Não foi possível concluir a avaliação."
      );
    }

    closeModal(
      "evaluationModal"
    );

    currentEvaluation = null;

    await loadEvaluations();

    showGlobalMessage(
      finalStatus ===
      "aprovado"
        ? "Treinamento aprovado com sucesso."
        : "Treinamento devolvido para correção.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao concluir avaliação:",
      error
    );

    alert(
      error.message
    );

  } finally {
    button.disabled = false;

    button.innerHTML =
      original;
  }
}

function renderExternalEvaluationModal() {
  const container =
    document.getElementById(
      "evaluationModalContent"
    );

  if (
    !container ||
    !currentEvaluation
  ) {
    return;
  }

  const enrollment =
    currentEvaluation.enrollment ||
    {};

  const user =
    currentEvaluation.user ||
    {};

  const course =
    currentEvaluation.course ||
    {};

  const certificate =
    currentEvaluation.certificate ||
    null;

  const sector =
    course.setor ||
    course.setor_responsavel ||
    loggedAdmin?.setor ||
    "-";

  container.innerHTML = `
    <div class="modal-header">

      <div class="modal-title-icon">
        <i class="fa-solid fa-certificate"></i>
      </div>

      <div>

        <h2>
          Avaliar curso externo
        </h2>

        <p>
          Confira o certificado enviado pelo colaborador.
        </p>

      </div>

    </div>

    <div class="evaluation-profile">

      <div class="list-avatar">
        ${escapeHTML(
          getInitials(
            user.nome
          )
        )}
      </div>

      <div class="evaluation-profile-info">

        <strong>
          ${escapeHTML(
            user.nome ||
            "Colaborador"
          )}
        </strong>

        <span>
          ${escapeHTML(
            user.cargo || ""
          )}

          •

          ${escapeHTML(
            user.setor || ""
          )}
        </span>

      </div>

    </div>

    <div class="evaluation-summary-grid">

      <div class="evaluation-summary-item">
        <span>
          Treinamento
        </span>

        <strong>
          ${escapeHTML(
            course.titulo ||
            "-"
          )}
        </strong>
      </div>

      <div class="evaluation-summary-item">
        <span>
          Carga horária
        </span>

        <strong>
          ${Number(
            course.carga_horaria ||
            0
          )}h
        </strong>
      </div>

      <div class="evaluation-summary-item">
        <span>
          Setor
        </span>

        <strong>
          ${escapeHTML(
            sector
          )}
        </strong>
      </div>

      <div class="evaluation-summary-item">
        <span>
          Enviado em
        </span>

        <strong>
          ${formatDateTime(
            enrollment.enviado_em
          )}
        </strong>
      </div>

    </div>

    <div class="external-certificate-review">

      <h4>
        Certificado enviado
      </h4>

      <p>
        Confira o documento antes de aprovar o treinamento.
      </p>

      ${
        certificate
          ? `
            <div class="external-certificate-file">

              <i class="fa-solid fa-file-pdf"></i>

              <span>
                ${escapeHTML(
                  certificate.arquivo_nome ||
                  "Certificado"
                )}
              </span>

              ${
                certificate
                  .arquivo_temporario
                  ? `
                    <a
                      href="${escapeHTML(
                        certificate
                          .arquivo_temporario
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir
                    </a>
                  `
                  : ""
              }

            </div>
          `
          : `
            <div class="empty-state">

              <strong>
                Certificado não encontrado
              </strong>

            </div>
          `
      }

    </div>

    <div class="form-group">

      <label>
        Observação
      </label>

      <textarea
        id="externalEvaluationObservation"
        rows="4"
        placeholder="Obrigatório caso solicite um novo certificado..."
      ></textarea>

    </div>

    <div class="evaluation-decision-actions">

      <button
        type="button"
        class="warning-button"
        id="rejectExternalCourseButton"
      >
        <i class="fa-solid fa-rotate-left"></i>
        Solicitar novo certificado
      </button>

      <button
        type="button"
        class="success-button"
        id="approveExternalCourseButton"
      >
        <i class="fa-solid fa-check"></i>
        Aprovar curso
      </button>

    </div>
  `;

  document
    .getElementById(
      "rejectExternalCourseButton"
    )
    ?.addEventListener(
      "click",
      event => {
        finishExternalEvaluation(
          "correcao_solicitada",
          event.currentTarget
        );
      }
    );

  document
    .getElementById(
      "approveExternalCourseButton"
    )
    ?.addEventListener(
      "click",
      event => {
        finishExternalEvaluation(
          "aprovado",
          event.currentTarget
        );
      }
    );
}

async function finishExternalEvaluation(
  status,
  button
) {
  if (!currentEvaluation) {
    return;
  }

  const observation =
    document
      .getElementById(
        "externalEvaluationObservation"
      )
      ?.value
      ?.trim() || "";

  if (
    status ===
      "correcao_solicitada" &&
    !observation
  ) {
    alert(
      "Informe o motivo para solicitar um novo certificado."
    );

    return;
  }

  const original =
    button.innerHTML;

  button.disabled = true;

  button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Salvando...
  `;

  try {
    const response =
      await fetch(
        `/api/treinamentos/admin/avaliacoes/${currentEvaluation.enrollment.id}`,
        {
          method: "PATCH",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify({
              status,

              observacao:
                observation
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
        "Não foi possível concluir a avaliação."
      );
    }

    closeModal(
      "evaluationModal"
    );

    currentEvaluation = null;

    await loadEvaluations();

    showGlobalMessage(
      status ===
      "aprovado"
        ? "Curso externo aprovado com sucesso."
        : "Novo certificado solicitado ao colaborador.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao avaliar curso externo:",
      error
    );

    alert(
      error.message
    );

  } finally {
    button.disabled = false;

    button.innerHTML =
      original;
  }
}

async function publishCertificate(
  enrollmentId,
  file,
  button = null
) {
  if (!file) {
    alert(
      "Selecione o certificado."
    );

    return;
  }

  const formData =
    new FormData();

  formData.append(
    "arquivo",
    file
  );

  const original =
    button
      ? button.innerHTML
      : null;

  if (button) {
    button.disabled = true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Publicando...
    `;
  }

  try {
    const response =
      await fetch(
        `/api/treinamentos/admin/avaliacoes/${enrollmentId}/certificado`,
        {
          method: "POST",

          headers:
            getAuthHeaders(),

          body:
            formData
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
        "Não foi possível publicar o certificado."
      );
    }

    showGlobalMessage(
      result.message ||
      "Certificado publicado com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao publicar certificado:",
      error
    );

    alert(
      error.message
    );

  } finally {
    if (button) {
      button.disabled = false;

      button.innerHTML =
        original;
    }
  }
}

document
  .getElementById(
    "refreshEvaluationsButton"
  )
  ?.addEventListener(
    "click",
    loadEvaluations
  );

/* =========================================================
   FEEDBACKS
   CONTINUA NA PARTE 3
========================================================= */

function getFeedbackTypeLabel(type) {
  const labels = {
    positivo:
      "Positivo",

    desenvolvimento:
      "Desenvolvimento",

    atencao:
      "Atenção",

    solicitacao:
      "Solicitação"
  };

  return (
    labels[type] ||
    "Feedback"
  );
}

function getFeedbackTypeClass(type) {
  const classes = {
    positivo:
      "positive",

    desenvolvimento:
      "development",

    atencao:
      "attention",

    solicitacao:
      "request"
  };

  return (
    classes[type] ||
    "development"
  );
}

function getFeedbackSubjectLabel(subject) {
  const labels = {
    desempenho_geral:
      "Desempenho geral",

    desempenho_tecnico:
      "Desempenho técnico",

    comunicacao:
      "Comunicação",

    organizacao:
      "Organização",

    produtividade:
      "Produtividade",

    relacionamento:
      "Relacionamento",

    desenvolvimento_profissional:
      "Desenvolvimento profissional",

    outro:
      "Outro"
  };

  return (
    labels[subject] ||
    "Feedback"
  );
}

function getFeedbackStatusLabel(status) {
  const labels = {
    pendente:
      "Pendente",

    visualizado:
      "Visualizado",

    aguardando_resposta:
      "Aguardando resposta",

    respondido:
      "Respondido",

    ciente:
      "Ciente"
  };

  return (
    labels[status] ||
    status ||
    "-"
  );
}

function getFeedbackStatusClass(status) {
  const classes = {
    pendente:
      "pending",

    visualizado:
      "viewed",

    aguardando_resposta:
      "waiting",

    respondido:
      "answered",

    ciente:
      "acknowledged"
  };

  return (
    classes[status] ||
    "viewed"
  );
}

async function loadFeedbacksAdmin() {
  const requestsList =
    document.getElementById(
      "feedbackRequestsList"
    );

  const sentList =
    document.getElementById(
      "feedbackSentList"
    );

  const loadingHTML = `
    <div class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Carregando feedbacks...</span>
    </div>
  `;

  if (requestsList) {
    requestsList.innerHTML =
      loadingHTML;
  }

  if (sentList) {
    sentList.innerHTML =
      loadingHTML;
  }

  try {
    const response =
      await fetch(
        "/api/feedbacks/admin",
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
        "Não foi possível carregar os feedbacks."
      );
    }

    const all =
      Array.isArray(result)
        ? result
        : result.feedbacks || [];

    feedbackRequests =
      all.filter(
        feedback =>
          feedback.iniciado_por ===
          "colaborador"
      );

    sentFeedbacks =
      all.filter(
        feedback =>
          feedback.iniciado_por ===
          "admin"
      );

    renderFeedbackAdmin();
    updateFeedbackCounters();
    updateDashboardCounters();

  } catch (error) {
    console.error(
      "Erro ao carregar feedbacks:",
      error
    );

    feedbackRequests = [];
    sentFeedbacks = [];

    renderFeedbackAdmin();
    updateFeedbackCounters();
    updateDashboardCounters();

    showGlobalMessage(
      error.message,
      "error"
    );
  }
}

async function loadFeedbackEmployees() {
  try {
    const response =
      await fetch(
        "/api/feedbacks/admin/colaboradores",
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
      return false;
    }

    const result =
      await getResponseData(
        response
      );

    if (!response.ok) {
      throw new Error(
        result.error ||
        "Não foi possível carregar os colaboradores."
      );
    }

    feedbackEmployees =
      Array.isArray(result)
        ? result
        : result.colaboradores || [];

    populateFeedbackEmployeeSelect();

    return true;

  } catch (error) {
    console.error(
      "Erro ao carregar colaboradores para feedback:",
      error
    );

    feedbackEmployees = [];

    populateFeedbackEmployeeSelect();

    showGlobalMessage(
      error.message,
      "error"
    );

    return false;
  }
}

function populateFeedbackEmployeeSelect() {
  const select =
    document.getElementById(
      "feedbackEmployee"
    );

  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">
      Selecione um colaborador
    </option>
  `;

  feedbackEmployees.forEach(
    employee => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        employee.id;

      option.textContent =
        `${employee.nome} • ${employee.cargo || "Colaborador"}`;

      select.appendChild(option);
    }
  );
}

function switchFeedbackAdminTab(tab) {
  activeFeedbackAdminTab = tab;

  document
    .querySelectorAll(
      "[data-feedback-admin-tab]"
    )
    .forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset
            .feedbackAdminTab ===
            tab
        );
      }
    );

  document
    .getElementById(
      "feedbackRequestsContent"
    )
    ?.classList
    .toggle(
      "active",
      tab === "requests"
    );

  document
    .getElementById(
      "feedbackSentContent"
    )
    ?.classList
    .toggle(
      "active",
      tab === "sent"
    );

  renderFeedbackAdmin();
}

document
  .querySelectorAll(
    "[data-feedback-admin-tab]"
  )
  .forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          switchFeedbackAdminTab(
            button.dataset
              .feedbackAdminTab
          );
        }
      );
    }
  );

function getFilteredAdminFeedbacks(list) {
  const search =
    document
      .getElementById(
        "feedbackAdminSearch"
      )
      ?.value
      ?.trim()
      ?.toLowerCase() || "";

  const status =
    document
      .getElementById(
        "feedbackAdminStatusFilter"
      )
      ?.value || "";

  return list.filter(
    feedback => {
      if (
        status &&
        feedback.status !== status
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        feedback.titulo,
        feedback.mensagem,
        feedback.resposta,
        feedback.colaborador?.nome,
        feedback.colaborador?.cargo,
        getFeedbackSubjectLabel(
          feedback.assunto
        ),
        getFeedbackTypeLabel(
          feedback.tipo
        )
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    }
  );
}

document
  .getElementById(
    "feedbackAdminSearch"
  )
  ?.addEventListener(
    "input",
    renderFeedbackAdmin
  );

document
  .getElementById(
    "feedbackAdminStatusFilter"
  )
  ?.addEventListener(
    "change",
    renderFeedbackAdmin
  );

function renderFeedbackAdmin() {
  renderFeedbackRequests();
  renderSentFeedbacks();
}

function renderFeedbackRequests() {
  const container =
    document.getElementById(
      "feedbackRequestsList"
    );

  if (!container) {
    return;
  }

  const filtered =
    getFilteredAdminFeedbacks(
      feedbackRequests
    );

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-inbox"></i>

        <strong>
          Nenhuma solicitação encontrada
        </strong>

        <span>
          Quando um colaborador solicitar um feedback, o pedido aparecerá aqui.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML = "";

  filtered.forEach(
    feedback => {
      container.appendChild(
        createAdminFeedbackCard(
          feedback,
          true
        )
      );
    }
  );
}

function renderSentFeedbacks() {
  const container =
    document.getElementById(
      "feedbackSentList"
    );

  if (!container) {
    return;
  }

  const filtered =
    getFilteredAdminFeedbacks(
      sentFeedbacks
    );

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-paper-plane"></i>

        <strong>
          Nenhum feedback enviado
        </strong>

        <span>
          Os feedbacks enviados por você aparecerão aqui.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML = "";

  filtered.forEach(
    feedback => {
      container.appendChild(
        createAdminFeedbackCard(
          feedback,
          false
        )
      );
    }
  );
}

function createAdminFeedbackCard(
  feedback,
  isRequest
) {
  const card =
    document.createElement(
      "article"
    );

  card.className =
    "feedback-admin-card";

  if (
    isRequest &&
    !feedback.visualizado_em
  ) {
    card.classList.add(
      "unread"
    );
  }

  const employee =
    feedback.colaborador || {};

  const type =
    isRequest
      ? "solicitacao"
      : feedback.tipo;

  card.innerHTML = `
    <div class="feedback-admin-avatar">

      ${escapeHTML(
        getInitials(
          employee.nome
        )
      )}

    </div>

    <div class="feedback-admin-card-content">

      <div class="feedback-admin-card-top">

        <h3>
          ${escapeHTML(
            feedback.titulo ||
            "Feedback"
          )}
        </h3>

        ${
          isRequest
            ? `
              <span class="feedback-subject-badge">
                ${escapeHTML(
                  getFeedbackSubjectLabel(
                    feedback.assunto
                  )
                )}
              </span>
            `
            : `
              <span
                class="
                  feedback-type-badge
                  ${getFeedbackTypeClass(
                    type
                  )}
                "
              >
                ${escapeHTML(
                  getFeedbackTypeLabel(
                    feedback.tipo
                  )
                )}
              </span>
            `
        }

        <span
          class="
            status-badge
            ${getFeedbackStatusClass(
              feedback.status
            )}
          "
        >
          ${escapeHTML(
            getFeedbackStatusLabel(
              feedback.status
            )
          )}
        </span>

      </div>

      <p class="feedback-admin-card-description">

        ${escapeHTML(
          truncateText(
            feedback.mensagem,
            180
          )
        )}

      </p>

      <div class="feedback-admin-card-meta">

        <span>
          <i class="fa-solid fa-user"></i>

          ${escapeHTML(
            employee.nome ||
            "Colaborador"
          )}
        </span>

        <span>
          <i class="fa-solid fa-briefcase"></i>

          ${escapeHTML(
            employee.cargo ||
            "-"
          )}
        </span>

        <span>
          <i class="fa-regular fa-calendar"></i>

          ${formatDateTime(
            feedback.created_at
          )}
        </span>

      </div>

    </div>

    <div class="feedback-admin-card-actions">

      <button
        type="button"
        class="secondary-button"
        data-admin-feedback-open="${feedback.id}"
      >
        <i class="fa-regular fa-eye"></i>
        Ver detalhes
      </button>

    </div>
  `;

  card
    .querySelector(
      `[data-admin-feedback-open="${feedback.id}"]`
    )
    ?.addEventListener(
      "click",
      () => {
        if (isRequest) {
          openFeedbackRequestDetails(
            feedback.id
          );
        } else {
          openSentFeedbackDetails(
            feedback.id
          );
        }
      }
    );

  return card;
}

function updateFeedbackCounters() {
  const pendingRequests =
    feedbackRequests.filter(
      feedback =>
        [
          "pendente",
          "visualizado"
        ].includes(
          feedback.status
        )
    ).length;

  const waitingEmployee =
    sentFeedbacks.filter(
      feedback =>
        feedback.status ===
        "aguardando_resposta"
    ).length;

  const answered =
    [
      ...feedbackRequests,
      ...sentFeedbacks
    ].filter(
      feedback =>
        [
          "respondido",
          "ciente"
        ].includes(
          feedback.status
        )
    ).length;

  setCounterValue(
    "feedbackPendingRequestsCount",
    pendingRequests
  );

  setCounterValue(
    "feedbackWaitingEmployeeCount",
    waitingEmployee
  );

  setCounterValue(
    "feedbackAnsweredCount",
    answered
  );

  setCounterValue(
    "feedbackRequestsTabCounter",
    feedbackRequests.length
  );

  setCounterValue(
    "feedbackSentTabCounter",
    sentFeedbacks.length
  );

  setCounterValue(
    "feedbackMenuCounter",
    pendingRequests
  );

  setCounterValue(
    "dashboardFeedbacks",
    pendingRequests
  );
}

async function openNewFeedbackModal() {
  const form =
    document.getElementById(
      "newFeedbackForm"
    );

  form?.reset();

  const select =
    document.getElementById(
      "feedbackEmployee"
    );

  if (select) {
    select.innerHTML = `
      <option value="">
        Carregando colaboradores...
      </option>
    `;
  }

  openModal(
    "newFeedbackModal"
  );

  await loadFeedbackEmployees();
}

document
  .getElementById(
    "newFeedbackButton"
  )
  ?.addEventListener(
    "click",
    openNewFeedbackModal
  );

document
  .getElementById(
    "newFeedbackForm"
  )
  ?.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const button =
        document.getElementById(
          "submitNewFeedbackButton"
        );

      if (
        !button ||
        button.disabled
      ) {
        return;
      }

      const payload = {
        colaborador_id:
          document
            .getElementById(
              "feedbackEmployee"
            )
            .value,

        tipo:
          document
            .getElementById(
              "feedbackType"
            )
            .value,

        titulo:
          document
            .getElementById(
              "feedbackTitle"
            )
            .value
            .trim(),

        mensagem:
          document
            .getElementById(
              "feedbackMessage"
            )
            .value
            .trim(),

        exige_resposta:
          document
            .getElementById(
              "feedbackRequiresResponse"
            )
            .checked
      };

      if (
        !payload.colaborador_id ||
        !payload.tipo ||
        !payload.titulo ||
        !payload.mensagem
      ) {
        alert(
          "Preencha todos os campos obrigatórios."
        );

        return;
      }

      const original =
        button.innerHTML;

      button.disabled = true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Enviando...
      `;

      try {
        const response =
          await fetch(
            "/api/feedbacks/admin",
            {
              method: "POST",

              headers:
                getAuthHeaders(
                  true
                ),

              body:
                JSON.stringify(
                  payload
                )
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
            "Não foi possível enviar o feedback."
          );
        }

        closeModal(
          "newFeedbackModal"
        );

        await loadFeedbacksAdmin();

        switchFeedbackAdminTab(
          "sent"
        );

        showGlobalMessage(
          result.message ||
          "Feedback enviado com sucesso.",
          "success"
        );

      } catch (error) {
        console.error(
          "Erro ao enviar feedback:",
          error
        );

        alert(error.message);

      } finally {
        button.disabled = false;
        button.innerHTML =
          original;
      }
    }
  );

async function openFeedbackRequestDetails(
  feedbackId
) {
  const container =
    document.getElementById(
      "feedbackRequestDetailsContent"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="loading-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <span>
        Carregando solicitação...
      </span>

    </div>
  `;

  openModal(
    "feedbackRequestDetailsModal"
  );

  try {
    const response =
      await fetch(
        `/api/feedbacks/admin/${feedbackId}`,
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

    const feedback =
      await getResponseData(
        response
      );

    if (!response.ok) {
      throw new Error(
        feedback.error ||
        "Não foi possível abrir a solicitação."
      );
    }

    currentFeedback =
      feedback;

    updateAdminFeedbackLocal(
      feedback
    );

    updateFeedbackCounters();
    renderFeedbackAdmin();

    renderFeedbackRequestDetails(
      feedback
    );

  } catch (error) {
    console.error(
      "Erro ao abrir solicitação de feedback:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Não foi possível abrir a solicitação
        </strong>

        <span>
          ${escapeHTML(
            error.message
          )}
        </span>

      </div>
    `;
  }
}

function renderFeedbackRequestDetails(
  feedback
) {
  const container =
    document.getElementById(
      "feedbackRequestDetailsContent"
    );

  if (!container) {
    return;
  }

  const employee =
    feedback.colaborador || {};

  const responseHTML =
    feedback.resposta
      ? `
        <div class="feedback-response-box">

          <span>
            Sua resposta
          </span>

          <p>
            ${escapeHTML(
              feedback.resposta
            )}
          </p>

        </div>
      `
      : "";

  const actions =
    [
      "pendente",
      "visualizado"
    ].includes(
      feedback.status
    )
      ? `
        <div class="feedback-detail-actions">

          <button
            type="button"
            class="primary-button"
            id="answerCurrentFeedbackRequestButton"
          >
            <i class="fa-solid fa-reply"></i>
            Responder solicitação
          </button>

        </div>
      `
      : "";

  container.innerHTML = `
    <div class="feedback-detail-header">

      <div class="feedback-detail-type">

        <span class="feedback-subject-badge">
          ${escapeHTML(
            getFeedbackSubjectLabel(
              feedback.assunto
            )
          )}
        </span>

      </div>

      <h2>
        ${escapeHTML(
          feedback.titulo ||
          "Solicitação de feedback"
        )}
      </h2>

    </div>

    <div class="feedback-detail-profile">

      <div class="feedback-detail-profile-avatar">
        ${escapeHTML(
          getInitials(
            employee.nome
          )
        )}
      </div>

      <div class="feedback-detail-profile-info">

        <strong>
          ${escapeHTML(
            employee.nome ||
            "Colaborador"
          )}
        </strong>

        <span>
          ${escapeHTML(
            employee.cargo || ""
          )}
          •
          ${escapeHTML(
            employee.setor || ""
          )}
        </span>

      </div>

    </div>

    <div class="feedback-detail-meta">

      <span>
        <i class="fa-regular fa-calendar"></i>

        ${formatDateTime(
          feedback.created_at
        )}
      </span>

      <span
        class="
          status-badge
          ${getFeedbackStatusClass(
            feedback.status
          )}
        "
      >
        ${escapeHTML(
          getFeedbackStatusLabel(
            feedback.status
          )
        )}
      </span>

    </div>

    <div class="feedback-message-box">

      <span>
        Solicitação do colaborador
      </span>

      <p>
        ${escapeHTML(
          feedback.mensagem || ""
        )}
      </p>

    </div>

    ${responseHTML}
    ${actions}
  `;

  document
    .getElementById(
      "answerCurrentFeedbackRequestButton"
    )
    ?.addEventListener(
      "click",
      () => {
        openAnswerFeedbackRequestModal(
          feedback
        );
      }
    );
}

function openAnswerFeedbackRequestModal(
  feedback
) {
  const employee =
    feedback.colaborador || {};

  const id =
    document.getElementById(
      "answerFeedbackRequestId"
    );

  const textarea =
    document.getElementById(
      "answerFeedbackRequestText"
    );

  if (id) {
    id.value = feedback.id;
  }

  if (textarea) {
    textarea.value = "";
  }

  const context =
    document.getElementById(
      "feedbackRequestContext"
    );

  if (context) {
    context.innerHTML = `
      <strong>
        ${escapeHTML(
          employee.nome ||
          "Colaborador"
        )}
        •
        ${escapeHTML(
          getFeedbackSubjectLabel(
            feedback.assunto
          )
        )}
      </strong>

      <p>
        ${escapeHTML(
          truncateText(
            feedback.mensagem,
            350
          )
        )}
      </p>
    `;
  }

  openModal(
    "answerFeedbackRequestModal"
  );
}

document
  .getElementById(
    "answerFeedbackRequestForm"
  )
  ?.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const feedbackId =
        document
          .getElementById(
            "answerFeedbackRequestId"
          )
          .value;

      const answer =
        document
          .getElementById(
            "answerFeedbackRequestText"
          )
          .value
          .trim();

      if (
        !feedbackId ||
        !answer
      ) {
        alert(
          "Informe a resposta do feedback."
        );

        return;
      }

      const button =
        document.getElementById(
          "submitFeedbackRequestAnswerButton"
        );

      if (
        !button ||
        button.disabled
      ) {
        return;
      }

      const original =
        button.innerHTML;

      button.disabled = true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Enviando...
      `;

      try {
        const response =
          await fetch(
            `/api/feedbacks/admin/${feedbackId}/responder`,
            {
              method: "PATCH",

              headers:
                getAuthHeaders(
                  true
                ),

              body:
                JSON.stringify({
                  resposta:
                    answer
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
            "Não foi possível responder à solicitação."
          );
        }

        closeModal(
          "answerFeedbackRequestModal"
        );

        closeModal(
          "feedbackRequestDetailsModal"
        );

        currentFeedback = null;

        await loadFeedbacksAdmin();

        showGlobalMessage(
          result.message ||
          "Solicitação respondida com sucesso.",
          "success"
        );

      } catch (error) {
        console.error(
          "Erro ao responder solicitação de feedback:",
          error
        );

        alert(error.message);

      } finally {
        button.disabled = false;
        button.innerHTML =
          original;
      }
    }
  );

async function openSentFeedbackDetails(
  feedbackId
) {
  const container =
    document.getElementById(
      "sentFeedbackDetailsContent"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="loading-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <span>
        Carregando feedback...
      </span>

    </div>
  `;

  openModal(
    "sentFeedbackDetailsModal"
  );

  try {
    const response =
      await fetch(
        `/api/feedbacks/admin/${feedbackId}`,
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

    const feedback =
      await getResponseData(
        response
      );

    if (!response.ok) {
      throw new Error(
        feedback.error ||
        "Não foi possível abrir o feedback."
      );
    }

    currentFeedback =
      feedback;

    updateAdminFeedbackLocal(
      feedback
    );

    renderFeedbackAdmin();
    updateFeedbackCounters();

    renderSentFeedbackDetails(
      feedback
    );

  } catch (error) {
    console.error(
      "Erro ao abrir feedback enviado:",
      error
    );

    container.innerHTML = `
      <div class="empty-state">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Não foi possível abrir o feedback
        </strong>

        <span>
          ${escapeHTML(
            error.message
          )}
        </span>

      </div>
    `;
  }
}

function renderSentFeedbackDetails(
  feedback
) {
  const container =
    document.getElementById(
      "sentFeedbackDetailsContent"
    );

  if (!container) {
    return;
  }

  const employee =
    feedback.colaborador || {};

  const typeClass =
    getFeedbackTypeClass(
      feedback.tipo
    );

  let notice = "";

  if (
    feedback.status ===
    "aguardando_resposta"
  ) {
    notice = `
      <div class="feedback-action-notice waiting">

        <i class="fa-regular fa-clock"></i>

        <span>
          Este feedback está aguardando uma resposta do colaborador.
        </span>

      </div>
    `;
  }

  if (
    feedback.status ===
    "respondido"
  ) {
    notice = `
      <div class="feedback-action-notice success">

        <i class="fa-solid fa-circle-check"></i>

        <span>
          O colaborador respondeu a este feedback.
        </span>

      </div>
    `;
  }

  if (
    feedback.status ===
    "ciente"
  ) {
    notice = `
      <div class="feedback-action-notice success">

        <i class="fa-solid fa-check"></i>

        <span>
          O colaborador confirmou ciência deste feedback.
        </span>

      </div>
    `;
  }

  container.innerHTML = `
    <div class="feedback-detail-header">

      <div class="feedback-detail-type">

        <span
          class="
            feedback-type-badge
            ${typeClass}
          "
        >
          ${escapeHTML(
            getFeedbackTypeLabel(
              feedback.tipo
            )
          )}
        </span>

      </div>

      <h2>
        ${escapeHTML(
          feedback.titulo ||
          "Feedback"
        )}
      </h2>

    </div>

    <div class="feedback-detail-profile">

      <div class="feedback-detail-profile-avatar">
        ${escapeHTML(
          getInitials(
            employee.nome
          )
        )}
      </div>

      <div class="feedback-detail-profile-info">

        <strong>
          ${escapeHTML(
            employee.nome ||
            "Colaborador"
          )}
        </strong>

        <span>
          ${escapeHTML(
            employee.cargo || ""
          )}
          •
          ${escapeHTML(
            employee.setor || ""
          )}
        </span>

      </div>

    </div>

    <div class="feedback-detail-meta">

      <span>
        <i class="fa-regular fa-calendar"></i>

        ${formatDateTime(
          feedback.created_at
        )}
      </span>

      <span
        class="
          status-badge
          ${getFeedbackStatusClass(
            feedback.status
          )}
        "
      >
        ${escapeHTML(
          getFeedbackStatusLabel(
            feedback.status
          )
        )}
      </span>

    </div>

    <div class="feedback-message-box">

      <span>
        Feedback enviado
      </span>

      <p>
        ${escapeHTML(
          feedback.mensagem || ""
        )}
      </p>

    </div>

    ${
      feedback.resposta
        ? `
          <div class="employee-feedback-response">

            <span>
              Resposta do colaborador
            </span>

            <p>
              ${escapeHTML(
                feedback.resposta
              )}
            </p>

          </div>
        `
        : ""
    }

    ${notice}

    <div
      class="
        feedback-requirement
        ${
          feedback.exige_resposta
            ? "required"
            : "optional"
        }
      "
    >

      <i
        class="
          fa-solid
          ${
            feedback.exige_resposta
              ? "fa-reply"
              : "fa-check"
          }
        "
      ></i>

      ${
        feedback.exige_resposta
          ? "Resposta do colaborador solicitada"
          : "Apenas ciência do colaborador necessária"
      }

    </div>
  `;
}

function updateAdminFeedbackLocal(
  updated
) {
  feedbackRequests =
    feedbackRequests.map(
      feedback =>
        String(feedback.id) ===
        String(updated.id)
          ? {
              ...feedback,
              ...updated
            }
          : feedback
    );

  sentFeedbacks =
    sentFeedbacks.map(
      feedback =>
        String(feedback.id) ===
        String(updated.id)
          ? {
              ...feedback,
              ...updated
            }
          : feedback
    );
}

document
  .getElementById(
    "refreshFeedbackAdminButton"
  )
  ?.addEventListener(
    "click",
    loadFeedbacksAdmin
  );

/* =========================================================
   PONTO
========================================================= */

function mapApiPoint(record) {
  const user =
    record.usuario ||
    {};

  const scheduleSource =
    record.jornada ||
    record.jornada_ponto ||
    user.jornada ||
    {};

  const schedule =
    normalizeSchedule(
      scheduleSource
    );

  const overtime =
    Number(
      record.horas_extras || 0
    );

  return {
    id: record.id,

    employeeId:
      record.usuario_id ||
      user.id ||
      "",

    employeeName:
      record.nome ||
      user.nome ||
      "Colaborador",

    registration:
      record.matricula ||
      user.matricula ||
      "",

    role:
      record.cargo ||
      user.cargo ||
      "",

    sector:
      record.setor ||
      user.setor ||
      loggedAdmin?.setor ||
      "",

    date:
      record.data ||
      record.data_ponto ||
      "",

    entry:
      record.entrada || "",

    breakTime:
      record.intervalo ||
      record.inicio_intervalo ||
      "",

    returnTime:
      record.retorno ||
      record.fim_intervalo ||
      "",

    exit:
      record.saida || "",

    workedHours:
      record.horas_trabalhadas ??
      0,

    overtime,

    status:
      record.status ||
      record.situacao ||
      "",

    schedule,

    document:
      record.documento_url ||
      record.documento ||
      record.anexo_url ||
      null,

    documentName:
      record.documento_nome ||
      record.nome_arquivo ||
      "Documento anexado",

    observation:
      record.observacao_admin ||
      record.observacao ||
      ""
  };
}

function formatPointHours(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "0h 00min";
  }

  if (
    typeof value === "string" &&
    value.includes(":")
  ) {
    const [
      hours,
      minutes
    ] =
      value
        .split(":")
        .map(Number);

    return `${hours || 0}h ${String(
      minutes || 0
    ).padStart(2, "0")}min`;
  }

  const totalMinutes =
    Math.round(
      Number(value || 0) * 60
    );

  return `${Math.floor(
    totalMinutes / 60
  )}h ${String(
    totalMinutes % 60
  ).padStart(2, "0")}min`;
}

function hasPointDelay(record) {
  const schedule =
    record.schedule || {};

  if (!schedule.configured) {
    return false;
  }

  const tolerance = 10;

  const expectedEntry =
    timeToMinutes(
      schedule.entry
    );

  const actualEntry =
    timeToMinutes(
      record.entry
    );

  const expectedReturn =
    timeToMinutes(
      schedule.returnTime
    );

  const actualReturn =
    timeToMinutes(
      record.returnTime
    );

  const entryDelay =
    expectedEntry !== null &&
    actualEntry !== null &&
    actualEntry >
      expectedEntry + tolerance;

  const returnDelay =
    expectedReturn !== null &&
    actualReturn !== null &&
    actualReturn >
      expectedReturn + tolerance;

  return (
    entryDelay ||
    returnDelay
  );
}

function getPointStatus(record) {
  const normalized =
    String(
      record.status || ""
    ).toLowerCase();

  if (
    [
      "absence",
      "falta",
      "ausente"
    ].includes(normalized)
  ) {
    return {
      className: "absence",
      label: "Falta"
    };
  }

  if (
    [
      "delay",
      "atraso",
      "atrasado"
    ].includes(normalized) ||
    hasPointDelay(record)
  ) {
    return {
      className: "delay",
      label: "Atraso"
    };
  }

  if (
    [
      "overtime",
      "hora_extra",
      "horas_extras"
    ].includes(normalized) ||
    Number(record.overtime) > 0
  ) {
    return {
      className: "overtime",
      label: "Hora extra"
    };
  }

  if (
    [
      "incomplete",
      "incompleto",
      "pendente"
    ].includes(normalized)
  ) {
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

function getPointScheduleHTML(record) {
  const schedule =
    record.schedule || {};

  if (
    !schedule.configured ||
    !schedule.entry ||
    !schedule.exit
  ) {
    return `
      <div class="point-schedule-cell">
        <strong class="not-configured">
          Não configurada
        </strong>
      </div>
    `;
  }

  return `
    <div class="point-schedule-cell">
      <strong>
        ${escapeHTML(schedule.entry)}
        -
        ${escapeHTML(schedule.exit)}
      </strong>

      <span>
        ${escapeHTML(
          schedule.breakTime || "--:--"
        )}
        -
        ${escapeHTML(
          schedule.returnTime || "--:--"
        )}
      </span>
    </div>
  `;
}

function populatePointEmployeeFilter() {
  const select =
    document.getElementById(
      "pointEmployeeFilter"
    );

  if (!select) {
    return;
  }

  const previous =
    select.value;

  const collaborators =
    employees.filter(
      employee =>
        employee.profile ===
          "colaborador" &&
        employee.active
    );

  select.innerHTML = `
    <option value="">
      Todos os colaboradores
    </option>

    ${collaborators
      .map(
        employee => `
          <option
            value="${escapeHTML(
              employee.id
            )}"
          >
            ${escapeHTML(
              employee.name
            )}
          </option>
        `
      )
      .join("")}
  `;

  if (
    collaborators.some(
      employee =>
        String(employee.id) ===
        String(previous)
    )
  ) {
    select.value = previous;
  }
}

function configurePointMonth() {
  const input =
    document.getElementById(
      "pointMonthFilter"
    );

  if (
    input &&
    !input.value
  ) {
    const today =
      new Date();

    input.value =
      `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;
  }
}

async function loadPointRecords(
  showError = true
) {
  const tbody =
    document.getElementById(
      "pointRecordsTableBody"
    );

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12">
          <div class="table-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Carregando registros...
          </div>
        </td>
      </tr>
    `;
  }

  configurePointMonth();
  populatePointEmployeeFilter();

  const month =
    document
      .getElementById(
        "pointMonthFilter"
      )
      ?.value || "";

  const employeeId =
    document
      .getElementById(
        "pointEmployeeFilter"
      )
      ?.value || "";

  const params =
    new URLSearchParams();

  if (month) {
    params.set(
      "mes",
      month
    );
  }

  if (employeeId) {
    params.set(
      "usuario_id",
      employeeId
    );
  }

  try {
    const query =
      params.toString();

    const response =
      await fetch(
        `/api/ponto/admin${
          query
            ? `?${query}`
            : ""
        }`,
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
        "Não foi possível carregar os registros de ponto."
      );
    }

    const data =
      Array.isArray(result)
        ? result
        : (
            result.registros ||
            result.pontos ||
            []
          );

    pointRecords =
      data.map(
        record => {
          const mapped =
            mapApiPoint(record);

          const employee =
            employees.find(
              item =>
                String(item.id) ===
                String(
                  mapped.employeeId
                )
            );

          if (
            employee &&
            !mapped.schedule.configured
          ) {
            mapped.schedule =
              employee.schedule ||
              normalizeSchedule();
          }

          return mapped;
        }
      );

    renderPointRecords();
    updatePointSummary();
    updateDashboardCounters();

  } catch (error) {
    console.error(
      "Erro ao carregar ponto:",
      error
    );

    pointRecords = [];

    renderPointRecords();
    updatePointSummary();
    updateDashboardCounters();

    if (showError) {
      showGlobalMessage(
        error.message,
        "error"
      );
    }
  }
}

function getFilteredPointRecords() {
  const search =
    document
      .getElementById(
        "pointEmployeeSearch"
      )
      ?.value
      ?.trim()
      ?.toLowerCase() || "";

  const employeeId =
    document
      .getElementById(
        "pointEmployeeFilter"
      )
      ?.value || "";

  return pointRecords.filter(
    record => {
      if (
        employeeId &&
        String(record.employeeId) !==
          String(employeeId)
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        record.employeeName,
        record.registration,
        record.role
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    }
  );
}

function renderPointRecords() {
  const tbody =
    document.getElementById(
      "pointRecordsTableBody"
    );

  if (!tbody) {
    return;
  }

  const records =
    getFilteredPointRecords();

  if (!records.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12">
          <div class="table-loading">
            Nenhum registro encontrado.
          </div>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    records
      .map(
        record => {
          const status =
            getPointStatus(
              record
            );

          return `
            <tr>

              <td>
                <div class="employee-cell">

                  <div class="table-avatar">
                    ${escapeHTML(
                      getInitials(
                        record.employeeName
                      )
                    )}
                  </div>

                  <strong>
                    ${escapeHTML(
                      record.employeeName
                    )}
                  </strong>

                </div>
              </td>

              <td>
                ${getPointScheduleHTML(
                  record
                )}
              </td>

              <td>
                ${formatDate(
                  record.date
                )}
              </td>

              <td>
                ${escapeHTML(
                  record.entry ||
                  "--:--"
                )}
              </td>

              <td>
                ${escapeHTML(
                  record.breakTime ||
                  "--:--"
                )}
              </td>

              <td>
                ${escapeHTML(
                  record.returnTime ||
                  "--:--"
                )}
              </td>

              <td>
                ${escapeHTML(
                  record.exit ||
                  "--:--"
                )}
              </td>

              <td>
                ${formatPointHours(
                  record.workedHours
                )}
              </td>

              <td>
                ${formatPointHours(
                  record.overtime
                )}
              </td>

              <td>
                <span
                  class="
                    point-status
                    ${status.className}
                  "
                >
                  ${status.label}
                </span>
              </td>

              <td>
                ${
                  record.document
                    ? `
                      <button
                        type="button"
                        class="point-document-button"
                        onclick="
                          openPointDocument(
                            '${record.id}'
                          )
                        "
                      >
                        <i class="fa-solid fa-paperclip"></i>
                        Ver
                      </button>
                    `
                    : "-"
                }
              </td>

              <td>
                <button
                  type="button"
                  class="table-action"
                  title="Alterar registro"
                  onclick="
                    openPointEditModal(
                      '${record.id}'
                    )
                  "
                >
                  <i class="fa-solid fa-pen"></i>
                </button>
              </td>

            </tr>
          `;
        }
      )
      .join("");
}

function updatePointSummary() {
  const today =
    new Date();

  const todayString =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

  const todayCount =
    pointRecords.filter(
      record =>
        String(
          record.date || ""
        ).slice(0, 10) ===
          todayString &&
        record.entry
    ).length;

  const delays =
    pointRecords.filter(
      record =>
        getPointStatus(record)
          .className ===
        "delay"
    ).length;

  const absences =
    pointRecords.filter(
      record =>
        getPointStatus(record)
          .className ===
        "absence"
    ).length;

  const overtime =
    pointRecords.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.overtime || 0
        ),
      0
    );

  setCounterValue(
    "pointTodayCount",
    todayCount
  );

  setCounterValue(
    "pointDelayCount",
    delays
  );

  setCounterValue(
    "pointAbsenceCount",
    absences
  );

  setCounterValue(
    "pointOvertimeTotal",
    formatPointHours(
      overtime
    )
  );
}

function openPointEditModal(
  recordId
) {
  const record =
    pointRecords.find(
      item =>
        String(item.id) ===
        String(recordId)
    );

  if (!record) {
    return;
  }

  currentPointRecord =
    record;

  const values = {
    pointEditRecordId:
      record.id,

    pointEditEmployeeId:
      record.employeeId,

    pointEditEntry:
      record.entry,

    pointEditBreak:
      record.breakTime,

    pointEditReturn:
      record.returnTime,

    pointEditExit:
      record.exit,

    pointEditObservation:
      ""
  };

  Object.entries(values)
    .forEach(
      ([id, value]) => {
        const element =
          document.getElementById(id);

        if (element) {
          element.value =
            value || "";
        }
      }
    );

  const name =
    document.getElementById(
      "pointEditEmployeeName"
    );

  const date =
    document.getElementById(
      "pointEditDate"
    );

  const documentName =
    document.getElementById(
      "pointEditDocumentName"
    );

  const documentButton =
    document.getElementById(
      "pointEditOpenDocumentButton"
    );

  if (name) {
    name.textContent =
      record.employeeName;
  }

  if (date) {
    date.textContent =
      formatDate(
        record.date
      );
  }

  if (documentName) {
    documentName.textContent =
      record.document
        ? record.documentName
        : "Nenhum documento";
  }

  if (documentButton) {
    documentButton.disabled =
      !record.document;
  }

  hidePointEditMessage();

  openModal(
    "pointEditModal"
  );
}

function showPointEditMessage(
  message,
  type = "error"
) {
  const element =
    document.getElementById(
      "pointEditMessage"
    );

  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.className =
    `modal-message ${type}`;
}

function hidePointEditMessage() {
  const element =
    document.getElementById(
      "pointEditMessage"
    );

  if (!element) {
    return;
  }

  element.textContent = "";
  element.className =
    "modal-message";
}

async function savePointEdit(event) {
  event.preventDefault();

  if (!currentPointRecord) {
    return;
  }

  const observation =
    document
      .getElementById(
        "pointEditObservation"
      )
      ?.value
      ?.trim() || "";

  if (!observation) {
    showPointEditMessage(
      "Informe o motivo da alteração.",
      "error"
    );

    return;
  }

  const payload = {
    entrada:
      document
        .getElementById(
          "pointEditEntry"
        )
        ?.value || null,

    intervalo:
      document
        .getElementById(
          "pointEditBreak"
        )
        ?.value || null,

    retorno:
      document
        .getElementById(
          "pointEditReturn"
        )
        ?.value || null,

    saida:
      document
        .getElementById(
          "pointEditExit"
        )
        ?.value || null,

    motivo_alteracao:
      observation
  };

  const button =
    document.getElementById(
      "savePointEditButton"
    );

  const original =
    button?.innerHTML;

  if (button) {
    button.disabled = true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Salvando...
    `;
  }

  hidePointEditMessage();

  try {
    const response =
      await fetch(
        `/api/ponto/admin/${currentPointRecord.id}`,
        {
          method: "PUT",

          headers:
            getAuthHeaders(true),

          body:
            JSON.stringify(
              payload
            )
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
        "Não foi possível alterar o registro de ponto."
      );
    }

    closeModal(
      "pointEditModal"
    );

    await loadPointRecords();

    showGlobalMessage(
      result.message ||
      "Registro de ponto alterado com sucesso.",
      "success"
    );

  } catch (error) {
    console.error(
      "Erro ao alterar ponto:",
      error
    );

    showPointEditMessage(
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

function openPointDocument(
  recordId
) {
  const record =
    pointRecords.find(
      item =>
        String(item.id) ===
        String(recordId)
    ) ||
    currentPointRecord;

  if (!record?.document) {
    return;
  }

  window.open(
    record.document,
    "_blank",
    "noopener,noreferrer"
  );
}

document
  .getElementById(
    "pointEmployeeSearch"
  )
  ?.addEventListener(
    "input",
    renderPointRecords
  );

document
  .getElementById(
    "pointEmployeeFilter"
  )
  ?.addEventListener(
    "change",
    () => {
      loadPointRecords();
    }
  );

document
  .getElementById(
    "pointMonthFilter"
  )
  ?.addEventListener(
    "change",
    () => {
      loadPointRecords();
    }
  );

document
  .getElementById(
    "refreshPointButton"
  )
  ?.addEventListener(
    "click",
    () => {
      loadPointRecords();
    }
  );

document
  .getElementById(
    "pointEditForm"
  )
  ?.addEventListener(
    "submit",
    savePointEdit
  );

document
  .getElementById(
    "pointEditOpenDocumentButton"
  )
  ?.addEventListener(
    "click",
    () => {
      if (
        currentPointRecord
      ) {
        openPointDocument(
          currentPointRecord.id
        );
      }
    }
  );

/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboardCounters() {
  const activeEmployees =
    employees.filter(
      employee =>
        employee.active &&
        employee.profile ===
        "colaborador"
    ).length;

  const activeCourses =
    courses.filter(
      course =>
        course.active
    ).length;

  const pendingEvaluations =
    evaluations.length;

  const pendingVacations =
    vacationRequests.length;

  const pendingFeedbacks =
    feedbackRequests.filter(
      feedback =>
        [
          "pendente",
          "visualizado"
        ].includes(
          feedback.status
        )
    ).length;

  const today =
    new Date();

  const todayString =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

  const todayPointRecords =
    pointRecords.filter(
      record =>
        String(
          record.date || ""
        ).slice(0, 10) ===
          todayString &&
        record.entry
    ).length;

  setCounterValue(
    "dashboardEmployees",
    activeEmployees
  );

  setCounterValue(
    "dashboardTrainings",
    activeCourses
  );

  setCounterValue(
    "dashboardEvaluations",
    pendingEvaluations
  );

  setCounterValue(
    "dashboardVacations",
    pendingVacations
  );

  setCounterValue(
    "dashboardFeedbacks",
    pendingFeedbacks
  );

  setCounterValue(
    "dashboardPointRecords",
    todayPointRecords
  );

  setCounterValue(
    "evaluationMenuCounter",
    pendingEvaluations
  );

  setCounterValue(
    "vacationMenuCounter",
    pendingVacations
  );

  setCounterValue(
    "feedbackMenuCounter",
    pendingFeedbacks
  );

  setCounterValue(
    "vacationPendingCount",
    pendingVacations
  );
}

/* =========================================================
   LOGOUT
========================================================= */

function logout() {
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

document
  .getElementById(
    "logoutButton"
  )
  ?.addEventListener(
    "click",
    logout
  );

/* =========================================================
   INICIALIZAÇÃO DO ADMIN
========================================================= */

async function initializeAdmin() {
  if (!validateSession()) {
    return;
  }

  renderLoggedAdmin();

  configureAdminPermissions();

  populateSectorSelects();

  configurePointMonth();

  changePage(
    "dashboard"
  );

  await Promise.all([
    loadEmployees(),
    loadCourses(),
    loadVacationRequests(),
    loadEvaluations(),
    loadFeedbacksAdmin(),
    loadPointRecords(false)
  ]);

  updateFeedbackCounters();

  updatePointSummary();

  updateDashboardCounters();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
  );
} else {
  initializeAdmin();
}

/* =========================================================
   FUNÇÕES UTILIZADAS PELO HTML
========================================================= */

Object.assign(
  window,
  {
    changePage,
    openModal,
    closeModal,
    openUserModal,
    createEmployee,
    openEmployeeEditModal,
    openWorkScheduleModal,
    openUserDeleteModal,
    openVacationPeriodModal,
    openVacationDecisionModal,
    openCourseModal,
    toggleExternalCourse,
    addActivity,
    removeActivity,
    updateActivity,
    createCourse,
    openCourseDetails,
    prepareCourseRemoval,
    openEvaluationModal,
    publishCertificate,
    openNewFeedbackModal,
    openFeedbackRequestDetails,
    openSentFeedbackDetails,
    switchFeedbackAdminTab,
    loadFeedbacksAdmin,
    openPointEditModal,
    openPointDocument,
    loadPointRecords,
    logout
  }
);