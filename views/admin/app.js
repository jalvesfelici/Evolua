// ==========================================================
// EVOLUA+
// ADMIN - APP.JS
// ==========================================================
//
// RESPONSABILIDADES:
//
// - validar sessão do administrador;
// - mostrar administrador logado;
// - navegar pelas páginas do painel;
// - cadastrar colaboradores;
// - cadastrar administradores;
// - listar usuários;
// - configurar período de férias;
// - cadastrar treinamentos;
// - listar treinamentos;
// - controlar avaliações;
// - receber solicitações de férias;
// - aprovar / recusar solicitações de férias;
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


let currentAdmin =
  null;



// ==========================================================
// RECUPERAR USUÁRIO LOGADO
// ==========================================================

try {

  const storedUser =
    localStorage.getItem(
      "usuario_logado"
    );


  if (storedUser) {

    currentAdmin =
      JSON.parse(
        storedUser
      );

  }

} catch (error) {

  console.error(
    "Erro ao recuperar administrador:",
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

function validateAdminSession() {

  // ========================================================
  // TOKEN OU USUÁRIO AUSENTE
  // ========================================================

  if (
    !accessToken ||
    !currentAdmin
  ) {

    window.location.href =
      "/login/";


    return false;

  }



  // ========================================================
  // PRECISA SER ADMIN
  // ========================================================

  const isAdmin =

    currentAdmin.perfil ===
      "admin_principal"

    ||

    currentAdmin.perfil ===
      "admin_setor";


  if (!isAdmin) {

    window.location.href =
      "/treinamentos/";


    return false;

  }



  // ========================================================
  // ADMIN INATIVO
  // ========================================================

  if (
    currentAdmin.ativo ===
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
// TRATAR TOKEN EXPIRADO
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
// DADOS
// ==========================================================

let employees =
  [];


let courses =
  [];


let temporaryActivities =
  [];


let courseToDelete =
  null;


let vacationRequests =
  [];


let currentVacationRequestId =
  null;



// ==========================================================
// AVALIAÇÕES
// ==========================================================
//
// TEMPORÁRIO.
//
// Posteriormente será substituído pelos dados reais
// enviados pelos colaboradores.
//
// ==========================================================

let evaluations = [

  {

    id:
      1,

    employee:
      "Maycon Santos",

    initials:
      "MS",

    sector:
      "Tecnologia",

    course:
      "Excel Avançado",

    hours:
      8,

    submittedAt:
      "15/08/2026",

    status:
      "pending",

    internalCourse:
      true,

    activities: [

      {

        title:
          "Leia o material introdutório",

        file:
          "resumo-introducao.pdf"

      },

      {

        title:
          "Crie uma planilha financeira",

        file:
          "planilha-financeira.xlsx"

      }

    ]

  }

];



// ==========================================================
// PÁGINAS
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


  trainings: {

    title:
      "Treinamentos",

    subtitle:
      "Crie e gerencie os treinamentos disponibilizados na plataforma."

  },


  evaluations: {

    title:
      "Avaliações",

    subtitle:
      "Analise as atividades enviadas pelos colaboradores."

  },


  vacations: {

    title:
      "Férias",

    subtitle:
      "Analise as solicitações de férias dos colaboradores do seu setor."

  }

};



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
// FORMATAR DATA
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


  return `${day}/${month}/${year}`;

}



// ==========================================================
// FORMATAR DIAS
// ==========================================================

function formatDays(
  value
) {

  const days =
    Number(
      value || 0
    );


  return `${days} ${
    days === 1
      ? "dia"
      : "dias"
  }`;

}



// ==========================================================
// INICIAIS
// ==========================================================

function getInitials(
  name
) {

  if (!name) {

    return "--";

  }


  return name

    .trim()

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
// ABRIR MODAL
// ==========================================================

function openModal(
  id
) {

  const modal =
    document.getElementById(
      id
    );


  if (!modal) {

    console.warn(
      `Modal não encontrado: ${id}`
    );


    return;

  }


  modal.classList.add(
    "show"
  );


  document.body.style.overflow =
    "hidden";

}



// ==========================================================
// FECHAR MODAL
// ==========================================================

function closeModal(
  id
) {

  const modal =
    document.getElementById(
      id
    );


  if (!modal) {

    return;

  }


  modal.classList.remove(
    "show"
  );


  document.body.style.overflow =
    "auto";

}



// ==========================================================
// TROCAR PÁGINA
// ==========================================================

function changePage(
  pageName
) {

  // ========================================================
  // ESCONDER PÁGINAS
  // ========================================================

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



  // ========================================================
  // MENU
  // ========================================================

  document
    .querySelectorAll(
      ".menu-item[data-page]"
    )
    .forEach(
      item => {

        item.classList.remove(
          "active"
        );

      }
    );



  // ========================================================
  // ABRIR PÁGINA
  // ========================================================

  const page =
    document.getElementById(
      `${pageName}Page`
    );


  if (page) {

    page.classList.add(
      "active-page"
    );

  }



  // ========================================================
  // MENU ATIVO
  // ========================================================

  const menu =
    document.querySelector(
      `.menu-item[data-page="${pageName}"]`
    );


  if (menu) {

    menu.classList.add(
      "active"
    );

  }



  // ========================================================
  // TÍTULO
  // ========================================================

  const information =
    pageData[
      pageName
    ];


  if (information) {

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
        information.title;

    }


    if (subtitle) {

      subtitle.textContent =
        information.subtitle;

    }

  }



  // ========================================================
  // FÉRIAS
  // ========================================================
  //
  // Sempre que o Admin abrir a página,
  // atualizamos as solicitações.
  //
  // ========================================================

  if (
    pageName ===
    "vacations"
  ) {

    loadVacationRequests();

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
// ADMIN LOGADO
// ==========================================================

function renderCurrentAdmin() {

  if (!currentAdmin) {

    return;

  }



  // ========================================================
  // SETOR
  // ========================================================

  const sector =
    document.getElementById(
      "adminSector"
    );


  if (sector) {

    sector.textContent =

      currentAdmin.perfil ===
      "admin_principal"

        ? "Acesso geral"

        : currentAdmin.setor ||
          "Setor não informado";

  }



  // ========================================================
  // AVATAR
  // ========================================================

  const avatar =
    document.getElementById(
      "adminAvatar"
    );


  if (avatar) {

    avatar.textContent =
      getInitials(
        currentAdmin.nome
      );

  }



  // ========================================================
  // NOME
  // ========================================================

  const name =
    document.getElementById(
      "adminName"
    );


  if (name) {

    name.textContent =
      currentAdmin.nome ||
      "Administrador";

  }



  // ========================================================
  // PERFIL
  // ========================================================

  const role =
    document.getElementById(
      "adminRole"
    );


  if (role) {

    role.textContent =

      currentAdmin.perfil ===
      "admin_principal"

        ? "Administrador Principal"

        : `Administrador • ${currentAdmin.setor}`;

  }

}



// ==========================================================
// CONVERTER USUÁRIO DA API
// ==========================================================

function mapApiUser(
  user
) {

  return {

    id:
      user.id,

    name:
      user.nome,

    registration:
      user.matricula,

    email:
      user.email,

    role:
      user.cargo,

    sector:
      user.setor,

    profile:
      user.perfil,

    status:
      user.ativo
        ? "Ativo"
        : "Inativo"

  };

}



// ==========================================================
// CARREGAR USUÁRIOS
// ==========================================================

async function loadUsersFromApi() {

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
      await response.json();


    if (!response.ok) {

      throw new Error(

        result.error ||
        "Não foi possível carregar os usuários."

      );

    }


    const users =

      Array.isArray(
        result
      )

        ? result

        : result.usuarios ||
          [];


    employees =
      users.map(
        mapApiUser
      );


    renderEmployees();


    updateDashboardCounters();


  } catch (error) {

    console.error(
      "Erro ao carregar usuários:",
      error
    );

  }

}



// ==========================================================
// RENDERIZAR USUÁRIOS
// ==========================================================

function renderEmployees() {

  const tbody =
    document.getElementById(
      "employeesTableBody"
    );


  if (!tbody) {

    return;

  }


  const searchInput =
    document.getElementById(
      "employeeSearch"
    );


  const search =
    String(
      searchInput?.value || ""
    )
      .trim()
      .toLowerCase();



  const filtered =
    employees.filter(
      employee => {

        const text = [

          employee.name,

          employee.registration,

          employee.email,

          employee.role,

          employee.sector

        ]

          .join(
            " "
          )

          .toLowerCase();


        return text.includes(
          search
        );

      }
    );


  tbody.innerHTML =
    "";



  // ========================================================
  // VAZIO
  // ========================================================

  if (
    filtered.length ===
    0
  ) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="8"
          style="
            padding: 30px;
            text-align: center;
          "
        >
          Nenhum usuário encontrado.
        </td>

      </tr>

    `;


    return;

  }



  // ========================================================
  // LINHAS
  // ========================================================

  filtered.forEach(
    employee => {

      const row =
        document.createElement(
          "tr"
        );


      let profile =
        "Colaborador";


      if (
        employee.profile ===
        "admin_setor"
      ) {

        profile =
          "Admin. do setor";

      }


      if (
        employee.profile ===
        "admin_principal"
      ) {

        profile =
          "Admin. principal";

      }



      // ====================================================
      // CONFIGURAR FÉRIAS
      // ====================================================

      const vacationButton =

        employee.profile ===
        "colaborador"

          ? `

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

          : "";



      row.innerHTML = `

        <td>

          <div class="employee-cell">

            <div class="table-avatar">

              ${getInitials(
                employee.name
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

          <span class="status-badge purple-status">

            ${escapeHTML(
              profile
            )}

          </span>

        </td>


        <td>

          <span
            class="
              status-badge
              ${
                employee.status ===
                "Ativo"

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

            ${vacationButton}

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
// PESQUISA DE FUNCIONÁRIO
// ==========================================================

const employeeSearch =
  document.getElementById(
    "employeeSearch"
  );


if (employeeSearch) {

  employeeSearch.addEventListener(
    "input",
    renderEmployees
  );

}



// ==========================================================
// ABRIR MODAL DE FUNCIONÁRIO
// ==========================================================

function openEmployeeModal() {

  const form =
    document.getElementById(
      "employeeForm"
    );


  if (form) {

    form.reset();

  }


  // ========================================================
  // ADMIN DE SETOR
  // ========================================================
  //
  // Colaborador só pode ser criado
  // no próprio setor do Admin.
  //
  // ========================================================

  const sector =
    document.getElementById(
      "employeeSector"
    );


  if (
    sector &&
    currentAdmin?.perfil ===
      "admin_setor"
  ) {

    sector.value =
      currentAdmin.setor;


    sector.disabled =
      true;

  }


  openModal(
    "employeeModal"
  );

}



// ==========================================================
// CRIAR FUNCIONÁRIO
// ==========================================================

async function createEmployee(
  event
) {

  event.preventDefault();


  const name =
    document
      .getElementById(
        "employeeName"
      )
      .value
      .trim();


  const registration =
    document
      .getElementById(
        "employeeRegistration"
      )
      .value
      .trim();


  const email =
    document
      .getElementById(
        "employeeEmail"
      )
      .value
      .trim()
      .toLowerCase();


  const password =
    document
      .getElementById(
        "employeePassword"
      )
      .value;


  const role =
    document
      .getElementById(
        "employeeRole"
      )
      .value
      .trim();


  const sectorInput =
    document.getElementById(
      "employeeSector"
    );


  const sector =

    currentAdmin.perfil ===
    "admin_setor"

      ? currentAdmin.setor

      : sectorInput.value;



  if (
    !name ||
    !registration ||
    !email ||
    !password ||
    !role ||
    !sector
  ) {

    alert(
      "Preencha todos os campos."
    );


    return;

  }



  if (
    password.length < 6
  ) {

    alert(
      "A senha deve possuir pelo menos 6 caracteres."
    );


    return;

  }



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
            JSON.stringify({

              nome:
                name,

              matricula:
                registration,

              email,

              senha:
                password,

              cargo:
                role,

              setor:
                sector,

              perfil:
                "colaborador"

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


    if (!response.ok) {

      throw new Error(

        result.error ||
        result.details ||
        "Não foi possível criar o funcionário."

      );

    }


    closeModal(
      "employeeModal"
    );


    await loadUsersFromApi();


    alert(
      "Funcionário criado com sucesso!"
    );


  } catch (error) {

    console.error(
      error
    );


    alert(
      error.message
    );

  }

}



// ==========================================================
// EVENTO DO FORMULÁRIO DO FUNCIONÁRIO
// ==========================================================

const employeeForm =
  document.getElementById(
    "employeeForm"
  );


if (employeeForm) {

  employeeForm.addEventListener(
    "submit",
    createEmployee
  );

}



// ==========================================================
// ABRIR MODAL DO ADMIN
// ==========================================================

function openAdminModal() {

  const form =
    document.getElementById(
      "adminForm"
    );


  if (form) {

    form.reset();

  }


  openModal(
    "adminModal"
  );

}



// ==========================================================
// CRIAR ADMINISTRADOR
// ==========================================================
//
// REGRA:
//
// qualquer Admin pode criar outro Admin,
// escolhendo o setor dele.
//
// ==========================================================

async function createAdmin(
  event
) {

  event.preventDefault();


  const name =
    document
      .getElementById(
        "adminUserName"
      )
      .value
      .trim();


  const registration =
    document
      .getElementById(
        "adminRegistration"
      )
      .value
      .trim();


  const email =
    document
      .getElementById(
        "adminEmail"
      )
      .value
      .trim()
      .toLowerCase();


  const password =
    document
      .getElementById(
        "adminPassword"
      )
      .value;


  const role =
    document
      .getElementById(
        "adminUserRole"
      )
      .value
      .trim();


  const sector =
    document
      .getElementById(
        "adminUserSector"
      )
      .value;



  if (
    !name ||
    !registration ||
    !email ||
    !password ||
    !role ||
    !sector
  ) {

    alert(
      "Preencha todos os campos."
    );


    return;

  }



  if (
    password.length < 6
  ) {

    alert(
      "A senha deve possuir pelo menos 6 caracteres."
    );


    return;

  }



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
            JSON.stringify({

              nome:
                name,

              matricula:
                registration,

              email,

              senha:
                password,

              cargo:
                role,

              setor:
                sector,

              perfil:
                "admin_setor"

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


    if (!response.ok) {

      throw new Error(

        result.error ||
        result.details ||
        "Não foi possível criar o administrador."

      );

    }


    closeModal(
      "adminModal"
    );


    await loadUsersFromApi();


    alert(
      "Administrador criado com sucesso!"
    );


  } catch (error) {

    console.error(
      "Erro ao criar administrador:",
      error
    );


    alert(
      error.message
    );

  }

}



// ==========================================================
// FORMULÁRIO ADMIN
// ==========================================================

const adminForm =
  document.getElementById(
    "adminForm"
  );


if (adminForm) {

  adminForm.addEventListener(
    "submit",
    createAdmin
  );

}



// ==========================================================
// ==========================================================
// CONFIGURAÇÃO DO PERÍODO DE FÉRIAS
// ==========================================================
// ==========================================================

const VACATION_DEFAULT_DAYS =
  30;



// ==========================================================
// ABRIR CONFIGURAÇÃO DE FÉRIAS
// ==========================================================

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



  if (
    employee.profile !==
    "colaborador"
  ) {

    alert(
      "Férias só podem ser configuradas para colaboradores."
    );


    return;

  }



  // ========================================================
  // ELEMENTOS
  // ========================================================

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
    "vacationEmployeeAvatar"
  ).textContent =
    getInitials(
      employee.name
    );



  document.getElementById(
    "vacationEmployeeName"
  ).textContent =
    employee.name;



  document.getElementById(
    "vacationEmployeeDetails"
  ).textContent =
    `${employee.role} • ${employee.sector}`;



  document.getElementById(
    "vacationEntitledDays"
  ).value =
    VACATION_DEFAULT_DAYS;



  document.getElementById(
    "vacationUsedDays"
  ).value =
    0;



  document.getElementById(
    "vacationSaveText"
  ).textContent =
    "Cadastrar período";



  clearVacationMessage();


  updateVacationBalancePreview();


  openModal(
    "vacationPeriodModal"
  );



  // ========================================================
  // BUSCAR PERÍODO EXISTENTE
  // ========================================================

  try {

    const response =
      await fetch(

        `/api/ferias/admin/periodos/${employeeId}`,

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


    if (!response.ok) {

      throw new Error(

        result.error ||
        "Não foi possível carregar o período de férias."

      );

    }



    if (!result.periodo) {

      return;

    }



    const periodo =
      result.periodo;



    document.getElementById(
      "vacationPeriodStart"
    ).value =

      periodo.periodo_inicio

        ? String(
            periodo.periodo_inicio
          ).substring(
            0,
            10
          )

        : "";



    document.getElementById(
      "vacationPeriodEnd"
    ).value =

      periodo.periodo_fim

        ? String(
            periodo.periodo_fim
          ).substring(
            0,
            10
          )

        : "";



    document.getElementById(
      "vacationUsedDays"
    ).value =
      Number(
        periodo.dias_usados || 0
      );



    document.getElementById(
      "vacationExpirationDate"
    ).value =

      periodo.data_vencimento

        ? String(
            periodo.data_vencimento
          ).substring(
            0,
            10
          )

        : "";



    document.getElementById(
      "vacationSaveText"
    ).textContent =
      "Atualizar período";


    updateVacationBalancePreview();


  } catch (error) {

    console.error(
      "Erro ao carregar férias:",
      error
    );


    showVacationMessage(
      error.message,
      "error"
    );

  }

}



// ==========================================================
// PREVIEW DO SALDO
// ==========================================================

function updateVacationBalancePreview() {

  const usedInput =
    document.getElementById(
      "vacationUsedDays"
    );


  const preview =
    document.getElementById(
      "vacationBalancePreview"
    );


  if (!preview) {

    return;

  }


  const used =
    Number(
      usedInput?.value || 0
    );


  const balance =
    Math.max(

      VACATION_DEFAULT_DAYS -
      used,

      0

    );


  preview.textContent =
    formatDays(
      balance
    );

}



// ==========================================================
// SALVAR PERÍODO
// ==========================================================

async function saveVacationPeriod(
  event
) {

  event.preventDefault();


  const employeeId =
    document.getElementById(
      "vacationEmployeeId"
    ).value;


  const periodStart =
    document.getElementById(
      "vacationPeriodStart"
    ).value;


  const periodEnd =
    document.getElementById(
      "vacationPeriodEnd"
    ).value;


  const usedDays =
    Number(
      document.getElementById(
        "vacationUsedDays"
      ).value
    );


  const expirationDate =
    document.getElementById(
      "vacationExpirationDate"
    ).value;



  // ========================================================
  // VALIDAÇÃO
  // ========================================================

  if (
    !employeeId ||
    !periodStart ||
    !periodEnd ||
    !expirationDate
  ) {

    showVacationMessage(
      "Preencha todos os campos obrigatórios.",
      "error"
    );


    return;

  }



  if (
    !Number.isInteger(
      usedDays
    )
    ||
    usedDays < 0
    ||
    usedDays >
      VACATION_DEFAULT_DAYS
  ) {

    showVacationMessage(
      "Os dias utilizados devem estar entre 0 e 30.",
      "error"
    );


    return;

  }



  if (
    periodEnd <
    periodStart
  ) {

    showVacationMessage(
      "O fim do período não pode ser anterior ao início.",
      "error"
    );


    return;

  }



  if (
    expirationDate <
    periodEnd
  ) {

    showVacationMessage(
      "A data de vencimento não pode ser anterior ao fim do período aquisitivo.",
      "error"
    );


    return;

  }



  const button =
    document.getElementById(
      "vacationSaveButton"
    );


  const text =
    document.getElementById(
      "vacationSaveText"
    );


  const originalText =
    text?.textContent ||
    "Salvar período";



  try {

    if (button) {

      button.disabled =
        true;

    }


    if (text) {

      text.textContent =
        "Salvando...";

    }



    // ======================================================
    // BACKEND
    // ======================================================
    //
    // dias_direito NÃO é enviado.
    //
    // Backend decide automaticamente:
    //
    // período incompleto → 0
    // período concluído → 30
    //
    // ======================================================

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
            JSON.stringify({

              periodo_inicio:
                periodStart,

              periodo_fim:
                periodEnd,

              dias_usados:
                usedDays,

              data_vencimento:
                expirationDate

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


    if (!response.ok) {

      throw new Error(

        result.error ||
        result.details ||
        "Não foi possível salvar o período de férias."

      );

    }



    showVacationMessage(

      result.message ||
      "Período salvo com sucesso.",

      "success"

    );


    setTimeout(
      () => {

        closeModal(
          "vacationPeriodModal"
        );

      },
      700
    );


  } catch (error) {

    console.error(
      "Erro ao salvar férias:",
      error
    );


    showVacationMessage(
      error.message,
      "error"
    );


  } finally {

    if (button) {

      button.disabled =
        false;

    }


    if (text) {

      text.textContent =
        originalText;

    }

  }

}



// ==========================================================
// MENSAGEM DE FÉRIAS
// ==========================================================

function showVacationMessage(
  message,
  type
) {

  const container =
    document.getElementById(
      "vacationFormMessage"
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
// LIMPAR MENSAGEM
// ==========================================================

function clearVacationMessage() {

  const container =
    document.getElementById(
      "vacationFormMessage"
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
// FORMULÁRIO DE FÉRIAS
// ==========================================================

const vacationPeriodForm =
  document.getElementById(
    "vacationPeriodForm"
  );


if (vacationPeriodForm) {

  vacationPeriodForm.addEventListener(
    "submit",
    saveVacationPeriod
  );

}



// ==========================================================
// PREVIEW AUTOMÁTICO
// ==========================================================

const vacationUsedDaysInput =
  document.getElementById(
    "vacationUsedDays"
  );


if (vacationUsedDaysInput) {

  vacationUsedDaysInput.addEventListener(
    "input",
    updateVacationBalancePreview
  );

}

// ==========================================================
// ==========================================================
// TREINAMENTOS
// ==========================================================
// ==========================================================



// ==========================================================
// CONVERTER CURSO DA API
// ==========================================================

function mapApiCourse(
  apiCourse
) {

  const apiActivities =
    apiCourse.atividades_curso ||
    [];


  apiActivities.sort(
    (
      activityA,
      activityB
    ) => {

      return (

        Number(
          activityA.ordem || 0
        )

        -

        Number(
          activityB.ordem || 0
        )

      );

    }
  );


  return {

    id:
      apiCourse.id,

    title:
      apiCourse.titulo,

    description:
      apiCourse.descricao,

    hours:
      apiCourse.carga_horaria,

    area:
      apiCourse.area,

    level:
      apiCourse.nivel,

    responsibleSector:
      apiCourse.setor_responsavel,

    targetSector:
      apiCourse.setor_destino,

    requirement:
      apiCourse.classificacao,

    external:
      Boolean(
        apiCourse.curso_externo
      ),

    externalLink:
      apiCourse.link_externo ||
      "",

    active:
      apiCourse.ativo,

    createdAt:
      apiCourse.created_at,

    activities:
      apiActivities.map(
        activity => {

          return {

            id:
              activity.id,

            courseId:
              activity.curso_id,

            title:
              activity.titulo,

            description:
              activity.descricao ||
              "",

            type:
              activity.tipo,

            resource:
              activity.recurso ||
              "",

            order:
              activity.ordem

          };

        }
      )

  };

}



// ==========================================================
// CARREGAR CURSOS
// ==========================================================

async function loadCoursesFromApi() {

  const container =
    document.getElementById(
      "trainingAdminGrid"
    );


  if (container) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-spinner fa-spin"></i>

        <strong>
          Carregando treinamentos...
        </strong>

        <span>
          Buscando dados do servidor.
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
            "GET"

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(

        result.erro ||
        result.error ||
        "Não foi possível carregar os treinamentos."

      );

    }


    courses =
      (
        result || []
      )

        .map(
          mapApiCourse
        )

        .filter(
          course =>
            course.active !== false
        );


    renderCourses();


    renderDashboardCourses();


    updateDashboardCounters();


  } catch (error) {

    console.error(
      "Erro ao carregar cursos:",
      error
    );


    courses =
      [];


    if (container) {

      container.innerHTML = `

        <div class="empty-state">

          <i class="fa-solid fa-triangle-exclamation"></i>

          <strong>
            Não foi possível carregar os treinamentos
          </strong>

          <span>

            ${escapeHTML(
              error.message
            )}

          </span>

        </div>

      `;

    }


    updateDashboardCounters();

  }

}



// ==========================================================
// RENDERIZAR CURSOS
// ==========================================================

function renderCourses() {

  const container =
    document.getElementById(
      "trainingAdminGrid"
    );


  if (!container) {

    return;

  }


  const searchInput =
    document.getElementById(
      "trainingSearch"
    );


  const search =
    String(
      searchInput?.value || ""
    )
      .trim()
      .toLowerCase();


  const filtered =
    courses.filter(
      course => {

        const text = [

          course.title,

          course.description,

          course.area,

          course.level,

          course.responsibleSector,

          course.targetSector,

          course.requirement

        ]

          .join(
            " "
          )

          .toLowerCase();


        return text.includes(
          search
        );

      }
    );


  container.innerHTML =
    "";


  // ========================================================
  // SEM CURSOS
  // ========================================================

  if (
    filtered.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-graduation-cap"></i>

        <strong>
          Nenhum treinamento encontrado
        </strong>

        <span>
          Crie um novo treinamento ou altere sua busca.
        </span>

      </div>

    `;


    return;

  }


  // ========================================================
  // CARDS
  // ========================================================

  filtered.forEach(
    course => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "admin-course-card";


      const requirementClass =

        course.requirement ===
        "Obrigatório"

          ? "danger"

          : "purple-status";


      card.innerHTML = `

        <div class="admin-course-banner">

          <span
            class="
              status-badge
              ${requirementClass}
            "
          >

            ${escapeHTML(
              course.requirement
            )}

          </span>


          <i class="fa-solid fa-graduation-cap"></i>


          <span
            class="
              status-badge
              ${
                course.external
                  ? "info"
                  : "success"
              }
            "
          >

            ${
              course.external
                ? "Externo"
                : "Interno"
            }

          </span>

        </div>


        <div class="course-card-content">


          <div class="course-card-top">

            <span class="course-card-area">

              ${escapeHTML(
                course.area
              )}

            </span>


            <span class="status-badge success">

              Ativo

            </span>

          </div>


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


          <div class="course-meta-grid">


            <div class="course-meta-item">

              <span>
                Carga horária
              </span>

              <strong>
                ${course.hours}h
              </strong>

            </div>


            <div class="course-meta-item">

              <span>
                Nível
              </span>

              <strong>

                ${escapeHTML(
                  course.level
                )}

              </strong>

            </div>


            <div class="course-meta-item">

              <span>
                Público
              </span>

              <strong>

                ${escapeHTML(
                  course.targetSector
                )}

              </strong>

            </div>


            <div class="course-meta-item">

              <span>
                Atividades
              </span>

              <strong>
                ${course.activities.length}
              </strong>

            </div>


          </div>


          <div class="course-actions">


            <button
              type="button"
              class="view-course-button"
              onclick="
                showCourseDetails(
                  '${course.id}'
                )
              "
            >

              <i class="fa-regular fa-eye"></i>

              Visualizar

            </button>


            <button
              type="button"
              class="delete-course-button"
              onclick="
                askDeleteCourse(
                  '${course.id}'
                )
              "
              title="Remover treinamento"
            >

              <i class="fa-solid fa-trash"></i>

            </button>


          </div>

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// PESQUISA DE TREINAMENTOS
// ==========================================================

const trainingSearch =
  document.getElementById(
    "trainingSearch"
  );


if (trainingSearch) {

  trainingSearch.addEventListener(
    "input",
    renderCourses
  );

}



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


  const recentCourses =
    courses
      .slice(
        0,
        3
      );


  container.innerHTML =
    "";


  if (
    recentCourses.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <strong>
          Nenhum treinamento publicado
        </strong>

        <span>
          Crie o primeiro treinamento da plataforma.
        </span>

      </div>

    `;


    return;

  }


  recentCourses.forEach(
    course => {

      const item =
        document.createElement(
          "article"
        );


      item.className =
        "training-mini-card";


      item.innerHTML = `

        <div class="training-mini-top">

          <span class="training-mini-category">

            ${escapeHTML(
              course.area
            )}

          </span>


          <span class="status-badge success">
            Ativo
          </span>

        </div>


        <h3>

          ${escapeHTML(
            course.title
          )}

        </h3>


        <p>

          ${course.hours}h •

          ${escapeHTML(
            course.level
          )}

          •

          ${course.activities.length}
          atividade(s)

        </p>

      `;


      container.appendChild(
        item
      );

    }
  );

}



// ==========================================================
// ABRIR MODAL DE NOVO CURSO
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


  // ========================================================
  // CURSO EXTERNO
  // ========================================================

  const externalArea =
    document.getElementById(
      "externalLinkArea"
    );


  if (externalArea) {

    externalArea.style.display =
      "none";

  }


  renderActivityBuilder();


  openModal(
    "courseModal"
  );

}



// ==========================================================
// CURSO EXTERNO
// ==========================================================

function toggleExternalCourse() {

  const checkbox =
    document.getElementById(
      "externalCourse"
    );


  const area =
    document.getElementById(
      "externalLinkArea"
    );


  if (
    !checkbox ||
    !area
  ) {

    return;

  }


  area.style.display =

    checkbox.checked

      ? "block"

      : "none";

}



// ==========================================================
// EVENTO DO CHECKBOX
// ==========================================================

const externalCourseCheckbox =
  document.getElementById(
    "externalCourse"
  );


if (
  externalCourseCheckbox
) {

  externalCourseCheckbox.addEventListener(
    "change",
    toggleExternalCourse
  );

}



// ==========================================================
// ADICIONAR ATIVIDADE
// ==========================================================

function addActivity() {

  temporaryActivities.push({

    temporaryId:
      Date.now() +
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
        Number(
          activity.temporaryId
        )
        !==
        Number(
          activityId
        )
    );


  renderActivityBuilder();

}



// ==========================================================
// ALTERAR ATIVIDADE
// ==========================================================

function updateActivity(
  activityId,
  field,
  value
) {

  const activity =
    temporaryActivities.find(
      item =>
        Number(
          item.temporaryId
        )
        ===
        Number(
          activityId
        )
    );


  if (!activity) {

    return;

  }


  activity[
    field
  ] =
    value;


  // ========================================================
  // AO TROCAR O TIPO
  // ========================================================

  if (
    field ===
    "type"
  ) {

    activity.resource =
      "";


    renderActivityBuilder();

  }

}



// ==========================================================
// ARQUIVO DA ATIVIDADE
// ==========================================================

function saveActivityFile(
  activityId,
  input
) {

  if (
    !input.files ||
    input.files.length ===
    0
  ) {

    return;

  }


  const activity =
    temporaryActivities.find(
      item =>
        Number(
          item.temporaryId
        )
        ===
        Number(
          activityId
        )
    );


  if (!activity) {

    return;

  }


  // ========================================================
  // POR ENQUANTO
  // ========================================================
  //
  // Salvamos somente o nome.
  //
  // Depois:
  // Supabase Storage.
  //
  // ========================================================

  activity.resource =
    input.files[0].name;


  renderActivityBuilder();

}



// ==========================================================
// CONSTRUTOR DE ATIVIDADES
// ==========================================================

function renderActivityBuilder() {

  const container =
    document.getElementById(
      "activityBuilder"
    );


  if (!container) {

    return;

  }


  // ========================================================
  // VAZIO
  // ========================================================

  if (
    temporaryActivities.length ===
    0
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


  // ========================================================
  // ATIVIDADES
  // ========================================================

  temporaryActivities.forEach(
    (
      activity,
      index
    ) => {

      const element =
        document.createElement(
          "div"
        );


      element.className =
        "activity-builder";


      let resourceField =
        "";


      // ====================================================
      // LINK
      // ====================================================

      if (
        activity.type ===
        "Link"
      ) {

        resourceField = `

          <div class="form-group">

            <label>
              Link
            </label>

            <input
              type="url"
              value="${escapeHTML(
                activity.resource
              )}"
              placeholder="https://..."
              oninput="
                updateActivity(
                  ${activity.temporaryId},
                  'resource',
                  this.value
                )
              "
            >

          </div>

        `;

      }



      // ====================================================
      // ARQUIVO
      // ====================================================

      if (
        activity.type ===
        "Arquivo"
      ) {

        resourceField = `

          <div class="form-group">

            <label>
              Arquivo / material
            </label>

            <input
              type="file"
              onchange="
                saveActivityFile(
                  ${activity.temporaryId},
                  this
                )
              "
            >

            ${
              activity.resource

                ? `

                  <small class="field-helper">

                    Arquivo selecionado:

                    ${escapeHTML(
                      activity.resource
                    )}

                  </small>

                `

                : ""
            }

          </div>

        `;

      }



      element.innerHTML = `

        <div class="activity-builder-header">

          <strong>
            Atividade ${index + 1}
          </strong>


          <button
            type="button"
            class="remove-activity"
            onclick="
              removeActivity(
                ${activity.temporaryId}
              )
            "
          >

            <i class="fa-solid fa-trash"></i>

          </button>

        </div>


        <div class="form-group">

          <label>
            Título da atividade
          </label>

          <input
            type="text"
            value="${escapeHTML(
              activity.title
            )}"
            placeholder="Ex.: Criar uma planilha"
            oninput="
              updateActivity(
                ${activity.temporaryId},
                'title',
                this.value
              )
            "
          >

        </div>


        <div class="form-group">

          <label>
            Instruções
          </label>

          <textarea
            rows="3"
            placeholder="Explique o que deve ser realizado."
            oninput="
              updateActivity(
                ${activity.temporaryId},
                'description',
                this.value
              )
            "
          >${escapeHTML(
            activity.description
          )}</textarea>

        </div>


        <div class="form-group">

          <label>
            Tipo
          </label>

          <select
            onchange="
              updateActivity(
                ${activity.temporaryId},
                'type',
                this.value
              )
            "
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


        ${resourceField}

      `;


      container.appendChild(
        element
      );

    }
  );

}



// ==========================================================
// CRIAR CURSO
// ==========================================================

async function createCourse(
  event
) {

  event.preventDefault();


  // ========================================================
  // CAMPOS
  // ========================================================

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
      document.getElementById(
        "courseHours"
      ).value
    );


  const area =
    document
      .getElementById(
        "courseArea"
      )
      .value
      .trim();


  const level =
    document.getElementById(
      "courseLevel"
    ).value;


  const requirement =
    document.getElementById(
      "courseRequirement"
    ).value;


  const responsibleSector =
    document.getElementById(
      "courseResponsibleSector"
    ).value;


  const targetSector =
    document.getElementById(
      "courseTargetSector"
    ).value;


  const external =
    document.getElementById(
      "externalCourse"
    ).checked;


  const externalLink =
    document.getElementById(
      "externalCourseLinkInput"
    ).value.trim();



  // ========================================================
  // VALIDAÇÃO
  // ========================================================

  if (
    !title ||
    !description ||
    !hours ||
    !area ||
    !level ||
    !requirement ||
    !responsibleSector ||
    !targetSector
  ) {

    alert(
      "Preencha todos os campos do treinamento."
    );


    return;

  }



  // ========================================================
  // REGRA DO SETOR RESPONSÁVEL
  // ========================================================
  //
  // Admin de setor:
  // curso pertence ao próprio setor.
  //
  // ========================================================

  if (
    currentAdmin.perfil ===
      "admin_setor"
    &&
    responsibleSector !==
      currentAdmin.setor
  ) {

    alert(
      "Você só pode criar treinamentos cujo setor responsável seja o seu próprio setor."
    );


    return;

  }



  // ========================================================
  // CURSO EXTERNO
  // ========================================================

  if (
    external &&
    !externalLink
  ) {

    alert(
      "Informe o link do treinamento externo."
    );


    return;

  }



  // ========================================================
  // ATIVIDADES
  // ========================================================

  const invalidActivity =
    temporaryActivities.find(
      activity =>
        !activity.title.trim()
    );


  if (
    invalidActivity
  ) {

    alert(
      "Todas as atividades precisam possuir título."
    );


    return;

  }



  try {

    const response =
      await fetch(
        "/api/cursos",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              titulo:
                title,

              descricao:
                description,

              carga_horaria:
                hours,

              area:
                area,

              nivel:
                level,

              setor_responsavel:
                responsibleSector,

              setor_destino:
                targetSector,

              classificacao:
                requirement,

              curso_externo:
                external,

              link_externo:
                external
                  ? externalLink
                  : null,

              atividades:
                temporaryActivities.map(
                  activity => {

                    return {

                      titulo:
                        activity.title
                          .trim(),

                      descricao:
                        activity.description
                          .trim()
                        ||
                        null,

                      tipo:
                        activity.type,

                      recurso:
                        activity.resource
                        ||
                        null

                    };

                  }
                )

            })

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(

        result.erro ||
        result.error ||
        "Não foi possível criar o treinamento."

      );

    }


    closeModal(
      "courseModal"
    );


    temporaryActivities =
      [];


    await loadCoursesFromApi();


    changePage(
      "trainings"
    );


    alert(
      "Treinamento criado com sucesso!"
    );


  } catch (error) {

    console.error(
      "Erro ao criar treinamento:",
      error
    );


    alert(
      error.message
    );

  }

}



// ==========================================================
// FORMULÁRIO DE CURSO
// ==========================================================

const courseForm =
  document.getElementById(
    "courseForm"
  );


if (courseForm) {

  courseForm.addEventListener(
    "submit",
    createCourse
  );

}



// ==========================================================
// DETALHES DO CURSO
// ==========================================================

function showCourseDetails(
  courseId
) {

  const course =
    courses.find(
      item =>
        String(item.id) ===
        String(courseId)
    );


  if (!course) {

    return;

  }


  const activitiesHTML =

    course.activities.length > 0

      ? course.activities
          .map(
            (
              activity,
              index
            ) => {

              return `

                <div class="details-activity">

                  <strong>

                    ${index + 1}.

                    ${escapeHTML(
                      activity.title
                    )}

                  </strong>


                  <span>

                    ${escapeHTML(
                      activity.type
                    )}

                    ${
                      activity.resource

                        ? ` • ${escapeHTML(
                            activity.resource
                          )}`

                        : ""
                    }

                  </span>


                  ${
                    activity.description

                      ? `

                        <p>

                          ${escapeHTML(
                            activity.description
                          )}

                        </p>

                      `

                      : ""
                  }

                </div>

              `;

            }
          )
          .join("")

      : `

        <div class="details-activity">

          Nenhuma atividade cadastrada.

        </div>

      `;



  const container =
    document.getElementById(
      "courseDetailsContent"
    );


  if (!container) {

    return;

  }


  container.innerHTML = `

    <div class="details-course-header">


      <div class="course-icon-large">

        <i class="fa-solid fa-graduation-cap"></i>

      </div>


      <span class="status-badge purple-status">

        ${escapeHTML(
          course.area
        )}

      </span>


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
          Carga horária
        </span>

        <strong>
          ${course.hours} horas
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

    </div>


    ${
      course.external

        ? `

          <div class="form-information">

            <i class="fa-solid fa-link"></i>

            <p>

              Curso externo:

              <br><br>

              ${escapeHTML(
                course.externalLink
              )}

            </p>

          </div>

        `

        : ""
    }


    <div class="details-activities">

      <h3>
        Atividades
      </h3>

      ${activitiesHTML}

    </div>

  `;


  openModal(
    "courseDetailsModal"
  );

}



// ==========================================================
// PEDIR EXCLUSÃO DO CURSO
// ==========================================================

function askDeleteCourse(
  courseId
) {

  courseToDelete =
    courseId;


  openModal(
    "confirmationModal"
  );

}



// ==========================================================
// CONFIRMAR EXCLUSÃO
// ==========================================================

const confirmDeleteButton =
  document.getElementById(
    "confirmDeleteButton"
  );


if (
  confirmDeleteButton
) {

  confirmDeleteButton.addEventListener(
    "click",
    async () => {

      if (
        courseToDelete ===
        null
      ) {

        return;

      }


      const originalHTML =
        confirmDeleteButton.innerHTML;


      try {

        confirmDeleteButton.disabled =
          true;


        confirmDeleteButton.innerHTML = `

          <i class="fa-solid fa-spinner fa-spin"></i>

          Removendo...

        `;


        const response =
          await fetch(

            `/api/cursos/${courseToDelete}/desativar`,

            {

              method:
                "PATCH"

            }

          );


        const result =
          await response.json();


        if (!response.ok) {

          throw new Error(

            result.erro ||
            result.error ||
            "Não foi possível remover o treinamento."

          );

        }


        closeModal(
          "confirmationModal"
        );


        courseToDelete =
          null;


        await loadCoursesFromApi();


        alert(
          "Treinamento removido com sucesso."
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

        confirmDeleteButton.disabled =
          false;


        confirmDeleteButton.innerHTML =
          originalHTML;

      }

    }
  );

}

// ==========================================================
// ==========================================================
// AVALIAÇÕES
// ==========================================================
// ==========================================================
//
// POR ENQUANTO:
//
// avaliações continuam mockadas.
//
// Depois substituiremos pelos dados reais
// enviados pelos colaboradores.
//
// ==========================================================



// ==========================================================
// RENDERIZAR AVALIAÇÕES
// ==========================================================

function renderEvaluations() {

  const container =
    document.getElementById(
      "evaluationList"
    );


  if (!container) {

    return;

  }



  const searchInput =
    document.getElementById(
      "evaluationSearch"
    );


  const search =
    String(
      searchInput?.value || ""
    )
      .trim()
      .toLowerCase();



  const pendingEvaluations =
    evaluations.filter(
      evaluation => {

        if (
          evaluation.status !==
          "pending"
        ) {

          return false;

        }


        const text = [

          evaluation.employee,

          evaluation.course,

          evaluation.sector

        ]

          .join(
            " "
          )

          .toLowerCase();


        return text.includes(
          search
        );

      }
    );



  container.innerHTML =
    "";



  // ========================================================
  // NENHUMA AVALIAÇÃO
  // ========================================================

  if (
    pendingEvaluations.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-circle-check"></i>

        <strong>
          Nenhuma avaliação pendente
        </strong>

        <span>
          Todas as avaliações disponíveis já foram analisadas.
        </span>

      </div>

    `;


    updateEvaluationCounters();


    return;

  }



  // ========================================================
  // CARDS
  // ========================================================

  pendingEvaluations.forEach(
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
            evaluation.initials ||
            getInitials(
              evaluation.employee
            )
          )}

        </div>


        <div class="evaluation-content">

          <h3>

            ${escapeHTML(
              evaluation.employee
            )}

          </h3>


          <span class="evaluation-course-name">

            ${escapeHTML(
              evaluation.course
            )}

          </span>


          <div class="evaluation-meta">


            <span>

              <i class="fa-solid fa-building"></i>

              ${escapeHTML(
                evaluation.sector
              )}

            </span>


            <span>

              <i class="fa-regular fa-clock"></i>

              ${evaluation.hours}h

            </span>


            <span>

              <i class="fa-regular fa-calendar"></i>

              ${escapeHTML(
                evaluation.submittedAt
              )}

            </span>


          </div>

        </div>


        <button
          type="button"
          class="evaluate-button"
          onclick="
            openEvaluation(
              ${evaluation.id}
            )
          "
        >

          Avaliar

        </button>

      `;


      container.appendChild(
        card
      );

    }
  );



  updateEvaluationCounters();

}



// ==========================================================
// PESQUISA DE AVALIAÇÃO
// ==========================================================

const evaluationSearch =
  document.getElementById(
    "evaluationSearch"
  );


if (evaluationSearch) {

  evaluationSearch.addEventListener(
    "input",
    renderEvaluations
  );

}



// ==========================================================
// ABRIR AVALIAÇÃO
// ==========================================================

function openEvaluation(
  evaluationId
) {

  const evaluation =
    evaluations.find(
      item =>
        Number(item.id) ===
        Number(evaluationId)
    );


  if (!evaluation) {

    return;

  }



  const activitiesHTML =
    evaluation.activities

      .map(
        (
          activity,
          index
        ) => {

          return `

            <div class="submission-item">


              <div class="submission-item-header">

                <strong>
                  Atividade ${index + 1}
                </strong>

                <span class="status-badge success">
                  Entregue
                </span>

              </div>


              <p>

                ${escapeHTML(
                  activity.title
                )}

              </p>


              <div class="submission-file">

                <i class="fa-solid fa-file"></i>

                <span>

                  ${escapeHTML(
                    activity.file
                  )}

                </span>

              </div>


            </div>

          `;

        }
      )

      .join("");



  const container =
    document.getElementById(
      "evaluationModalContent"
    );


  if (!container) {

    return;

  }



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
          Analise as atividades enviadas pelo colaborador.
        </p>

      </div>

    </div>


    <div class="evaluation-profile">


      <div class="list-avatar">

        ${escapeHTML(
          evaluation.initials
        )}

      </div>


      <div>

        <strong>

          ${escapeHTML(
            evaluation.employee
          )}

        </strong>


        <span>

          ${escapeHTML(
            evaluation.course
          )}

          •

          ${evaluation.hours}h

        </span>

      </div>


    </div>


    <div class="submission-list">

      ${activitiesHTML}

    </div>


    <div class="form-group">

      <label for="evaluationObservation">
        Observações
      </label>

      <textarea
        id="evaluationObservation"
        rows="4"
        placeholder="Informe observações ou instruções de correção..."
      ></textarea>

    </div>


    <div class="evaluation-decision-actions">


      <button
        type="button"
        class="danger-button"
        onclick="
          rejectEvaluation(
            ${evaluation.id}
          )
        "
      >

        <i class="fa-solid fa-rotate-left"></i>

        Solicitar correção

      </button>


      <button
        type="button"
        class="primary-button"
        onclick="
          approveEvaluation(
            ${evaluation.id}
          )
        "
      >

        <i class="fa-solid fa-check"></i>

        Aprovar

      </button>


    </div>

  `;


  openModal(
    "evaluationModal"
  );

}



// ==========================================================
// APROVAR AVALIAÇÃO
// ==========================================================

function approveEvaluation(
  evaluationId
) {

  const evaluation =
    evaluations.find(
      item =>
        Number(item.id) ===
        Number(evaluationId)
    );


  if (!evaluation) {

    return;

  }


  evaluation.status =
    "approved";


  closeModal(
    "evaluationModal"
  );


  renderEvaluations();


  updateDashboardCounters();


  alert(
    "Treinamento aprovado."
  );

}



// ==========================================================
// SOLICITAR CORREÇÃO
// ==========================================================

function rejectEvaluation(
  evaluationId
) {

  const observationInput =
    document.getElementById(
      "evaluationObservation"
    );


  const observation =
    observationInput
      ? observationInput.value.trim()
      : "";


  if (!observation) {

    alert(
      "Informe o que precisa ser corrigido."
    );


    return;

  }



  const evaluation =
    evaluations.find(
      item =>
        Number(item.id) ===
        Number(evaluationId)
    );


  if (!evaluation) {

    return;

  }


  evaluation.status =
    "rejected";


  evaluation.observation =
    observation;


  closeModal(
    "evaluationModal"
  );


  renderEvaluations();


  updateDashboardCounters();


  alert(
    "O treinamento foi enviado para correção."
  );

}



// ==========================================================
// ==========================================================
// SOLICITAÇÕES DE FÉRIAS DO ADMIN
// ==========================================================
// ==========================================================
//
// BACKEND:
//
// GET
//
// /api/ferias/admin/solicitacoes
//
// retorna as solicitações.
//
// Admin de setor:
// backend retorna somente solicitações
// dos colaboradores daquele setor.
//
// ==========================================================



// ==========================================================
// CARREGAR SOLICITAÇÕES
// ==========================================================

async function loadVacationRequests() {

  const container =
    document.getElementById(
      "vacationRequestList"
    );


  if (container) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-spinner fa-spin"></i>

        <strong>
          Carregando solicitações...
        </strong>

        <span>
          Buscando solicitações de férias.
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
      await response.json();


    if (!response.ok) {

      throw new Error(

        result.error ||
        "Não foi possível carregar as solicitações de férias."

      );

    }



    vacationRequests =
      Array.isArray(
        result
      )
        ? result
        : [];



    // ======================================================
    // FILA DO ADMIN
    // ======================================================
    //
    // Queremos mostrar apenas pendentes.
    //
    // Mesmo que futuramente o backend retorne
    // histórico também, a tela continua correta.
    //
    // ======================================================

    vacationRequests =
      vacationRequests.filter(
        request =>
          request.status ===
          "pendente"
      );



    renderVacationRequests();


    updateVacationCounters();


  } catch (error) {

    console.error(
      "Erro ao carregar solicitações de férias:",
      error
    );


    vacationRequests =
      [];


    updateVacationCounters();


    if (container) {

      container.innerHTML = `

        <div class="empty-state">

          <i class="fa-solid fa-triangle-exclamation"></i>

          <strong>
            Não foi possível carregar as solicitações
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

}



// ==========================================================
// RENDERIZAR SOLICITAÇÕES
// ==========================================================

function renderVacationRequests() {

  const container =
    document.getElementById(
      "vacationRequestList"
    );


  if (!container) {

    return;

  }



  const searchInput =
    document.getElementById(
      "vacationSearch"
    );


  const search =
    String(
      searchInput?.value || ""
    )
      .trim()
      .toLowerCase();



  const filtered =
    vacationRequests.filter(
      request => {

        const employee =
          request.usuario ||
          {};


        const text = [

          employee.nome,

          employee.matricula,

          employee.cargo,

          employee.setor

        ]

          .join(
            " "
          )

          .toLowerCase();


        return text.includes(
          search
        );

      }
    );


  container.innerHTML =
    "";



  // ========================================================
  // SEM SOLICITAÇÕES
  // ========================================================

  if (
    filtered.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-circle-check"></i>

        <strong>
          Nenhuma solicitação pendente
        </strong>

        <span>
          Não existem solicitações de férias aguardando sua análise.
        </span>

      </div>

    `;


    return;

  }



  // ========================================================
  // CARDS
  // ========================================================

  filtered.forEach(
    request => {

      const employee =
        request.usuario ||
        {};


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "vacation-request-card";


      card.innerHTML = `

        <div class="vacation-request-person">


          <div class="list-avatar">

            ${getInitials(
              employee.nome
            )}

          </div>


          <div>

            <strong>

              ${escapeHTML(
                employee.nome ||
                "Colaborador"
              )}

            </strong>


            <span>

              ${escapeHTML(
                employee.cargo ||
                "Cargo não informado"
              )}

              •

              ${escapeHTML(
                employee.setor ||
                "Setor não informado"
              )}

            </span>

          </div>


        </div>


        <div class="vacation-request-period">


          <span>
            Período solicitado
          </span>


          <strong>

            ${formatDate(
              request.data_inicio
            )}

            até

            ${formatDate(
              request.data_fim
            )}

          </strong>


        </div>


        <div class="vacation-request-days">


          <span>
            Quantidade
          </span>


          <strong>

            ${formatDays(
              request.quantidade_dias
            )}

          </strong>


        </div>


        <div class="vacation-request-status">

          <span class="status-badge warning">

            Pendente

          </span>

        </div>


        <button
          type="button"
          class="primary-button vacation-review-button"
          onclick="
            openVacationRequestReview(
              '${request.id}'
            )
          "
        >

          <i class="fa-regular fa-eye"></i>

          Analisar

        </button>

      `;


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// BUSCA DE SOLICITAÇÃO
// ==========================================================

const vacationSearch =
  document.getElementById(
    "vacationSearch"
  );


if (vacationSearch) {

  vacationSearch.addEventListener(
    "input",
    renderVacationRequests
  );

}



// ==========================================================
// ABRIR SOLICITAÇÃO
// ==========================================================

function openVacationRequestReview(
  requestId
) {

  const request =
    vacationRequests.find(
      item =>
        String(item.id) ===
        String(requestId)
    );


  if (!request) {

    alert(
      "Solicitação não encontrada."
    );


    return;

  }


  currentVacationRequestId =
    request.id;



  const employee =
    request.usuario ||
    {};



  // ========================================================
  // ID
  // ========================================================

  const requestIdInput =
    document.getElementById(
      "vacationReviewRequestId"
    );


  if (requestIdInput) {

    requestIdInput.value =
      request.id;

  }



  // ========================================================
  // AVATAR
  // ========================================================

  const avatar =
    document.getElementById(
      "vacationReviewAvatar"
    );


  if (avatar) {

    avatar.textContent =
      getInitials(
        employee.nome
      );

  }



  // ========================================================
  // NOME
  // ========================================================

  const name =
    document.getElementById(
      "vacationReviewName"
    );


  if (name) {

    name.textContent =
      employee.nome ||
      "Colaborador";

  }



  // ========================================================
  // DETALHES
  // ========================================================

  const details =
    document.getElementById(
      "vacationReviewEmployeeDetails"
    );


  if (details) {

    details.textContent =
      `${
        employee.cargo ||
        "Cargo não informado"
      } • ${
        employee.setor ||
        "Setor não informado"
      }`;

  }



  // ========================================================
  // INÍCIO
  // ========================================================

  const start =
    document.getElementById(
      "vacationReviewStart"
    );


  if (start) {

    start.textContent =
      formatDate(
        request.data_inicio
      );

  }



  // ========================================================
  // FIM
  // ========================================================

  const end =
    document.getElementById(
      "vacationReviewEnd"
    );


  if (end) {

    end.textContent =
      formatDate(
        request.data_fim
      );

  }



  // ========================================================
  // DIAS
  // ========================================================

  const days =
    document.getElementById(
      "vacationReviewDays"
    );


  if (days) {

    days.textContent =
      formatDays(
        request.quantidade_dias
      );

  }



  // ========================================================
  // DATA DA SOLICITAÇÃO
  // ========================================================

  const createdAt =
    document.getElementById(
      "vacationReviewCreatedAt"
    );


  if (createdAt) {

    createdAt.textContent =
      formatDate(
        request.created_at
      );

  }



  // ========================================================
  // OBSERVAÇÃO DO COLABORADOR
  // ========================================================

  const employeeObservation =
    document.getElementById(
      "vacationReviewEmployeeObservation"
    );


  if (employeeObservation) {

    employeeObservation.textContent =

      request.observacoes?.trim()

        ? request.observacoes

        : "Nenhuma observação informada.";

  }



  // ========================================================
  // LIMPAR OBSERVAÇÃO DO ADMIN
  // ========================================================

  const adminObservation =
    document.getElementById(
      "vacationAdminObservation"
    );


  if (adminObservation) {

    adminObservation.value =
      "";

  }



  clearVacationAdminMessage();



  openModal(
    "vacationRequestAdminModal"
  );

}



// ==========================================================
// RESPONDER SOLICITAÇÃO
// ==========================================================

async function answerVacationRequest(
  status
) {

  // ========================================================
  // SOLICITAÇÃO
  // ========================================================

  const requestId =

    currentVacationRequestId

    ||

    document.getElementById(
      "vacationReviewRequestId"
    )?.value;



  if (!requestId) {

    showVacationAdminMessage(
      "Solicitação não identificada.",
      "error"
    );


    return;

  }



  // ========================================================
  // STATUS PERMITIDOS
  // ========================================================

  const allowedStatus = [

    "aprovada",

    "aprovada_com_ressalvas",

    "recusada"

  ];


  if (
    !allowedStatus.includes(
      status
    )
  ) {

    showVacationAdminMessage(
      "Decisão inválida.",
      "error"
    );


    return;

  }



  // ========================================================
  // OBSERVAÇÃO
  // ========================================================

  const observationInput =
    document.getElementById(
      "vacationAdminObservation"
    );


  const observation =
    observationInput
      ? observationInput.value.trim()
      : "";



  // ========================================================
  // RECUSA / RESSALVA
  // ========================================================

  if (
    (
      status ===
        "recusada"

      ||

      status ===
        "aprovada_com_ressalvas"
    )

    &&

    !observation
  ) {

    showVacationAdminMessage(
      "Informe uma observação para esta decisão.",
      "error"
    );


    return;

  }



  // ========================================================
  // CONFIRMAÇÃO
  // ========================================================

  let confirmationMessage =
    "Deseja aprovar esta solicitação de férias?";


  if (
    status ===
    "recusada"
  ) {

    confirmationMessage =
      "Deseja realmente recusar esta solicitação?";

  }


  if (
    status ===
    "aprovada_com_ressalvas"
  ) {

    confirmationMessage =
      "Deseja aprovar esta solicitação com ressalvas?";

  }



  const confirmed =
    confirm(
      confirmationMessage
    );


  if (!confirmed) {

    return;

  }



  // ========================================================
  // BOTÕES
  // ========================================================

  setVacationDecisionButtonsDisabled(
    true
  );



  try {

    showVacationAdminMessage(
      "Salvando decisão...",
      "info"
    );



    const response =
      await fetch(

        `/api/ferias/admin/solicitacoes/${requestId}`,

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



    if (!response.ok) {

      throw new Error(

        result.error ||
        result.details ||
        "Não foi possível analisar a solicitação."

      );

    }



    // ======================================================
    // SUCESSO
    // ======================================================

    showVacationAdminMessage(

      result.message ||
      "Solicitação analisada com sucesso.",

      "success"

    );



    // ======================================================
    // REMOVER DA LISTA LOCAL
    // ======================================================
    //
    // Como a solicitação deixou de ser pendente,
    // removemos imediatamente.
    //
    // ======================================================

    vacationRequests =
      vacationRequests.filter(
        request =>
          String(request.id) !==
          String(requestId)
      );



    updateVacationCounters();



    setTimeout(
      () => {

        closeModal(
          "vacationRequestAdminModal"
        );


        currentVacationRequestId =
          null;


        renderVacationRequests();


      },
      700
    );


  } catch (error) {

    console.error(
      "Erro ao responder solicitação:",
      error
    );


    showVacationAdminMessage(
      error.message,
      "error"
    );


  } finally {

    setVacationDecisionButtonsDisabled(
      false
    );

  }

}



// ==========================================================
// DESABILITAR BOTÕES DE DECISÃO
// ==========================================================

function setVacationDecisionButtonsDisabled(
  disabled
) {

  const ids = [

    "rejectVacationButton",

    "approveVacationWithConditionsButton",

    "approveVacationButton"

  ];


  ids.forEach(
    id => {

      const button =
        document.getElementById(
          id
        );


      if (button) {

        button.disabled =
          disabled;

      }

    }
  );

}



// ==========================================================
// MENSAGEM DO MODAL
// ==========================================================

function showVacationAdminMessage(
  message,
  type
) {

  const container =
    document.getElementById(
      "vacationAdminMessage"
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
// LIMPAR MENSAGEM
// ==========================================================

function clearVacationAdminMessage() {

  const container =
    document.getElementById(
      "vacationAdminMessage"
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
// CONTADOR DE FÉRIAS
// ==========================================================

function updateVacationCounters() {

  const pendingCount =
    vacationRequests.filter(
      request =>
        request.status ===
        "pendente"
    ).length;



  // ========================================================
  // MENU
  // ========================================================

  const menuCounter =
    document.getElementById(
      "vacationMenuCounter"
    );


  if (menuCounter) {

    menuCounter.textContent =
      pendingCount;

  }



  // ========================================================
  // PÁGINA
  // ========================================================

  const pageCounter =
    document.getElementById(
      "vacationPendingCount"
    );


  if (pageCounter) {

    pageCounter.textContent =
      pendingCount;

  }

}



// ==========================================================
// ==========================================================
// CONTADORES
// ==========================================================
// ==========================================================



// ==========================================================
// CONTADOR DE AVALIAÇÕES
// ==========================================================

function updateEvaluationCounters() {

  const pending =
    evaluations.filter(
      evaluation =>
        evaluation.status ===
        "pending"
    ).length;



  const menuCounter =
    document.getElementById(
      "evaluationMenuCounter"
    );


  if (menuCounter) {

    menuCounter.textContent =
      pending;

  }



  const pageCounter =
    document.getElementById(
      "evaluationPendingCount"
    );


  if (pageCounter) {

    pageCounter.textContent =
      pending;

  }



  const dashboardCounter =
    document.getElementById(
      "dashboardEvaluations"
    );


  if (dashboardCounter) {

    dashboardCounter.textContent =
      pending;

  }



  renderDashboardEvaluations();

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



  const pending =
    evaluations

      .filter(
        evaluation =>
          evaluation.status ===
          "pending"
      )

      .slice(
        0,
        3
      );



  container.innerHTML =
    "";



  if (
    pending.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-circle-check"></i>

        <strong>
          Tudo em dia!
        </strong>

        <span>
          Nenhuma avaliação pendente.
        </span>

      </div>

    `;


    return;

  }



  pending.forEach(
    evaluation => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "simple-list-item";


      item.innerHTML = `

        <div class="list-avatar">

          ${getInitials(
            evaluation.employee
          )}

        </div>


        <div class="list-main">

          <strong>

            ${escapeHTML(
              evaluation.employee
            )}

          </strong>


          <span>

            ${escapeHTML(
              evaluation.course
            )}

          </span>

        </div>


        <span class="status-badge warning">

          Aguardando

        </span>

      `;


      container.appendChild(
        item
      );

    }
  );

}



// ==========================================================
// CONTADORES PRINCIPAIS DO DASHBOARD
// ==========================================================

function updateDashboardCounters() {

  // ========================================================
  // COLABORADORES
  // ========================================================

  const collaborators =
    employees.filter(
      employee =>
        employee.profile ===
        "colaborador"
    );



  const employeesCounter =
    document.getElementById(
      "dashboardEmployees"
    );


  if (employeesCounter) {

    employeesCounter.textContent =
      collaborators.length;

  }



  // ========================================================
  // TREINAMENTOS
  // ========================================================

  const trainingCounter =
    document.getElementById(
      "dashboardTrainings"
    );


  if (trainingCounter) {

    trainingCounter.textContent =
      courses.length;

  }



  // ========================================================
  // APROVADOS
  // ========================================================

  const approved =
    evaluations.filter(
      evaluation =>
        evaluation.status ===
        "approved"
    ).length;



  const approvedCounter =
    document.getElementById(
      "dashboardApproved"
    );


  if (approvedCounter) {

    approvedCounter.textContent =
      approved;

  }



  // ========================================================
  // OUTROS CONTADORES
  // ========================================================

  updateEvaluationCounters();


  updateVacationCounters();

}



// ==========================================================
// ==========================================================
// MODAIS
// ==========================================================
// ==========================================================



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
            event.target ===
            modal
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
// FECHAR COM ESC
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


    document
      .querySelectorAll(
        ".modal-overlay.show"
      )
      .forEach(
        modal => {

          closeModal(
            modal.id
          );

        }
      );

  }
);



// ==========================================================
// ==========================================================
// LOGOUT
// ==========================================================
// ==========================================================

const logoutButton =
  document.querySelector(
    ".logout-button"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Deseja sair da área administrativa?"
        );


      if (!confirmed) {

        return;

      }


      clearSession();


      window.location.href =
        "/login/";

    }
  );

}



// ==========================================================
// ==========================================================
// INICIALIZAÇÃO
// ==========================================================
// ==========================================================

async function initializeApp() {

  console.log(
    "=============================================="
  );


  console.log(
    "Iniciando Evolua+ Admin..."
  );


  console.log(
    "=============================================="
  );



  // ========================================================
  // VALIDAR SESSÃO
  // ========================================================

  const validSession =
    validateAdminSession();


  if (!validSession) {

    return;

  }



  // ========================================================
  // MOSTRAR ADMIN
  // ========================================================

  renderCurrentAdmin();



  console.log(
    "Administrador autenticado:",
    currentAdmin.nome
  );


  console.log(
    "Perfil:",
    currentAdmin.perfil
  );


  console.log(
    "Setor:",
    currentAdmin.setor
  );



  // ========================================================
  // AVALIAÇÕES
  // ========================================================

  renderEvaluations();


  updateEvaluationCounters();



  // ========================================================
  // USUÁRIOS
  // ========================================================

  await loadUsersFromApi();



  // ========================================================
  // VERIFICAR SE A SESSÃO AINDA EXISTE
  // ========================================================

  if (
    !localStorage.getItem(
      "access_token"
    )
  ) {

    return;

  }



  // ========================================================
  // CURSOS
  // ========================================================

  await loadCoursesFromApi();



  // ========================================================
  // SOLICITAÇÕES DE FÉRIAS
  // ========================================================
  //
  // Carregamos já na inicialização para que:
  //
  // vacationMenuCounter
  //
  // apareça corretamente mesmo antes
  // de o Admin entrar na página Férias.
  //
  // ========================================================

  await loadVacationRequests();



  // ========================================================
  // DASHBOARD
  // ========================================================

  updateDashboardCounters();



  console.log(
    "=============================================="
  );


  console.log(
    "Evolua+ Admin iniciado com sucesso."
  );


  console.log(
    "=============================================="
  );

}



// ==========================================================
// INICIAR APLICAÇÃO
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);