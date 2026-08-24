// ==========================================================
// EVOLUA+
// ÁREA ADMINISTRATIVA
// APP.JS
// ==========================================================
//
// MÓDULOS:
//
// 1. Sessão
// 2. Navegação
// 3. Funcionários
// 4. Configuração de férias
// 5. Solicitações de férias
// 6. Treinamentos
// 7. Avaliações
// 8. Certificados
// 9. Dashboard
//
// ==========================================================



// ==========================================================
// CONFIGURAÇÕES
// ==========================================================

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



// ==========================================================
// ==========================================================
// SESSÃO
// ==========================================================
// ==========================================================

const accessToken =
  localStorage.getItem(
    "access_token"
  );


let loggedAdmin = null;



// ==========================================================
// RECUPERAR USUÁRIO SALVO
// ==========================================================

try {

  const storedUser =
    localStorage.getItem(
      "usuario_logado"
    );


  if (storedUser) {

    loggedAdmin =
      JSON.parse(
        storedUser
      );

  }

} catch (error) {

  console.error(
    "Erro ao recuperar usuário salvo:",
    error
  );

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
// VALIDAR SESSÃO
// ==========================================================

function validateSession() {

  if (
    !accessToken
    ||
    !loggedAdmin
  ) {

    window.location.href =
      "/login/";


    return false;

  }


  const allowedProfiles = [
    "admin_principal",
    "admin_setor"
  ];


  if (
    !allowedProfiles.includes(
      loggedAdmin.perfil
    )
  ) {

    window.location.href =
      "/treinamentos/";


    return false;

  }


  if (
    loggedAdmin.ativo === false
  ) {

    clearSession();


    window.location.href =
      "/login/";


    return false;

  }


  return true;

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
    response.status !== 401
  ) {

    return false;

  }


  clearSession();


  alert(
    "Sua sessão expirou. Faça login novamente."
  );


  window.location.href =
    "/login/";


  return true;

}



// ==========================================================
// LER JSON COM SEGURANÇA
// ==========================================================

async function getResponseData(
  response
) {

  try {

    return await response.json();

  } catch (error) {

    return {};

  }

}



// ==========================================================
// ==========================================================
// ESTADO GLOBAL
// ==========================================================
// ==========================================================

let employees = [];

let courses = [];

let vacationRequests = [];

let evaluations = [];

let temporaryActivities = [];

let currentUserCreationProfile =
  "colaborador";

let currentVacationRequest =
  null;

let currentEvaluation =
  null;

let coursePendingRemoval =
  null;



// ==========================================================
// ==========================================================
// UTILITÁRIOS
// ==========================================================
// ==========================================================

function escapeHTML(
  value
) {

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



// ==========================================================
// INICIAIS
// ==========================================================

function getInitials(
  name
) {

  const parts =
    String(
      name || ""
    )
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );


  if (
    parts.length === 0
  ) {

    return "--";

  }


  if (
    parts.length === 1
  ) {

    return parts[0]
      .substring(
        0,
        2
      )
      .toUpperCase();

  }


  return (
    parts[0][0]
    +
    parts[
      parts.length - 1
    ][0]
  )
    .toUpperCase();

}



// ==========================================================
// FORMATAR DATA
// ==========================================================

function formatDate(
  value
) {

  if (!value) {

    return "-";

  }


  const dateString =
    String(
      value
    )
      .substring(
        0,
        10
      );


  const parts =
    dateString.split(
      "-"
    );


  if (
    parts.length !== 3
  ) {

    return dateString;

  }


  return (
    `${parts[2]}/${parts[1]}/${parts[0]}`
  );

}



// ==========================================================
// FORMATAR DATA E HORA
// ==========================================================

function formatDateTime(
  value
) {

  if (!value) {

    return "-";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return date.toLocaleString(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short"
    }
  );

}



// ==========================================================
// MENSAGEM GLOBAL
// ==========================================================

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

      element.className =
        "global-message";


      element.textContent =
        "";

    },
    4500
  );

}



// ==========================================================
// DEFINIR CONTADOR
// ==========================================================

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
      String(
        value
      );

  }

}



// ==========================================================
// ==========================================================
// MODAIS
// ==========================================================
// ==========================================================

function openModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {

    return;

  }


  modal.classList.add(
    "show"
  );


  document.body.classList.add(
    "modal-open"
  );

}



// ==========================================================
// FECHAR MODAL
// ==========================================================

function closeModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "show"
  );


  const anotherModal =
    document.querySelector(
      ".modal-overlay.show"
    );


  if (!anotherModal) {

    document.body.classList.remove(
      "modal-open"
    );

  }


  if (
    modalId ===
    "evaluationModal"
  ) {

    currentEvaluation =
      null;

  }


  if (
    modalId ===
    "vacationDecisionModal"
  ) {

    currentVacationRequest =
      null;

  }

}



// ==========================================================
// CLICAR FORA DO MODAL
// ==========================================================

document
  .querySelectorAll(
    ".modal-overlay"
  )
  .forEach(
    modal => {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target === modal
          ) {

            closeModal(
              modal.id
            );

          }

        }
      );

    }
  );



// ==========================================================
// ESC
// ==========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {

      return;

    }


    const openedModal =
      document.querySelector(
        ".modal-overlay.show"
      );


    if (openedModal) {

      closeModal(
        openedModal.id
      );

    }

  }
);



// ==========================================================
// ==========================================================
// ADMIN LOGADO
// ==========================================================
// ==========================================================

function renderLoggedAdmin() {

  if (!loggedAdmin) {

    return;

  }


  const name =
    document.getElementById(
      "adminName"
    );


  const role =
    document.getElementById(
      "adminRole"
    );


  const avatar =
    document.getElementById(
      "adminAvatar"
    );


  const sector =
    document.getElementById(
      "adminSector"
    );


  const vacationSector =
    document.getElementById(
      "vacationAdminSector"
    );


  const responsibleSector =
    document.getElementById(
      "courseResponsibleSector"
    );


  if (name) {

    name.textContent =
      loggedAdmin.nome
      ||
      "Administrador";

  }


  if (role) {

    role.textContent =
      loggedAdmin.cargo
      ||
      (
        loggedAdmin.perfil ===
        "admin_principal"

          ? "Administrador Principal"

          : "Administrador"
      );

  }


  if (avatar) {

    avatar.textContent =
      getInitials(
        loggedAdmin.nome
      );

  }


  if (sector) {

    sector.textContent =
      loggedAdmin.setor
      ||
      "Setor não definido";

  }


  if (vacationSector) {

    vacationSector.textContent =
      loggedAdmin.setor
      ||
      "-";

  }


  if (responsibleSector) {

    responsibleSector.value =
      loggedAdmin.setor
      ||
      "";

  }

}



// ==========================================================
// ==========================================================
// NAVEGAÇÃO
// ==========================================================
// ==========================================================

const pageData = {

  dashboard: {

    title:
      "Visão Geral",

    subtitle:
      "Acompanhe as principais informações do seu setor."

  },


  employees: {

    title:
      "Funcionários",

    subtitle:
      "Gerencie os colaboradores cadastrados no seu setor."

  },


  vacations: {

    title:
      "Férias",

    subtitle:
      "Analise as solicitações de férias dos seus colaboradores."

  },


  trainings: {

    title:
      "Treinamentos",

    subtitle:
      "Crie e gerencie os treinamentos disponibilizados pelo seu setor."

  },


  evaluations: {

    title:
      "Avaliações",

    subtitle:
      "Analise os treinamentos concluídos e enviados para o seu setor."

  }

};



// ==========================================================
// TROCAR PÁGINA
// ==========================================================

function changePage(
  pageName
) {

  const data =
    pageData[
      pageName
    ];


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


  const page =
    document.getElementById(
      `${pageName}Page`
    );


  if (page) {

    page.classList.add(
      "active-page"
    );

  }


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


  if (
    pageName ===
    "vacations"
  ) {

    loadVacationRequests();

  }


  if (
    pageName ===
    "trainings"
  ) {

    loadCourses();

  }


  if (
    pageName ===
    "evaluations"
  ) {

    loadEvaluations();

  }

}



// ==========================================================
// EVENTOS DO MENU
// ==========================================================

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



// ==========================================================
// ==========================================================
// FUNCIONÁRIOS
// ==========================================================
// ==========================================================

function mapApiEmployee(
  employee
) {

  return {

    id:
      employee.id,

    name:
      employee.nome
      ||
      "",

    registration:
      employee.matricula
      ||
      "",

    email:
      employee.email
      ||
      "",

    role:
      employee.cargo
      ||
      "",

    sector:
      employee.setor
      ||
      "",

    profile:
      employee.perfil
      ||
      "colaborador",

    active:
      employee.ativo !== false,

    status:
      employee.ativo === false
        ? "Inativo"
        : "Ativo"

  };

}



// ==========================================================
// CARREGAR FUNCIONÁRIOS
// ==========================================================

async function loadEmployees() {

  const tbody =
    document.getElementById(
      "employeesTableBody"
    );


  if (tbody) {

    tbody.innerHTML = `

      <tr>

        <td colspan="7">

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
      await getResponseData(
        response
      );


    if (!response.ok) {

      throw new Error(
        result.error
        ||
        result.details
        ||
        "Não foi possível carregar os funcionários."
      );

    }


    employees =
      (
        Array.isArray(
          result
        )
          ? result
          : []
      )
        .map(
          mapApiEmployee
        );


    renderEmployees();


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



// ==========================================================
// RENDERIZAR FUNCIONÁRIOS
// ==========================================================

function renderEmployees() {

  const tbody =
    document.getElementById(
      "employeesTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML =
    "";


  const search =
    document
      .getElementById(
        "employeeSearch"
      )
      ?.value
      ?.trim()
      ?.toLowerCase()
    ||
    "";


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
          .join(
            " "
          )
          .toLowerCase()
          .includes(
            search
          );

      }
    );


  if (
    filtered.length === 0
  ) {

    tbody.innerHTML = `

      <tr>

        <td colspan="7">

          <div class="table-loading">

            Nenhum funcionário encontrado.

          </div>

        </td>

      </tr>

    `;


    return;

  }


  filtered.forEach(
    employee => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

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

            <button
              type="button"
              class="
                table-action
                vacation-action
              "
              title="Configurar férias"
              onclick="
                openVacationPeriodModal(
                  '${employee.id}'
                )
              "
            >

              <i class="fa-solid fa-umbrella-beach"></i>

            </button>

          </div>

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}



// ==========================================================
// PESQUISA FUNCIONÁRIOS
// ==========================================================

document
  .getElementById(
    "employeeSearch"
  )
  ?.addEventListener(
    "input",
    renderEmployees
  );



// ==========================================================
// ==========================================================
// SETORES
// ==========================================================
// ==========================================================

function populateSectorSelects() {

  const employeeSector =
    document.getElementById(
      "employeeSector"
    );


  const targetSector =
    document.getElementById(
      "courseTargetSector"
    );


  if (employeeSector) {

    employeeSector.innerHTML =
      "";


    SECTORS.forEach(
      sector => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          sector;


        option.textContent =
          sector;


        employeeSector.appendChild(
          option
        );

      }
    );

  }


  if (targetSector) {

    targetSector.innerHTML = `

      <option value="">
        Selecione
      </option>

    `;


    SECTORS.forEach(
      sector => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          sector;


        option.textContent =
          sector;


        targetSector.appendChild(
          option
        );

      }
    );

  }

}



// ==========================================================
// ==========================================================
// CRIAR USUÁRIO
// ==========================================================
// ==========================================================

function openUserModal(
  profile = "colaborador"
) {

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


  const profileSelect =
    document.getElementById(
      "employeeProfile"
    );


  if (form) {

    form.reset();

  }


  if (profileSelect) {

    profileSelect.value =
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

      sector.disabled =
        false;


      if (
        loggedAdmin?.setor
      ) {

        sector.value =
          loggedAdmin.setor;

      }

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
        loggedAdmin?.setor
        ||
        "";


      sector.disabled =
        true;

    }

  }


  openModal(
    "employeeModal"
  );

}



// ==========================================================
// CRIAR USUÁRIO
// ==========================================================
//
// ATENÇÃO:
//
// Esta função já é chamada pelo:
//
// onsubmit="createEmployee(event)"
//
// que existe no HTML.
//
// NÃO adicionamos outro addEventListener("submit").
// Isso evita criar o usuário duas vezes.
//
// ==========================================================

async function createEmployee(
  event
) {

  event.preventDefault();


  const button =
    document.getElementById(
      "employeeSubmitButton"
    );


  if (
    button?.disabled
  ) {

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
        .trim(),

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


  const original =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Criando...

  `;


  try {

    const response =
      await fetch(
        "/api/usuarios",
        {

          method:
            "POST",

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

      let message =
        result.error
        ||
        result.details
        ||
        "Não foi possível criar o usuário.";


      if (
        String(
          message
        )
          .toLowerCase()
          .includes(
            "already"
          )
        ||
        String(
          message
        )
          .toLowerCase()
          .includes(
            "email_exists"
          )
      ) {

        message =
          "Já existe um usuário cadastrado com este e-mail.";

      }


      throw new Error(
        message
      );

    }


    closeModal(
      "employeeModal"
    );


    await loadEmployees();


    showGlobalMessage(
      result.message
      ||
      "Usuário criado com sucesso.",
      "success"
    );


  } catch (error) {

    console.error(
      "Erro ao criar usuário:",
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



// ==========================================================
// ==========================================================
// FÉRIAS - PERÍODO AQUISITIVO
// ==========================================================
// ==========================================================

async function openVacationPeriodModal(
  employeeId
) {

  const employee =
    employees.find(
      item =>
        String(
          item.id
        )
        ===
        String(
          employeeId
        )
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


  if (form) {

    form.reset();

  }


  document.getElementById(
    "vacationEmployeeId"
  ).value =
    employee.id;


  document.getElementById(
    "vacationEmployeeName"
  ).textContent =
    `${employee.name} • ${employee.role}`;


  document.getElementById(
    "vacationUsedDays"
  ).value =
    0;


  updateVacationPreview();


  openModal(
    "vacationPeriodModal"
  );


  try {

    const response =
      await fetch(
        `/api/ferias/admin/periodos/${employee.id}`,
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
        result.error
        ||
        "Não foi possível carregar o período de férias."
      );

    }


    const period =
      result.periodo
      ||
      result;


    if (!period) {

      return;

    }


    document.getElementById(
      "vacationPeriodStart"
    ).value =
      period.periodo_inicio
        ?.substring(
          0,
          10
        )
      ||
      "";


    document.getElementById(
      "vacationPeriodEnd"
    ).value =
      period.periodo_fim
        ?.substring(
          0,
          10
        )
      ||
      "";


    document.getElementById(
      "vacationUsedDays"
    ).value =
      Number(
        period.dias_usados
        ||
        0
      );


    document.getElementById(
      "vacationExpirationDate"
    ).value =
      period.data_vencimento
        ?.substring(
          0,
          10
        )
      ||
      "";


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



// ==========================================================
// PREVIEW DAS FÉRIAS
// ==========================================================

function updateVacationPreview(
  backendPeriod = null
) {

  const start =
    document.getElementById(
      "vacationPeriodStart"
    )?.value;


  const end =
    document.getElementById(
      "vacationPeriodEnd"
    )?.value;


  const used =
    Number(
      document.getElementById(
        "vacationUsedDays"
      )?.value
      ||
      0
    );


  let rights = 0;

  let status =
    "Aguardando dados";


  if (backendPeriod) {

    rights =
      Number(
        backendPeriod.dias_direito
        ??
        0
      );


    status =
      backendPeriod.status
      ||
      (
        rights > 0
          ? "Disponível"
          : "Em aquisição"
      );

  } else if (
    start
    &&
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


    if (
      endDate < today
    ) {

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



// ==========================================================
// EVENTOS DO PREVIEW
// ==========================================================

[
  "vacationPeriodStart",
  "vacationPeriodEnd",
  "vacationUsedDays",
  "vacationExpirationDate"
]
  .forEach(
    id => {

      document
        .getElementById(
          id
        )
        ?.addEventListener(
          "input",
          () => {

            updateVacationPreview();

          }
        );

    }
  );



// ==========================================================
// SALVAR PERÍODO DE FÉRIAS
// ==========================================================

document
  .getElementById(
    "vacationPeriodForm"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const employeeId =
        document.getElementById(
          "vacationEmployeeId"
        ).value;


      const payload = {

        periodo_inicio:
          document.getElementById(
            "vacationPeriodStart"
          ).value,

        periodo_fim:
          document.getElementById(
            "vacationPeriodEnd"
          ).value,

        dias_usados:
          Number(
            document.getElementById(
              "vacationUsedDays"
            ).value
            ||
            0
          ),

        data_vencimento:
          document.getElementById(
            "vacationExpirationDate"
          ).value

      };


      if (
        !payload.periodo_inicio
        ||
        !payload.periodo_fim
        ||
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


      button.disabled =
        true;


      button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Salvando...

      `;


      try {

        const response =
          await fetch(
            `/api/ferias/admin/periodos/${employeeId}`,
            {

              method:
                "PUT",

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
            result.error
            ||
            result.details
            ||
            "Não foi possível salvar o período."
          );

        }


        closeModal(
          "vacationPeriodModal"
        );


        showGlobalMessage(
          result.message
          ||
          "Período de férias salvo com sucesso.",
          "success"
        );


      } catch (error) {

        console.error(
          "Erro ao salvar período de férias:",
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



// ==========================================================
// ==========================================================
// SOLICITAÇÕES DE FÉRIAS
// ==========================================================
// ==========================================================

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
      await getResponseData(
        response
      );


    if (!response.ok) {

      throw new Error(
        result.error
        ||
        "Não foi possível carregar as solicitações."
      );

    }


    vacationRequests =
      (
        Array.isArray(
          result
        )
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



// ==========================================================
// RENDERIZAR SOLICITAÇÕES
// ==========================================================

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

    list.innerHTML =
      "";

  }


  if (dashboardList) {

    dashboardList.innerHTML =
      "";

  }


  if (
    vacationRequests.length === 0
  ) {

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


  vacationRequests.forEach(
    request => {

      const user =
        request.usuario
        ||
        {};


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
              user.nome
              ||
              "Colaborador"
            )}

          </h3>


          <span>

            ${escapeHTML(
              user.cargo
              ||
              ""
            )}

            •

            ${escapeHTML(
              user.setor
              ||
              ""
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
                request.quantidade_dias
                ||
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
            data-vacation-request="${request.id}"
          >

            Analisar

          </button>

        </div>

      `;


      card
        .querySelector(
          `[data-vacation-request="${request.id}"]`
        )
        .addEventListener(
          "click",
          () => {

            openVacationDecisionModal(
              request.id
            );

          }
        );


      list
        ?.appendChild(
          card
        );

    }
  );


  vacationRequests
    .slice(
      0,
      3
    )
    .forEach(
      request => {

        const user =
          request.usuario
          ||
          {};


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
                user.nome
                ||
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
          ?.appendChild(
            item
          );

      }
    );

}



// ==========================================================
// MODAL DECISÃO FÉRIAS
// ==========================================================

function openVacationDecisionModal(
  requestId
) {

  currentVacationRequest =
    vacationRequests.find(
      request =>
        String(
          request.id
        )
        ===
        String(
          requestId
        )
    );


  if (!currentVacationRequest) {

    return;

  }


  const request =
    currentVacationRequest;


  const user =
    request.usuario
    ||
    {};


  const content =
    document.getElementById(
      "vacationDecisionContent"
    );


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
            user.nome
            ||
            "Colaborador"
          )}
        </strong>

        <span>

          ${escapeHTML(
            user.cargo
            ||
            ""
          )}

          •

          ${escapeHTML(
            user.setor
            ||
            ""
          )}

        </span>

      </div>

    </div>


    <div class="vacation-details-grid">

      <div class="vacation-detail-card">

        <span>
          Início
        </span>

        <strong>
          ${formatDate(
            request.data_inicio
          )}
        </strong>

      </div>


      <div class="vacation-detail-card">

        <span>
          Término
        </span>

        <strong>
          ${formatDate(
            request.data_fim
          )}
        </strong>

      </div>


      <div class="vacation-detail-card">

        <span>
          Quantidade
        </span>

        <strong>

          ${Number(
            request.quantidade_dias
            ||
            0
          )}

          dias

        </strong>

      </div>


      <div class="vacation-detail-card">

        <span>
          Solicitado em
        </span>

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
      style="margin-top:16px;"
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
              button.dataset.vacationDecision,
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



// ==========================================================
// RESPONDER FÉRIAS
// ==========================================================

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
      ?.trim()
    ||
    "";


  if (
    (
      status === "recusada"
      ||
      status ===
      "aprovada_com_ressalvas"
    )
    &&
    !observation
  ) {

    alert(
      "Informe uma observação para esta decisão."
    );


    return;

  }


  const original =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Salvando...

  `;


  try {

    const response =
      await fetch(
        `/api/ferias/admin/solicitacoes/${currentVacationRequest.id}`,
        {

          method:
            "PATCH",

          headers:
            getAuthHeaders(
              true
            ),

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
        result.error
        ||
        result.details
        ||
        "Não foi possível responder à solicitação."
      );

    }


    closeModal(
      "vacationDecisionModal"
    );


    currentVacationRequest =
      null;


    await loadVacationRequests();


    showGlobalMessage(
      result.message
      ||
      "Solicitação respondida com sucesso.",
      "success"
    );


  } catch (error) {

    console.error(
      "Erro ao responder férias:",
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



// ==========================================================
// BOTÃO ATUALIZAR FÉRIAS
// ==========================================================

document
  .getElementById(
    "refreshVacationButton"
  )
  ?.addEventListener(
    "click",
    loadVacationRequests
  );



// ==========================================================
// ==========================================================
// TREINAMENTOS
// ==========================================================
// ==========================================================

function mapApiCourse(
  course
) {

  return {

    id:
      course.id,

    title:
      course.titulo
      ||
      "",

    description:
      course.descricao
      ||
      "",

    hours:
      Number(
        course.carga_horaria
        ||
        0
      ),

    area:
      course.area
      ||
      "",

    level:
      course.nivel
      ||
      "",

    responsibleSector:
      course.setor_responsavel
      ||
      "",

    targetSector:
      course.setor_destino
      ||
      "",

    requirement:
      course.classificacao
      ||
      "Recomendado",

    external:
      course.curso_externo === true,

    externalLink:
      course.link_externo
      ||
      "",

    active:
      course.ativo !== false,

    createdAt:
      course.created_at
      ||
      null,

    activities:
      Array.isArray(
        course.atividades_curso
      )
        ? course.atividades_curso
        : []

  };

}



// ==========================================================
// CARREGAR CURSOS
// ==========================================================

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
      await getResponseData(
        response
      );


    if (!response.ok) {

      throw new Error(
        result.error
        ||
        result.details
        ||
        "Não foi possível carregar os treinamentos."
      );

    }


    courses =
      (
        Array.isArray(
          result
        )
          ? result
          : []
      )
        .map(
          mapApiCourse
        );


    populateTrainingAreaFilter();


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



// ==========================================================
// FILTRO DE ÁREAS
// ==========================================================

function populateTrainingAreaFilter() {

  const select =
    document.getElementById(
      "trainingAreaFilter"
    );


  if (!select) {

    return;

  }


  const previous =
    select.value;


  const areas = [
    ...new Set(
      courses
        .map(
          course =>
            course.area
        )
        .filter(
          Boolean
        )
    )
  ]
    .sort(
      (
        a,
        b
      ) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
    );


  select.innerHTML = `

    <option value="">
      Todas as áreas
    </option>

  `;


  areas.forEach(
    area => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        area;


      option.textContent =
        area;


      select.appendChild(
        option
      );

    }
  );


  if (
    areas.includes(
      previous
    )
  ) {

    select.value =
      previous;

  }

}



// ==========================================================
// FILTRAR CURSOS
// ==========================================================

function getFilteredAdminCourses() {

  const search =
    document
      .getElementById(
        "trainingSearch"
      )
      ?.value
      ?.trim()
      ?.toLowerCase()
    ||
    "";


  const area =
    document
      .getElementById(
        "trainingAreaFilter"
      )
      ?.value
    ||
    "";


  return courses.filter(
    course => {

      if (
        area
        &&
        course.area !== area
      ) {

        return false;

      }


      if (!search) {

        return true;

      }


      return [
        course.title,
        course.description,
        course.area,
        course.level,
        course.targetSector,
        course.requirement
      ]
        .join(
          " "
        )
        .toLowerCase()
        .includes(
          search
        );

    }
  );

}



// ==========================================================
// ÍCONE DO CURSO
// ==========================================================

function getAdminCourseIcon(
  area
) {

  const normalized =
    String(
      area || ""
    )
      .toLowerCase()
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  if (
    normalized.includes(
      "tecnologia"
    )
    ||
    normalized.includes(
      "desenvolvimento"
    )
  ) {

    return "fa-code";

  }


  if (
    normalized.includes(
      "comunic"
    )
  ) {

    return "fa-comments";

  }


  if (
    normalized.includes(
      "lider"
    )
  ) {

    return "fa-users";

  }


  if (
    normalized.includes(
      "finance"
    )
  ) {

    return "fa-chart-line";

  }


  if (
    normalized.includes(
      "logistica"
    )
  ) {

    return "fa-boxes-stacked";

  }


  if (
    normalized.includes(
      "compliance"
    )
    ||
    normalized.includes(
      "seguranca"
    )
  ) {

    return "fa-shield-halved";

  }


  if (
    normalized.includes(
      "marketing"
    )
  ) {

    return "fa-bullhorn";

  }


  if (
    normalized === "rh"
  ) {

    return "fa-people-group";

  }


  return "fa-graduation-cap";

}



// ==========================================================
// RENDERIZAR CURSOS
// ==========================================================

function renderCourses() {

  const container =
    document.getElementById(
      "adminTrainingGrid"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  const filtered =
    getFilteredAdminCourses();


  if (
    filtered.length === 0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-graduation-cap"></i>

        <strong>
          Nenhum treinamento encontrado
        </strong>

        <span>
          Não existem cursos correspondentes aos filtros selecionados.
        </span>

      </div>

    `;


    return;

  }


  filtered.forEach(
    course => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-training-card";


      const requirementClass =
        course.requirement ===
        "Obrigatório"

          ? "mandatory"

          : "recommended";


      card.innerHTML = `

        <div class="admin-training-card-header">

          <div class="admin-course-icon">

            <i
              class="
                fa-solid
                ${getAdminCourseIcon(
                  course.area
                )}
              "
            ></i>

          </div>


          <span
            class="
              requirement-badge
              ${requirementClass}
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
              course.area
              ||
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

              <i class="fa-solid fa-users"></i>

              ${escapeHTML(
                course.targetSector
                ||
                "Sem setor"
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
              data-course-details="${course.id}"
            >

              <i class="fa-regular fa-eye"></i>

              Ver

            </button>


            <button
              type="button"
              class="danger-button"
              data-course-delete="${course.id}"
            >

              <i class="fa-solid fa-trash"></i>

              Remover

            </button>

          </div>

        </div>

      `;


      card
        .querySelector(
          `[data-course-details="${course.id}"]`
        )
        .addEventListener(
          "click",
          () => {

            openCourseDetails(
              course.id
            );

          }
        );


      card
        .querySelector(
          `[data-course-delete="${course.id}"]`
        )
        .addEventListener(
          "click",
          () => {

            prepareCourseRemoval(
              course.id
            );

          }
        );


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// FILTROS TREINAMENTOS
// ==========================================================

document
  .getElementById(
    "trainingSearch"
  )
  ?.addEventListener(
    "input",
    renderCourses
  );


document
  .getElementById(
    "trainingAreaFilter"
  )
  ?.addEventListener(
    "change",
    renderCourses
  );



// ==========================================================
// ==========================================================
// CRIAÇÃO DE CURSO
// ==========================================================
// ==========================================================

function openCourseModal() {

  temporaryActivities =
    [];


  const form =
    document.getElementById(
      "courseForm"
    );


  if (form) {

    form.reset();

  }


  const responsible =
    document.getElementById(
      "courseResponsibleSector"
    );


  if (responsible) {

    responsible.value =
      loggedAdmin?.setor
      ||
      "";

  }


  document
    .getElementById(
      "externalLinkArea"
    )
    ?.classList
    .remove(
      "show"
    );


  document
    .getElementById(
      "courseActivitiesSection"
    )
    ?.classList
    .remove(
      "hidden"
    );


  renderActivityBuilder();


  openModal(
    "courseModal"
  );

}



// ==========================================================
// CURSO EXTERNO
// ==========================================================
//
// Já chamado pelo onchange do HTML.
// NÃO registramos outro listener.
//
// ==========================================================

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


  if (checkbox.checked) {

    externalArea
      ?.classList
      .add(
        "show"
      );


    activitiesSection
      ?.classList
      .add(
        "hidden"
      );


    if (externalLink) {

      externalLink.required =
        true;

    }


    temporaryActivities =
      [];


    renderActivityBuilder();

  } else {

    externalArea
      ?.classList
      .remove(
        "show"
      );


    activitiesSection
      ?.classList
      .remove(
        "hidden"
      );


    if (externalLink) {

      externalLink.required =
        false;


      externalLink.value =
        "";

    }

  }

}



// ==========================================================
// ADICIONAR ATIVIDADE
// ==========================================================

function addActivity() {

  temporaryActivities.push({

    temporaryId:
      Date.now()
      +
      Math.random(),

    title:
      "",

    description:
      "",

    type:
      "Texto",

    resource:
      ""

  });


  renderActivityBuilder();

}



// ==========================================================
// REMOVER ATIVIDADE
// ==========================================================

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



// ==========================================================
// ATUALIZAR ATIVIDADE
// ==========================================================

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


  activity[
    field
  ] =
    value;


  if (
    field === "type"
  ) {

    activity.resource =
      "";


    renderActivityBuilder();

  }

}



// ==========================================================
// CONSTRUTOR DAS ATIVIDADES
// ==========================================================

function renderActivityBuilder() {

  const container =
    document.getElementById(
      "activityBuilderList"
    );


  if (!container) {

    return;

  }


  if (
    temporaryActivities.length === 0
  ) {

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


  container.innerHTML =
    "";


  temporaryActivities.forEach(
    (
      activity,
      index
    ) => {

      const element =
        document.createElement(
          "article"
        );


      element.className =
        "activity-builder-card";


      let resourceField =
        "";


      if (
        activity.type === "Link"
      ) {

        resourceField = `

          <div
            class="
              form-group
              full
              activity-extra-field
            "
          >

            <label>
              Link de referência
            </label>


            <input
              type="url"
              value="${escapeHTML(
                activity.resource
              )}"
              placeholder="https://..."
              data-activity-resource="${activity.temporaryId}"
            >

          </div>

        `;

      } else if (
        activity.type === "Arquivo"
      ) {

        resourceField = `

          <div
            class="
              form-group
              full
              activity-extra-field
            "
          >

            <label>
              Nome / orientação do material
            </label>


            <input
              type="text"
              value="${escapeHTML(
                activity.resource
              )}"
              placeholder="Ex.: material-introdutorio.pdf"
              data-activity-resource="${activity.temporaryId}"
            >

          </div>

        `;

      } else {

        resourceField = `

          <div
            class="
              form-group
              full
              activity-extra-field
            "
          >

            <label>
              Orientação complementar
            </label>


            <textarea
              rows="3"
              placeholder="Opcional..."
              data-activity-resource="${activity.temporaryId}"
            >${escapeHTML(
              activity.resource
            )}</textarea>

          </div>

        `;

      }


      element.innerHTML = `

        <div class="activity-builder-header">

          <strong>

            Atividade
            ${index + 1}

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
                  activity.type === "Texto"
                    ? "selected"
                    : ""
                }
              >
                Texto
              </option>


              <option
                value="Arquivo"
                ${
                  activity.type === "Arquivo"
                    ? "selected"
                    : ""
                }
              >
                Arquivo
              </option>


              <option
                value="Link"
                ${
                  activity.type === "Link"
                    ? "selected"
                    : ""
                }
              >
                Link
              </option>

            </select>

          </div>


          ${resourceField}

        </div>

      `;


      element
        .querySelector(
          `[data-remove-activity="${activity.temporaryId}"]`
        )
        .addEventListener(
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
        .addEventListener(
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
        .addEventListener(
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
        .addEventListener(
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



// ==========================================================
// VALIDAR ATIVIDADES
// ==========================================================

function validateTemporaryActivities() {

  for (
    let index = 0;
    index < temporaryActivities.length;
    index++
  ) {

    const activity =
      temporaryActivities[
        index
      ];


    if (
      !String(
        activity.title
        ||
        ""
      ).trim()
    ) {

      return {

        valid:
          false,

        message:
          `Informe o título da atividade ${index + 1}.`

      };

    }


    if (
      !String(
        activity.description
        ||
        ""
      ).trim()
    ) {

      return {

        valid:
          false,

        message:
          `Informe a descrição da atividade ${index + 1}.`

      };

    }


    if (
      activity.type === "Link"
    ) {

      const link =
        String(
          activity.resource
          ||
          ""
        ).trim();


      if (!link) {

        return {

          valid:
            false,

          message:
            `Informe o link da atividade ${index + 1}.`

        };

      }


      try {

        new URL(
          link
        );

      } catch (error) {

        return {

          valid:
            false,

          message:
            `O link da atividade ${index + 1} é inválido.`

        };

      }

    }

  }


  return {

    valid:
      true

  };

}



// ==========================================================
// CRIAR CURSO
// ==========================================================
//
// Já chamado pelo:
// onsubmit="createCourse(event)"
//
// Não adicionamos outro listener.
//
// ==========================================================

async function createCourse(
  event
) {

  event.preventDefault();


  const button =
    document.getElementById(
      "courseSubmitButton"
    );


  if (
    button?.disabled
  ) {

    return;

  }


  const external =
    document.getElementById(
      "externalCourse"
    ).checked;


  const externalLink =
    document
      .getElementById(
        "externalCourseLink"
      )
      .value
      .trim();


  if (
    external
    &&
    !externalLink
  ) {

    alert(
      "Informe o link do curso externo."
    );


    return;

  }


  if (external) {

    try {

      new URL(
        externalLink
      );

    } catch (error) {

      alert(
        "Informe um link externo válido."
      );


      return;

    }

  }


  if (!external) {

    if (
      temporaryActivities.length === 0
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

    titulo:
      document
        .getElementById(
          "courseTitle"
        )
        .value
        .trim(),

    descricao:
      document
        .getElementById(
          "courseDescription"
        )
        .value
        .trim(),

    carga_horaria:
      Number(
        document.getElementById(
          "courseHours"
        ).value
      ),

    area:
      document.getElementById(
        "courseArea"
      ).value,

    nivel:
      document.getElementById(
        "courseLevel"
      ).value,

    setor_destino:
      document.getElementById(
        "courseTargetSector"
      ).value,

    classificacao:
      document.getElementById(
        "courseRequirement"
      ).value,

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
            ) => {

              return {

                titulo:
                  activity.title.trim(),

                descricao:
                  activity.description.trim(),

                tipo:
                  activity.type,

                recurso:
                  String(
                    activity.resource
                    ||
                    ""
                  ).trim()
                  ||
                  null,

                ordem:
                  index + 1

              };

            }
          )

  };


  const original =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Publicando...

  `;


  try {

    const response =
      await fetch(
        "/api/cursos",
        {

          method:
            "POST",

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
        result.error
        ||
        result.details
        ||
        "Não foi possível criar o treinamento."
      );

    }


    closeModal(
      "courseModal"
    );


    temporaryActivities =
      [];


    await loadCourses();


    showGlobalMessage(
      result.message
      ||
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

    button.disabled =
      false;


    button.innerHTML =
      original;

  }

}



// ==========================================================
// ==========================================================
// DETALHES DO CURSO
// ==========================================================
// ==========================================================

function openCourseDetails(
  courseId
) {

  const course =
    courses.find(
      item =>
        String(
          item.id
        )
        ===
        String(
          courseId
        )
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


  const activitiesHTML =

    course.external

      ? `

          <div class="form-information">

            <i class="fa-solid fa-arrow-up-right-from-square"></i>

            <p>
              Este treinamento é realizado externamente.
            </p>

          </div>

        `

      : `

          <div class="details-activities">

            <h3>
              Atividades
            </h3>


            ${
              course.activities.length === 0

                ? `

                    <div class="empty-state">

                      <strong>
                        Nenhuma atividade cadastrada
                      </strong>

                    </div>

                  `

                : course.activities
                    .map(
                      (
                        activity,
                        index
                      ) => `

                        <div class="details-activity-item">

                          <strong>

                            ${index + 1}.
                            ${escapeHTML(
                              activity.titulo
                              ||
                              "Atividade"
                            )}

                          </strong>


                          <span>

                            ${escapeHTML(
                              activity.tipo
                              ||
                              "-"
                            )}

                          </span>

                        </div>

                      `
                    )
                    .join(
                      ""
                    )
            }

          </div>

        `;


  content.innerHTML = `

    <div class="details-course-header">

      <div class="course-icon-large">

        <i
          class="
            fa-solid
            ${getAdminCourseIcon(
              course.area
            )}
          "
        ></i>

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
          Área
        </span>

        <strong>
          ${escapeHTML(
            course.area
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
          Setor responsável
        </span>

        <strong>
          ${escapeHTML(
            course.responsibleSector
          )}
        </strong>

      </div>


      <div class="detail-item">

        <span>
          Setor de destino
        </span>

        <strong>
          ${escapeHTML(
            course.targetSector
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



// ==========================================================
// REMOVER CURSO
// ==========================================================

function prepareCourseRemoval(
  courseId
) {

  coursePendingRemoval =
    courses.find(
      course =>
        String(
          course.id
        )
        ===
        String(
          courseId
        )
    )
    ||
    null;


  if (!coursePendingRemoval) {

    return;

  }


  openModal(
    "confirmationModal"
  );

}



// ==========================================================
// CONFIRMAR REMOÇÃO
// ==========================================================

document
  .getElementById(
    "confirmDeleteButton"
  )
  ?.addEventListener(
    "click",
    async event => {

      if (!coursePendingRemoval) {

        return;

      }


      const button =
        event.currentTarget;


      const original =
        button.innerHTML;


      button.disabled =
        true;


      button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Removendo...

      `;


      try {

        const response =
          await fetch(
            `/api/cursos/${coursePendingRemoval.id}/desativar`,
            {

              method:
                "PATCH",

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
            result.error
            ||
            result.details
            ||
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
          result.message
          ||
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



// ==========================================================
// CURSOS NO DASHBOARD
// ==========================================================

function renderDashboardCourses() {

  const container =
    document.getElementById(
      "dashboardTrainingList"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  const latest =
    courses
      .filter(
        course =>
          course.active
      )
      .slice(
        0,
        3
      );


  if (
    latest.length === 0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-graduation-cap"></i>

        <strong>
          Nenhum treinamento criado
        </strong>

        <span>
          Crie o primeiro treinamento do seu setor.
        </span>

      </div>

    `;


    return;

  }


  latest.forEach(
    course => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "training-mini-card";


      card.innerHTML = `

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


        <div class="training-mini-meta">

          <span>
            ${escapeHTML(
              course.area
            )}
          </span>


          <span>
            ${course.hours}h
          </span>


          <span>
            ${escapeHTML(
              course.targetSector
            )}
          </span>

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// ==========================================================
// AVALIAÇÕES
// ==========================================================
// ==========================================================
//
// ROTA CORRETA:
//
// GET /api/treinamentos/admin/avaliacoes
//
// O backend retorna:
//
// {
//   inscricao,
//   usuario,
//   curso
// }
//
// ==========================================================

function mapApiEvaluation(
  item
) {

  const enrollment =
    item.inscricao
    ||
    {};


  const user =
    item.usuario
    ||
    {};


  const course =
    item.curso
    ||
    {};


  return {

    enrollmentId:
      enrollment.id,

    userId:
      user.id
      ||
      enrollment.usuario_id,

    userName:
      user.nome
      ||
      "Colaborador",

    userRole:
      user.cargo
      ||
      "",

    userSector:
      user.setor
      ||
      "",

    courseId:
      course.id
      ||
      enrollment.curso_id,

    courseTitle:
      course.titulo
      ||
      "Treinamento",

    courseDescription:
      course.descricao
      ||
      "",

    courseHours:
      Number(
        course.carga_horaria
        ||
        0
      ),

    responsibleSector:
      course.setor_responsavel
      ||
      "",

    external:
      course.curso_externo === true,

    status:
      enrollment.status
      ||
      "aguardando_avaliacao",

    submittedAt:
      enrollment.enviado_em
      ||
      enrollment.created_at
      ||
      null

  };

}



// ==========================================================
// CARREGAR AVALIAÇÕES
// ==========================================================

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
      await getResponseData(
        response
      );


    if (!response.ok) {

      throw new Error(
        result.error
        ||
        result.details
        ||
        "Não foi possível carregar as avaliações."
      );

    }


    evaluations =
      (
        Array.isArray(
          result
        )
          ? result
          : []
      )
        .map(
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



// ==========================================================
// RENDERIZAR FILA DE AVALIAÇÕES
// ==========================================================

function renderEvaluations() {

  const container =
    document.getElementById(
      "evaluationList"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  if (
    evaluations.length === 0
  ) {

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


  evaluations.forEach(
    evaluation => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "evaluation-card";


      card.innerHTML = `

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

              Colaborador:

              ${escapeHTML(
                evaluation.userSector
                ||
                "-"
              )}

            </span>


            <span>

              <i class="fa-solid fa-graduation-cap"></i>

              Responsável:

              ${escapeHTML(
                evaluation.responsibleSector
                ||
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
            data-evaluation-open="${evaluation.enrollmentId}"
          >

            <i class="fa-regular fa-eye"></i>

            Avaliar

          </button>

        </div>

      `;


      card
        .querySelector(
          `[data-evaluation-open="${evaluation.enrollmentId}"]`
        )
        .addEventListener(
          "click",
          () => {

            openEvaluationModal(
              evaluation.enrollmentId
            );

          }
        );


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// AVALIAÇÕES NO DASHBOARD
// ==========================================================

function renderDashboardEvaluations() {

  const container =
    document.getElementById(
      "dashboardEvaluationList"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  if (
    evaluations.length === 0
  ) {

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


  evaluations
    .slice(
      0,
      3
    )
    .forEach(
      evaluation => {

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

        `;


        container.appendChild(
          item
        );

      }
    );

}



// ==========================================================
// ==========================================================
// ABRIR AVALIAÇÃO
// ==========================================================
// ==========================================================
//
// Aqui buscamos os detalhes completos.
//
// GET
// /api/treinamentos/admin/avaliacoes/:inscricaoId
//
// ==========================================================

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
      await getResponseData(
        response
      );


    if (!response.ok) {

      throw new Error(
        result.error
        ||
        "Não foi possível carregar a avaliação."
      );

    }


    currentEvaluation = {

      enrollment:
        result.inscricao
        ||
        {},

      user:
        result.usuario
        ||
        {},

      course:
        result.curso
        ||
        {},

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
        result.certificado
        ||
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



// ==========================================================
// BUSCAR ATIVIDADE
// ==========================================================

function getEvaluationActivity(
  activityId
) {

  return currentEvaluation
    ?.activities
    ?.find(
      activity =>
        Number(
          activity.id
        )
        ===
        Number(
          activityId
        )
    )
    ||
    null;

}



// ==========================================================
// RENDERIZAR MODAL DE AVALIAÇÃO
// ==========================================================

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



// ==========================================================
// ==========================================================
// CURSO INTERNO
// ==========================================================
// ==========================================================

function renderInternalEvaluationModal() {

  const container =
    document.getElementById(
      "evaluationModalContent"
    );


  const enrollment =
    currentEvaluation.enrollment
    ||
    {};


  const user =
    currentEvaluation.user
    ||
    {};


  const course =
    currentEvaluation.course
    ||
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
      .join(
        ""
      );


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
            user.nome
            ||
            "Colaborador"
          )}
        </strong>


        <span>

          ${escapeHTML(
            user.cargo
            ||
            ""
          )}

          •

          ${escapeHTML(
            user.setor
            ||
            ""
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
            course.titulo
            ||
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
            course.carga_horaria
            ||
            0
          )}h

        </strong>

      </div>


      <div class="evaluation-summary-item">

        <span>
          Responsável
        </span>

        <strong>
          ${escapeHTML(
            course.setor_responsavel
            ||
            "-"
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
        deliveriesHTML

        ||

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
        id="returnEvaluationButton"
      >

        <i class="fa-solid fa-rotate-left"></i>

        Devolver para correção

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


  configureEvaluationActivityEvents();


  document
    .getElementById(
      "returnEvaluationButton"
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



// ==========================================================
// HTML DE UMA ATIVIDADE
// ==========================================================

function createEvaluationActivityHTML(
  delivery,
  index
) {

  const activity =
    getEvaluationActivity(
      delivery.atividade_id
    )
    ||
    {};


  let responseHTML =
    "";


  if (
    delivery.resposta_texto
  ) {

    responseHTML += `

      <div class="submission-text">

        ${escapeHTML(
          delivery.resposta_texto
        )}

      </div>

    `;

  }


  if (
    delivery.resposta_link
  ) {

    responseHTML += `

      <div class="submission-link">

        <i class="fa-solid fa-link"></i>


        <a
          href="${escapeHTML(
            delivery.resposta_link
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >

          ${escapeHTML(
            delivery.resposta_link
          )}

        </a>

      </div>

    `;

  }


  if (
    delivery.arquivo_temporario
  ) {

    responseHTML += `

      <div class="submission-file">

        <i class="fa-solid fa-file"></i>


        <span>
          ${escapeHTML(
            delivery.arquivo_nome
            ||
            "Arquivo enviado"
          )}
        </span>


        <a
          href="${escapeHTML(
            delivery.arquivo_temporario
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >

          Abrir arquivo

        </a>

      </div>

    `;

  }


  if (!responseHTML) {

    responseHTML = `

      <div class="submission-text">

        Nenhum conteúdo disponível.

      </div>

    `;

  }


  return `

    <article
      class="
        submission-item
        ${
          delivery.status === "ok"
            ? "approved"
            : delivery.status === "nao_ok"
              ? "rejected"
              : ""
        }
      "
      data-delivery-card="${delivery.id}"
    >

      <div class="submission-item-header">

        <div>

          <strong>

            ${index + 1}.
            ${escapeHTML(
              activity.titulo
              ||
              "Atividade"
            )}

          </strong>


          <p>
            ${escapeHTML(
              activity.descricao
              ||
              ""
            )}
          </p>

        </div>


        <span class="submission-type-badge">

          ${escapeHTML(
            activity.tipo
            ||
            "Atividade"
          )}

        </span>

      </div>


      ${responseHTML}


      <div class="activity-review-area">

        <label>
          Avaliação
        </label>


        <div class="activity-review-buttons">

          <button
            type="button"
            class="
              activity-review-button
              ok
              ${
                delivery.status === "ok"
                  ? "selected"
                  : ""
              }
            "
            data-delivery-status="${delivery.id}"
            data-status="ok"
          >

            <i class="fa-solid fa-check"></i>

            OK

          </button>


          <button
            type="button"
            class="
              activity-review-button
              not-ok
              ${
                delivery.status === "nao_ok"
                  ? "selected"
                  : ""
              }
            "
            data-delivery-status="${delivery.id}"
            data-status="nao_ok"
          >

            <i class="fa-solid fa-xmark"></i>

            Não OK

          </button>

        </div>


        <div class="activity-review-observation">

          <textarea
            rows="3"
            placeholder="Comentário sobre esta atividade..."
            data-delivery-observation="${delivery.id}"
          >${escapeHTML(
            delivery.observacao_admin
            ||
            ""
          )}</textarea>

        </div>

      </div>

    </article>

  `;

}



// ==========================================================
// EVENTOS DE AVALIAÇÃO DAS ATIVIDADES
// ==========================================================

function configureEvaluationActivityEvents() {

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
              button.dataset.deliveryStatus;


            const status =
              button.dataset.status;


            const delivery =
              currentEvaluation
                ?.deliveries
                ?.find(
                  item =>
                    String(
                      item.id
                    )
                    ===
                    String(
                      deliveryId
                    )
                );


            if (!delivery) {

              return;

            }


            delivery.status =
              status;


            const card =
              button.closest(
                "[data-delivery-card]"
              );


            card
              ?.querySelectorAll(
                "[data-delivery-status]"
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


            card
              ?.classList
              .remove(
                "approved",
                "rejected"
              );


            if (
              status === "ok"
            ) {

              card
                ?.classList
                .add(
                  "approved"
                );

            } else {

              card
                ?.classList
                .add(
                  "rejected"
                );

            }

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

            const delivery =
              currentEvaluation
                ?.deliveries
                ?.find(
                  item =>
                    String(
                      item.id
                    )
                    ===
                    String(
                      textarea
                        .dataset
                        .deliveryObservation
                    )
                );


            if (delivery) {

              delivery.observacao_admin =
                textarea.value;

            }

          }
        );

      }
    );

}



// ==========================================================
// SALVAR AVALIAÇÃO DE UMA ATIVIDADE
// ==========================================================

async function saveDeliveryEvaluation(
  delivery
) {

  const response =
    await fetch(
      `/api/treinamentos/admin/entregas/${delivery.id}`,
      {

        method:
          "PATCH",

        headers:
          getAuthHeaders(
            true
          ),

        body:
          JSON.stringify({

            status:
              delivery.status,

            observacao_admin:
              String(
                delivery.observacao_admin
                ||
                ""
              ).trim()

          })

      }
    );


  if (
    handleUnauthorized(
      response
    )
  ) {

    throw new Error(
      "Sessão expirada."
    );

  }


  const result =
    await getResponseData(
      response
    );


  if (!response.ok) {

    throw new Error(
      result.error
      ||
      "Não foi possível avaliar uma das atividades."
    );

  }


  return result;

}



// ==========================================================
// FINALIZAR CURSO INTERNO
// ==========================================================

async function finishInternalEvaluation(
  finalStatus,
  button
) {

  if (!currentEvaluation) {

    return;

  }


  const deliveries =
    currentEvaluation.deliveries;


  if (
    deliveries.length === 0
  ) {

    alert(
      "Não existem atividades para avaliar."
    );


    return;

  }


  for (
    let index = 0;
    index < deliveries.length;
    index++
  ) {

    const delivery =
      deliveries[
        index
      ];


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
      delivery.status === "nao_ok"
      &&
      !String(
        delivery.observacao_admin
        ||
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
    finalStatus === "aprovado"
    &&
    hasRejected
  ) {

    alert(
      'Todas as atividades precisam estar marcadas como "OK" para aprovar o treinamento.'
    );


    return;

  }


  if (
    finalStatus ===
      "correcao_solicitada"
    &&
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
      ?.trim()
    ||
    "";


  if (
    finalStatus ===
      "correcao_solicitada"
    &&
    !observation
  ) {

    alert(
      "Informe uma orientação geral para o colaborador."
    );


    return;

  }


  const original =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Salvando...

  `;


  try {

    // ======================================================
    // 1. SALVAR CADA ATIVIDADE
    // ======================================================

    for (
      const delivery
      of deliveries
    ) {

      await saveDeliveryEvaluation(
        delivery
      );

    }


    // ======================================================
    // 2. SALVAR DECISÃO DO CURSO
    // ======================================================

    const response =
      await fetch(
        `/api/treinamentos/admin/avaliacoes/${currentEvaluation.enrollment.id}`,
        {

          method:
            "PATCH",

          headers:
            getAuthHeaders(
              true
            ),

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
        result.error
        ||
        "Não foi possível concluir a avaliação."
      );

    }


    closeModal(
      "evaluationModal"
    );


    currentEvaluation =
      null;


    // Depois da decisão, não está mais
    // aguardando_avaliacao.
    //
    // Portanto desaparece automaticamente da fila.
    await loadEvaluations();


    showGlobalMessage(

      finalStatus === "aprovado"

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

    button.disabled =
      false;


    button.innerHTML =
      original;

  }

}



// ==========================================================
// ==========================================================
// CURSO EXTERNO
// ==========================================================
// ==========================================================

function renderExternalEvaluationModal() {

  const container =
    document.getElementById(
      "evaluationModalContent"
    );


  const enrollment =
    currentEvaluation.enrollment
    ||
    {};


  const user =
    currentEvaluation.user
    ||
    {};


  const course =
    currentEvaluation.course
    ||
    {};


  const certificate =
    currentEvaluation.certificate
    ||
    null;


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
            user.nome
            ||
            "Colaborador"
          )}
        </strong>


        <span>

          ${escapeHTML(
            user.cargo
            ||
            ""
          )}

          •

          ${escapeHTML(
            user.setor
            ||
            ""
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
            course.titulo
            ||
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
            course.carga_horaria
            ||
            0
          )}h

        </strong>

      </div>


      <div class="evaluation-summary-item">

        <span>
          Setor responsável
        </span>

        <strong>
          ${escapeHTML(
            course.setor_responsavel
            ||
            "-"
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
                    certificate.arquivo_nome
                    ||
                    "Certificado"
                  )}
                </span>


                ${
                  certificate.arquivo_temporario

                    ? `

                        <a
                          href="${escapeHTML(
                            certificate.arquivo_temporario
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



// ==========================================================
// FINALIZAR CURSO EXTERNO
// ==========================================================

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
      ?.trim()
    ||
    "";


  if (
    status ===
      "correcao_solicitada"
    &&
    !observation
  ) {

    alert(
      "Informe o motivo para solicitar um novo certificado."
    );


    return;

  }


  const original =
    button.innerHTML;


  button.disabled =
    true;


  button.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Salvando...

  `;


  try {

    const response =
      await fetch(
        `/api/treinamentos/admin/avaliacoes/${currentEvaluation.enrollment.id}`,
        {

          method:
            "PATCH",

          headers:
            getAuthHeaders(
              true
            ),

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
        result.error
        ||
        "Não foi possível concluir a avaliação."
      );

    }


    closeModal(
      "evaluationModal"
    );


    currentEvaluation =
      null;


    await loadEvaluations();


    showGlobalMessage(

      status === "aprovado"

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

    button.disabled =
      false;


    button.innerHTML =
      original;

  }

}



// ==========================================================
// ==========================================================
// PUBLICAR CERTIFICADO INTERNO
// ==========================================================
//
// A rota que criamos recebe multipart/form-data.
//
// POST
// /api/treinamentos/admin/avaliacoes/:inscricaoId/certificado
//
// ==========================================================

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

    button.disabled =
      true;


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

          method:
            "POST",

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
        result.error
        ||
        "Não foi possível publicar o certificado."
      );

    }


    showGlobalMessage(
      result.message
      ||
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

      button.disabled =
        false;


      button.innerHTML =
        original;

    }

  }

}



// ==========================================================
// BOTÃO ATUALIZAR AVALIAÇÕES
// ==========================================================

document
  .getElementById(
    "refreshEvaluationsButton"
  )
  ?.addEventListener(
    "click",
    loadEvaluations
  );



// ==========================================================
// ==========================================================
// DASHBOARD
// ==========================================================
// ==========================================================

function updateDashboardCounters() {

  const activeEmployees =
    employees.filter(
      employee =>
        employee.active
        &&
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


  // ========================================================
  // CARDS DO DASHBOARD
  // ========================================================

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


  // ========================================================
  // SIDEBAR
  // ========================================================

  setCounterValue(
    "evaluationMenuCounter",
    pendingEvaluations
  );


  setCounterValue(
    "vacationMenuCounter",
    pendingVacations
  );


  // ========================================================
  // PÁGINA DE FÉRIAS
  // ========================================================

  setCounterValue(
    "vacationPendingCount",
    pendingVacations
  );

}



// ==========================================================
// ==========================================================
// LOGOUT
// ==========================================================
// ==========================================================

function logout() {

  const confirmed =
    confirm(
      "Deseja sair do Evolua+?"
    );


  if (!confirmed) {

    return;

  }


  clearSession();


  window.location.href =
    "/login/";

}



// ==========================================================
// EVENTO LOGOUT
// ==========================================================

document
  .getElementById(
    "logoutButton"
  )
  ?.addEventListener(
    "click",
    logout
  );



// ==========================================================
// ==========================================================
// INICIALIZAÇÃO
// ==========================================================
// ==========================================================

async function initializeAdmin() {

  // ========================================================
  // 1. VALIDAR SESSÃO
  // ========================================================

  if (
    !validateSession()
  ) {

    return;

  }


  // ========================================================
  // 2. ADMIN LOGADO
  // ========================================================

  renderLoggedAdmin();


  // ========================================================
  // 3. SETORES
  // ========================================================

  populateSectorSelects();


  // ========================================================
  // 4. ABRIR DASHBOARD
  // ========================================================

  changePage(
    "dashboard"
  );


  // ========================================================
  // 5. CARREGAR INFORMAÇÕES
  // ========================================================
  //
  // Promise.all permite carregar os quatro módulos
  // paralelamente.
  //
  // Cada função possui tratamento próprio de erro.
  //
  // ========================================================

  await Promise.all([

    loadEmployees(),

    loadCourses(),

    loadVacationRequests(),

    loadEvaluations()

  ]);


  updateDashboardCounters();

}



// ==========================================================
// INICIAR
// ==========================================================

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



// ==========================================================
// ==========================================================
// FUNÇÕES USADAS DIRETAMENTE PELO HTML
// ==========================================================
// ==========================================================

window.changePage =
  changePage;


window.openModal =
  openModal;


window.closeModal =
  closeModal;


window.openUserModal =
  openUserModal;


window.createEmployee =
  createEmployee;


window.openVacationPeriodModal =
  openVacationPeriodModal;


window.openVacationDecisionModal =
  openVacationDecisionModal;


window.openCourseModal =
  openCourseModal;


window.toggleExternalCourse =
  toggleExternalCourse;


window.addActivity =
  addActivity;


window.removeActivity =
  removeActivity;


window.updateActivity =
  updateActivity;


window.createCourse =
  createCourse;


window.openCourseDetails =
  openCourseDetails;


window.prepareCourseRemoval =
  prepareCourseRemoval;


window.openEvaluationModal =
  openEvaluationModal;


window.publishCertificate =
  publishCertificate;


window.logout =
  logout;


// ==========================================================
// FIM
// ==========================================================