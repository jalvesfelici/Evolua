// ==========================================================
// EVOLUA+
// TREINAMENTOS - FRONTEND DO COLABORADOR
// ==========================================================
//
// RESPONSABILIDADES:
//
// - validar sessão;
// - mostrar usuário logado;
// - carregar treinamentos reais;
// - carregar resumo;
// - listar treinamentos do colaborador;
// - listar catálogo geral;
// - filtrar treinamentos;
// - abrir detalhes;
// - iniciar curso;
// - salvar atividades;
// - enviar arquivos;
// - enviar curso para avaliação;
// - trabalhar com cursos externos;
// - enviar certificado externo;
// - mostrar correções;
// - mostrar aprovação;
// - abrir certificado;
// - logout.
//
// ==========================================================



// ==========================================================
// ==========================================================
// SESSÃO
// ==========================================================
// ==========================================================

const accessToken =
  localStorage.getItem(
    "access_token"
  );


let loggedUser =
  null;



// ==========================================================
// RECUPERAR USUÁRIO SALVO
// ==========================================================

try {

  const storedUser =
    localStorage.getItem(
      "usuario_logado"
    );


  if (
    storedUser
  ) {

    loggedUser =
      JSON.parse(
        storedUser
      );

  }

} catch (
  error
) {

  console.error(
    "Erro ao recuperar usuário logado:",
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

  // ========================================================
  // SEM TOKEN OU USUÁRIO
  // ========================================================

  if (
    !accessToken
    ||
    !loggedUser
  ) {

    window.location.href =
      "/login/";


    return false;

  }



  // ========================================================
  // SOMENTE COLABORADOR
  // ========================================================

  if (
    loggedUser.perfil !==
    "colaborador"
  ) {

    window.location.href =
      "/admin/";


    return false;

  }



  // ========================================================
  // INATIVO
  // ========================================================

  if (
    loggedUser.ativo ===
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
//
// Para JSON:
//
// getAuthHeaders(true)
//
// Para GET comum:
//
// getAuthHeaders()
//
// Para FormData:
//
// NÃO adicionamos Content-Type manualmente,
// porque o navegador precisa gerar o boundary.
//
// ==========================================================

function getAuthHeaders(
  includeJson = false
) {

  const headers = {

    Authorization:
      `Bearer ${accessToken}`

  };


  if (
    includeJson
  ) {

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
// ==========================================================
// ESTADO DA PÁGINA
// ==========================================================
// ==========================================================

let myTrainings =
  [];


let catalogCourses =
  [];


let summary =
  {

    obrigatorios:
      0,

    em_andamento:
      0,

    concluidos:
      0,

    carga_horaria:
      0

  };



// Curso atualmente aberto.
let currentCourse =
  null;


// Inscrição atual.
let currentEnrollment =
  null;


// Entregas da inscrição atual.
let currentDeliveries =
  [];


// Certificado atual.
let currentCertificate =
  null;


// Arquivos selecionados antes de serem enviados.
//
// Chave:
//
// atividadeId
//
// Valor:
//
// File
//
const selectedActivityFiles =
  {};



// Filtro da seção "Seus treinamentos".
let currentTrainingStatusFilter =
  "todos";


// Filtro de área do catálogo.
let currentCatalogArea =
  "Todos";


// Pesquisa do catálogo.
let currentSearch =
  "";



// ==========================================================
// ==========================================================
// ELEMENTOS
// ==========================================================
// ==========================================================

const userAvatar =
  document.getElementById(
    "userAvatar"
  );


const userName =
  document.getElementById(
    "userName"
  );


const userRole =
  document.getElementById(
    "userRole"
  );


const logoutButton =
  document.getElementById(
    "logoutButton"
  );



const mandatoryCount =
  document.getElementById(
    "mandatoryCount"
  );


const inProgressCount =
  document.getElementById(
    "inProgressCount"
  );


const completedCount =
  document.getElementById(
    "completedCount"
  );


const totalHours =
  document.getElementById(
    "totalHours"
  );



const userTrainingGrid =
  document.getElementById(
    "userTrainingGrid"
  );


const courseCatalog =
  document.getElementById(
    "courseCatalog"
  );


const searchInput =
  document.getElementById(
    "searchInput"
  );


const filterButtons =
  document.getElementById(
    "filterButtons"
  );


const globalMessage =
  document.getElementById(
    "globalMessage"
  );



// ==========================================================
// MODAL DO CURSO
// ==========================================================

const courseModal =
  document.getElementById(
    "courseModal"
  );


const closeCourseModalButton =
  document.getElementById(
    "closeCourseModalButton"
  );


const closeCourseFooterButton =
  document.getElementById(
    "closeCourseFooterButton"
  );


const modalCourseBadge =
  document.getElementById(
    "modalCourseBadge"
  );


const modalCourseStatus =
  document.getElementById(
    "modalCourseStatus"
  );


const modalCourseTitle =
  document.getElementById(
    "modalCourseTitle"
  );


const modalCourseArea =
  document.getElementById(
    "modalCourseArea"
  );


const modalCourseHours =
  document.getElementById(
    "modalCourseHours"
  );


const modalCourseLevel =
  document.getElementById(
    "modalCourseLevel"
  );


const modalCourseSector =
  document.getElementById(
    "modalCourseSector"
  );


const modalCourseRequirement =
  document.getElementById(
    "modalCourseRequirement"
  );


const modalCourseDescription =
  document.getElementById(
    "modalCourseDescription"
  );


const correctionAlert =
  document.getElementById(
    "correctionAlert"
  );


const correctionMessage =
  document.getElementById(
    "correctionMessage"
  );


const evaluationWaitingBox =
  document.getElementById(
    "evaluationWaitingBox"
  );


const approvedTrainingBox =
  document.getElementById(
    "approvedTrainingBox"
  );



// ==========================================================
// CURSO EXTERNO
// ==========================================================

const externalCourseSection =
  document.getElementById(
    "externalCourseSection"
  );


const externalCourseLink =
  document.getElementById(
    "externalCourseLink"
  );


const externalCertificateArea =
  document.getElementById(
    "externalCertificateArea"
  );


const externalCertificateInput =
  document.getElementById(
    "externalCertificateInput"
  );


const externalCertificateFileName =
  document.getElementById(
    "externalCertificateFileName"
  );


const sendExternalCertificateButton =
  document.getElementById(
    "sendExternalCertificateButton"
  );



// ==========================================================
// CURSO INTERNO
// ==========================================================

const internalCourseSection =
  document.getElementById(
    "internalCourseSection"
  );


const courseProgressText =
  document.getElementById(
    "courseProgressText"
  );


const courseProgressPercentage =
  document.getElementById(
    "courseProgressPercentage"
  );


const courseProgressFill =
  document.getElementById(
    "courseProgressFill"
  );


const courseActivities =
  document.getElementById(
    "courseActivities"
  );


const submitTrainingArea =
  document.getElementById(
    "submitTrainingArea"
  );


const submitTrainingButton =
  document.getElementById(
    "submitTrainingButton"
  );



// ==========================================================
// CERTIFICADO
// ==========================================================

const certificateResultSection =
  document.getElementById(
    "certificateResultSection"
  );


const certificateFileName =
  document.getElementById(
    "certificateFileName"
  );


const openCertificateButton =
  document.getElementById(
    "openCertificateButton"
  );



// ==========================================================
// AÇÕES DO MODAL
// ==========================================================

const startCourseButton =
  document.getElementById(
    "startCourseButton"
  );


const courseModalMessage =
  document.getElementById(
    "courseModalMessage"
  );



// ==========================================================
// CONFIRMAÇÃO
// ==========================================================

const submitConfirmationModal =
  document.getElementById(
    "submitConfirmationModal"
  );


const cancelSubmitTrainingButton =
  document.getElementById(
    "cancelSubmitTrainingButton"
  );


const confirmSubmitTrainingButton =
  document.getElementById(
    "confirmSubmitTrainingButton"
  );



// ==========================================================
// ==========================================================
// FUNÇÕES UTILITÁRIAS
// ==========================================================
// ==========================================================



// ==========================================================
// ESCAPAR HTML
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
    parts.length ===
    0
  ) {

    return "--";

  }


  if (
    parts.length ===
    1
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
// FORMATAÇÃO DE HORAS
// ==========================================================

function formatHours(
  value
) {

  const number =
    Number(
      value || 0
    );


  if (
    Number.isInteger(
      number
    )
  ) {

    return `${number}h`;

  }


  return `${number}h`;

}



// ==========================================================
// MENSAGEM GLOBAL
// ==========================================================

function showGlobalMessage(
  message,
  type = "info"
) {

  if (
    !globalMessage
  ) {

    return;

  }


  globalMessage.textContent =
    message;


  globalMessage.className =
    `global-message show ${type}`;


  window.setTimeout(
    () => {

      globalMessage.className =
        "global-message";


      globalMessage.textContent =
        "";

    },
    4500
  );

}



// ==========================================================
// MENSAGEM DO MODAL
// ==========================================================

function showModalMessage(
  message,
  type = "info"
) {

  if (
    !courseModalMessage
  ) {

    return;

  }


  courseModalMessage.textContent =
    message;


  courseModalMessage.className =
    `modal-message show ${type}`;

}



// ==========================================================
// LIMPAR MENSAGEM DO MODAL
// ==========================================================

function clearModalMessage() {

  if (
    !courseModalMessage
  ) {

    return;

  }


  courseModalMessage.textContent =
    "";


  courseModalMessage.className =
    "modal-message";

}



// ==========================================================
// PEGAR RESULTADO JSON COM SEGURANÇA
// ==========================================================

async function getResponseData(
  response
) {

  try {

    return await response.json();

  } catch (
    error
  ) {

    return {};

  }

}



// ==========================================================
// CLASSE VISUAL POR ÁREA
// ==========================================================

function getCourseAreaClass(
  area
) {

  const value =
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
    value.includes(
      "tecnologia"
    )
  ) {

    return "technology";

  }


  if (
    value.includes(
      "desenvolvimento"
    )
  ) {

    return "development";

  }


  if (
    value.includes(
      "comunic"
    )
  ) {

    return "communication";

  }


  if (
    value.includes(
      "lider"
    )
  ) {

    return "leadership";

  }


  if (
    value.includes(
      "compliance"
    )
    ||
    value.includes(
      "seguranca"
    )
    ||
    value.includes(
      "lgpd"
    )
  ) {

    return "compliance";

  }


  if (
    value.includes(
      "finance"
    )
  ) {

    return "finance";

  }


  if (
    value.includes(
      "logistica"
    )
  ) {

    return "logistics";

  }


  return "";

}



// ==========================================================
// ÍCONE POR ÁREA
// ==========================================================

function getCourseIcon(
  area
) {

  const value =
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
    value.includes(
      "tecnologia"
    )
    ||
    value.includes(
      "desenvolvimento"
    )
  ) {

    return "fa-code";

  }


  if (
    value.includes(
      "comunic"
    )
  ) {

    return "fa-comments";

  }


  if (
    value.includes(
      "lider"
    )
  ) {

    return "fa-users";

  }


  if (
    value.includes(
      "finance"
    )
  ) {

    return "fa-chart-line";

  }


  if (
    value.includes(
      "logistica"
    )
  ) {

    return "fa-boxes-stacked";

  }


  if (
    value.includes(
      "compliance"
    )
    ||
    value.includes(
      "seguranca"
    )
  ) {

    return "fa-shield-halved";

  }


  return "fa-graduation-cap";

}



// ==========================================================
// STATUS DA INSCRIÇÃO
// ==========================================================

function getEnrollmentStatus(
  course
) {

  return (
    course
      ?.inscricao
      ?.status
    ||
    "nao_iniciado"
  );

}



// ==========================================================
// LABEL DO STATUS
// ==========================================================

function getStatusLabel(
  status
) {

  const labels = {

    nao_iniciado:
      "Não iniciado",

    em_andamento:
      "Em andamento",

    aguardando_avaliacao:
      "Em avaliação",

    correcao_solicitada:
      "Correção solicitada",

    aprovado:
      "Concluído"

  };


  return (
    labels[
      status
    ]
    ||
    "Não iniciado"
  );

}



// ==========================================================
// CLASSE DO STATUS
// ==========================================================

function getStatusClass(
  status
) {

  const classes = {

    nao_iniciado:
      "not-started",

    em_andamento:
      "in-progress",

    aguardando_avaliacao:
      "waiting",

    correcao_solicitada:
      "correction",

    aprovado:
      "approved"

  };


  return (
    classes[
      status
    ]
    ||
    "not-started"
  );

}



// ==========================================================
// CLASSE EXTRA DO CARD
// ==========================================================

function getTrainingCardStatusClass(
  status
) {

  if (
    status ===
    "aguardando_avaliacao"
  ) {

    return "status-waiting";

  }


  if (
    status ===
    "correcao_solicitada"
  ) {

    return "status-correction";

  }


  if (
    status ===
    "aprovado"
  ) {

    return "status-approved";

  }


  return "";

}



// ==========================================================
// TEXTO DO BOTÃO
// ==========================================================

function getCourseActionLabel(
  course
) {

  const status =
    getEnrollmentStatus(
      course
    );


  if (
    status ===
    "nao_iniciado"
  ) {

    return "Ver treinamento";

  }


  if (
    status ===
    "em_andamento"
  ) {

    return "Continuar";

  }


  if (
    status ===
    "aguardando_avaliacao"
  ) {

    return "Ver envio";

  }


  if (
    status ===
    "correcao_solicitada"
  ) {

    return "Corrigir";

  }


  if (
    status ===
    "aprovado"
  ) {

    return "Ver conclusão";

  }


  return "Abrir";

}



// ==========================================================
// ==========================================================
// USUÁRIO
// ==========================================================
// ==========================================================

function renderLoggedUser() {

  if (
    !loggedUser
  ) {

    return;

  }


  if (
    userAvatar
  ) {

    userAvatar.textContent =
      getInitials(
        loggedUser.nome
      );

  }


  if (
    userName
  ) {

    userName.textContent =
      loggedUser.nome
      ||
      "Colaborador";

  }


  if (
    userRole
  ) {

    userRole.textContent =
      loggedUser.cargo
      ||
      loggedUser.setor
      ||
      "Colaborador";

  }

}



// ==========================================================
// ==========================================================
// CARREGAR PÁGINA
// ==========================================================
// ==========================================================

async function loadTrainings() {

  // ========================================================
  // LOADING
  // ========================================================

  if (
    userTrainingGrid
  ) {

    userTrainingGrid.innerHTML = `

      <div class="loading-state">

        <i class="fa-solid fa-spinner fa-spin"></i>

        <span>
          Carregando seus treinamentos...
        </span>

      </div>

    `;

  }


  if (
    courseCatalog
  ) {

    courseCatalog.innerHTML = `

      <div class="loading-state">

        <i class="fa-solid fa-spinner fa-spin"></i>

        <span>
          Carregando catálogo...
        </span>

      </div>

    `;

  }



  try {

    const response =
      await fetch(
        "/api/treinamentos",
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
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível carregar os treinamentos."

      );

    }



    // ======================================================
    // ATUALIZAR USUÁRIO COM DADOS DO BACKEND
    // ======================================================

    if (
      result.usuario
    ) {

      loggedUser =
        result.usuario;


      localStorage.setItem(
        "usuario_logado",
        JSON.stringify(
          loggedUser
        )
      );


      renderLoggedUser();

    }



    // ======================================================
    // DADOS
    // ======================================================

    myTrainings =
      Array.isArray(
        result.meus_treinamentos
      )
        ? result.meus_treinamentos
        : [];


    catalogCourses =
      Array.isArray(
        result.catalogo
      )
        ? result.catalogo
        : [];


    summary =
      result.resumo
      ||
      summary;



    // ======================================================
    // RENDER
    // ======================================================

    renderSummary();

    createCatalogFilters();

    renderMyTrainings();

    renderCatalog();


  } catch (
    error
  ) {

    console.error(
      "Erro ao carregar treinamentos:",
      error
    );


    myTrainings =
      [];


    catalogCourses =
      [];


    renderMyTrainings();

    renderCatalog();


    showGlobalMessage(
      error.message,
      "error"
    );

  }

}



// ==========================================================
// ==========================================================
// RESUMO
// ==========================================================
// ==========================================================

function renderSummary() {

  if (
    mandatoryCount
  ) {

    mandatoryCount.textContent =
      Number(
        summary.obrigatorios || 0
      );

  }


  if (
    inProgressCount
  ) {

    inProgressCount.textContent =
      Number(
        summary.em_andamento || 0
      );

  }


  if (
    completedCount
  ) {

    completedCount.textContent =
      Number(
        summary.concluidos || 0
      );

  }


  if (
    totalHours
  ) {

    totalHours.textContent =
      formatHours(
        summary.carga_horaria
      );

  }

}



// ==========================================================
// ==========================================================
// FILTRAR "SEUS TREINAMENTOS"
// ==========================================================
// ==========================================================

function filterMyTrainings(
  courses
) {

  if (
    currentTrainingStatusFilter ===
    "todos"
  ) {

    return courses;

  }


  return courses.filter(
    course => {

      const status =
        getEnrollmentStatus(
          course
        );


      if (
        currentTrainingStatusFilter ===
        "pendentes"
      ) {

        return (
          status ===
          "nao_iniciado"
        );

      }


      if (
        currentTrainingStatusFilter ===
        "andamento"
      ) {

        return (
          status ===
          "em_andamento"
        );

      }


      if (
        currentTrainingStatusFilter ===
        "avaliacao"
      ) {

        return (
          status ===
          "aguardando_avaliacao"
        );

      }


      if (
        currentTrainingStatusFilter ===
        "correcao"
      ) {

        return (
          status ===
          "correcao_solicitada"
        );

      }


      if (
        currentTrainingStatusFilter ===
        "concluidos"
      ) {

        return (
          status ===
          "aprovado"
        );

      }


      return true;

    }
  );

}



// ==========================================================
// ==========================================================
// CARD "SEUS TREINAMENTOS"
// ==========================================================
// ==========================================================

function createTrainingCard(
  course
) {

  const status =
    getEnrollmentStatus(
      course
    );


  const progress =
    Number(
      course
        ?.inscricao
        ?.progresso
      ||
      0
    );


  const areaClass =
    getCourseAreaClass(
      course.area
    );


  const icon =
    getCourseIcon(
      course.area
    );


  const requirementClass =

    course.classificacao ===
    "Obrigatório"

      ? "mandatory"

      : "recommended";


  const cardStatusClass =
    getTrainingCardStatusClass(
      status
    );


  const article =
    document.createElement(
      "article"
    );


  article.className =
    `training-card ${cardStatusClass}`;


  article.innerHTML = `

    <div
      class="
        training-image
        ${areaClass}
      "
    >

      <span
        class="
          badge
          ${requirementClass}
        "
      >
        ${escapeHTML(
          course.classificacao || "Recomendado"
        )}
      </span>


      <span
        class="training-status-badge"
      >
        ${escapeHTML(
          getStatusLabel(
            status
          )
        )}
      </span>


      <i
        class="
          fa-solid
          ${icon}
        "
      ></i>

    </div>


    <div class="training-content">

      <span class="training-category">
        ${escapeHTML(
          course.area || "Treinamento"
        )}
      </span>


      <h3>
        ${escapeHTML(
          course.titulo
        )}
      </h3>


      <p>
        ${escapeHTML(
          course.descricao || ""
        )}
      </p>


      <div class="training-info">

        <span>

          <i class="fa-regular fa-clock"></i>

          ${escapeHTML(
            String(
              course.carga_horaria || 0
            )
          )}h

        </span>


        <span>

          <i class="fa-solid fa-signal"></i>

          ${escapeHTML(
            course.nivel || "-"
          )}

        </span>

      </div>


      <div class="progress-container">

        <div class="progress-header">

          <span>
            Progresso
          </span>

          <strong>
            ${progress}%
          </strong>

        </div>


        <div class="progress-bar">

          <div
            class="progress"
            style="width: ${progress}%"
          >
          </div>

        </div>

      </div>


      <button
        type="button"
        class="primary-button"
        data-course-id="${course.id}"
      >

        ${escapeHTML(
          getCourseActionLabel(
            course
          )
        )}

      </button>

    </div>

  `;



  const button =
    article.querySelector(
      "[data-course-id]"
    );


  button.addEventListener(
    "click",
    () => {

      openCourseModal(
        course.id
      );

    }
  );


  return article;

}



// ==========================================================
// RENDER SEUS TREINAMENTOS
// ==========================================================

function renderMyTrainings() {

  if (
    !userTrainingGrid
  ) {

    return;

  }


  userTrainingGrid.innerHTML =
    "";


  const filtered =
    filterMyTrainings(
      myTrainings
    );



  if (
    filtered.length ===
    0
  ) {

    userTrainingGrid.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-graduation-cap"></i>

        <strong>
          Nenhum treinamento encontrado
        </strong>

        <span>
          Não existem treinamentos nesta categoria no momento.
        </span>

      </div>

    `;


    return;

  }



  filtered.forEach(
    course => {

      userTrainingGrid.appendChild(
        createTrainingCard(
          course
        )
      );

    }
  );

}



// ==========================================================
// ==========================================================
// FILTROS DO CATÁLOGO
// ==========================================================
// ==========================================================

function createCatalogFilters() {

  if (
    !filterButtons
  ) {

    return;

  }


  const areas =
    [

      ...new Set(

        catalogCourses

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



  filterButtons.innerHTML =
    "";


  const allButton =
    document.createElement(
      "button"
    );


  allButton.type =
    "button";


  allButton.className =
    currentCatalogArea ===
    "Todos"

      ? "filter-button active"

      : "filter-button";


  allButton.dataset.area =
    "Todos";


  allButton.textContent =
    "Todos";


  allButton.addEventListener(
    "click",
    () => {

      selectCatalogArea(
        "Todos"
      );

    }
  );


  filterButtons.appendChild(
    allButton
  );



  areas.forEach(
    area => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.dataset.area =
        area;


      button.className =

        currentCatalogArea ===
        area

          ? "filter-button active"

          : "filter-button";


      button.textContent =
        area;


      button.addEventListener(
        "click",
        () => {

          selectCatalogArea(
            area
          );

        }
      );


      filterButtons.appendChild(
        button
      );

    }
  );

}



// ==========================================================
// SELECIONAR ÁREA
// ==========================================================

function selectCatalogArea(
  area
) {

  currentCatalogArea =
    area;


  document
    .querySelectorAll(
      ".filter-button"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.area ===
          area
        );

      }
    );


  renderCatalog();

}



// ==========================================================
// FILTRAR CATÁLOGO
// ==========================================================

function getFilteredCatalog() {

  return catalogCourses.filter(
    course => {

      // ====================================================
      // ÁREA
      // ====================================================

      const areaMatch =

        currentCatalogArea ===
        "Todos"

        ||

        course.area ===
        currentCatalogArea;



      // ====================================================
      // PESQUISA
      // ====================================================

      const search =
        currentSearch
          .trim()
          .toLowerCase();


      if (
        !search
      ) {

        return areaMatch;

      }



      const searchable =
        [

          course.titulo,

          course.descricao,

          course.area,

          course.nivel,

          course.setor_responsavel

        ]
          .join(
            " "
          )
          .toLowerCase();



      return (
        areaMatch
        &&
        searchable.includes(
          search
        )
      );

    }
  );

}



// ==========================================================
// ==========================================================
// CARD DO CATÁLOGO
// ==========================================================
// ==========================================================

function createCatalogCard(
  course
) {

  const status =
    getEnrollmentStatus(
      course
    );


  const icon =
    getCourseIcon(
      course.area
    );


  const card =
    document.createElement(
      "article"
    );


  card.className =
    "catalog-card";


  card.innerHTML = `

    <div class="catalog-icon">

      <i
        class="
          fa-solid
          ${icon}
        "
      ></i>

    </div>


    <div class="catalog-content">

      <span class="catalog-category">
        ${escapeHTML(
          course.area || "Treinamento"
        )}
      </span>


      <h3>
        ${escapeHTML(
          course.titulo
        )}
      </h3>


      <p>
        ${escapeHTML(
          course.descricao || ""
        )}
      </p>


      <div class="catalog-footer">

        <span>

          ${escapeHTML(
            String(
              course.carga_horaria || 0
            )
          )}h

          ·

          ${escapeHTML(
            course.nivel || "-"
          )}

          ·

          ${escapeHTML(
            getStatusLabel(
              status
            )
          )}

        </span>


        <button
          type="button"
          data-catalog-course="${course.id}"
        >
          Ver detalhes
        </button>

      </div>

    </div>

  `;



  card
    .querySelector(
      "[data-catalog-course]"
    )
    .addEventListener(
      "click",
      () => {

        openCourseModal(
          course.id
        );

      }
    );


  return card;

}



// ==========================================================
// RENDER CATÁLOGO
// ==========================================================

function renderCatalog() {

  if (
    !courseCatalog
  ) {

    return;

  }


  courseCatalog.innerHTML =
    "";


  const courses =
    getFilteredCatalog();



  if (
    courses.length ===
    0
  ) {

    courseCatalog.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-magnifying-glass"></i>

        <strong>
          Nenhum treinamento encontrado
        </strong>

        <span>
          Tente utilizar outro termo ou selecionar outra área.
        </span>

      </div>

    `;


    return;

  }



  courses.forEach(
    course => {

      courseCatalog.appendChild(
        createCatalogCard(
          course
        )
      );

    }
  );

}



// ==========================================================
// ==========================================================
// ABRIR MODAL
// ==========================================================
// ==========================================================

async function openCourseModal(
  courseId
) {

  clearModalMessage();


  resetCourseModalState();


  courseModal.classList.add(
    "show"
  );


  courseModal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";



  // ========================================================
  // LOADING DAS ATIVIDADES
  // ========================================================

  if (
    courseActivities
  ) {

    courseActivities.innerHTML = `

      <div class="loading-state">

        <i class="fa-solid fa-spinner fa-spin"></i>

        <span>
          Carregando treinamento...
        </span>

      </div>

    `;

  }



  try {

    const response =
      await fetch(
        `/api/treinamentos/${courseId}`,
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
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível abrir o treinamento."

      );

    }



    currentCourse =
      result.curso;


    currentEnrollment =
      result.inscricao;


    currentDeliveries =
      Array.isArray(
        result.entregas
      )
        ? result.entregas
        : [];


    currentCertificate =
      result.certificado
      ||
      null;



    renderCourseModal();


  } catch (
    error
  ) {

    console.error(
      "Erro ao abrir treinamento:",
      error
    );


    showModalMessage(
      error.message,
      "error"
    );

  }

}



// ==========================================================
// FECHAR MODAL
// ==========================================================

function closeCourseModal() {

  courseModal.classList.remove(
    "show"
  );


  courseModal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "";


  currentCourse =
    null;


  currentEnrollment =
    null;


  currentDeliveries =
    [];


  currentCertificate =
    null;


  Object
    .keys(
      selectedActivityFiles
    )
    .forEach(
      key => {

        delete selectedActivityFiles[
          key
        ];

      }
    );


  clearModalMessage();

}



// ==========================================================
// RESET VISUAL
// ==========================================================

function resetCourseModalState() {

  correctionAlert.classList.remove(
    "show"
  );


  evaluationWaitingBox.classList.remove(
    "show"
  );


  approvedTrainingBox.classList.remove(
    "show"
  );


  externalCourseSection.classList.remove(
    "show"
  );


  internalCourseSection.classList.remove(
    "show"
  );


  certificateResultSection.classList.remove(
    "show"
  );


  startCourseButton.classList.remove(
    "show"
  );


  submitTrainingArea.classList.add(
    "hidden"
  );


  externalCertificateArea.classList.remove(
    "hidden"
  );


  externalCertificateInput.value =
    "";


  externalCertificateFileName.textContent =
    "PDF, PNG ou JPG — máximo de 10 MB";

}



// ==========================================================
// ==========================================================
// RENDER MODAL
// ==========================================================
// ==========================================================

function renderCourseModal() {

  if (
    !currentCourse
  ) {

    return;

  }


  const status =
    currentEnrollment
      ?.status
    ||
    "nao_iniciado";



  // ========================================================
  // CABEÇALHO
  // ========================================================

  modalCourseBadge.textContent =
    currentCourse.curso_externo

      ? "Curso externo"

      : currentCourse.classificacao
        ||
        "Treinamento";


  modalCourseStatus.textContent =
    getStatusLabel(
      status
    );


  modalCourseStatus.className =
    `status-pill ${getStatusClass(status)}`;


  modalCourseTitle.textContent =
    currentCourse.titulo
    ||
    "Treinamento";


  modalCourseArea.textContent =
    currentCourse.area
    ||
    "-";


  modalCourseHours.textContent =
    `${currentCourse.carga_horaria || 0} horas`;


  modalCourseLevel.textContent =
    currentCourse.nivel
    ||
    "-";


  modalCourseSector.textContent =
    currentCourse.setor_responsavel
    ||
    "-";


  modalCourseRequirement.textContent =
    currentCourse.classificacao
    ||
    "-";


  modalCourseDescription.textContent =
    currentCourse.descricao
    ||
    "Nenhuma descrição informada.";



  // ========================================================
  // ESTADOS
  // ========================================================

  if (
    status ===
    "aguardando_avaliacao"
  ) {

    evaluationWaitingBox.classList.add(
      "show"
    );

  }


  if (
    status ===
    "correcao_solicitada"
  ) {

    correctionAlert.classList.add(
      "show"
    );


    correctionMessage.textContent =
      buildCorrectionMessage();

  }


  if (
    status ===
    "aprovado"
  ) {

    approvedTrainingBox.classList.add(
      "show"
    );

  }



  // ========================================================
  // INICIAR
  // ========================================================

  if (
    !currentEnrollment
    ||
    status ===
    "nao_iniciado"
  ) {

    startCourseButton.classList.add(
      "show"
    );

  }



  // ========================================================
  // CURSO EXTERNO
  // ========================================================

  if (
    currentCourse.curso_externo ===
    true
  ) {

    renderExternalCourse(
      status
    );

  }



  // ========================================================
  // CURSO INTERNO
  // ========================================================

  else {

    renderInternalCourse(
      status
    );

  }



  // ========================================================
  // CERTIFICADO
  // ========================================================

  renderCertificate();

}



// ==========================================================
// MENSAGEM DE CORREÇÃO
// ==========================================================

function buildCorrectionMessage() {

  const rejectedDeliveries =
    currentDeliveries.filter(
      delivery =>
        delivery.status ===
        "nao_ok"
    );


  if (
    rejectedDeliveries.length ===
    0
  ) {

    return (
      "O responsável solicitou ajustes. Revise suas entregas e envie novamente."
    );

  }



  const observations =
    rejectedDeliveries

      .map(
        delivery =>
          delivery.observacao_admin
      )

      .filter(
        Boolean
      );


  if (
    observations.length ===
    0
  ) {

    return (
      "Uma ou mais atividades precisam ser corrigidas."
    );

  }


  return observations.join(
    " | "
  );

}



// ==========================================================
// ==========================================================
// CURSO EXTERNO
// ==========================================================
// ==========================================================

function renderExternalCourse(
  status
) {

  externalCourseSection.classList.add(
    "show"
  );


  internalCourseSection.classList.remove(
    "show"
  );



  // ========================================================
  // LINK
  // ========================================================

  externalCourseLink.href =
    currentCourse.link_externo
    ||
    "#";


  if (
    !currentCourse.link_externo
  ) {

    externalCourseLink.classList.add(
      "hidden"
    );

  } else {

    externalCourseLink.classList.remove(
      "hidden"
    );

  }



  // ========================================================
  // BLOQUEAR UPLOAD QUANDO AGUARDANDO OU APROVADO
  // ========================================================

  if (
    status ===
      "aguardando_avaliacao"

    ||

    status ===
      "aprovado"
  ) {

    externalCertificateArea.classList.add(
      "hidden"
    );

  } else {

    externalCertificateArea.classList.remove(
      "hidden"
    );

  }



  // ========================================================
  // SE JÁ EXISTE CERTIFICADO EXTERNO
  // ========================================================

  if (
    currentCertificate
    ?.arquivo_nome
  ) {

    externalCertificateFileName.textContent =
      currentCertificate.arquivo_nome;

  }

}



// ==========================================================
// ==========================================================
// CURSO INTERNO
// ==========================================================
// ==========================================================

function renderInternalCourse(
  status
) {

  internalCourseSection.classList.add(
    "show"
  );


  externalCourseSection.classList.remove(
    "show"
  );


  renderCourseProgress();


  renderCourseActivities();



  // ========================================================
  // PODE ENVIAR PARA AVALIAÇÃO?
  // ========================================================

  if (
    status ===
      "em_andamento"

    ||

    status ===
      "correcao_solicitada"
  ) {

    submitTrainingArea.classList.remove(
      "hidden"
    );

  } else {

    submitTrainingArea.classList.add(
      "hidden"
    );

  }



  updateSubmitTrainingButton();

}



// ==========================================================
// ==========================================================
// PROGRESSO
// ==========================================================
// ==========================================================

function renderCourseProgress() {

  const activities =
    currentCourse
      ?.atividades_curso
    ||
    [];


  const total =
    activities.length;


  const delivered =
    currentDeliveries.length;


  const progress =

    currentEnrollment
      ?.progresso
    ??
    (
      total > 0

        ? Math.round(
            (
              delivered /
              total
            )
            *
            100
          )

        : 0
    );



  courseProgressText.textContent =
    `${delivered} de ${total} atividades enviadas`;


  courseProgressPercentage.textContent =
    `${progress}%`;


  courseProgressFill.style.width =
    `${progress}%`;

}



// ==========================================================
// BUSCAR ENTREGA DE UMA ATIVIDADE
// ==========================================================

function getActivityDelivery(
  activityId
) {

  return currentDeliveries.find(
    delivery =>
      Number(
        delivery.atividade_id
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
// ==========================================================
// RENDER ATIVIDADES
// ==========================================================
// ==========================================================

function renderCourseActivities() {

  if (
    !courseActivities
  ) {

    return;

  }


  courseActivities.innerHTML =
    "";


  const activities =
    currentCourse
      ?.atividades_curso
    ||
    [];



  if (
    activities.length ===
    0
  ) {

    courseActivities.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-list-check"></i>

        <strong>
          Nenhuma atividade cadastrada
        </strong>

        <span>
          Este treinamento não possui atividades disponíveis.
        </span>

      </div>

    `;


    return;

  }



  activities.forEach(
    (
      activity,
      index
    ) => {

      courseActivities.appendChild(
        createActivityCard(
          activity,
          index
        )
      );

    }
  );

}



// ==========================================================
// ==========================================================
// CARD DA ATIVIDADE
// ==========================================================
// ==========================================================

function createActivityCard(
  activity,
  index
) {

  const delivery =
    getActivityDelivery(
      activity.id
    );


  const courseStatus =
    currentEnrollment
      ?.status
    ||
    "nao_iniciado";


  // ========================================================
  // BLOQUEIO
  // ========================================================

  const locked =

    courseStatus ===
      "aguardando_avaliacao"

    ||

    courseStatus ===
      "aprovado";



  let evaluationClass =
    "";


  if (
    delivery?.status ===
    "ok"
  ) {

    evaluationClass =
      "activity-ok";

  }


  if (
    delivery?.status ===
    "nao_ok"
  ) {

    evaluationClass =
      "activity-not-ok";

  }



  const card =
    document.createElement(
      "article"
    );


  card.className =
    `activity-card ${evaluationClass} ${locked ? "readonly" : ""}`;



  // ========================================================
  // MATERIAL DE REFERÊNCIA
  // ========================================================

  const materialHTML =
    createActivityMaterialHTML(
      activity
    );



  // ========================================================
  // ENTREGA
  // ========================================================

  const deliveryHTML =
    createActivityDeliveryHTML(
      activity,
      delivery,
      locked
    );



  // ========================================================
  // AVALIAÇÃO
  // ========================================================

  const evaluationHTML =
    createActivityEvaluationHTML(
      delivery
    );



  card.innerHTML = `

    <div class="activity-header">

      <div class="activity-header-main">

        <div class="activity-number">
          ${index + 1}
        </div>


        <div>

          <h4>
            ${escapeHTML(
              activity.titulo
            )}
          </h4>


          <p>
            ${escapeHTML(
              activity.descricao
              ||
              "Realize a atividade conforme as orientações."
            )}
          </p>

        </div>

      </div>


      <span class="activity-type">

        ${escapeHTML(
          activity.tipo || "Atividade"
        )}

      </span>

    </div>


    ${materialHTML}

    ${deliveryHTML}

    ${evaluationHTML}

  `;



  // ========================================================
  // EVENTOS DA ATIVIDADE
  // ========================================================

  if (
    !locked
  ) {

    attachActivityEvents(
      card,
      activity
    );

  }


  return card;

}



// ==========================================================
// ==========================================================
// MATERIAL DA ATIVIDADE
// ==========================================================
// ==========================================================

function createActivityMaterialHTML(
  activity
) {

  if (
    !activity.recurso
  ) {

    return "";

  }



  if (
    activity.tipo ===
    "Link"
  ) {

    return `

      <div class="course-material">

        <i class="fa-solid fa-link"></i>


        <span>
          Material da atividade
        </span>


        <a
          href="${escapeHTML(
            activity.recurso
          )}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir link
        </a>

      </div>

    `;

  }



  if (
    activity.tipo ===
    "Arquivo"
  ) {

    return `

      <div class="course-material">

        <i class="fa-solid fa-file"></i>


        <span>
          ${escapeHTML(
            activity.recurso
          )}
        </span>

      </div>

    `;

  }



  return `

    <div class="course-material">

      <i class="fa-solid fa-circle-info"></i>


      <span>
        ${escapeHTML(
          activity.recurso
        )}
      </span>

    </div>

  `;

}



// ==========================================================
// ==========================================================
// FORMULÁRIO DA ENTREGA
// ==========================================================
// ==========================================================

function createActivityDeliveryHTML(
  activity,
  delivery,
  locked
) {

  // ========================================================
  // ATIVIDADE TEXTO
  // ========================================================

  if (
    activity.tipo ===
    "Texto"
  ) {

    return `

      <div class="activity-delivery">

        <label
          for="activityText_${activity.id}"
        >
          Sua resposta
        </label>


        <textarea
          id="activityText_${activity.id}"
          placeholder="Digite sua resposta..."
          ${locked ? "disabled" : ""}
        >${escapeHTML(
          delivery?.resposta_texto || ""
        )}</textarea>


        ${createSavedDeliveryHTML(
          delivery
        )}


        <div class="activity-actions">

          <button
            type="button"
            class="activity-save-button"
            data-save-activity="${activity.id}"
          >

            <i class="fa-solid fa-floppy-disk"></i>

            ${
              delivery
                ? "Atualizar atividade"
                : "Salvar atividade"
            }

          </button>

        </div>

      </div>

    `;

  }



  // ========================================================
  // ATIVIDADE LINK
  // ========================================================

  if (
    activity.tipo ===
    "Link"
  ) {

    return `

      <div class="activity-delivery">

        <label
          for="activityLink_${activity.id}"
        >
          Link da sua entrega
        </label>


        <input
          type="url"
          id="activityLink_${activity.id}"
          placeholder="https://..."
          value="${escapeHTML(
            delivery?.resposta_link || ""
          )}"
          ${locked ? "disabled" : ""}
        />


        ${createSavedDeliveryHTML(
          delivery
        )}


        <div class="activity-actions">

          <button
            type="button"
            class="activity-save-button"
            data-save-activity="${activity.id}"
          >

            <i class="fa-solid fa-floppy-disk"></i>

            ${
              delivery
                ? "Atualizar atividade"
                : "Salvar atividade"
            }

          </button>

        </div>

      </div>

    `;

  }



  // ========================================================
  // ATIVIDADE ARQUIVO
  // ========================================================

  return `

    <div class="activity-delivery">

      <label>
        Sua entrega
      </label>


      <div class="activity-file-area">

        <input
          type="file"
          id="activityFile_${activity.id}"
          class="file-input"
          data-activity-file="${activity.id}"
          ${locked ? "disabled" : ""}
        />


        <label
          class="upload-label"
          for="activityFile_${activity.id}"
        >

          <i class="fa-solid fa-cloud-arrow-up"></i>


          <div>

            <strong>
              ${
                delivery?.arquivo_nome
                  ? "Substituir arquivo"
                  : "Selecionar arquivo"
              }
            </strong>


            <span
              id="activityFileName_${activity.id}"
            >

              ${
                escapeHTML(
                  delivery?.arquivo_nome
                  ||
                  "Selecione um arquivo de até 10 MB"
                )
              }

            </span>

          </div>

        </label>


        <div
          id="selectedActivityFile_${activity.id}"
        >
        </div>

      </div>


      ${createSavedDeliveryHTML(
        delivery
      )}


      <div class="activity-actions">

        <button
          type="button"
          class="activity-save-button"
          data-save-activity="${activity.id}"
        >

          <i class="fa-solid fa-cloud-arrow-up"></i>

          ${
            delivery
              ? "Atualizar entrega"
              : "Enviar atividade"
          }

        </button>

      </div>

    </div>

  `;

}



// ==========================================================
// ENTREGA SALVA
// ==========================================================

function createSavedDeliveryHTML(
  delivery
) {

  if (
    !delivery
  ) {

    return "";

  }



  let detail =
    "Entrega salva.";


  if (
    delivery.arquivo_nome
  ) {

    detail =
      delivery.arquivo_nome;

  } else if (
    delivery.resposta_link
  ) {

    detail =
      delivery.resposta_link;

  } else if (
    delivery.resposta_texto
  ) {

    detail =
      "Resposta de texto salva.";

  }



  return `

    <div class="saved-delivery">

      <i class="fa-solid fa-circle-check"></i>


      <div>

        <strong>
          Entrega registrada
        </strong>


        <span>
          ${escapeHTML(
            detail
          )}
        </span>

      </div>

    </div>

  `;

}



// ==========================================================
// AVALIAÇÃO DA ATIVIDADE
// ==========================================================

function createActivityEvaluationHTML(
  delivery
) {

  if (
    !delivery
  ) {

    return "";

  }



  if (
    delivery.status ===
    "ok"
  ) {

    return `

      <div class="activity-evaluation ok">

        <strong>
          <i class="fa-solid fa-circle-check"></i>
          Atividade aprovada
        </strong>


        ${
          delivery.observacao_admin

            ? `

              <p>
                ${escapeHTML(
                  delivery.observacao_admin
                )}
              </p>

            `

            : ""
        }

      </div>

    `;

  }



  if (
    delivery.status ===
    "nao_ok"
  ) {

    return `

      <div class="activity-evaluation nao-ok">

        <strong>
          <i class="fa-solid fa-triangle-exclamation"></i>
          Correção necessária
        </strong>


        <p>
          ${escapeHTML(
            delivery.observacao_admin
            ||
            "Revise esta atividade."
          )}
        </p>

      </div>

    `;

  }



  return "";

}



// ==========================================================
// ==========================================================
// EVENTOS DA ATIVIDADE
// ==========================================================
// ==========================================================

function attachActivityEvents(
  card,
  activity
) {

  // ========================================================
  // ARQUIVO
  // ========================================================

  const fileInput =
    card.querySelector(
      `[data-activity-file="${activity.id}"]`
    );


  if (
    fileInput
  ) {

    fileInput.addEventListener(
      "change",
      () => {

        handleActivityFileSelection(
          activity.id,
          fileInput
        );

      }
    );

  }



  // ========================================================
  // SALVAR
  // ========================================================

  const saveButton =
    card.querySelector(
      `[data-save-activity="${activity.id}"]`
    );


  if (
    saveButton
  ) {

    saveButton.addEventListener(
      "click",
      () => {

        saveActivity(
          activity,
          saveButton
        );

      }
    );

  }

}



// ==========================================================
// SELEÇÃO DE ARQUIVO
// ==========================================================

function handleActivityFileSelection(
  activityId,
  input
) {

  if (
    !input.files
    ||
    input.files.length ===
    0
  ) {

    delete selectedActivityFiles[
      activityId
    ];


    return;

  }


  const file =
    input.files[0];



  if (
    file.size >
    10 * 1024 * 1024
  ) {

    alert(
      "O arquivo deve possuir no máximo 10 MB."
    );


    input.value =
      "";


    return;

  }



  selectedActivityFiles[
    activityId
  ] =
    file;



  const nameElement =
    document.getElementById(
      `activityFileName_${activityId}`
    );


  if (
    nameElement
  ) {

    nameElement.textContent =
      file.name;

  }



  const selectedArea =
    document.getElementById(
      `selectedActivityFile_${activityId}`
    );


  if (
    selectedArea
  ) {

    selectedArea.innerHTML = `

      <div class="selected-file">

        <i class="fa-solid fa-file-circle-check"></i>

        <span>
          ${escapeHTML(
            file.name
          )}
        </span>

      </div>

    `;

  }

}



// ==========================================================
// ==========================================================
// SALVAR ATIVIDADE
// ==========================================================
// ==========================================================

async function saveActivity(
  activity,
  button
) {

  if (
    !currentCourse
  ) {

    return;

  }



  // ========================================================
  // SE NÃO INICIOU, INICIAMOS PRIMEIRO
  // ========================================================

  if (
    !currentEnrollment
  ) {

    const started =
      await startCourse(
        false
      );


    if (
      !started
    ) {

      return;

    }

  }



  const formData =
    new FormData();



  // ========================================================
  // TEXTO
  // ========================================================

  if (
    activity.tipo ===
    "Texto"
  ) {

    const input =
      document.getElementById(
        `activityText_${activity.id}`
      );


    const value =
      input
        ?.value
        ?.trim()
      ||
      "";


    if (
      !value
    ) {

      showModalMessage(
        "Digite sua resposta antes de salvar a atividade.",
        "error"
      );


      return;

    }


    formData.append(
      "resposta_texto",
      value
    );

  }



  // ========================================================
  // LINK
  // ========================================================

  else if (
    activity.tipo ===
    "Link"
  ) {

    const input =
      document.getElementById(
        `activityLink_${activity.id}`
      );


    const value =
      input
        ?.value
        ?.trim()
      ||
      "";


    if (
      !value
    ) {

      showModalMessage(
        "Informe o link da sua entrega.",
        "error"
      );


      return;

    }



    try {

      new URL(
        value
      );

    } catch (
      error
    ) {

      showModalMessage(
        "Informe um link válido. Exemplo: https://...",
        "error"
      );


      return;

    }


    formData.append(
      "resposta_link",
      value
    );

  }



  // ========================================================
  // ARQUIVO
  // ========================================================

  else {

    const file =
      selectedActivityFiles[
        activity.id
      ];


    const existingDelivery =
      getActivityDelivery(
        activity.id
      );


    // Se já existe arquivo no banco,
    // não obrigamos selecionar outro para manter a entrega.
    //
    // Porém, como o usuário clicou em "Atualizar entrega",
    // precisamos garantir que exista algum conteúdo.
    //
    if (
      !file
      &&
      !existingDelivery
        ?.arquivo_url
    ) {

      showModalMessage(
        "Selecione um arquivo antes de enviar a atividade.",
        "error"
      );


      return;

    }



    if (
      file
    ) {

      formData.append(
        "arquivo",
        file
      );

    } else {

      // Backend exige pelo menos uma resposta.
      //
      // Caso a entrega já exista e o usuário não
      // tenha escolhido novo arquivo, não precisamos
      // reenviá-la.
      //
      showModalMessage(
        "Selecione um novo arquivo caso queira atualizar esta entrega.",
        "info"
      );


      return;

    }

  }



  // ========================================================
  // BOTÃO
  // ========================================================

  const originalHTML =
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

        `/api/treinamentos/${currentCourse.id}/atividades/${activity.id}`,

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


    if (
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível salvar a atividade."

      );

    }



    // ======================================================
    // ATUALIZAR INSCRIÇÃO
    // ======================================================

    currentEnrollment =
      result.inscricao
      ||
      currentEnrollment;



    // ======================================================
    // LIMPAR ARQUIVO TEMPORÁRIO
    // ======================================================

    delete selectedActivityFiles[
      activity.id
    ];



    // ======================================================
    // RECARREGAR DETALHES
    // ======================================================

    await reloadCurrentCourse();


    showModalMessage(
      "Atividade salva com sucesso.",
      "success"
    );


    await refreshTrainingsAfterChange();


  } catch (
    error
  ) {

    console.error(
      "Erro ao salvar atividade:",
      error
    );


    showModalMessage(
      error.message,
      "error"
    );


  } finally {

    button.disabled =
      false;


    button.innerHTML =
      originalHTML;

  }

}



// ==========================================================
// ==========================================================
// INICIAR TREINAMENTO
// ==========================================================
// ==========================================================

async function startCourse(
  showSuccessMessage = true
) {

  if (
    !currentCourse
  ) {

    return false;

  }


  startCourseButton.disabled =
    true;


  const originalHTML =
    startCourseButton.innerHTML;


  startCourseButton.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Iniciando...

  `;



  try {

    const response =
      await fetch(

        `/api/treinamentos/${currentCourse.id}/iniciar`,

        {

          method:
            "POST",

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


    if (
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível iniciar o treinamento."

      );

    }



    currentEnrollment =
      result.inscricao;


    await reloadCurrentCourse();


    await refreshTrainingsAfterChange();



    if (
      showSuccessMessage
    ) {

      showModalMessage(
        "Treinamento iniciado com sucesso.",
        "success"
      );

    }


    return true;


  } catch (
    error
  ) {

    console.error(
      "Erro ao iniciar treinamento:",
      error
    );


    showModalMessage(
      error.message,
      "error"
    );


    return false;


  } finally {

    startCourseButton.disabled =
      false;


    startCourseButton.innerHTML =
      originalHTML;

  }

}



// ==========================================================
// ==========================================================
// RECARREGAR CURSO ABERTO
// ==========================================================
// ==========================================================

async function reloadCurrentCourse() {

  if (
    !currentCourse
  ) {

    return;

  }


  const courseId =
    currentCourse.id;


  const response =
    await fetch(

      `/api/treinamentos/${courseId}`,

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
    !response.ok
  ) {

    throw new Error(

      result.error
      ||
      "Não foi possível atualizar o treinamento."

    );

  }



  currentCourse =
    result.curso;


  currentEnrollment =
    result.inscricao;


  currentDeliveries =
    Array.isArray(
      result.entregas
    )
      ? result.entregas
      : [];


  currentCertificate =
    result.certificado
    ||
    null;


  resetCourseModalState();


  renderCourseModal();

}



// ==========================================================
// ==========================================================
// ATUALIZAR LISTAS DEPOIS DE ALTERAÇÃO
// ==========================================================
// ==========================================================

async function refreshTrainingsAfterChange() {

  try {

    const response =
      await fetch(
        "/api/treinamentos",
        {

          method:
            "GET",

          headers:
            getAuthHeaders()

        }
      );


    if (
      !response.ok
    ) {

      return;

    }


    const result =
      await response.json();


    myTrainings =
      Array.isArray(
        result.meus_treinamentos
      )
        ? result.meus_treinamentos
        : [];


    catalogCourses =
      Array.isArray(
        result.catalogo
      )
        ? result.catalogo
        : [];


    summary =
      result.resumo
      ||
      summary;


    renderSummary();

    createCatalogFilters();

    renderMyTrainings();

    renderCatalog();


  } catch (
    error
  ) {

    console.error(
      "Erro ao atualizar listas:",
      error
    );

  }

}



// ==========================================================
// ==========================================================
// PODE ENVIAR CURSO?
// ==========================================================
// ==========================================================

function canSubmitInternalCourse() {

  if (
    !currentCourse
    ||
    !currentEnrollment
  ) {

    return false;

  }


  const activities =
    currentCourse
      .atividades_curso
    ||
    [];


  if (
    activities.length ===
    0
  ) {

    return false;

  }



  const deliveredIds =
    new Set(

      currentDeliveries.map(
        delivery =>
          Number(
            delivery.atividade_id
          )
      )

    );



  return activities.every(
    activity =>
      deliveredIds.has(
        Number(
          activity.id
        )
      )
  );

}



// ==========================================================
// ATUALIZAR BOTÃO DE ENVIO
// ==========================================================

function updateSubmitTrainingButton() {

  if (
    !submitTrainingButton
  ) {

    return;

  }


  const canSubmit =
    canSubmitInternalCourse();


  submitTrainingButton.disabled =
    !canSubmit;



  if (
    canSubmit
  ) {

    submitTrainingButton.innerHTML = `

      <i class="fa-solid fa-paper-plane"></i>

      Enviar para avaliação

    `;

  } else {

    submitTrainingButton.innerHTML = `

      <i class="fa-solid fa-lock"></i>

      Conclua todas as atividades

    `;

  }

}



// ==========================================================
// ==========================================================
// ABRIR CONFIRMAÇÃO
// ==========================================================
// ==========================================================

function openSubmitConfirmation() {

  if (
    !canSubmitInternalCourse()
  ) {

    showModalMessage(
      "Conclua todas as atividades antes de enviar o treinamento.",
      "error"
    );


    return;

  }


  submitConfirmationModal.classList.add(
    "show"
  );


  submitConfirmationModal.setAttribute(
    "aria-hidden",
    "false"
  );

}



// ==========================================================
// FECHAR CONFIRMAÇÃO
// ==========================================================

function closeSubmitConfirmation() {

  submitConfirmationModal.classList.remove(
    "show"
  );


  submitConfirmationModal.setAttribute(
    "aria-hidden",
    "true"
  );

}



// ==========================================================
// ==========================================================
// ENVIAR TREINAMENTO PARA AVALIAÇÃO
// ==========================================================
// ==========================================================

async function submitTraining() {

  if (
    !currentCourse
  ) {

    return;

  }


  confirmSubmitTrainingButton.disabled =
    true;


  const originalHTML =
    confirmSubmitTrainingButton.innerHTML;


  confirmSubmitTrainingButton.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Enviando...

  `;



  try {

    const response =
      await fetch(

        `/api/treinamentos/${currentCourse.id}/enviar`,

        {

          method:
            "POST",

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
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível enviar o treinamento."

      );

    }



    closeSubmitConfirmation();


    await reloadCurrentCourse();


    await refreshTrainingsAfterChange();


    showModalMessage(
      "Treinamento enviado para avaliação.",
      "success"
    );


  } catch (
    error
  ) {

    console.error(
      "Erro ao enviar treinamento:",
      error
    );


    closeSubmitConfirmation();


    showModalMessage(
      error.message,
      "error"
    );


  } finally {

    confirmSubmitTrainingButton.disabled =
      false;


    confirmSubmitTrainingButton.innerHTML =
      originalHTML;

  }

}



// ==========================================================
// ==========================================================
// CERTIFICADO EXTERNO
// ==========================================================
// ==========================================================

function handleExternalCertificateSelection() {

  const file =
    externalCertificateInput
      ?.files
      ?.[0];


  if (
    !file
  ) {

    externalCertificateFileName.textContent =
      "PDF, PNG ou JPG — máximo de 10 MB";


    return;

  }



  if (
    file.size >
    10 * 1024 * 1024
  ) {

    alert(
      "O certificado deve possuir no máximo 10 MB."
    );


    externalCertificateInput.value =
      "";


    externalCertificateFileName.textContent =
      "PDF, PNG ou JPG — máximo de 10 MB";


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

    alert(
      "Envie o certificado em PDF, PNG ou JPG."
    );


    externalCertificateInput.value =
      "";


    return;

  }


  externalCertificateFileName.textContent =
    file.name;

}



// ==========================================================
// ENVIAR CERTIFICADO EXTERNO
// ==========================================================

async function sendExternalCertificate() {

  if (
    !currentCourse
  ) {

    return;

  }


  const file =
    externalCertificateInput
      ?.files
      ?.[0];


  if (
    !file
  ) {

    showModalMessage(
      "Selecione o certificado antes de enviar.",
      "error"
    );


    return;

  }



  const formData =
    new FormData();


  formData.append(
    "arquivo",
    file
  );



  sendExternalCertificateButton.disabled =
    true;


  const originalHTML =
    sendExternalCertificateButton.innerHTML;


  sendExternalCertificateButton.innerHTML = `

    <i class="fa-solid fa-spinner fa-spin"></i>

    Enviando...

  `;



  try {

    const response =
      await fetch(

        `/api/treinamentos/${currentCourse.id}/certificado-externo`,

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


    if (
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível enviar o certificado."

      );

    }



    await reloadCurrentCourse();


    await refreshTrainingsAfterChange();


    showModalMessage(
      "Certificado enviado para avaliação.",
      "success"
    );


  } catch (
    error
  ) {

    console.error(
      "Erro ao enviar certificado:",
      error
    );


    showModalMessage(
      error.message,
      "error"
    );


  } finally {

    sendExternalCertificateButton.disabled =
      false;


    sendExternalCertificateButton.innerHTML =
      originalHTML;

  }

}



// ==========================================================
// ==========================================================
// CERTIFICADO DISPONÍVEL
// ==========================================================
// ==========================================================

function renderCertificate() {

  certificateResultSection.classList.remove(
    "show"
  );



  if (
    !currentCertificate
  ) {

    return;

  }



  // ========================================================
  // CERTIFICADO EXTERNO
  // ========================================================
  //
  // O certificado externo já existe antes da aprovação,
  // pois foi enviado pelo próprio colaborador.
  //
  // Mas só mostraremos como "Certificado disponível"
  // depois da aprovação.
  //
  // ========================================================

  if (
    currentEnrollment
      ?.status !==
    "aprovado"
  ) {

    return;

  }



  certificateResultSection.classList.add(
    "show"
  );


  certificateFileName.textContent =
    currentCertificate.arquivo_nome
    ||
    "Certificado do treinamento";

}



// ==========================================================
// ABRIR CERTIFICADO
// ==========================================================

async function openCertificate() {

  if (
    !currentCertificate
  ) {

    showModalMessage(
      "Nenhum certificado está disponível.",
      "error"
    );


    return;

  }



  openCertificateButton.disabled =
    true;


  try {

    const response =
      await fetch(

        `/api/treinamentos/certificados/${currentCertificate.id}`,

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
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível abrir o certificado."

      );

    }



    if (
      !result.url
    ) {

      throw new Error(
        "O certificado não possui um endereço disponível."
      );

    }



    window.open(
      result.url,
      "_blank",
      "noopener,noreferrer"
    );


  } catch (
    error
  ) {

    console.error(
      "Erro ao abrir certificado:",
      error
    );


    showModalMessage(
      error.message,
      "error"
    );


  } finally {

    openCertificateButton.disabled =
      false;

  }

}



// ==========================================================
// ==========================================================
// FILTROS - EVENTOS
// ==========================================================
// ==========================================================

document
  .querySelectorAll(
    ".training-status-filter"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          currentTrainingStatusFilter =
            button.dataset.status
            ||
            "todos";


          document
            .querySelectorAll(
              ".training-status-filter"
            )
            .forEach(
              item => {

                item.classList.toggle(
                  "active",
                  item === button
                );

              }
            );


          renderMyTrainings();

        }
      );

    }
  );



// ==========================================================
// PESQUISA
// ==========================================================

if (
  searchInput
) {

  searchInput.addEventListener(
    "input",
    () => {

      currentSearch =
        searchInput.value;


      renderCatalog();

    }
  );

}



// ==========================================================
// ==========================================================
// EVENTOS DO MODAL
// ==========================================================
// ==========================================================

if (
  closeCourseModalButton
) {

  closeCourseModalButton.addEventListener(
    "click",
    closeCourseModal
  );

}


if (
  closeCourseFooterButton
) {

  closeCourseFooterButton.addEventListener(
    "click",
    closeCourseModal
  );

}


if (
  startCourseButton
) {

  startCourseButton.addEventListener(
    "click",
    () => {

      startCourse(
        true
      );

    }
  );

}


if (
  submitTrainingButton
) {

  submitTrainingButton.addEventListener(
    "click",
    openSubmitConfirmation
  );

}


if (
  cancelSubmitTrainingButton
) {

  cancelSubmitTrainingButton.addEventListener(
    "click",
    closeSubmitConfirmation
  );

}


if (
  confirmSubmitTrainingButton
) {

  confirmSubmitTrainingButton.addEventListener(
    "click",
    submitTraining
  );

}


if (
  externalCertificateInput
) {

  externalCertificateInput.addEventListener(
    "change",
    handleExternalCertificateSelection
  );

}


if (
  sendExternalCertificateButton
) {

  sendExternalCertificateButton.addEventListener(
    "click",
    sendExternalCertificate
  );

}


if (
  openCertificateButton
) {

  openCertificateButton.addEventListener(
    "click",
    openCertificate
  );

}



// ==========================================================
// FECHAR MODAL CLICANDO FORA
// ==========================================================

if (
  courseModal
) {

  courseModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        courseModal
      ) {

        closeCourseModal();

      }

    }
  );

}


if (
  submitConfirmationModal
) {

  submitConfirmationModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        submitConfirmationModal
      ) {

        closeSubmitConfirmation();

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
      event.key !==
      "Escape"
    ) {

      return;

    }


    if (
      submitConfirmationModal
        ?.classList
        .contains(
          "show"
        )
    ) {

      closeSubmitConfirmation();


      return;

    }


    if (
      courseModal
        ?.classList
        .contains(
          "show"
        )
    ) {

      closeCourseModal();

    }

  }
);



// ==========================================================
// ==========================================================
// LOGOUT
// ==========================================================
// ==========================================================

if (
  logoutButton
) {

  logoutButton.addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Deseja sair do Evolua+?"
        );


      if (
        !confirmed
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
// ==========================================================
// INICIALIZAÇÃO
// ==========================================================
// ==========================================================

async function initializeTrainingsPage() {

  // ========================================================
  // VALIDAR SESSÃO
  // ========================================================

  if (
    !validateSession()
  ) {

    return;

  }



  // ========================================================
  // USUÁRIO INICIAL
  // ========================================================

  renderLoggedUser();



  // ========================================================
  // CARREGAR DADOS REAIS
  // ========================================================

  await loadTrainings();

}



// ==========================================================
// EXECUTAR
// ==========================================================

initializeTrainingsPage();