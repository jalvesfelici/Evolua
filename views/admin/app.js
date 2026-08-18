// ==========================================================
// EVOLUA+
// ADMIN - APP.JS
// ==========================================================
//
// SITUAÇÃO ATUAL:
//
// USUÁRIOS:
// - vêm do Supabase através do backend;
// - exigem usuário autenticado;
//
// TREINAMENTOS:
// - vêm do Supabase através do backend;
//
// ATIVIDADES:
// - vêm do Supabase;
//
// AVALIAÇÕES:
// - ainda estão simuladas;
//
// LOGIN:
// - já utiliza Supabase Auth;
// - usuário e token ficam no localStorage.
//
// ==========================================================



// ==========================================================
// DADOS DA SESSÃO
// ==========================================================
//
// Após o login salvamos:
//
// access_token
// usuario_logado
//
// Agora a tela Admin utiliza esses dados.
//
// NÃO precisamos mais deixar UUID do admin
// escrito manualmente no JavaScript.
//
// ==========================================================

const accessToken =
  localStorage.getItem(
    "access_token"
  );


let currentAdmin =
  null;


// Tentamos recuperar o usuário logado.
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
    "Erro ao recuperar usuário logado:",
    error
  );

}



// ==========================================================
// VERIFICAR SESSÃO
// ==========================================================
//
// Se alguém tentar abrir:
//
// /admin/
//
// diretamente sem login,
// voltamos para:
//
// /login/
//
// ==========================================================

function validateAdminSession() {

  // Sem token ou usuário.
  if (
    !accessToken ||
    !currentAdmin
  ) {

    window.location.href =
      "/login/";

    return false;

  }


  // Somente administradores podem entrar nesta tela.
  if (
    currentAdmin.perfil !==
      "admin_principal"
    &&
    currentAdmin.perfil !==
      "admin_setor"
  ) {

    window.location.href =
      "/treinamentos/";

    return false;

  }


  // Usuário precisa estar ativo.
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
//
// Utilizaremos esta função nas chamadas protegidas.
//
// Exemplo:
//
// Authorization:
// Bearer eyJhbGci...
//
// O backend utiliza esse token para descobrir
// quem realmente está fazendo a solicitação.
//
// ==========================================================

function getAuthHeaders(
  includeJson = false
) {

  const headers = {

    Authorization:
      `Bearer ${accessToken}`

  };


  if (includeJson) {

    headers["Content-Type"] =
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
    response.status === 401
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
// SETORES OFICIAIS
// ==========================================================

const sectors = [

  "Operacional",

  "Logística",

  "Administrativo",

  "Tecnologia",

  "RH",

  "Financeiro",

  "Marketing"

];



// ==========================================================
// USUÁRIOS
// ==========================================================

let employees =
  [];



// ==========================================================
// TIPO DE USUÁRIO SENDO CRIADO
// ==========================================================
//
// colaborador
//
// ou:
//
// admin_setor
//
// ==========================================================

let currentUserCreationProfile =
  "colaborador";



// ==========================================================
// CURSOS
// ==========================================================

let courses =
  [];



// ==========================================================
// AVALIAÇÕES
// ==========================================================
//
// Esta parte ainda é temporária.
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
          "Crie uma planilha de controle financeiro",

        file:
          "planilha-financeira.xlsx"

      },


      {

        title:
          "Crie uma tabela dinâmica",

        file:
          "tabela-dinamica.xlsx"

      }

    ]

  },


  {

    id:
      2,

    employee:
      "Amanda Ribeiro",

    initials:
      "AR",

    sector:
      "Tecnologia",

    course:
      "Segurança da Informação",

    hours:
      2,

    submittedAt:
      "14/08/2026",

    status:
      "pending",

    internalCourse:
      true,

    activities: [

      {

        title:
          "Leia o material de segurança",

        file:
          "atividade-seguranca.pdf"

      }

    ]

  },


  {

    id:
      3,

    employee:
      "João Lima",

    initials:
      "JL",

    sector:
      "Tecnologia",

    course:
      "LGPD nas Empresas",

    hours:
      3,

    submittedAt:
      "13/08/2026",

    status:
      "pending",

    internalCourse:
      false,

    activities: [

      {

        title:
          "Enviar certificado externo",

        file:
          "certificado-lgpd.pdf"

      }

    ]

  }

];



// ==========================================================
// ATIVIDADES TEMPORÁRIAS
// ==========================================================

let temporaryActivities =
  [];



// ==========================================================
// STATUS DAS AVALIAÇÕES
// ==========================================================

let currentEvaluationStatus =
  "pending";



// ==========================================================
// CURSO QUE SERÁ REMOVIDO
// ==========================================================

let courseToDelete =
  null;



// ==========================================================
// INFORMAÇÕES DAS PÁGINAS
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

  }

};



// ==========================================================
// ESCAPAR HTML
// ==========================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)

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
// ALTERAR PÁGINA
// ==========================================================

function changePage(
  pageName
) {

  // Esconder páginas.
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


  // Remover destaque do menu.
  document
    .querySelectorAll(
      ".menu-item"
    )
    .forEach(
      item => {

        item.classList.remove(
          "active"
        );

      }
    );


  // Mostrar página.
  const page =
    document.getElementById(
      `${pageName}Page`
    );


  if (page) {

    page.classList.add(
      "active-page"
    );

  }


  // Destacar menu.
  const menuItem =
    document.querySelector(
      `[data-page="${pageName}"]`
    );


  if (menuItem) {

    menuItem.classList.add(
      "active"
    );

  }


  // Alterar título.
  if (
    pageData[pageName]
  ) {

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
        pageData[pageName]
          .title;

    }


    if (subtitle) {

      subtitle.textContent =
        pageData[pageName]
          .subtitle;

    }

  }

}



// ==========================================================
// CLIQUES NO MENU
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
// GERAR INICIAIS
// ==========================================================

function getInitials(name) {

  if (!name) {

    return "";

  }


  return name

    .split(" ")

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

    .join("")

    .toUpperCase();

}



// ==========================================================
// ABRIR MODAL
// ==========================================================

function openModal(id) {

  const modal =
    document.getElementById(
      id
    );


  if (!modal) {

    console.warn(
      `Modal "${id}" não encontrado.`
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

function closeModal(id) {

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
// RENDERIZAR ADMIN LOGADO
// ==========================================================
//
// Agora os dados vêm do usuário realmente autenticado.
//
// Banco:
//
// nome
// setor
// cargo
// perfil
//
// ==========================================================

function renderCurrentAdmin() {

  if (!currentAdmin) {

    return;

  }


  // ========================================================
  // SETOR
  // ========================================================

  const adminSector =
    document.getElementById(
      "adminSector"
    );


  if (adminSector) {

    if (
      currentAdmin.perfil ===
      "admin_principal"
    ) {

      adminSector.textContent =
        "Acesso geral";

    } else {

      adminSector.textContent =
        currentAdmin.setor;

    }

  }


  // ========================================================
  // AVATAR
  // ========================================================

  const adminAvatar =
    document.getElementById(
      "adminAvatar"
    );


  if (adminAvatar) {

    adminAvatar.textContent =
      getInitials(
        currentAdmin.nome
      );

  }


  // ========================================================
  // NOME
  // ========================================================

  const adminName =
    document.getElementById(
      "adminName"
    );


  if (adminName) {

    adminName.textContent =
      currentAdmin.nome;

  }


  // ========================================================
  // FUNÇÃO
  // ========================================================

  const adminRole =
    document.getElementById(
      "adminRole"
    );


  if (adminRole) {

    if (
      currentAdmin.perfil ===
      "admin_principal"
    ) {

      adminRole.textContent =
        "Administrador Principal";

    } else {

      adminRole.textContent =
        `Administrador • ${currentAdmin.setor}`;

    }

  }


  // ========================================================
  // BOTÃO NOVO ADMIN DO DASHBOARD
  // ========================================================

  const newAdminButton =
    document.getElementById(
      "newAdminButton"
    );


  if (newAdminButton) {

    newAdminButton.style.display =

      currentAdmin.perfil ===
      "admin_principal"

        ? "inline-flex"

        : "none";

  }


  // ========================================================
  // BOTÃO NOVO ADMIN DA PÁGINA FUNCIONÁRIOS
  // ========================================================

  const newAdminToolbarButton =
    document.getElementById(
      "newAdminToolbarButton"
    );


  if (
    newAdminToolbarButton
  ) {

    newAdminToolbarButton.style.display =

      currentAdmin.perfil ===
      "admin_principal"

        ? "inline-flex"

        : "none";

  }

}



// ==========================================================
// PREENCHER SETORES
// ==========================================================

function populateSectorSelect() {

  const select =
    document.getElementById(
      "employeeSector"
    );


  if (
    !select ||
    !currentAdmin
  ) {

    return;

  }


  select.innerHTML =
    "";


  // ========================================================
  // ADMIN DE SETOR
  // ========================================================
  //
  // Não pode escolher outro setor.
  //

  if (
    currentAdmin.perfil ===
    "admin_setor"
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      currentAdmin.setor;


    option.textContent =
      currentAdmin.setor;


    select.appendChild(
      option
    );


    select.disabled =
      true;


    return;

  }


  // ========================================================
  // ADMIN PRINCIPAL
  // ========================================================

  select.disabled =
    false;


  sectors.forEach(
    sector => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        sector;


      option.textContent =
        sector;


      select.appendChild(
        option
      );

    }
  );

}



// ==========================================================
// ABRIR NOVO FUNCIONÁRIO
// ==========================================================

function openEmployeeModal() {

  currentUserCreationProfile =
    "colaborador";


  prepareUserModal();

}



// ==========================================================
// ABRIR NOVO ADMINISTRADOR
// ==========================================================

function openAdminModal() {

  if (
    !currentAdmin ||
    currentAdmin.perfil !==
      "admin_principal"
  ) {

    alert(
      "Somente o Administrador Principal pode criar administradores."
    );

    return;

  }


  currentUserCreationProfile =
    "admin_setor";


  prepareUserModal();

}



// ==========================================================
// PREPARAR MODAL
// ==========================================================

function prepareUserModal() {

  const form =
    document.getElementById(
      "employeeForm"
    );


  if (form) {

    form.reset();

  }


  populateSectorSelect();


  const modalTitle =
    document.getElementById(
      "employeeModalTitle"
    );


  const modalDescription =
    document.getElementById(
      "employeeModalDescription"
    );


  const submitText =
    document.getElementById(
      "employeeSubmitText"
    );


  // ========================================================
  // ADMINISTRADOR
  // ========================================================

  if (
    currentUserCreationProfile ===
    "admin_setor"
  ) {

    if (modalTitle) {

      modalTitle.textContent =
        "Novo administrador";

    }


    if (modalDescription) {

      modalDescription.textContent =
        "Crie um administrador responsável por um setor.";

    }


    if (submitText) {

      submitText.textContent =
        "Criar administrador";

    }

  }


  // ========================================================
  // COLABORADOR
  // ========================================================

  else {

    if (modalTitle) {

      modalTitle.textContent =
        "Novo funcionário";

    }


    if (modalDescription) {

      modalDescription.textContent =
        "Crie o acesso de um colaborador.";

    }


    if (submitText) {

      submitText.textContent =
        "Criar funcionário";

    }

  }


  openModal(
    "employeeModal"
  );

}



// ==========================================================
// CONVERTER USUÁRIO DA API
// ==========================================================

function mapApiUser(
  apiUser
) {

  return {

    id:
      apiUser.id,

    name:
      apiUser.nome,

    registration:
      apiUser.matricula,

    email:
      apiUser.email,

    role:
      apiUser.cargo,

    sector:
      apiUser.setor,

    profile:
      apiUser.perfil,

    status:
      apiUser.ativo
        ? "Ativo"
        : "Inativo"

  };

}



// ==========================================================
// CARREGAR USUÁRIOS DA API
// ==========================================================
//
// ALTERAÇÃO IMPORTANTE:
//
// Agora enviamos:
//
// Authorization: Bearer TOKEN
//
// Não precisamos mais dizer ao backend
// manualmente quem é o administrador.
//
// ==========================================================

async function loadUsersFromApi() {

  try {

    console.log(
      "Buscando usuários..."
    );


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


    // Sessão expirada.
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


    const apiUsers =

      Array.isArray(result)

        ? result

        : result.usuarios || [];


    employees =
      apiUsers.map(
        mapApiUser
      );


    renderEmployees();


    updateDashboardCounters();


    console.log(
      `${employees.length} usuário(s) carregado(s).`
    );

  } catch (error) {

    console.error(
      "Erro ao carregar usuários:",
      error
    );


    employees =
      [];


    renderEmployees();


    updateDashboardCounters();

  }

}



// ==========================================================
// CRIAR USUÁRIO
// ==========================================================
//
// NOVO FLUXO:
//
// Admin logado
//      ↓
// token
//      ↓
// POST /api/usuarios
//      ↓
// Node.js
//      ↓
// valida token
//      ↓
// identifica admin
//      ↓
// verifica perfil/setor
//      ↓
// Supabase Auth
//      +
// tabela usuario
//
// ==========================================================

async function createEmployee(
  event
) {

  event.preventDefault();


  // ========================================================
  // CAMPOS
  // ========================================================

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


  const sectorSelect =
    document.getElementById(
      "employeeSector"
    );


  // ========================================================
  // DEFINIR SETOR
  // ========================================================

  const sector =

    currentAdmin.perfil ===
    "admin_setor"

      ? currentAdmin.setor

      : sectorSelect.value;



  // ========================================================
  // VALIDAÇÕES
  // ========================================================

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
      "A senha inicial deve possuir pelo menos 6 caracteres."
    );

    return;

  }


  // ========================================================
  // VALIDAÇÃO DE ADMIN
  // ========================================================

  if (
    currentUserCreationProfile ===
      "admin_setor"
    &&
    currentAdmin.perfil !==
      "admin_principal"
  ) {

    alert(
      "Você não possui permissão para criar administradores."
    );

    return;

  }



  // ========================================================
  // DADOS DO NOVO USUÁRIO
  // ========================================================
  //
  // IMPORTANTE:
  //
  // admin_id FOI REMOVIDO.
  //
  // Quem cria o usuário será identificado
  // automaticamente através do token.
  //
  // ========================================================

  const userData = {

    nome:
      name,

    matricula:
      registration,

    email:
      email,

    senha:
      password,

    cargo:
      role,

    setor:
      sector,

    perfil:
      currentUserCreationProfile

  };



  // ========================================================
  // BOTÃO
  // ========================================================

  const submitButton =
    document.getElementById(
      "employeeSubmitButton"
    );


  const submitText =
    document.getElementById(
      "employeeSubmitText"
    );


  const originalText =
    submitText
      ? submitText.textContent
      : "";


  try {

    if (submitButton) {

      submitButton.disabled =
        true;

    }


    if (submitText) {

      submitText.textContent =
        "Criando...";

    }



    // ======================================================
    // POST /api/usuarios
    // ======================================================

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
              userData
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
      await response.json();



    // ======================================================
    // ERRO
    // ======================================================

    if (!response.ok) {

      throw new Error(
        result.error ||
        result.details ||
        "Não foi possível criar o usuário."
      );

    }



    // ======================================================
    // SUCESSO
    // ======================================================

    closeModal(
      "employeeModal"
    );


    await loadUsersFromApi();


    if (
      currentUserCreationProfile ===
      "admin_setor"
    ) {

      alert(
        "Administrador criado com sucesso!"
      );

    } else {

      alert(
        "Funcionário criado com sucesso!"
      );

    }


  } catch (error) {

    console.error(
      "Erro ao criar usuário:",
      error
    );


    alert(
      error.message
    );


  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;

    }


    if (submitText) {

      submitText.textContent =
        originalText;

    }

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


  const searchInput =
    document.getElementById(
      "employeeSearch"
    );


  const search =

    searchInput

      ? searchInput
          .value
          .trim()
          .toLowerCase()

      : "";


  // ========================================================
  // FILTRAR
  // ========================================================

  const filtered =
    employees.filter(
      employee => {

        const name =
          String(
            employee.name || ""
          ).toLowerCase();


        const registration =
          String(
            employee.registration || ""
          ).toLowerCase();


        const email =
          String(
            employee.email || ""
          ).toLowerCase();


        const role =
          String(
            employee.role || ""
          ).toLowerCase();


        const sector =
          String(
            employee.sector || ""
          ).toLowerCase();


        return (

          name.includes(
            search
          )

          ||

          registration.includes(
            search
          )

          ||

          email.includes(
            search
          )

          ||

          role.includes(
            search
          )

          ||

          sector.includes(
            search
          )

        );

      }
    );


  tbody.innerHTML =
    "";


  // ========================================================
  // SEM USUÁRIOS
  // ========================================================

  if (
    filtered.length === 0
  ) {

    const row =
      document.createElement(
        "tr"
      );


    row.innerHTML = `

      <td
        colspan="8"
        style="
          text-align: center;
          padding: 30px;
          color: var(--text-muted);
        "
      >

        Nenhum usuário encontrado.

      </td>

    `;


    tbody.appendChild(
      row
    );


    return;

  }



  // ========================================================
  // USUÁRIOS
  // ========================================================

  filtered.forEach(
    employee => {

      const row =
        document.createElement(
          "tr"
        );


      let profileText =
        "Colaborador";


      if (
        employee.profile ===
        "admin_setor"
      ) {

        profileText =
          "Admin. do setor";

      }


      if (
        employee.profile ===
        "admin_principal"
      ) {

        profileText =
          "Admin. principal";

      }



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

          <span
            class="
              status-badge
              purple-status
            "
          >

            ${escapeHTML(
              profileText
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

          <button
            class="table-action"
            title="Visualizar"
          >

            <i
              class="
                fa-regular
                fa-eye
              "
            ></i>

          </button>

        </td>

      `;


      tbody.appendChild(
        row
      );

    }
  );

}



// ==========================================================
// PESQUISAR FUNCIONÁRIOS
// ==========================================================

const employeeSearchInput =
  document.getElementById(
    "employeeSearch"
  );


if (
  employeeSearchInput
) {

  employeeSearchInput
    .addEventListener(
      "input",
      renderEmployees
    );

}

// ==========================================================
// CONVERTER CURSO DA API PARA O FORMATO DO FRONTEND
// ==========================================================
//
// A API retorna nomes em português.
//
// Exemplo:
//
// titulo
// descricao
// carga_horaria
// setor_responsavel
//
// A interface utiliza:
//
// title
// description
// hours
// responsibleSector
//
// ==========================================================

function mapApiCourse(apiCourse) {

  const apiActivities =
    apiCourse.atividades_curso || [];


  // Ordenamos as atividades.
  apiActivities.sort(
    (a, b) => {

      return (
        Number(a.ordem || 0)
        -
        Number(b.ordem || 0)
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
      apiCourse.curso_externo,


    externalLink:
      apiCourse.link_externo || "",


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
              activity.descricao || "",


            type:
              activity.tipo,


            resource:
              activity.recurso || "",


            order:
              activity.ordem

          };

        }
      )

  };

}



// ==========================================================
// CARREGAR CURSOS DA API
// ==========================================================

async function loadCoursesFromApi() {

  const container =
    document.getElementById(
      "adminTrainingGrid"
    );


  if (container) {

    container.innerHTML = `

      <div class="empty-state">

        <i
          class="
            fa-solid
            fa-spinner
            fa-spin
          "
        ></i>

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


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.erro ||
        "Não foi possível carregar os cursos."
      );

    }


    courses =
      (data || []).map(
        course =>
          mapApiCourse(course)
      );


    renderCourses();

    renderDashboardCourses();

    updateDashboardCounters();


    console.log(
      "Cursos carregados:",
      courses
    );

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

          <i
            class="
              fa-solid
              fa-triangle-exclamation
            "
          ></i>

          <strong>
            Não foi possível carregar os treinamentos
          </strong>

          <span>
            ${escapeHTML(error.message)}
          </span>

        </div>

      `;

    }


    updateDashboardCounters();

  }

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


  const externalArea =
    document.getElementById(
      "externalLinkArea"
    );


  if (externalArea) {

    externalArea.classList.remove(
      "show"
    );

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


  if (checkbox.checked) {

    area.classList.add(
      "show"
    );

  } else {

    area.classList.remove(
      "show"
    );

  }

}



// ==========================================================
// ADICIONAR ATIVIDADE
// ==========================================================

function addActivity() {

  const activity = {

    temporaryId:
      Date.now() + Math.random(),

    title:
      "",

    description:
      "",

    type:
      "Texto",

    resource:
      ""

  };


  temporaryActivities.push(
    activity
  );


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


  activity[field] =
    value;


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
// RENDERIZAR CONSTRUTOR DE ATIVIDADES
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
          Clique em "Adicionar atividade"
          para começar.
        </span>

      </div>

    `;


    return;

  }


  container.innerHTML =
    "";


  temporaryActivities.forEach(
    (activity, index) => {

      const element =
        document.createElement(
          "div"
        );


      element.className =
        "activity-builder";


      let resourceField =
        "";


      // ======================================================
      // LINK
      // ======================================================

      if (
        activity.type ===
        "Link"
      ) {

        resourceField = `

          <div
            class="
              form-group
              activity-extra-field
            "
          >

            <label>
              Link
            </label>

            <input
              type="url"
              placeholder="https://..."
              value="${escapeHTML(activity.resource)}"
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


      // ======================================================
      // ARQUIVO
      // ======================================================

      if (
        activity.type ===
        "Arquivo"
      ) {

        resourceField = `

          <div
            class="
              form-group
              activity-extra-field
            "
          >

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

                ?

                `

                  <span
                    class="
                      status-badge
                      success
                    "
                  >

                    ${escapeHTML(activity.resource)}

                  </span>

                `

                :

                ""
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


        <div class="form-grid">


          <div
            class="
              form-group
              full
            "
          >

            <label>
              Título da atividade
            </label>


            <input
              type="text"
              placeholder="Ex.: Crie uma planilha financeira"
              value="${escapeHTML(activity.title)}"
              oninput="
                updateActivity(
                  ${activity.temporaryId},
                  'title',
                  this.value
                )
              "
            >

          </div>



          <div
            class="
              form-group
              full
            "
          >

            <label>
              Instruções
            </label>


            <textarea
              rows="3"
              placeholder="Explique o que o colaborador deverá realizar..."
              oninput="
                updateActivity(
                  ${activity.temporaryId},
                  'description',
                  this.value
                )
              "
            >${escapeHTML(activity.description)}</textarea>

          </div>



          <div class="form-group">

            <label>
              Tipo de conteúdo
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
                Somente texto
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
                Link externo
              </option>

            </select>

          </div>

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
// SALVAR ARQUIVO DA ATIVIDADE
// ==========================================================
//
// Ainda estamos guardando somente
// o nome do arquivo.
//
// Upload real ficará para o Supabase Storage.
//
// ==========================================================

function saveActivityFile(
  activityId,
  input
) {

  if (
    !input.files ||
    input.files.length === 0
  ) {

    return;

  }


  const activity =
    temporaryActivities.find(
      item =>
        item.temporaryId ===
        activityId
    );


  if (!activity) {

    return;

  }


  activity.resource =
    input.files[0].name;


  renderActivityBuilder();

}



// ==========================================================
// CRIAR CURSO
// ==========================================================

async function createCourse(
  event
) {

  event.preventDefault();


  // ========================================================
  // VERIFICAR ATIVIDADES
  // ========================================================

  if (
    temporaryActivities.length ===
    0
  ) {

    const continueWithoutActivity =
      confirm(
        "O curso não possui atividades. Deseja publicá-lo mesmo assim?"
      );


    if (
      !continueWithoutActivity
    ) {

      return;

    }

  }


  // ========================================================
  // VALIDAR ATIVIDADES
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
      "Todas as atividades precisam possuir um título."
    );

    return;

  }


  const form =
    document.getElementById(
      "courseForm"
    );


  if (!form) {

    return;

  }


  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );


  const originalButtonHTML =
    submitButton
      ? submitButton.innerHTML
      : "";


  if (submitButton) {

    submitButton.disabled =
      true;


    submitButton.innerHTML = `

      <i
        class="
          fa-solid
          fa-spinner
          fa-spin
        "
      ></i>

      Salvando...

    `;

  }


  try {

    // ======================================================
    // MONTAR CURSO
    // ======================================================

    const courseData = {

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
          document
            .getElementById(
              "courseHours"
            )
            .value
        ),


      area:
        document
          .getElementById(
            "courseArea"
          )
          .value,


      nivel:
        document
          .getElementById(
            "courseLevel"
          )
          .value,


      setor_responsavel:
        document
          .getElementById(
            "courseResponsibleSector"
          )
          .value,


      setor_destino:
        document
          .getElementById(
            "courseTargetSector"
          )
          .value,


      classificacao:
        document
          .getElementById(
            "courseRequirement"
          )
          .value,


      curso_externo:
        document
          .getElementById(
            "externalCourse"
          )
          .checked,


      link_externo:
        document
          .getElementById(
            "externalCourseLink"
          )
          .value
          .trim()
          || null,


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
                || null,


              tipo:
                activity.type,


              recurso:
                activity.resource
                || null

            };

          }
        )

    };


    // ======================================================
    // ENVIAR PARA API
    // ======================================================

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
            JSON.stringify(
              courseData
            )

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.erro ||
        "Não foi possível criar o treinamento."
      );

    }


    // ======================================================
    // SUCESSO
    // ======================================================

    temporaryActivities =
      [];


    form.reset();


    closeModal(
      "courseModal"
    );


    await loadCoursesFromApi();


    changePage(
      "trainings"
    );


    alert(
      "Treinamento publicado com sucesso!"
    );


  } catch (error) {

    console.error(
      "Erro ao criar treinamento:",
      error
    );


    alert(
      "Não foi possível criar o treinamento.\n\n"
      +
      error.message
    );


  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;


      submitButton.innerHTML =
        originalButtonHTML;

    }

  }

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


  const searchInput =
    document.getElementById(
      "trainingSearch"
    );


  const search =
    searchInput

      ? searchInput
          .value
          .trim()
          .toLowerCase()

      : "";


  const areaFilter =
    document.getElementById(
      "trainingAreaFilter"
    );


  const area =
    areaFilter
      ? areaFilter.value
      : "";


  const filtered =
    courses.filter(
      course => {

        if (
          !course.active
        ) {

          return false;

        }


        const title =
          String(
            course.title || ""
          )
            .toLowerCase();


        const description =
          String(
            course.description || ""
          )
            .toLowerCase();


        const matchesSearch =

          title.includes(
            search
          )

          ||

          description.includes(
            search
          );


        const matchesArea =

          area === ""

          ||

          course.area ===
            area;


        return (
          matchesSearch
          &&
          matchesArea
        );

      }
    );


  container.innerHTML =
    "";


  // ========================================================
  // NENHUM CURSO
  // ========================================================

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
          Crie um novo treinamento
          ou altere os filtros.
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
        "admin-course-card";


      const statusClass =

        course.requirement ===
        "Obrigatório"

          ? "danger"

          : "purple-status";


      card.innerHTML = `

        <div class="admin-course-banner">

          <span
            class="
              status-badge
              ${statusClass}
            "
          >

            ${escapeHTML(
              course.requirement
            )}

          </span>


          <i
            class="
              fa-solid
              fa-graduation-cap
            "
          ></i>


          ${
            course.external

              ?

              `

                <span
                  class="
                    status-badge
                    info
                  "
                >
                  Externo
                </span>

              `

              :

              `

                <span
                  class="
                    status-badge
                    success
                  "
                >
                  Interno
                </span>

              `
          }

        </div>


        <div class="course-card-content">

          <div class="course-card-top">

            <span class="course-card-area">

              ${escapeHTML(
                course.area
              )}

            </span>


            <span
              class="
                status-badge
                success
              "
            >
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
              class="delete-course-button"
              onclick="
                askDeleteCourse(
                  '${course.id}'
                )
              "
              title="Remover curso"
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
// PESQUISA DE CURSO
// ==========================================================

const trainingSearchInput =
  document.getElementById(
    "trainingSearch"
  );


if (
  trainingSearchInput
) {

  trainingSearchInput
    .addEventListener(
      "input",
      renderCourses
    );

}



// ==========================================================
// FILTRO DE ÁREA
// ==========================================================

const trainingAreaFilter =
  document.getElementById(
    "trainingAreaFilter"
  );


if (
  trainingAreaFilter
) {

  trainingAreaFilter
    .addEventListener(
      "change",
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


  const activeCourses =
    courses

      .filter(
        course =>
          course.active
      )

      .slice(
        0,
        3
      );


  container.innerHTML =
    "";


  if (
    activeCourses.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <strong>
          Nenhum treinamento publicado
        </strong>

        <span>
          Crie seu primeiro treinamento.
        </span>

      </div>

    `;


    return;

  }


  activeCourses.forEach(
    course => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "training-mini-card";


      card.innerHTML = `

        <div class="training-mini-top">

          <span class="training-mini-category">

            ${escapeHTML(
              course.area
            )}

          </span>


          <span
            class="
              status-badge
              success
            "
          >
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
          )} •

          ${course.activities.length}
          atividade(s)

        </p>

      `;


      container.appendChild(
        card
      );

    }
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

    console.warn(
      "Curso não encontrado:",
      courseId
    );

    return;

  }


  const activitiesHTML =

    course.activities.length > 0

      ?

      course.activities

        .map(
          (activity, index) => {

            return `

              <div class="details-activity">

                <strong>

                  ${index + 1}.

                  ${escapeHTML(
                    activity.title ||
                    "Atividade sem título"
                  )}

                </strong>


                <span>

                  ${escapeHTML(
                    activity.type
                  )}

                  ${
                    activity.resource

                      ?

                      ` • ${escapeHTML(
                        activity.resource
                      )}`

                      :

                      ""
                  }

                </span>


                ${
                  activity.description

                    ?

                    `

                      <p
                        style="
                          margin-top: 6px;
                          font-size: 8px;
                          color: var(--text-secondary);
                          line-height: 1.5;
                        "
                      >

                        ${escapeHTML(
                          activity.description
                        )}

                      </p>

                    `

                    :

                    ""
                }

              </div>

            `;

          }
        )

        .join("")

      :

      `

        <div class="details-activity">

          <span>
            Nenhuma atividade cadastrada.
          </span>

        </div>

      `;


  const detailsContainer =
    document.getElementById(
      "courseDetailsContent"
    );


  if (
    !detailsContainer
  ) {

    return;

  }


  detailsContainer.innerHTML = `

    <div class="details-course-header">

      <div class="course-icon-large">

        <i class="fa-solid fa-graduation-cap"></i>

      </div>


      <span
        class="
          status-badge
          purple-status
        "
      >

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
          Público
        </span>

        <strong>

          ${escapeHTML(
            course.targetSector
          )}

          •

          ${escapeHTML(
            course.requirement
          )}

        </strong>

      </div>

    </div>


    ${
      course.external

        ?

        `

          <div class="form-information">

            <i class="fa-solid fa-link"></i>

            <p>

              Este é um curso externo.

              <br><br>

              ${escapeHTML(
                course.externalLink
              )}

            </p>

          </div>

        `

        :

        ""
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
// SOLICITAR EXCLUSÃO
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
// CONFIRMAR EXCLUSÃO / DESATIVAÇÃO
// ==========================================================

const confirmDeleteButton =
  document.getElementById(
    "confirmDeleteButton"
  );


if (
  confirmDeleteButton
) {

  confirmDeleteButton
    .addEventListener(
      "click",
      async () => {

        if (
          courseToDelete ===
          null
        ) {

          return;

        }


        const originalButtonHTML =
          confirmDeleteButton
            .innerHTML;


        confirmDeleteButton.disabled =
          true;


        confirmDeleteButton.innerHTML = `

          <i
            class="
              fa-solid
              fa-spinner
              fa-spin
            "
          ></i>

          Removendo...

        `;


        try {

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
            "Treinamento removido da plataforma."
          );


        } catch (error) {

          console.error(
            "Erro ao remover treinamento:",
            error
          );


          alert(
            "Não foi possível remover o treinamento.\n\n"
            +
            error.message
          );


        } finally {

          confirmDeleteButton.disabled =
            false;


          confirmDeleteButton.innerHTML =
            originalButtonHTML;

        }

      }
    );

}

// ==========================================================
// RENDERIZAR AVALIAÇÕES
// ==========================================================
//
// Por enquanto esta parte ainda utiliza dados simulados.
//
// Depois vamos conectá-la ao Supabase.
//
// ==========================================================

function renderEvaluations() {

  const container =
    document.getElementById(
      "evaluationList"
    );


  if (!container) {

    return;

  }


  const filtered =
    evaluations.filter(
      evaluation =>
        evaluation.status ===
        currentEvaluationStatus
    );


  container.innerHTML =
    "";


  // ========================================================
  // SEM AVALIAÇÕES
  // ========================================================

  if (
    filtered.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-clipboard-check"></i>

        <strong>
          Nenhuma avaliação encontrada
        </strong>

        <span>
          Não existem registros nesta categoria.
        </span>

      </div>

    `;


    return;

  }


  // ========================================================
  // CRIAR CARDS
  // ========================================================

  filtered.forEach(
    evaluation => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "evaluation-card";


      let statusHTML =
        "";


      if (
        evaluation.status ===
        "approved"
      ) {

        statusHTML = `

          <span
            class="
              status-badge
              success
            "
          >
            Aprovado
          </span>

        `;

      }


      if (
        evaluation.status ===
        "rejected"
      ) {

        statusHTML = `

          <span
            class="
              status-badge
              danger
            "
          >
            Reprovado
          </span>

        `;

      }


      card.innerHTML = `

        <div class="evaluation-user-avatar">

          ${escapeHTML(
            evaluation.initials
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

              Enviado em

              ${escapeHTML(
                evaluation.submittedAt
              )}

            </span>

          </div>

        </div>


        ${
          evaluation.status ===
          "pending"

            ?

            `

              <button
                class="evaluate-button"
                onclick="
                  openEvaluation(
                    ${evaluation.id}
                  )
                "
              >
                Avaliar
              </button>

            `

            :

            statusHTML
        }

      `;


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// ABAS DAS AVALIAÇÕES
// ==========================================================

document
  .querySelectorAll(
    ".evaluation-tab"
  )
  .forEach(
    tab => {

      tab.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".evaluation-tab"
            )
            .forEach(
              item => {

                item.classList.remove(
                  "active"
                );

              }
            );


          tab.classList.add(
            "active"
          );


          currentEvaluationStatus =
            tab.dataset
              .evaluationStatus;


          renderEvaluations();

        }
      );

    }
  );



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

    console.warn(
      "Avaliação não encontrada:",
      evaluationId
    );

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


                <span
                  class="
                    status-badge
                    success
                  "
                >
                  Entregue
                </span>

              </div>


              <p
                style="
                  font-size: 9px;
                  color: var(--text-secondary);
                  margin-bottom: 10px;
                "
              >

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


                <button
                  type="button"
                  onclick="
                    alert(
                      'A visualização real do arquivo será conectada posteriormente.'
                    )
                  "
                >
                  Visualizar
                </button>

              </div>

            </div>

          `;

        }
      )

      .join("");


  const modalContent =
    document.getElementById(
      "evaluationModalContent"
    );


  if (!modalContent) {

    return;

  }


  modalContent.innerHTML = `

    <div class="modal-header">


      <div class="modal-title-icon">

        <i class="fa-solid fa-clipboard-check"></i>

      </div>


      <div>

        <h2>
          Avaliar treinamento
        </h2>

        <p>
          Analise todas as atividades antes de tomar uma decisão.
        </p>

      </div>

    </div>


    <div class="evaluation-profile">


      <div class="list-avatar">

        ${escapeHTML(
          evaluation.initials
        )}

      </div>


      <div class="evaluation-profile-info">

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

          ${evaluation.hours} horas

        </span>

      </div>

    </div>


    <h3
      style="
        font-size: 13px;
        margin-bottom: 5px;
      "
    >
      Atividades enviadas
    </h3>


    <p
      style="
        color: var(--text-secondary);
        font-size: 9px;
      "
    >
      Confira os arquivos enviados pelo colaborador.
    </p>


    <div class="submission-list">

      ${activitiesHTML}

    </div>


    <div class="form-group">

      <label>
        Observações da avaliação
      </label>

      <textarea
        id="evaluationObservation"
        rows="4"
        placeholder="Informe observações, principalmente em caso de reprovação..."
      ></textarea>

    </div>


    ${
      evaluation.internalCourse

        ?

        `

          <div class="certificate-upload">

            <label>
              Certificado do colaborador
            </label>

            <p>
              Em caso de aprovação, você poderá anexar
              o certificado emitido pela empresa.
            </p>

            <input
              type="file"
              id="certificateFile"
              accept=".pdf,.png,.jpg,.jpeg"
            >

          </div>

        `

        :

        `

          <div class="form-information">

            <i class="fa-solid fa-circle-info"></i>

            <p>
              Este treinamento foi realizado externamente.

              O certificado enviado pelo colaborador
              já funciona como comprovante.
            </p>

          </div>

        `
    }


    <div class="evaluation-decision-actions">


      <button
        class="danger-button"
        onclick="
          rejectEvaluation(
            ${evaluation.id}
          )
        "
      >

        <i class="fa-solid fa-xmark"></i>

        Reprovar

      </button>


      <button
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
//
// Ainda temporário.
//
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


  updateEvaluationCounters();


  alert(
    "Treinamento aprovado."
  );

}



// ==========================================================
// REPROVAR AVALIAÇÃO
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
      "Informe o motivo da reprovação."
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


  updateEvaluationCounters();


  alert(
    "Treinamento reprovado."
  );

}



// ==========================================================
// CONTADORES DO DASHBOARD
// ==========================================================

function updateDashboardCounters() {

  // ========================================================
  // COLABORADORES
  // ========================================================
  //
  // Não contamos os administradores como funcionários
  // no card do dashboard.
  //

  const collaborators =
    employees.filter(
      employee =>
        employee.profile ===
        "colaborador"
    );


  // ========================================================
  // CURSOS ATIVOS
  // ========================================================

  const activeCourses =
    courses.filter(
      course =>
        course.active
    );


  // ========================================================
  // FUNCIONÁRIOS
  // ========================================================

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

  const trainingsCounter =
    document.getElementById(
      "dashboardTrainings"
    );


  if (trainingsCounter) {

    trainingsCounter.textContent =
      activeCourses.length;

  }


  // ========================================================
  // APROVADOS
  // ========================================================

  const approvedCounter =
    document.getElementById(
      "dashboardApproved"
    );


  if (approvedCounter) {

    const approved =
      evaluations.filter(
        evaluation =>
          evaluation.status ===
          "approved"
      );


    approvedCounter.textContent =
      approved.length;

  }


  updateEvaluationCounters();

}



// ==========================================================
// CONTADORES DAS AVALIAÇÕES
// ==========================================================

function updateEvaluationCounters() {

  const pending =
    evaluations.filter(
      evaluation =>
        evaluation.status ===
        "pending"
    );


  const dashboardCounter =
    document.getElementById(
      "dashboardEvaluations"
    );


  if (dashboardCounter) {

    dashboardCounter.textContent =
      pending.length;

  }


  const menuCounter =
    document.getElementById(
      "evaluationMenuCounter"
    );


  if (menuCounter) {

    menuCounter.textContent =
      pending.length;

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


  // ========================================================
  // SEM PENDÊNCIAS
  // ========================================================

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

          ${escapeHTML(
            evaluation.initials
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


        <span
          class="
            status-badge
            warning
          "
        >
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
// FECHAR MODAL CLICANDO FORA
// ==========================================================

document
  .querySelectorAll(
    ".modal-overlay"
  )
  .forEach(
    overlay => {

      overlay.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            overlay
          ) {

            closeModal(
              overlay.id
            );

          }

        }
      );

    }
  );



// ==========================================================
// FECHAR MODAIS COM ESC
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
// LOGOUT
// ==========================================================
//
// Agora o logout deixa de ser apenas visual.
//
// Removemos:
//
// access_token
// usuario_logado
//
// e voltamos ao login.
//
// ==========================================================

const logoutButton =
  document.querySelector(
    ".logout-button"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    () => {

      const confirmLogout =
        confirm(
          "Deseja sair da área administrativa?"
        );


      if (!confirmLogout) {

        return;

      }


      // Limpamos a sessão local.
      clearSession();


      // Voltamos ao login.
      window.location.href =
        "/login/";

    }
  );

}



// ==========================================================
// INICIALIZAÇÃO
// ==========================================================
//
// NOVO FLUXO:
//
// /admin/
//    ↓
// existe token?
//    ↓
// existe usuario_logado?
//    ↓
// perfil é admin?
//    ↓
// SIM
//    ↓
// carrega tela
//
// Caso contrário:
//
// /login/
//
// ==========================================================

async function initializeApp() {

  console.log(
    "Iniciando Evolua+ Admin..."
  );


  // ========================================================
  // VALIDAR LOGIN
  // ========================================================

  const validSession =
    validateAdminSession();


  if (!validSession) {

    return;

  }


  console.log(
    "Administrador autenticado:",
    currentAdmin.nome
  );


  // ========================================================
  // ADMIN LOGADO
  // ========================================================

  renderCurrentAdmin();


  // ========================================================
  // SELECTS
  // ========================================================

  populateSectorSelect();


  // ========================================================
  // AVALIAÇÕES
  // ========================================================

  renderEvaluations();


  updateEvaluationCounters();


  // ========================================================
  // USUÁRIOS
  // ========================================================

  await loadUsersFromApi();


  // A função acima pode ter detectado token expirado
  // e redirecionado para o login.
  //
  // Portanto verificamos novamente.
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
  // DASHBOARD
  // ========================================================

  updateDashboardCounters();


  console.log(
    "Evolua+ Admin iniciado com sucesso."
  );

}



// ==========================================================
// INICIAR QUANDO O HTML ESTIVER PRONTO
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);