// ==========================================================
// PORTAL DE CARREIRAS
// TELA DE TREINAMENTOS - APP.JS
// ==========================================================
//
// SITUAÇÃO ATUAL:
//
// - Cursos vêm da API /api/cursos.
// - A API busca os dados no Supabase.
// - Usuário ainda é temporário.
// - Progresso ainda não é salvo no banco.
// - Upload ainda não vai para o Supabase Storage.
// - Arquivos selecionados existem apenas no navegador.
//
// ==========================================================



// ==========================================================
// USUÁRIO TEMPORÁRIO
// ==========================================================
//
// Enquanto ainda não temos login e criação de usuários,
// simulamos o colaborador atual.
//
// IMPORTANTE:
//
// O setor precisa ser exatamente igual ao valor utilizado
// pelo Admin ao cadastrar o curso.
//
// Exemplo:
//
// Tecnologia
//
// ==========================================================

const currentUser = {

  id: 1,

  name:
    "Maycon Santos",

  sector:
    "Tecnologia",

  role:
    "Desenvolvedor Júnior"

};



// ==========================================================
// CURSOS
// ==========================================================
//
// Este array começa vazio.
//
// Depois será preenchido através de:
//
// GET /api/cursos
//
// ==========================================================

let courses = [];



// ==========================================================
// CURSO ATUALMENTE ABERTO
// ==========================================================
//
// Quando o usuário clicar em:
//
// Ver treinamento
//
// guardamos o ID do curso aqui.
//
// ==========================================================

let currentCourseId =
  null;



// ==========================================================
// FILTRO ATUAL DO CATÁLOGO
// ==========================================================

let currentAreaFilter =
  "Todos";



// ==========================================================
// CONTROLE TEMPORÁRIO DE ATIVIDADES CONCLUÍDAS
// ==========================================================
//
// Como ainda não temos usuários reais,
// não existe tabela de progresso.
//
// Então guardamos temporariamente:
//
// {
//   10: {
//     3: true,
//     4: false
//   }
// }
//
// Significa:
//
// curso 10
//
// atividade 3 = concluída
// atividade 4 = pendente
//
// ==========================================================

const completedActivities = {};



// ==========================================================
// ARQUIVOS TEMPORÁRIOS
// ==========================================================
//
// Guardamos apenas informações dos arquivos
// selecionados durante esta sessão.
//
// Nenhum arquivo é enviado ao servidor ainda.
//
// ==========================================================

const uploadedFiles = {};



// ==========================================================
// FUNÇÃO AUXILIAR - ESCAPAR HTML
// ==========================================================
//
// Evita que textos vindos do banco sejam interpretados
// como código HTML.
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
// GERAR INICIAIS
// ==========================================================
//
// Maycon Santos
//
// vira:
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
// NORMALIZAR TEXTO
// ==========================================================
//
// Usaremos para comparar setores e áreas.
//
// Exemplo:
//
// "Tecnologia"
// "tecnologia"
//
// passam a ser tratados como iguais.
//
// ==========================================================

function normalizeText(value) {

  return String(
    value || ""
  )

    .trim()

    .toLowerCase()

    .normalize(
      "NFD"
    )

    .replace(
      /[\u0300-\u036f]/g,
      ""
    );

}



// ==========================================================
// CONVERTER CURSO DA API PARA O FORMATO DO FRONTEND
// ==========================================================
//
// API retorna:
//
// titulo
// descricao
// carga_horaria
// setor_destino
//
// Frontend utiliza:
//
// title
// description
// hours
// targetSector
//
// ==========================================================

function mapApiCourse(
  apiCourse
) {

  const apiActivities =
    apiCourse.atividades_curso
    || [];


  // Ordenamos as atividades.
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
      apiCourse.link_externo
      || "",


    active:
      apiCourse.ativo,


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
// EXIBIR DADOS DO USUÁRIO TEMPORÁRIO
// ==========================================================

function renderCurrentUser() {

  const avatar =
    document.getElementById(
      "userAvatar"
    );


  const name =
    document.getElementById(
      "userName"
    );


  const role =
    document.getElementById(
      "userRole"
    );


  if (avatar) {

    avatar.textContent =
      getInitials(
        currentUser.name
      );

  }


  if (name) {

    name.textContent =
      currentUser.name;

  }


  if (role) {

    role.textContent =
      currentUser.role;

  }

}



// ==========================================================
// BUSCAR CURSOS NA API
// ==========================================================

async function loadCourses() {

  try {

    const response =
      await fetch(
        "/api/cursos"
      );


    const data =
      await response.json();


    if (
      !response.ok
    ) {

      throw new Error(
        data.erro
        ||
        "Não foi possível carregar os treinamentos."
      );

    }


    // ======================================================
    // TRANSFORMAR DADOS
    // ======================================================

    courses =
      (data || [])

        .map(
          course =>
            mapApiCourse(
              course
            )
        )

        .filter(
          course =>
            course.active
        );


    console.log(
      "Cursos recebidos:",
      courses
    );


    // ======================================================
    // CRIAR ESTRUTURA DE PROGRESSO TEMPORÁRIO
    // ======================================================

    initializeTemporaryProgress();


    // ======================================================
    // ATUALIZAR TELA
    // ======================================================

    renderUserTrainings();

    renderAreaFilters();

    renderCatalog();

    updateSummary();

  } catch (error) {

    console.error(
      "Erro ao carregar treinamentos:",
      error
    );


    showLoadingError(
      error.message
    );

  }

}



// ==========================================================
// CRIAR ESTRUTURA TEMPORÁRIA DE PROGRESSO
// ==========================================================

function initializeTemporaryProgress() {

  courses.forEach(
    course => {

      if (
        !completedActivities[
          course.id
        ]
      ) {

        completedActivities[
          course.id
        ] = {};

      }


      course.activities.forEach(
        activity => {

          if (
            completedActivities[
              course.id
            ][activity.id]
            === undefined
          ) {

            completedActivities[
              course.id
            ][activity.id] =
              false;

          }

        }
      );

    }
  );

}



// ==========================================================
// MOSTRAR ERRO NAS DUAS ÁREAS
// ==========================================================

function showLoadingError(
  message
) {

  const userGrid =
    document.getElementById(
      "userTrainingGrid"
    );


  const catalog =
    document.getElementById(
      "courseCatalog"
    );


  const errorHTML = `

    <div
      class="
        empty-state
        error-state
      "
    >

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
        ${escapeHTML(message)}
      </span>

    </div>

  `;


  if (userGrid) {

    userGrid.innerHTML =
      errorHTML;

  }


  if (catalog) {

    catalog.innerHTML =
      errorHTML;

  }

}



// ==========================================================
// CURSOS DESTINADOS AO USUÁRIO
// ==========================================================
//
// Regra:
//
// setor_destino === currentUser.sector
//
// ==========================================================

function getUserCourses() {

  return courses.filter(
    course => {

      return (

        normalizeText(
          course.targetSector
        )

        ===

        normalizeText(
          currentUser.sector
        )

      );

    }
  );

}



// ==========================================================
// CALCULAR PROGRESSO DE UM CURSO
// ==========================================================

function getCourseProgress(
  course
) {

  const total =
    course.activities.length;


  // Curso sem atividades.
  if (
    total === 0
  ) {

    return {

      total:
        0,

      completed:
        0,

      percentage:
        0

    };

  }


  const courseProgress =
    completedActivities[
      course.id
    ]
    || {};


  const completed =
    course.activities.filter(
      activity =>
        courseProgress[
          activity.id
        ]
        === true
    ).length;


  const percentage =
    Math.round(

      (
        completed
        /
        total
      )

      *

      100

    );


  return {

    total,

    completed,

    percentage

  };

}



// ==========================================================
// ESCOLHER ÍCONE DE ACORDO COM ÁREA
// ==========================================================

function getCourseVisual(
  course
) {

  const area =
    normalizeText(
      course.area
    );


  // Tecnologia
  if (
    area.includes(
      "tecnologia"
    )
    ||
    area.includes(
      "ti"
    )
  ) {

    return {

      icon:
        "fa-solid fa-laptop-code",

      className:
        "technology"

    };

  }


  // Desenvolvimento
  if (
    area.includes(
      "desenvolvimento"
    )
  ) {

    return {

      icon:
        "fa-solid fa-chart-line",

      className:
        "development"

    };

  }


  // Comunicação
  if (
    area.includes(
      "comunicacao"
    )
  ) {

    return {

      icon:
        "fa-solid fa-comments",

      className:
        "communication"

    };

  }


  // Liderança
  if (
    area.includes(
      "lideranca"
    )
  ) {

    return {

      icon:
        "fa-solid fa-users",

      className:
        "leadership"

    };

  }


  // Compliance
  if (
    area.includes(
      "compliance"
    )
    ||
    area.includes(
      "lgpd"
    )
  ) {

    return {

      icon:
        "fa-solid fa-shield-halved",

      className:
        "compliance"

    };

  }


  // Genérico
  return {

    icon:
      "fa-solid fa-graduation-cap",

    className:
      ""

  };

}



// ==========================================================
// RENDERIZAR CURSOS DO USUÁRIO
// ==========================================================

function renderUserTrainings() {

  const container =
    document.getElementById(
      "userTrainingGrid"
    );


  if (!container) {

    return;

  }


  const userCourses =
    getUserCourses();


  container.innerHTML =
    "";


  // ========================================================
  // NENHUM CURSO PARA O SETOR
  // ========================================================

  if (
    userCourses.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i
          class="
            fa-solid
            fa-graduation-cap
          "
        ></i>

        <strong>
          Nenhum treinamento direcionado ao seu setor
        </strong>

        <span>
          Você ainda pode acessar os cursos disponíveis
          no catálogo geral abaixo.
        </span>

      </div>

    `;


    return;

  }


  // ========================================================
  // ORDENAR
  // ========================================================
  //
  // Obrigatórios primeiro.
  //
  // ========================================================

  const orderedCourses =
    [...userCourses].sort(
      (
        courseA,
        courseB
      ) => {

        if (
          courseA.requirement ===
          courseB.requirement
        ) {

          return courseA.title
            .localeCompare(
              courseB.title
            );

        }


        if (
          courseA.requirement ===
          "Obrigatório"
        ) {

          return -1;

        }


        return 1;

      }
    );


  // ========================================================
  // CRIAR CARDS
  // ========================================================

  orderedCourses.forEach(
    course => {

      const progress =
        getCourseProgress(
          course
        );


      const visual =
        getCourseVisual(
          course
        );


      const isMandatory =
        course.requirement ===
        "Obrigatório";


      const badgeClass =
        isMandatory
          ? "mandatory"
          : "recommended";


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "training-card";


      card.innerHTML = `

        <div
          class="
            training-image
            ${visual.className}
          "
        >

          <span
            class="
              badge
              ${badgeClass}
            "
          >

            ${escapeHTML(course.requirement)}

          </span>


          <i
            class="
              ${visual.icon}
            "
          ></i>

        </div>


        <div class="training-content">


          <span class="training-category">

            ${escapeHTML(course.area)}

          </span>


          <h3>

            ${escapeHTML(course.title)}

          </h3>


          <p>

            ${escapeHTML(course.description)}

          </p>


          <div class="training-info">


            <span>

              <i
                class="
                  fa-regular
                  fa-clock
                "
              ></i>

              ${course.hours} horas

            </span>


            <span>

              <i
                class="
                  fa-solid
                  fa-signal
                "
              ></i>

              ${escapeHTML(course.level)}

            </span>

          </div>


          <div class="progress-container">


            <div class="progress-header">

              <span>
                Progresso
              </span>

              <span>

                ${progress.percentage}%

              </span>

            </div>


            <div class="progress-bar">

              <div
                class="progress"
                style="
                  width:
                  ${progress.percentage}%
                "
              ></div>

            </div>

          </div>


          <button
            type="button"
            class="primary-button"

            onclick="
              openCourseModal(
                ${course.id}
              )
            "
          >

            ${
              progress.percentage > 0

                ?

                "Continuar"

                :

                "Ver treinamento"
            }

          </button>

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// CRIAR FILTROS DE ÁREA
// ==========================================================
//
// As áreas agora vêm dos cursos cadastrados
// pelo administrador.
//
// ==========================================================

function renderAreaFilters() {

  const container =
    document.getElementById(
      "filterButtons"
    );


  if (!container) {

    return;

  }


  // ========================================================
  // DESCOBRIR ÁREAS ÚNICAS
  // ========================================================

  const areas = [

    ...new Set(

      courses

        .map(
          course =>
            course.area
        )

        .filter(
          area =>
            Boolean(area)
        )

    )

  ];


  // Ordenamos alfabeticamente.
  areas.sort(
    (
      areaA,
      areaB
    ) =>
      areaA.localeCompare(
        areaB
      )
  );


  // ========================================================
  // BOTÃO TODOS
  // ========================================================

  container.innerHTML = `

    <button
      type="button"
      class="
        filter-button
        ${
          currentAreaFilter ===
          "Todos"
            ? "active"
            : ""
        }
      "
      data-area="Todos"
    >

      Todos

    </button>

  `;


  // ========================================================
  // DEMAIS ÁREAS
  // ========================================================

  areas.forEach(
    area => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "filter-button";


      if (
        currentAreaFilter ===
        area
      ) {

        button.classList.add(
          "active"
        );

      }


      button.dataset.area =
        area;


      button.textContent =
        area;


      container.appendChild(
        button
      );

    }
  );


  // ========================================================
  // EVENTOS DOS FILTROS
  // ========================================================

  container
    .querySelectorAll(
      ".filter-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            currentAreaFilter =
              button.dataset.area;


            renderAreaFilters();

            renderCatalog();

          }
        );

      }
    );

}



// ==========================================================
// RENDERIZAR CATÁLOGO GERAL
// ==========================================================

function renderCatalog() {

  const container =
    document.getElementById(
      "courseCatalog"
    );


  if (!container) {

    return;

  }


  const searchInput =
    document.getElementById(
      "searchInput"
    );


  const search =
    normalizeText(
      searchInput
        ? searchInput.value
        : ""
    );


  // ========================================================
  // FILTRAR
  // ========================================================

  const filteredCourses =
    courses.filter(
      course => {

        const title =
          normalizeText(
            course.title
          );


        const description =
          normalizeText(
            course.description
          );


        const area =
          normalizeText(
            course.area
          );


        const matchesSearch =

          title.includes(
            search
          )

          ||

          description.includes(
            search
          )

          ||

          area.includes(
            search
          );


        const matchesArea =

          currentAreaFilter ===
          "Todos"

          ||

          course.area ===
          currentAreaFilter;


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
  // SEM RESULTADOS
  // ========================================================

  if (
    filteredCourses.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i
          class="
            fa-solid
            fa-magnifying-glass
          "
        ></i>

        <strong>
          Nenhum treinamento encontrado
        </strong>

        <span>
          Tente alterar sua pesquisa ou selecionar outra área.
        </span>

      </div>

    `;


    return;

  }


  // ========================================================
  // CARDS DO CATÁLOGO
  // ========================================================

  filteredCourses.forEach(
    course => {

      const visual =
        getCourseVisual(
          course
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
              ${visual.icon}
            "
          ></i>

        </div>


        <div class="catalog-content">


          <span class="catalog-category">

            ${escapeHTML(course.area)}

          </span>


          <h3>

            ${escapeHTML(course.title)}

          </h3>


          <p>

            ${escapeHTML(course.description)}

          </p>


          <div class="catalog-footer">


            <span>

              <i
                class="
                  fa-regular
                  fa-clock
                "
              ></i>

              ${course.hours} horas

            </span>


            <button
              type="button"

              onclick="
                openCourseModal(
                  ${course.id}
                )
              "
            >

              Ver curso

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
// PESQUISA DO CATÁLOGO
// ==========================================================

const searchInput =
  document.getElementById(
    "searchInput"
  );


if (
  searchInput
) {

  searchInput.addEventListener(
    "input",
    renderCatalog
  );

}



// ==========================================================
// ABRIR MODAL DO CURSO
// ==========================================================
//
// Agora recebe:
//
// openCourseModal(courseId)
//
// ==========================================================

function openCourseModal(
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


  // Guardamos o curso atual.
  currentCourseId =
    course.id;


  // Garantimos que a estrutura
  // temporária exista.
  if (
    !completedActivities[
      course.id
    ]
  ) {

    completedActivities[
      course.id
    ] = {};

  }


  // ========================================================
  // CABEÇALHO
  // ========================================================

  const visual =
    getCourseVisual(
      course
    );


  const modalIcon =
    document.getElementById(
      "modalCourseIcon"
    );


  if (
    modalIcon
  ) {

    modalIcon.className =
      visual.icon;

  }


  const badge =
    document.getElementById(
      "modalCourseBadge"
    );


  if (
    badge
  ) {

    badge.textContent =
      `Treinamento ${course.requirement.toLowerCase()}`;


    badge.className =
      "modal-badge";


    if (
      course.requirement ===
      "Obrigatório"
    ) {

      badge.classList.add(
        "mandatory-modal"
      );

    } else {

      badge.classList.add(
        "recommended-modal"
      );

    }

  }


  document
    .getElementById(
      "modalCourseTitle"
    )
    .textContent =
      course.title;


  document
    .getElementById(
      "modalCourseArea"
    )
    .textContent =
      course.area;


  document
    .getElementById(
      "modalCourseHours"
    )
    .textContent =
      `${course.hours} horas`;


  document
    .getElementById(
      "modalCourseLevel"
    )
    .textContent =
      course.level;


  document
    .getElementById(
      "modalCourseSector"
    )
    .textContent =
      course.responsibleSector;


  document
    .getElementById(
      "modalCourseDescription"
    )
    .textContent =
      course.description;


  // ========================================================
  // CURSO EXTERNO
  // ========================================================

  const externalBox =
    document.getElementById(
      "externalCourseBox"
    );


  const externalLink =
    document.getElementById(
      "externalCourseLink"
    );


  if (
    course.external
    &&
    course.externalLink
  ) {

    externalBox.classList.add(
      "show"
    );


    externalLink.href =
      course.externalLink;

  } else {

    externalBox.classList.remove(
      "show"
    );


    externalLink.href =
      "#";

  }


  // ========================================================
  // ATIVIDADES
  // ========================================================

  renderCourseActivities(
    course
  );


  // ========================================================
  // PROGRESSO
  // ========================================================

  updateCourseProgress();


  // ========================================================
  // EXIBIR MODAL
  // ========================================================

  document
    .getElementById(
      "courseModal"
    )
    .classList.add(
      "show"
    );


  document.body.style.overflow =
    "hidden";

}



// ==========================================================
// FECHAR MODAL
// ==========================================================

function closeCourseModal() {

  const modal =
    document.getElementById(
      "courseModal"
    );


  modal.classList.remove(
    "show"
  );


  document.body.style.overflow =
    "auto";


  currentCourseId =
    null;

}



// ==========================================================
// RENDERIZAR ATIVIDADES DO CURSO
// ==========================================================

function renderCourseActivities(
  course
) {

  const container =
    document.getElementById(
      "courseActivities"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  // ========================================================
  // CURSO SEM ATIVIDADES
  // ========================================================

  if (
    course.activities.length ===
    0
  ) {

    container.innerHTML = `

      <div class="no-activities">

        <i
          class="
            fa-regular
            fa-clipboard
          "
        ></i>

        <strong>
          Nenhuma atividade cadastrada
        </strong>

        <span>
          Este treinamento não possui atividades no momento.
        </span>

      </div>

    `;


    return;

  }


  // ========================================================
  // CRIAR ATIVIDADES
  // ========================================================

  course.activities.forEach(
    (
      activity,
      index
    ) => {

      const isCompleted =

        completedActivities[
          course.id
        ][activity.id]

        ===

        true;


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "activity-card";


      card.dataset.activity =
        activity.id;


      if (
        isCompleted
      ) {

        card.classList.add(
          "completed"
        );

      }


      const resourceHTML =
        createActivityResourceHTML(
          activity
        );


      const actionHTML =
        createActivityActionHTML(
          course,
          activity
        );


      card.innerHTML = `

        <div class="activity-check">

          <i
            class="
              fa-solid
              fa-check
            "
          ></i>

        </div>


        <div class="activity-content">


          <div class="activity-header">


            <div>

              <span class="activity-number">

                Atividade
                ${String(index + 1).padStart(
                  2,
                  "0"
                )}

              </span>


              <h4>

                ${escapeHTML(activity.title)}

              </h4>

            </div>


            <span class="activity-status">

              ${
                isCompleted

                  ?

                  "Concluída"

                  :

                  "Pendente"
              }

            </span>

          </div>


          ${
            activity.description

              ?

              `

                <p>

                  ${escapeHTML(activity.description)}

                </p>

              `

              :

              ""
          }


          ${resourceHTML}


          ${actionHTML}

        </div>

      `;


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// MONTAR RECURSO DA ATIVIDADE
// ==========================================================
//
// Tipo:
//
// Texto
// Arquivo
// Link
//
// ==========================================================

function createActivityResourceHTML(
  activity
) {

  // ========================================================
  // TEXTO
  // ========================================================

  if (
    activity.type ===
    "Texto"
  ) {

    return `

      <div class="activity-instructions">

        <strong>
          Instruções
        </strong>

        <p>

          ${
            escapeHTML(
              activity.description
              ||
              "Realize a atividade conforme as orientações informadas."
            )
          }

        </p>

      </div>

    `;

  }


  // ========================================================
  // ARQUIVO
  // ========================================================

  if (
    activity.type ===
    "Arquivo"
  ) {

    return `

      <div class="course-material">


        <div class="material-icon">

          <i
            class="
              fa-solid
              fa-file
            "
          ></i>

        </div>


        <div>

          <strong>

            ${
              escapeHTML(
                activity.resource
                ||
                "Material do treinamento"
              )
            }

          </strong>

          <span>
            Material disponibilizado pelo administrador
          </span>

        </div>


        <button
          type="button"

          onclick="
            showMaterialNotice(
              ${activity.id}
            )
          "
        >

          <i
            class="
              fa-solid
              fa-download
            "
          ></i>

          Baixar

        </button>

      </div>

    `;

  }


  // ========================================================
  // LINK
  // ========================================================

  if (
    activity.type ===
    "Link"
  ) {

    if (
      activity.resource
    ) {

      return `

        <div class="course-material">


          <div
            class="
              material-icon
              link-material
            "
          >

            <i
              class="
                fa-solid
                fa-link
              "
            ></i>

          </div>


          <div>

            <strong>
              Link da atividade
            </strong>

            <span>

              ${escapeHTML(activity.resource)}

            </span>

          </div>


          <a
            href="${escapeHTML(activity.resource)}"

            target="_blank"

            rel="noopener noreferrer"
          >

            <i
              class="
                fa-solid
                fa-arrow-up-right-from-square
              "
            ></i>

            Abrir

          </a>

        </div>

      `;

    }

  }


  return "";

}



// ==========================================================
// MONTAR ÁREA DE ENVIO DA ATIVIDADE
// ==========================================================
//
// Nesta fase todas as atividades podem ser comprovadas
// através de arquivo.
//
// Para atividades Texto também oferecemos uma opção
// temporária de conclusão manual.
//
// ==========================================================

function createActivityActionHTML(
  course,
  activity
) {

  const fileKey =
    `${course.id}_${activity.id}`;


  const file =
    uploadedFiles[
      fileKey
    ];


  // ========================================================
  // ATIVIDADE TEXTO
  // ========================================================
  //
  // Por enquanto permitimos marcar como concluída
  // manualmente.
  //
  // ========================================================

  if (
    activity.type ===
    "Texto"
  ) {

    const completed =

      completedActivities[
        course.id
      ][activity.id]

      === true;


    return `

      <div class="activity-simple-action">

        <button
          type="button"

          class="activity-complete-button"

          onclick="
            toggleTextActivity(
              ${course.id},
              ${activity.id}
            )
          "
        >

          ${
            completed
              ? "Marcar como pendente"
              : "Marcar como concluída"
          }

        </button>

      </div>

    `;

  }


  // ========================================================
  // LINK E ARQUIVO
  // ========================================================
  //
  // Usuário envia um comprovante.
  //
  // ========================================================

  return `

    <div class="upload-area">


      <input
        type="file"

        id="
          file_${course.id}_${activity.id}
        "

        class="file-input"

        onchange="
          handleFileUpload(
            this,
            ${course.id},
            ${activity.id}
          )
        "
      />


      <label
        for="
          file_${course.id}_${activity.id}
        "

        class="upload-label"
      >

        <i
          class="
            fa-solid
            fa-cloud-arrow-up
          "
        ></i>


        <div>

          <strong>
            Enviar comprovante da atividade
          </strong>

          <span>
            Clique para selecionar um arquivo
          </span>

        </div>

      </label>


      <div
        class="
          uploaded-file
          ${file ? "show" : ""}
        "

        id="
          uploadedFile_${course.id}_${activity.id}
        "
      >

        ${
          file

            ?

            createUploadedFileHTML(
              file,
              course.id,
              activity.id
            )

            :

            ""
        }

      </div>

    </div>

  `;

}



// ==========================================================
// ATIVIDADE DE TEXTO
// ==========================================================
//
// Função temporária.
//
// Quando tivermos usuários reais,
// isso será salvo no banco.
//
// ==========================================================

function toggleTextActivity(
  courseId,
  activityId
) {

  if (
    !completedActivities[
      courseId
    ]
  ) {

    completedActivities[
      courseId
    ] = {};

  }


  completedActivities[
    courseId
  ][activityId] =

    !completedActivities[
      courseId
    ][activityId];


  const course =
    courses.find(
      item =>
        Number(item.id) ===
        Number(courseId)
    );


  if (
    course
  ) {

    renderCourseActivities(
      course
    );


    updateCourseProgress();


    renderUserTrainings();

    updateSummary();

  }

}



// ==========================================================
// USUÁRIO SELECIONA ARQUIVO
// ==========================================================

function handleFileUpload(
  input,
  courseId,
  activityId
) {

  const file =
    input.files[0];


  if (!file) {

    return;

  }


  // ========================================================
  // CHAVE TEMPORÁRIA
  // ========================================================

  const key =
    `${courseId}_${activityId}`;


  // Guardamos o arquivo apenas na memória.
  uploadedFiles[key] =
    file;


  // Marcamos atividade como concluída.
  if (
    !completedActivities[
      courseId
    ]
  ) {

    completedActivities[
      courseId
    ] = {};

  }


  completedActivities[
    courseId
  ][activityId] =
    true;


  // ========================================================
  // ATUALIZAR ARQUIVO VISUAL
  // ========================================================

  const uploadedFileContainer =
    document.getElementById(
      `uploadedFile_${courseId}_${activityId}`
    );


  if (
    uploadedFileContainer
  ) {

    uploadedFileContainer.innerHTML =
      createUploadedFileHTML(
        file,
        courseId,
        activityId
      );


    uploadedFileContainer
      .classList
      .add(
        "show"
      );

  }


  // ========================================================
  // ATUALIZAR CARD
  // ========================================================

  updateActivityStatus(
    courseId,
    activityId
  );


  // ========================================================
  // ATUALIZAR PROGRESSO
  // ========================================================

  updateCourseProgress();


  renderUserTrainings();

  updateSummary();

}



// ==========================================================
// HTML DO ARQUIVO SELECIONADO
// ==========================================================

function createUploadedFileHTML(
  file,
  courseId,
  activityId
) {

  return `

    <div class="uploaded-file-icon">

      <i
        class="
          fa-solid
          fa-file
        "
      ></i>

    </div>


    <div class="uploaded-file-info">

      <strong>

        ${escapeHTML(file.name)}

      </strong>

      <span>
        Arquivo anexado
      </span>

    </div>


    <button
      type="button"

      class="remove-file"

      title="Remover arquivo"

      onclick="
        removeFile(
          ${courseId},
          ${activityId}
        )
      "
    >

      <i
        class="
          fa-solid
          fa-trash
        "
      ></i>

    </button>

  `;

}



// ==========================================================
// REMOVER ARQUIVO
// ==========================================================

function removeFile(
  courseId,
  activityId
) {

  const key =
    `${courseId}_${activityId}`;


  // Apagamos arquivo da memória.
  delete uploadedFiles[
    key
  ];


  // Volta para pendente.
  completedActivities[
    courseId
  ][activityId] =
    false;


  // Limpamos input.
  const input =
    document.getElementById(
      `file_${courseId}_${activityId}`
    );


  if (
    input
  ) {

    input.value =
      "";

  }


  // Limpamos visual.
  const uploadedFileContainer =
    document.getElementById(
      `uploadedFile_${courseId}_${activityId}`
    );


  if (
    uploadedFileContainer
  ) {

    uploadedFileContainer.innerHTML =
      "";


    uploadedFileContainer
      .classList
      .remove(
        "show"
      );

  }


  updateActivityStatus(
    courseId,
    activityId
  );


  updateCourseProgress();


  renderUserTrainings();

  updateSummary();

}



// ==========================================================
// ATUALIZAR VISUAL DA ATIVIDADE
// ==========================================================

function updateActivityStatus(
  courseId,
  activityId
) {

  const card =
    document.querySelector(
      `[data-activity="${activityId}"]`
    );


  if (!card) {

    return;

  }


  const status =
    card.querySelector(
      ".activity-status"
    );


  const completed =

    completedActivities[
      courseId
    ][activityId]

    === true;


  if (
    completed
  ) {

    card.classList.add(
      "completed"
    );


    status.textContent =
      "Concluída";

  } else {

    card.classList.remove(
      "completed"
    );


    status.textContent =
      "Pendente";

  }

}



// ==========================================================
// ATUALIZAR PROGRESSO DO CURSO ABERTO
// ==========================================================

function updateCourseProgress() {

  if (
    currentCourseId ===
    null
  ) {

    return;

  }


  const course =
    courses.find(
      item =>
        Number(item.id) ===
        Number(currentCourseId)
    );


  if (!course) {

    return;

  }


  const progress =
    getCourseProgress(
      course
    );


  // ========================================================
  // TEXTO
  // ========================================================

  document
    .getElementById(
      "courseProgressText"
    )
    .textContent =

      `${progress.completed} de ${progress.total} atividades concluídas`;


  // ========================================================
  // PORCENTAGEM
  // ========================================================

  document
    .getElementById(
      "courseProgressPercentage"
    )
    .textContent =

      `${progress.percentage}%`;


  // ========================================================
  // BARRA
  // ========================================================

  document
    .getElementById(
      "courseProgressFill"
    )
    .style
    .width =

      `${progress.percentage}%`;


  // ========================================================
  // MENSAGEM FINAL
  // ========================================================

  const completedMessage =
    document.getElementById(
      "courseCompletedMessage"
    );


  if (
    progress.total > 0
    &&
    progress.percentage ===
    100
  ) {

    completedMessage.classList.add(
      "show"
    );

  } else {

    completedMessage.classList.remove(
      "show"
    );

  }

}



// ==========================================================
// CONTADORES DO RESUMO
// ==========================================================
//
// Como não temos usuários reais ainda:
//
// Obrigatórios:
// funciona.
//
// Em andamento:
// calculado com progresso temporário.
//
// Concluídos:
// calculado com progresso temporário.
//
// Carga horária:
// soma cursos concluídos temporariamente.
//
// ==========================================================

function updateSummary() {

  const userCourses =
    getUserCourses();


  // ========================================================
  // OBRIGATÓRIOS
  // ========================================================

  const mandatory =
    userCourses.filter(
      course => {

        if (
          course.requirement !==
          "Obrigatório"
        ) {

          return false;

        }


        return (
          getCourseProgress(
            course
          ).percentage < 100
        );

      }
    );


  // ========================================================
  // EM ANDAMENTO
  // ========================================================

  const inProgress =
    userCourses.filter(
      course => {

        const percentage =
          getCourseProgress(
            course
          ).percentage;


        return (

          percentage > 0

          &&

          percentage < 100

        );

      }
    );


  // ========================================================
  // CONCLUÍDOS
  // ========================================================

  const completed =
    userCourses.filter(
      course => {

        const progress =
          getCourseProgress(
            course
          );


        return (

          progress.total > 0

          &&

          progress.percentage ===
          100

        );

      }
    );


  // ========================================================
  // HORAS CONCLUÍDAS
  // ========================================================

  const hours =
    completed.reduce(
      (
        total,
        course
      ) => {

        return (

          total

          +

          Number(
            course.hours || 0
          )

        );

      },
      0
    );


  // ========================================================
  // ATUALIZAR HTML
  // ========================================================

  document
    .getElementById(
      "mandatoryCount"
    )
    .textContent =
      mandatory.length;


  document
    .getElementById(
      "inProgressCount"
    )
    .textContent =
      inProgress.length;


  document
    .getElementById(
      "completedCount"
    )
    .textContent =
      completed.length;


  document
    .getElementById(
      "totalHours"
    )
    .textContent =
      `${hours}h`;

}



// ==========================================================
// MATERIAL DO ADMIN
// ==========================================================
//
// Como ainda não utilizamos Supabase Storage,
// o arquivo do Admin não pode ser realmente baixado.
//
// Por enquanto exibimos um aviso.
//
// ==========================================================

function showMaterialNotice(
  activityId
) {

  const course =
    courses.find(
      item =>
        Number(item.id) ===
        Number(currentCourseId)
    );


  if (!course) {

    return;

  }


  const activity =
    course.activities.find(
      item =>
        Number(item.id) ===
        Number(activityId)
    );


  if (!activity) {

    return;

  }


  alert(

    "Material cadastrado:\n\n"

    +

    (
      activity.resource
      ||
      "Arquivo sem nome."
    )

    +

    "\n\nO download real será implementado quando conectarmos o Supabase Storage."

  );

}



// ==========================================================
// FECHAR AO CLICAR FORA DO MODAL
// ==========================================================

const modalOverlay =
  document.getElementById(
    "courseModal"
  );


if (
  modalOverlay
) {

  modalOverlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modalOverlay
      ) {

        closeCourseModal();

      }

    }
  );

}



// ==========================================================
// FECHAR MODAL COM ESC
// ==========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeCourseModal();

    }

  }
);



// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

async function initializeTrainingPage() {

  console.log(
    "Iniciando tela de treinamentos..."
  );


  // ========================================================
  // EXIBIR USUÁRIO
  // ========================================================

  renderCurrentUser();


  // ========================================================
  // BUSCAR CURSOS
  // ========================================================

  await loadCourses();


  console.log(
    "Tela de treinamentos carregada."
  );

}



// ==========================================================
// EXECUTAR APÓS HTML CARREGAR
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeTrainingPage
);