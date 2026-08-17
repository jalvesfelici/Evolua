// ==========================================================
// PORTAL DE CARREIRAS
// ADMIN - APP.JS
// ==========================================================
//
// SITUAÇÃO ATUAL DO PROJETO:
//
// FUNCIONÁRIOS:
// - Ainda simulados no frontend.
//
// TREINAMENTOS:
// - Vêm do Supabase através do backend.
//
// ATIVIDADES:
// - Vêm do Supabase através do backend.
//
// AVALIAÇÕES:
// - Ainda simuladas no frontend.
//
// FLUXO DOS CURSOS:
//
// app.js
//    ↓
// fetch("/api/cursos")
//    ↓
// server.js
//    ↓
// routes/cursos.js
//    ↓
// config/supabase.js
//    ↓
// Supabase
//
// ==========================================================



// ==========================================================
// FUNCIONÁRIOS MOCKADOS
// ==========================================================
//
// Esta parte continuará simulada por enquanto.
// Futuramente criaremos a tabela de funcionários
// e integraremos também ao Supabase.
//
// ==========================================================

let employees = [

  {
    id: 1,

    name:
      "Maycon Santos",

    username:
      "maycon.santos",

    role:
      "Desenvolvedor Júnior",

    sector:
      "Tecnologia",

    status:
      "Ativo"
  },


  {
    id: 2,

    name:
      "Amanda Ribeiro",

    username:
      "amanda.ribeiro",

    role:
      "Analista de Sistemas",

    sector:
      "Tecnologia",

    status:
      "Ativo"
  },


  {
    id: 3,

    name:
      "João Lima",

    username:
      "joao.lima",

    role:
      "Analista de Suporte",

    sector:
      "Tecnologia",

    status:
      "Ativo"
  }

];



// ==========================================================
// CURSOS
// ==========================================================
//
// IMPORTANTE:
//
// Antes os cursos ficavam escritos diretamente
// dentro deste array.
//
// Agora o array começa vazio.
//
// Ele será preenchido automaticamente pela nossa API:
//
// GET /api/cursos
//
// ==========================================================

let courses = [];



// ==========================================================
// AVALIAÇÕES MOCKADAS
// ==========================================================
//
// Ainda não estamos trabalhando na integração
// das avaliações.
//
// Por isso esta parte continua simulada.
//
// ==========================================================

let evaluations = [

  {
    id: 1,

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
    id: 2,

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
    id: 3,

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
//
// Quando o administrador estiver criando um curso,
// as atividades ficam temporariamente neste array.
//
// Exemplo:
//
// temporaryActivities = [
//   {
//     temporaryId: 123,
//     title: "Criar uma planilha",
//     description: "...",
//     type: "Texto",
//     resource: ""
//   }
// ];
//
// Quando clicar em "Publicar treinamento",
// enviaremos tudo para:
//
// POST /api/cursos
//
// ==========================================================

let temporaryActivities = [];



// ==========================================================
// STATUS ATUAL DAS AVALIAÇÕES
// ==========================================================
//
// Define qual aba está selecionada:
//
// pending
// approved
// rejected
//
// ==========================================================

let currentEvaluationStatus =
  "pending";



// ==========================================================
// CURSO QUE SERÁ REMOVIDO
// ==========================================================
//
// Guardamos temporariamente o ID do curso
// quando o administrador clicar na lixeira.
//
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
// FUNÇÃO AUXILIAR - ESCAPAR HTML
// ==========================================================
//
// Como alguns dados vêm do banco e depois são colocados
// dentro de innerHTML, utilizamos esta função.
//
// Ela evita que caracteres especiais sejam interpretados
// como HTML.
//
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
//
// Esta função controla a navegação interna da tela Admin.
//
// Exemplo:
//
// changePage("trainings");
//
// ==========================================================

function changePage(pageName) {

  // ========================================================
  // ESCONDER TODAS AS PÁGINAS
  // ========================================================

  document
    .querySelectorAll(
      ".page-section"
    )
    .forEach(page => {

      page.classList.remove(
        "active-page"
      );

    });


  // ========================================================
  // REMOVER ITEM ATIVO DO MENU
  // ========================================================

  document
    .querySelectorAll(
      ".menu-item"
    )
    .forEach(item => {

      item.classList.remove(
        "active"
      );

    });


  // ========================================================
  // MOSTRAR PÁGINA SELECIONADA
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
  // DESTACAR ITEM DO MENU
  // ========================================================

  const menuItem =
    document.querySelector(
      `[data-page="${pageName}"]`
    );


  if (menuItem) {

    menuItem.classList.add(
      "active"
    );

  }


  // ========================================================
  // ALTERAR TÍTULO
  // ========================================================

  if (
    pageData[pageName]
  ) {

    document
      .getElementById(
        "pageTitle"
      )
      .textContent =
        pageData[pageName].title;


    document
      .getElementById(
        "pageSubtitle"
      )
      .textContent =
        pageData[pageName].subtitle;

  }

}



// ==========================================================
// CLIQUES DOS BOTÕES DO MENU
// ==========================================================

document
  .querySelectorAll(
    ".menu-item[data-page]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        changePage(
          button.dataset.page
        );

      }
    );

  });



// ==========================================================
// GERAR INICIAIS DO FUNCIONÁRIO
// ==========================================================
//
// Exemplo:
//
// Maycon Santos
//
// Resultado:
//
// MS
//
// ==========================================================

function getInitials(name) {

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


  // Impede a rolagem da tela que está atrás.
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


  // Libera a rolagem novamente.
  document.body.style.overflow =
    "auto";

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


  openModal(
    "employeeModal"
  );

}



// ==========================================================
// CRIAR FUNCIONÁRIO
// ==========================================================
//
// IMPORTANTE:
//
// Continua funcionando apenas no frontend.
//
// Ainda NÃO estamos criando usuários reais.
//
// ==========================================================

function createEmployee(event) {

  event.preventDefault();


  // ========================================================
  // PEGAR OS CAMPOS
  // ========================================================

  const name =
    document
      .getElementById(
        "employeeName"
      )
      .value
      .trim();


  const username =
    document
      .getElementById(
        "employeeUsername"
      )
      .value
      .trim();


  const role =
    document
      .getElementById(
        "employeeRole"
      )
      .value
      .trim();


  const sector =
    document
      .getElementById(
        "employeeSector"
      )
      .value;


  // ========================================================
  // CRIAR OBJETO
  // ========================================================

  const employee = {

    id:
      Date.now(),

    name,

    username,

    role,

    sector,

    status:
      "Ativo"

  };


  // ========================================================
  // ADICIONAR AO ARRAY
  // ========================================================

  employees.push(
    employee
  );


  // ========================================================
  // ATUALIZAR INTERFACE
  // ========================================================

  renderEmployees();


  updateDashboardCounters();


  closeModal(
    "employeeModal"
  );


  alert(
    "Funcionário criado apenas no frontend."
  );

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


  // ========================================================
  // TEXTO DA PESQUISA
  // ========================================================

  const searchInput =
    document.getElementById(
      "employeeSearch"
    );


  const search =
    searchInput
      ? searchInput.value
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
          employee.name
            .toLowerCase();


        const username =
          employee.username
            .toLowerCase();


        const role =
          employee.role
            .toLowerCase();


        return (

          name.includes(
            search
          )

          ||

          username.includes(
            search
          )

          ||

          role.includes(
            search
          )

        );

      }
    );


  // ========================================================
  // LIMPAR TABELA
  // ========================================================

  tbody.innerHTML =
    "";


  // ========================================================
  // NENHUM FUNCIONÁRIO
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
        colspan="6"
        style="
          text-align: center;
          padding: 30px;
          color: var(--text-muted);
        "
      >

        Nenhum funcionário encontrado.

      </td>

    `;


    tbody.appendChild(
      row
    );


    return;

  }


  // ========================================================
  // CRIAR LINHAS
  // ========================================================

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

              ${getInitials(employee.name)}

            </div>


            <strong>

              ${escapeHTML(employee.name)}

            </strong>

          </div>

        </td>


        <td>

          ${escapeHTML(employee.username)}

        </td>


        <td>

          ${escapeHTML(employee.role)}

        </td>


        <td>

          ${escapeHTML(employee.sector)}

        </td>


        <td>

          <span
            class="
              status-badge
              success
            "
          >

            ${escapeHTML(employee.status)}

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
// PESQUISA DE FUNCIONÁRIO
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
// A API retorna:
//
// titulo
// descricao
// carga_horaria
// setor_responsavel
//
// Mas o frontend que já criamos utiliza:
//
// title
// description
// hours
// responsibleSector
//
// Em vez de refazer a tela inteira,
// fazemos uma tradução aqui.
//
// ==========================================================

function mapApiCourse(
  apiCourse
) {

  // Pegamos as atividades vindas da API.
  const apiActivities =
    apiCourse.atividades_curso
    || [];


  // Ordenamos pela coluna "ordem".
  apiActivities.sort(
    (a, b) => {

      return (
        Number(
          a.ordem || 0
        )
        -
        Number(
          b.ordem || 0
        )
      );

    }
  );


  return {

    // ======================================================
    // CURSO
    // ======================================================

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
      apiCourse.link_externo
      || "",


    active:
      apiCourse.ativo,


    createdAt:
      apiCourse.created_at,


    // ======================================================
    // ATIVIDADES
    // ======================================================

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
              activity.descricao
              || "",


            type:
              activity.tipo,


            resource:
              activity.recurso
              || "",


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
//
// Esta função substitui os cursos mockados.
//
// Fazemos:
//
// GET /api/cursos
//
// ==========================================================

async function loadCoursesFromApi() {

  const container =
    document.getElementById(
      "adminTrainingGrid"
    );


  // ========================================================
  // MOSTRAR CARREGAMENTO
  // ========================================================

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

    // ======================================================
    // CONSULTAR NOSSO BACKEND
    // ======================================================

    const response =
      await fetch(
        "/api/cursos"
      );


    // ======================================================
    // TRANSFORMAR RESPOSTA EM JSON
    // ======================================================

    const data =
      await response.json();


    // ======================================================
    // VERIFICAR ERRO HTTP
    // ======================================================

    if (
      !response.ok
    ) {

      throw new Error(
        data.erro
        ||
        "Não foi possível carregar os cursos."
      );

    }


    // ======================================================
    // CONVERTER CURSOS PARA O FORMATO DO FRONTEND
    // ======================================================

    courses =
      (data || []).map(
        course => {

          return mapApiCourse(
            course
          );

        }
      );


    // ======================================================
    // ATUALIZAR A INTERFACE
    // ======================================================

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


    courses = [];


    // ======================================================
    // MOSTRAR ERRO
    // ======================================================

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


    // Mesmo com erro nos cursos,
    // atualizamos os contadores.
    updateDashboardCounters();

  }

}



// ==========================================================
// ABRIR MODAL DE NOVO CURSO
// ==========================================================

function openCourseModal() {

  // Limpamos atividades criadas anteriormente.
  temporaryActivities =
    [];


  // ========================================================
  // LIMPAR FORMULÁRIO
  // ========================================================

  const form =
    document.getElementById(
      "courseForm"
    );


  if (form) {

    form.reset();

  }


  // ========================================================
  // ESCONDER CAMPO DE LINK EXTERNO
  // ========================================================

  const externalArea =
    document.getElementById(
      "externalLinkArea"
    );


  if (
    externalArea
  ) {

    externalArea.classList.remove(
      "show"
    );

  }


  // ========================================================
  // LIMPAR CONSTRUTOR DAS ATIVIDADES
  // ========================================================

  renderActivityBuilder();


  // ========================================================
  // ABRIR MODAL
  // ========================================================

  openModal(
    "courseModal"
  );

}



// ==========================================================
// CURSO EXTERNO
// ==========================================================
//
// Controla a exibição do campo:
//
// Link do curso externo
//
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


  if (
    checkbox.checked
  ) {

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
// ADICIONAR ATIVIDADE TEMPORÁRIA
// ==========================================================

function addActivity() {

  const activity = {

    // ID temporário usado somente enquanto
    // o curso ainda não foi salvo.
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
// REMOVER ATIVIDADE TEMPORÁRIA
// ==========================================================

function removeActivity(
  activityId
) {

  temporaryActivities =
    temporaryActivities.filter(
      activity =>
        activity.temporaryId !== activityId
    );


  renderActivityBuilder();

}



// ==========================================================
// ATUALIZAR ATIVIDADE TEMPORÁRIA
// ==========================================================

function updateActivity(
  activityId,
  field,
  value
) {

  const activity =
    temporaryActivities.find(
      item =>
        item.temporaryId === activityId
    );


  if (!activity) {

    return;

  }


  activity[field] =
    value;


  // Se o tipo da atividade mudar,
  // limpamos o recurso anterior.
  if (
    field === "type"
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


  // ========================================================
  // SEM ATIVIDADES
  // ========================================================

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


  // ========================================================
  // CRIAR CADA BLOCO DE ATIVIDADE
  // ========================================================

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
      // TIPO LINK
      // ======================================================

      if (
        activity.type === "Link"
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
            />

          </div>

        `;

      }


      // ======================================================
      // TIPO ARQUIVO
      // ======================================================

      if (
        activity.type === "Arquivo"
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
            />

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

              placeholder="
                Ex.: Crie uma planilha financeira
              "

              value="${escapeHTML(activity.title)}"

              oninput="
                updateActivity(
                  ${activity.temporaryId},
                  'title',
                  this.value
                )
              "
            />

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

              placeholder="
                Explique o que o colaborador deverá realizar...
              "

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
                  activity.type === "Texto"
                    ? "selected"
                    : ""
                }
              >
                Somente texto
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
// SALVAR NOME DO ARQUIVO DA ATIVIDADE
// ==========================================================
//
// IMPORTANTE:
//
// Nesta etapa ainda NÃO fazemos upload real.
//
// Guardamos apenas o nome do arquivo.
// O Supabase Storage será implementado depois.
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
        item.temporaryId === activityId
    );


  if (!activity) {

    return;

  }


  // Pegamos apenas o nome.
  activity.resource =
    input.files[0].name;


  renderActivityBuilder();

}



// ==========================================================
// CRIAR CURSO VIA API
// ==========================================================
//
// FLUXO:
//
// formulário
//     ↓
// app.js
//     ↓
// POST /api/cursos
//     ↓
// backend
//     ↓
// Supabase
//
// ==========================================================

async function createCourse(
  event
) {

  event.preventDefault();


  // ========================================================
  // VERIFICAR SE EXISTEM ATIVIDADES
  // ========================================================

  if (
    temporaryActivities.length === 0
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
  // VALIDAR TÍTULO DAS ATIVIDADES
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


  // ========================================================
  // PEGAR FORMULÁRIO
  // ========================================================

  const form =
    document.getElementById(
      "courseForm"
    );


  if (!form) {

    return;

  }


  // ========================================================
  // PEGAR BOTÃO DE SUBMIT
  // ========================================================

  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );


  const originalButtonHTML =
    submitButton
      ? submitButton.innerHTML
      : "";


  if (
    submitButton
  ) {

    submitButton.disabled =
      true;


    submitButton.innerHTML = `

      <i class="fa-solid fa-spinner fa-spin"></i>

      Salvando...

    `;

  }


  try {

    // ======================================================
    // DADOS DO CURSO
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


      // ====================================================
      // ATIVIDADES
      // ====================================================

      atividades:
        temporaryActivities.map(
          activity => {

            return {

              titulo:
                activity.title.trim(),


              descricao:
                activity.description.trim()
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
    // POST PARA NOSSO BACKEND
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


    // ======================================================
    // PEGAR RETORNO
    // ======================================================

    const result =
      await response.json();


    // ======================================================
    // ERRO HTTP
    // ======================================================

    if (
      !response.ok
    ) {

      throw new Error(
        result.erro
        ||
        "Não foi possível criar o treinamento."
      );

    }


    console.log(
      "Curso criado:",
      result
    );


    // ======================================================
    // SUCESSO
    // ======================================================

    alert(
      "Treinamento publicado com sucesso!"
    );


    // Limpamos atividades temporárias.
    temporaryActivities =
      [];


    // Limpamos formulário.
    form.reset();


    // Fechamos modal.
    closeModal(
      "courseModal"
    );


    // Recarregamos os cursos.
    await loadCoursesFromApi();


    // Levamos o usuário para a área de treinamentos.
    changePage(
      "trainings"
    );

  } catch (error) {

    console.error(
      "Erro ao criar treinamento:",
      error
    );


    alert(
      "Não foi possível criar o treinamento.\n\n" +
      (
        error.message
        ||
        "Erro desconhecido."
      )
    );

  } finally {

    // ======================================================
    // RESTAURAR BOTÃO
    // ======================================================

    if (
      submitButton
    ) {

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


  // ========================================================
  // PESQUISA
  // ========================================================

  const searchInput =
    document.getElementById(
      "trainingSearch"
    );


  const search =
    searchInput
      ? searchInput.value
        .trim()
        .toLowerCase()
      : "";


  // ========================================================
  // FILTRO DE ÁREA
  // ========================================================

  const areaFilter =
    document.getElementById(
      "trainingAreaFilter"
    );


  const area =
    areaFilter
      ? areaFilter.value
      : "";


  // ========================================================
  // FILTRAGEM
  // ========================================================

  const filtered =
    courses.filter(
      course => {

        // Cursos inativos não aparecem.
        if (
          !course.active
        ) {

          return false;

        }


        const title =
          (
            course.title || ""
          )
            .toLowerCase();


        const description =
          (
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

          course.area === area;


        return (
          matchesSearch
          &&
          matchesArea
        );

      }
    );


  // ========================================================
  // LIMPAR ÁREA
  // ========================================================

  container.innerHTML =
    "";


  // ========================================================
  // SEM RESULTADOS
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


  // ========================================================
  // CRIAR CARDS
  // ========================================================

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

            ${escapeHTML(course.requirement)}

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

              ${escapeHTML(course.area)}

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

            ${escapeHTML(course.title)}

          </h3>


          <p>

            ${escapeHTML(course.description)}

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

                ${escapeHTML(course.level)}

              </strong>

            </div>


            <div class="course-meta-item">

              <span>
                Público
              </span>

              <strong>

                ${escapeHTML(course.targetSector)}

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
                  ${course.id}
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
                  ${course.id}
                )
              "

              title="
                Remover curso
              "
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
// FILTRO POR TEXTO
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
// FILTRO POR ÁREA
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
// RENDERIZAR CURSOS NO DASHBOARD
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


  // ========================================================
  // SEM CURSOS
  // ========================================================

  if (
    activeCourses.length === 0
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


  // ========================================================
  // CRIAR MINI CARDS
  // ========================================================

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


          <span
            class="
              training-mini-category
            "
          >

            ${escapeHTML(course.area)}

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

          ${escapeHTML(course.title)}

        </h3>


        <p>

          ${course.hours}h •

          ${escapeHTML(course.level)} •

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
// VISUALIZAR DETALHES DO CURSO
// ==========================================================

function showCourseDetails(
  courseId
) {

  const course =
    courses.find(
      item =>
        Number(item.id) ===
        Number(courseId)
    );


  if (!course) {

    console.warn(
      "Curso não encontrado:",
      courseId
    );

    return;

  }


  // ========================================================
  // MONTAR ATIVIDADES
  // ========================================================

  const activitiesHTML =

    course.activities.length > 0

      ?

      course.activities
        .map(
          (
            activity,
            index
          ) => {

            return `

              <div class="details-activity">

                <strong>

                  ${index + 1}.

                  ${
                    escapeHTML(
                      activity.title
                      ||
                      "Atividade sem título"
                    )
                  }

                </strong>


                <span>

                  ${escapeHTML(activity.type)}

                  ${
                    activity.resource

                      ?

                      ` • ${escapeHTML(activity.resource)}`

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

                        ${escapeHTML(activity.description)}

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


  // ========================================================
  // EXIBIR DETALHES
  // ========================================================

  const detailsContainer =
    document.getElementById(
      "courseDetailsContent"
    );


  if (!detailsContainer) {

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

        ${escapeHTML(course.area)}

      </span>


      <h2>

        ${escapeHTML(course.title)}

      </h2>


      <p>

        ${escapeHTML(course.description)}

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

          ${escapeHTML(course.level)}

        </strong>

      </div>


      <div class="detail-item">

        <span>
          Setor responsável
        </span>

        <strong>

          ${
            escapeHTML(
              course.responsibleSector
            )
          }

        </strong>

      </div>


      <div class="detail-item">

        <span>
          Público
        </span>

        <strong>

          ${
            escapeHTML(
              course.targetSector
            )
          }

          •

          ${
            escapeHTML(
              course.requirement
            )
          }

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

              ${
                escapeHTML(
                  course.externalLink
                )
              }

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
// SOLICITAR REMOÇÃO DO CURSO
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
// CONFIRMAR REMOÇÃO / DESATIVAÇÃO
// ==========================================================
//
// Chamaremos:
//
// PATCH /api/cursos/:id/desativar
//
// O banco NÃO apaga o curso.
// Apenas muda:
//
// ativo = false
//
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
          courseToDelete === null
        ) {

          return;

        }


        const originalButtonHTML =
          confirmDeleteButton.innerHTML;


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

          // ==================================================
          // PATCH PARA O BACKEND
          // ==================================================

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


          if (
            !response.ok
          ) {

            throw new Error(
              result.erro
              ||
              "Não foi possível remover o treinamento."
            );

          }


          // ==================================================
          // FECHAR MODAL
          // ==================================================

          closeModal(
            "confirmationModal"
          );


          courseToDelete =
            null;


          // ==================================================
          // RECARREGAR CURSOS
          // ==================================================

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
            "Não foi possível remover o treinamento.\n\n" +
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
// As avaliações ainda são mockadas nesta etapa.
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


  // Filtramos de acordo com a aba selecionada.
  const filtered =
    evaluations.filter(
      evaluation =>
        evaluation.status ===
        currentEvaluationStatus
    );


  container.innerHTML =
    "";


  // ========================================================
  // NENHUMA AVALIAÇÃO
  // ========================================================

  if (
    filtered.length === 0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i
          class="
            fa-solid
            fa-clipboard-check
          "
        ></i>

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


      // ====================================================
      // STATUS APROVADO
      // ====================================================

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


      // ====================================================
      // STATUS REPROVADO
      // ====================================================

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


      // ====================================================
      // CONTEÚDO DO CARD
      // ====================================================

      card.innerHTML = `

        <div
          class="
            evaluation-user-avatar
          "
        >

          ${evaluation.initials}

        </div>


        <div class="evaluation-content">

          <h3>

            ${escapeHTML(evaluation.employee)}

          </h3>


          <span
            class="
              evaluation-course-name
            "
          >

            ${escapeHTML(evaluation.course)}

          </span>


          <div class="evaluation-meta">

            <span>

              <i
                class="
                  fa-solid
                  fa-building
                "
              ></i>

              ${escapeHTML(evaluation.sector)}

            </span>


            <span>

              <i
                class="
                  fa-regular
                  fa-clock
                "
              ></i>

              ${evaluation.hours}h

            </span>


            <span>

              <i
                class="
                  fa-regular
                  fa-calendar
                "
              ></i>

              Enviado em

              ${evaluation.submittedAt}

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
// ABAS DE AVALIAÇÃO
// ==========================================================

document
  .querySelectorAll(
    ".evaluation-tab"
  )
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        // Remove seleção de todas as abas.
        document
          .querySelectorAll(
            ".evaluation-tab"
          )
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });


        // Marca a aba atual.
        tab.classList.add(
          "active"
        );


        // Atualiza o status atual.
        currentEvaluationStatus =
          tab.dataset
            .evaluationStatus;


        // Renderiza novamente.
        renderEvaluations();

      }
    );

  });



// ==========================================================
// ABRIR MODAL DE AVALIAÇÃO
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


  // ========================================================
  // MONTAR LISTA DE ATIVIDADES
  // ========================================================

  const activitiesHTML =
    evaluation.activities
      .map(
        (
          activity,
          index
        ) => {

          return `

            <div class="submission-item">

              <div
                class="
                  submission-item-header
                "
              >

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

                ${escapeHTML(activity.title)}

              </p>


              <div class="submission-file">

                <i
                  class="
                    fa-solid
                    fa-file
                  "
                ></i>


                <span>

                  ${escapeHTML(activity.file)}

                </span>


                <button
                  type="button"
                  onclick="
                    alert(
                      'Visualização do arquivo será implementada depois.'
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


  // ========================================================
  // PEGAR CONTAINER DO MODAL
  // ========================================================

  const modalContent =
    document.getElementById(
      "evaluationModalContent"
    );


  if (!modalContent) {

    return;

  }


  // ========================================================
  // MONTAR MODAL
  // ========================================================

  modalContent.innerHTML = `

    <div class="modal-header">

      <div class="modal-title-icon">

        <i
          class="
            fa-solid
            fa-clipboard-check
          "
        ></i>

      </div>


      <div>

        <h2>
          Avaliar treinamento
        </h2>

        <p>
          Analise todas as atividades
          antes de tomar uma decisão.
        </p>

      </div>

    </div>


    <div class="evaluation-profile">

      <div class="list-avatar">

        ${evaluation.initials}

      </div>


      <div
        class="
          evaluation-profile-info
        "
      >

        <strong>

          ${escapeHTML(evaluation.employee)}

        </strong>

        <span>

          ${escapeHTML(evaluation.course)}

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

      Confira os arquivos enviados
      pelo colaborador.

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
              Em caso de aprovação,
              você poderá anexar o certificado
              emitido pela empresa.
            </p>

            <input
              type="file"
              id="certificateFile"
              accept=".pdf,.png,.jpg,.jpeg"
            />

          </div>

        `

        :

        `

          <div class="form-information">

            <i
              class="
                fa-solid
                fa-circle-info
              "
            ></i>

            <p>
              Este treinamento foi realizado
              externamente.

              O certificado enviado pelo
              colaborador já funciona como
              comprovante.
            </p>

          </div>

        `
    }


    <div
      class="
        evaluation-decision-actions
      "
    >

      <button
        class="danger-button"

        onclick="
          rejectEvaluation(
            ${evaluation.id}
          )
        "
      >

        <i
          class="
            fa-solid
            fa-xmark
          "
        ></i>

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

        <i
          class="
            fa-solid
            fa-check
          "
        ></i>

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
// CONTINUA MOCKADO.
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


  // Alteramos o status apenas no frontend.
  evaluation.status =
    "approved";


  closeModal(
    "evaluationModal"
  );


  renderEvaluations();


  updateEvaluationCounters();


  alert(
    "Treinamento aprovado no frontend."
  );

}



// ==========================================================
// REPROVAR AVALIAÇÃO
// ==========================================================
//
// CONTINUA MOCKADO.
//
// ==========================================================

function rejectEvaluation(
  evaluationId
) {

  // ========================================================
  // PEGAR OBSERVAÇÃO
  // ========================================================

  const observationInput =
    document.getElementById(
      "evaluationObservation"
    );


  const observation =
    observationInput
      ? observationInput.value.trim()
      : "";


  // ========================================================
  // EXIGIR MOTIVO
  // ========================================================

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


  // ========================================================
  // ALTERAR STATUS
  // ========================================================

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
    "Treinamento reprovado no frontend."
  );

}



// ==========================================================
// ATUALIZAR CONTADORES DO DASHBOARD
// ==========================================================

function updateDashboardCounters() {

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


  if (
    employeesCounter
  ) {

    employeesCounter.textContent =
      employees.length;

  }


  // ========================================================
  // TREINAMENTOS
  // ========================================================

  const trainingsCounter =
    document.getElementById(
      "dashboardTrainings"
    );


  if (
    trainingsCounter
  ) {

    trainingsCounter.textContent =
      activeCourses.length;

  }


  // ========================================================
  // AVALIAÇÕES
  // ========================================================

  updateEvaluationCounters();

}



// ==========================================================
// ATUALIZAR CONTADOR DAS AVALIAÇÕES
// ==========================================================

function updateEvaluationCounters() {

  const pending =
    evaluations.filter(
      evaluation =>
        evaluation.status ===
        "pending"
    );


  // ========================================================
  // CARD DO DASHBOARD
  // ========================================================

  const dashboardCounter =
    document.getElementById(
      "dashboardEvaluations"
    );


  if (
    dashboardCounter
  ) {

    dashboardCounter.textContent =
      pending.length;

  }


  // ========================================================
  // CONTADOR DO MENU
  // ========================================================

  const menuCounter =
    document.getElementById(
      "evaluationMenuCounter"
    );


  if (
    menuCounter
  ) {

    menuCounter.textContent =
      pending.length;

  }


  // ========================================================
  // LISTA RESUMIDA
  // ========================================================

  renderDashboardEvaluations();

}



// ==========================================================
// RENDERIZAR AVALIAÇÕES NO DASHBOARD
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
  // NENHUMA PENDÊNCIA
  // ========================================================

  if (
    pending.length === 0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i
          class="
            fa-solid
            fa-circle-check
          "
        ></i>

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


  // ========================================================
  // CRIAR ITENS
  // ========================================================

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

          ${evaluation.initials}

        </div>


        <div class="list-main">

          <strong>

            ${escapeHTML(evaluation.employee)}

          </strong>

          <span>

            ${escapeHTML(evaluation.course)}

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

          // Só fechamos se o clique
          // ocorrer exatamente no fundo.
          if (
            event.target === overlay
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
      event.key !== "Escape"
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
// INICIALIZAÇÃO DO SISTEMA
// ==========================================================
//
// ESTA É UMA DAS PARTES MAIS IMPORTANTES.
//
// Antes:
//
// renderCourses();
//
// utilizava cursos mockados.
//
// Agora:
//
// await loadCoursesFromApi();
//
// busca os cursos reais através de:
//
// GET /api/cursos
//
// ==========================================================

async function initializeApp() {

  console.log(
    "Iniciando Portal de Carreiras..."
  );


  // ========================================================
  // FUNCIONÁRIOS
  // ========================================================

  renderEmployees();


  // ========================================================
  // AVALIAÇÕES
  // ========================================================

  renderEvaluations();


  updateEvaluationCounters();


  // ========================================================
  // CURSOS REAIS
  // ========================================================

  await loadCoursesFromApi();


  console.log(
    "Portal de Carreiras iniciado."
  );

}



// ==========================================================
// INICIAR QUANDO O HTML ESTIVER CARREGADO
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);