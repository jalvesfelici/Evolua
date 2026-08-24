// ==========================================================
// EVOLUA+
// TELA DE TREINAMENTOS - APP.JS
// ==========================================================
//
// RESPONSABILIDADES:
//
// - validar o colaborador autenticado;
// - recuperar usuário real do localStorage;
// - mostrar nome, setor e avatar reais na sidebar;
// - permitir logout;
// - carregar cursos da API;
// - mostrar treinamentos do setor do colaborador;
// - mostrar catálogo geral;
// - controlar temporariamente o progresso;
// - controlar temporariamente arquivos selecionados;
//
// IMPORTANTE:
//
// Progresso e uploads ainda não são persistidos.
//
// Posteriormente:
//
// - progresso irá para o Supabase;
// - arquivos irão para o Supabase Storage;
// - conclusões irão gerar avaliações para o Admin.
//
// ==========================================================



// ==========================================================
// SESSÃO
// ==========================================================
//
// O login salva:
//
// access_token
//
// usuario_logado
//
// Exemplo de usuario_logado:
//
// {
//   id: "...",
//   nome: "João Silva",
//   email: "...",
//   cargo: "Analista",
//   setor: "Tecnologia",
//   perfil: "colaborador",
//   ativo: true
// }
//
// ==========================================================

const accessToken =
  localStorage.getItem(
    "access_token"
  );



// ==========================================================
// USUÁRIO ATUAL
// ==========================================================
//
// Não existe mais usuário mockado.
//
// Este objeto será preenchido usando:
//
// localStorage.usuario_logado
//
// ==========================================================

let currentUser =
  null;



// ==========================================================
// RECUPERAR USUÁRIO LOGADO
// ==========================================================

try {

  const storedUser =
    localStorage.getItem(
      "usuario_logado"
    );


  if (
    storedUser
  ) {

    const loggedUser =
      JSON.parse(
        storedUser
      );


    // ======================================================
    // NORMALIZAMOS OS NOMES
    // ======================================================
    //
    // O backend utiliza:
    //
    // nome
    // setor
    // cargo
    //
    // Parte antiga do frontend utiliza:
    //
    // name
    // sector
    // role
    //
    // Para evitar alterar centenas de linhas,
    // transformamos uma vez aqui.
    //
    // ======================================================

    currentUser = {

      id:
        loggedUser.id,


      name:
        loggedUser.nome ||
        loggedUser.name ||
        "",


      email:
        loggedUser.email ||
        "",


      registration:
        loggedUser.matricula ||
        loggedUser.registration ||
        "",


      sector:
        loggedUser.setor ||
        loggedUser.sector ||
        "",


      role:
        loggedUser.cargo ||
        loggedUser.role ||
        "",


      profile:
        loggedUser.perfil ||
        loggedUser.profile ||
        "",


      active:

        loggedUser.ativo !==
        false

    };

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
//
// REGRAS:
//
// sem login
// → /login/
//
// Admin
// → /admin/
//
// colaborador
// → pode continuar.
//
// ==========================================================

function validateUserSession() {

  // ========================================================
  // TOKEN OU USUÁRIO AUSENTE
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
  // ADMIN
  // ========================================================

  if (
    currentUser.profile ===
      "admin_principal"

    ||

    currentUser.profile ===
      "admin_setor"
  ) {

    window.location.href =
      "/admin/";


    return false;

  }



  // ========================================================
  // PERFIL INVÁLIDO
  // ========================================================

  if (
    currentUser.profile !==
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
    currentUser.active ===
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
// Já deixamos esta função pronta porque posteriormente
// as rotas de treinamentos/progresso serão protegidas.
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
// CURSOS
// ==========================================================
//
// Começa vazio.
//
// Depois será preenchido por:
//
// GET /api/cursos
//
// ==========================================================

let courses =
  [];



// ==========================================================
// CURSO ATUALMENTE ABERTO
// ==========================================================

let currentCourseId =
  null;



// ==========================================================
// FILTRO ATUAL
// ==========================================================

let currentAreaFilter =
  "Todos";



// ==========================================================
// PROGRESSO TEMPORÁRIO
// ==========================================================
//
// Ainda não salvamos progresso no Supabase.
//
// Estrutura:
//
// {
//   cursoId: {
//     atividadeId: true,
//     atividadeId: false
//   }
// }
//
// ==========================================================

const completedActivities =
  {};



// ==========================================================
// ARQUIVOS TEMPORÁRIOS
// ==========================================================
//
// Nesta etapa continuam somente no navegador.
//
// ==========================================================

const uploadedFiles =
  {};



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
// GERAR INICIAIS
// ==========================================================
//
// João Silva
//
// vira:
//
// JS
//
// ==========================================================

function getInitials(
  name
) {

  if (
    !name
  ) {

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
// NORMALIZAR TEXTO
// ==========================================================
//
// Permite comparar:
//
// Tecnologia
// tecnologia
// TECNOLOGIA
//
// ==========================================================

function normalizeText(
  value
) {

  return String(
    value ||
    ""
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
// CONVERTER CURSO DA API
// ==========================================================

function mapApiCourse(
  apiCourse
) {

  const apiActivities =
    apiCourse.atividades_curso ||
    [];



  // ========================================================
  // ORDENAR ATIVIDADES
  // ========================================================

  apiActivities.sort(
    (
      activityA,
      activityB
    ) => {

      return (

        Number(
          activityA.ordem ||
          0
        )

        -

        Number(
          activityB.ordem ||
          0
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
// EXIBIR COLABORADOR LOGADO
// ==========================================================
//
// IDs utilizados no novo index.html:
//
// sidebarUserAvatar
// sidebarUserName
// sidebarUserSector
//
// ==========================================================

function renderCurrentUser() {

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



  // ========================================================
  // AVATAR
  // ========================================================

  if (
    avatar
  ) {

    avatar.textContent =
      getInitials(
        currentUser.name
      );

  }



  // ========================================================
  // NOME
  // ========================================================

  if (
    name
  ) {

    name.textContent =
      currentUser.name ||
      "Colaborador";

  }



  // ========================================================
  // SETOR
  // ========================================================

  if (
    sector
  ) {

    sector.textContent =
      currentUser.sector ||
      "Setor não informado";

  }

}



// ==========================================================
// BUSCAR CURSOS NA API
// ==========================================================

async function loadCourses() {

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



    if (
      !response.ok
    ) {

      throw new Error(

        data.erro ||
        data.error ||
        "Não foi possível carregar os treinamentos."

      );

    }



    // ======================================================
    // TRANSFORMAR DADOS
    // ======================================================

    courses =
      (
        data ||
        []
      )

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
    // PROGRESSO TEMPORÁRIO
    // ======================================================

    initializeTemporaryProgress();



    // ======================================================
    // ATUALIZAR TELA
    // ======================================================

    renderUserTrainings();


    renderAreaFilters();


    renderCatalog();


    updateSummary();


  } catch (
    error
  ) {

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
        ] =
          {};

      }



      course.activities.forEach(
        activity => {

          if (
            completedActivities[
              course.id
            ][
              activity.id
            ]
            ===
            undefined
          ) {

            completedActivities[
              course.id
            ][
              activity.id
            ] =
              false;

          }

        }
      );

    }
  );

}



// ==========================================================
// MOSTRAR ERRO
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
        ${escapeHTML(
          message
        )}
      </span>

    </div>

  `;


  if (
    userGrid
  ) {

    userGrid.innerHTML =
      errorHTML;

  }


  if (
    catalog
  ) {

    catalog.innerHTML =
      errorHTML;

  }

}



// ==========================================================
// CURSOS DESTINADOS AO COLABORADOR
// ==========================================================
//
// REGRA:
//
// setor_destino
//
// deve ser igual ao:
//
// setor do colaborador.
//
// Exemplo:
//
// João
// setor = Tecnologia
//
// Curso Python
// setor_destino = Tecnologia
//
// → aparece em "Seus treinamentos".
//
// ==========================================================

function getUserCourses() {

  if (
    !currentUser
  ) {

    return [];

  }


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
// CALCULAR PROGRESSO
// ==========================================================

function getCourseProgress(
  course
) {

  const total =
    course.activities.length;



  // ========================================================
  // CURSO SEM ATIVIDADE
  // ========================================================

  if (
    total ===
    0
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
    ||
    {};



  const completed =
    course.activities.filter(
      activity =>

        courseProgress[
          activity.id
        ]
        ===
        true

    ).length;



  const percentage =
    Math.round(

      (
        completed /
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
// VISUAL DO CURSO
// ==========================================================

function getCourseVisual(
  course
) {

  const area =
    normalizeText(
      course.area
    );



  // ========================================================
  // TECNOLOGIA
  // ========================================================

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



  // ========================================================
  // DESENVOLVIMENTO
  // ========================================================

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



  // ========================================================
  // COMUNICAÇÃO
  // ========================================================

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



  // ========================================================
  // LIDERANÇA
  // ========================================================

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



  // ========================================================
  // COMPLIANCE
  // ========================================================

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



  // ========================================================
  // PADRÃO
  // ========================================================

  return {

    icon:
      "fa-solid fa-graduation-cap",

    className:
      ""

  };

}



// ==========================================================
// RENDERIZAR CURSOS DO SETOR DO COLABORADOR
// ==========================================================

function renderUserTrainings() {

  const container =
    document.getElementById(
      "userTrainingGrid"
    );


  if (
    !container
  ) {

    return;

  }



  const userCourses =
    getUserCourses();


  container.innerHTML =
    "";



  // ========================================================
  // NENHUM CURSO
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
  // Obrigatórios aparecem primeiro.
  //
  // ========================================================

  const orderedCourses =
    [
      ...userCourses
    ].sort(
      (
        courseA,
        courseB
      ) => {

        if (
          courseA.requirement ===
          courseB.requirement
        ) {

          return String(
            courseA.title ||
            ""
          ).localeCompare(
            String(
              courseB.title ||
              ""
            )
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

            ${escapeHTML(
              course.requirement
            )}

          </span>


          <i
            class="
              ${visual.icon}
            "
          ></i>

        </div>


        <div class="training-content">


          <span class="training-category">

            ${escapeHTML(
              course.area
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

              ${escapeHTML(
                course.level
              )}

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
                  ${progress.percentage}%;
                "
              ></div>

            </div>


          </div>


          <button
            type="button"
            class="primary-button"
            onclick="
              openCourseModal(
                '${course.id}'
              )
            "
          >

            ${
              progress.percentage > 0

                ? "Continuar"

                : "Ver treinamento"
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
// FILTROS DE ÁREA
// ==========================================================

function renderAreaFilters() {

  const container =
    document.getElementById(
      "filterButtons"
    );


  if (
    !container
  ) {

    return;

  }



  // ========================================================
  // PEGAR ÁREAS ÚNICAS
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



  // Ordenar alfabeticamente.
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
  // OUTRAS ÁREAS
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
  // EVENTOS
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
// CATÁLOGO GERAL
// ==========================================================
//
// IMPORTANTE:
//
// Aqui mostramos TODOS os cursos ativos.
//
// Então:
//
// colaborador Tecnologia
//
// pode acessar:
//
// curso Financeiro
// curso RH
// curso Marketing
//
// caso queira realizar voluntariamente.
//
// ==========================================================

function renderCatalog() {

  const container =
    document.getElementById(
      "courseCatalog"
    );


  if (
    !container
  ) {

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


        const responsibleSector =
          normalizeText(
            course.responsibleSector
          );


        const targetSector =
          normalizeText(
            course.targetSector
          );



        // ==================================================
        // BUSCA
        // ==================================================

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
          )

          ||

          responsibleSector.includes(
            search
          )

          ||

          targetSector.includes(
            search
          );



        // ==================================================
        // ÁREA
        // ==================================================

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
          Tente alterar sua pesquisa
          ou selecionar outra área.
        </span>

      </div>

    `;


    return;

  }



  // ========================================================
  // CARDS
  // ========================================================

  filteredCourses.forEach(
    course => {

      const visual =
        getCourseVisual(
          course
        );


      const progress =
        getCourseProgress(
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

            ${escapeHTML(
              course.area
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
                  '${course.id}'
                )
              "
            >

              ${
                progress.percentage > 0

                  ? "Continuar"

                  : "Ver curso"
              }

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

function openCourseModal(
  courseId
) {

  const course =
    courses.find(
      item =>
        String(item.id) ===
        String(courseId)
    );


  if (
    !course
  ) {

    console.warn(
      "Curso não encontrado:",
      courseId
    );


    return;

  }



  // ========================================================
  // CURSO ATUAL
  // ========================================================

  currentCourseId =
    course.id;



  // ========================================================
  // GARANTIR ESTRUTURA DE PROGRESSO
  // ========================================================

  if (
    !completedActivities[
      course.id
    ]
  ) {

    completedActivities[
      course.id
    ] =
      {};

  }



  course.activities.forEach(
    activity => {

      if (
        completedActivities[
          course.id
        ][
          activity.id
        ]
        ===
        undefined
      ) {

        completedActivities[
          course.id
        ][
          activity.id
        ] =
          false;

      }

    }
  );



  // ========================================================
  // VISUAL
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



  // ========================================================
  // BADGE
  // ========================================================

  const badge =
    document.getElementById(
      "modalCourseBadge"
    );


  if (
    badge
  ) {

    const requirement =
      course.requirement ||
      "Recomendado";


    badge.textContent =
      `Treinamento ${requirement.toLowerCase()}`;


    badge.className =
      "modal-badge";


    if (
      requirement ===
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



  // ========================================================
  // TÍTULO
  // ========================================================

  const title =
    document.getElementById(
      "modalCourseTitle"
    );


  if (
    title
  ) {

    title.textContent =
      course.title ||
      "Treinamento";

  }



  // ========================================================
  // ÁREA
  // ========================================================

  const area =
    document.getElementById(
      "modalCourseArea"
    );


  if (
    area
  ) {

    area.textContent =
      course.area ||
      "Área não informada";

  }



  // ========================================================
  // HORAS
  // ========================================================

  const hours =
    document.getElementById(
      "modalCourseHours"
    );


  if (
    hours
  ) {

    hours.textContent =
      `${course.hours || 0} horas`;

  }



  // ========================================================
  // NÍVEL
  // ========================================================

  const level =
    document.getElementById(
      "modalCourseLevel"
    );


  if (
    level
  ) {

    level.textContent =
      course.level ||
      "Não informado";

  }



  // ========================================================
  // SETOR RESPONSÁVEL
  // ========================================================

  const sector =
    document.getElementById(
      "modalCourseSector"
    );


  if (
    sector
  ) {

    sector.textContent =
      course.responsibleSector ||
      "Não informado";

  }



  // ========================================================
  // DESCRIÇÃO
  // ========================================================

  const description =
    document.getElementById(
      "modalCourseDescription"
    );


  if (
    description
  ) {

    description.textContent =
      course.description ||
      "Sem descrição.";

  }



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
    externalBox &&
    externalLink
  ) {

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

  const modal =
    document.getElementById(
      "courseModal"
    );


  if (
    modal
  ) {

    modal.classList.add(
      "show"
    );

  }


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


  if (
    modal
  ) {

    modal.classList.remove(
      "show"
    );

  }


  document.body.style.overflow =
    "auto";


  currentCourseId =
    null;

}



// ==========================================================
// RENDERIZAR ATIVIDADES
// ==========================================================

function renderCourseActivities(
  course
) {

  const container =
    document.getElementById(
      "courseActivities"
    );


  if (
    !container
  ) {

    return;

  }


  container.innerHTML =
    "";



  // ========================================================
  // SEM ATIVIDADES
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
          Este treinamento não possui
          atividades no momento.
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
        ][
          activity.id
        ]

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
                ${String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}

              </span>


              <h4>

                ${escapeHTML(
                  activity.title
                )}

              </h4>

            </div>


            <span class="activity-status">

              ${
                isCompleted

                  ? "Concluída"

                  : "Pendente"
              }

            </span>


          </div>


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
// RECURSO DA ATIVIDADE
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
              '${activity.id}'
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

              ${escapeHTML(
                activity.resource
              )}

            </span>

          </div>


          <a
            href="${escapeHTML(
              activity.resource
            )}"
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
// ÁREA DE AÇÃO DA ATIVIDADE
// ==========================================================
//
// Nesta etapa:
//
// Texto:
// → pode ser marcado manualmente como concluído.
//
// Link/Arquivo:
// → exige seleção de um comprovante.
//
// Tudo ainda é temporário no navegador.
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
  // TEXTO
  // ========================================================

  if (
    activity.type ===
    "Texto"
  ) {

    const completed =

      completedActivities[
        course.id
      ][
        activity.id
      ]

      ===

      true;


    return `

      <div class="activity-simple-action">

        <button
          type="button"
          class="activity-complete-button"
          onclick="
            toggleTextActivity(
              '${course.id}',
              '${activity.id}'
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
  // ARQUIVO / LINK
  // ========================================================

  const inputId =
    `file_${course.id}_${activity.id}`;


  const uploadedContainerId =
    `uploadedFile_${course.id}_${activity.id}`;


  return `

    <div class="upload-area">


      <input
        type="file"
        id="${inputId}"
        class="file-input"
        onchange="
          handleFileUpload(
            this,
            '${course.id}',
            '${activity.id}'
          )
        "
      >


      <label
        for="${inputId}"
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
        id="${uploadedContainerId}"
      >

        ${
          file

            ? createUploadedFileHTML(
                file,
                course.id,
                activity.id
              )

            : ""
        }

      </div>


    </div>

  `;

}



// ==========================================================
// ATIVIDADE DE TEXTO
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
    ] =
      {};

  }


  completedActivities[
    courseId
  ][
    activityId
  ] =

    !completedActivities[
      courseId
    ][
      activityId
    ];



  const course =
    courses.find(
      item =>
        String(item.id) ===
        String(courseId)
    );


  if (
    course
  ) {

    renderCourseActivities(
      course
    );


    updateCourseProgress();


    renderUserTrainings();


    renderCatalog();


    updateSummary();

  }

}



// ==========================================================
// SELECIONAR ARQUIVO
// ==========================================================

function handleFileUpload(
  input,
  courseId,
  activityId
) {

  const file =
    input.files?.[0];


  if (
    !file
  ) {

    return;

  }



  // ========================================================
  // CHAVE
  // ========================================================

  const key =
    `${courseId}_${activityId}`;



  // ========================================================
  // GUARDAR ARQUIVO TEMPORÁRIO
  // ========================================================

  uploadedFiles[
    key
  ] =
    file;



  // ========================================================
  // MARCAR CONCLUÍDA
  // ========================================================

  if (
    !completedActivities[
      courseId
    ]
  ) {

    completedActivities[
      courseId
    ] =
      {};

  }


  completedActivities[
    courseId
  ][
    activityId
  ] =
    true;



  // ========================================================
  // CONTAINER VISUAL
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
  // VISUAL DA ATIVIDADE
  // ========================================================

  updateActivityStatus(
    courseId,
    activityId
  );



  // ========================================================
  // PROGRESSO
  // ========================================================

  updateCourseProgress();


  renderUserTrainings();


  renderCatalog();


  updateSummary();

}

// ==========================================================
// CRIAR HTML DO ARQUIVO ENVIADO
// ==========================================================

function createUploadedFileHTML(
  file,
  courseId,
  activityId
) {

  return `

    <div class="uploaded-file-info">


      <div class="uploaded-file-icon">

        <i class="fa-solid fa-file"></i>

      </div>


      <div class="uploaded-file-text">

        <strong>

          ${escapeHTML(
            file.name
          )}

        </strong>


        <span>

          ${formatFileSize(
            file.size
          )}

        </span>

      </div>


      <button
        type="button"
        class="remove-file-button"
        onclick="
          removeFile(
            '${courseId}',
            '${activityId}'
          )
        "
        title="Remover arquivo"
      >

        <i class="fa-solid fa-xmark"></i>

      </button>


    </div>

  `;

}



// ==========================================================
// FORMATAR TAMANHO DO ARQUIVO
// ==========================================================

function formatFileSize(
  bytes
) {

  if (
    !bytes ||
    bytes <= 0
  ) {

    return "0 KB";

  }


  const kilobytes =
    bytes / 1024;


  if (
    kilobytes < 1024
  ) {

    return `${kilobytes.toFixed(1)} KB`;

  }


  const megabytes =
    kilobytes / 1024;


  return `${megabytes.toFixed(1)} MB`;

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


  // ========================================================
  // REMOVER ARQUIVO TEMPORÁRIO
  // ========================================================

  delete uploadedFiles[
    key
  ];



  // ========================================================
  // MARCAR ATIVIDADE COMO PENDENTE
  // ========================================================

  if (
    completedActivities[
      courseId
    ]
  ) {

    completedActivities[
      courseId
    ][
      activityId
    ] =
      false;

  }



  // ========================================================
  // BUSCAR CURSO
  // ========================================================

  const course =
    courses.find(
      item =>
        String(item.id) ===
        String(courseId)
    );


  if (
    course
  ) {

    renderCourseActivities(
      course
    );


    updateCourseProgress();


    renderUserTrainings();


    renderCatalog();


    updateSummary();

  }

}



// ==========================================================
// ATUALIZAR STATUS VISUAL DA ATIVIDADE
// ==========================================================

function updateActivityStatus(
  courseId,
  activityId
) {

  const card =
    document.querySelector(
      `
        .activity-card[
          data-activity="${activityId}"
        ]
      `
        .replace(
          /\s+/g,
          ""
        )
    );


  if (
    !card
  ) {

    return;

  }



  const completed =

    completedActivities[
      courseId
    ]
    ?.[
      activityId
    ]

    ===

    true;



  if (
    completed
  ) {

    card.classList.add(
      "completed"
    );

  } else {

    card.classList.remove(
      "completed"
    );

  }



  const status =
    card.querySelector(
      ".activity-status"
    );


  if (
    status
  ) {

    status.textContent =
      completed
        ? "Concluída"
        : "Pendente";

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
        String(item.id) ===
        String(currentCourseId)
    );


  if (
    !course
  ) {

    return;

  }



  const progress =
    getCourseProgress(
      course
    );



  // ========================================================
  // TEXTO
  // ========================================================

  const text =
    document.getElementById(
      "courseProgressText"
    );


  if (
    text
  ) {

    text.textContent =
      `${progress.completed} de ${progress.total} atividades concluídas`;

  }



  // ========================================================
  // PERCENTUAL
  // ========================================================

  const percentage =
    document.getElementById(
      "courseProgressPercentage"
    );


  if (
    percentage
  ) {

    percentage.textContent =
      `${progress.percentage}%`;

  }



  // ========================================================
  // BARRA
  // ========================================================

  const fill =
    document.getElementById(
      "courseProgressFill"
    );


  if (
    fill
  ) {

    fill.style.width =
      `${progress.percentage}%`;

  }



  // ========================================================
  // MENSAGEM DE CONCLUSÃO
  // ========================================================

  const completedMessage =
    document.getElementById(
      "courseCompletedMessage"
    );


  if (
    completedMessage
  ) {

    const finished =

      progress.total > 0

      &&

      progress.completed ===
      progress.total;


    if (
      finished
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

}



// ==========================================================
// ATUALIZAR RESUMO
// ==========================================================

function updateSummary() {

  if (
    !currentUser
  ) {

    return;

  }



  const userCourses =
    getUserCourses();



  // ========================================================
  // OBRIGATÓRIOS
  // ========================================================

  const mandatoryCourses =
    userCourses.filter(
      course =>
        course.requirement ===
        "Obrigatório"
    );



  // ========================================================
  // CONCLUÍDOS
  // ========================================================

  const completedCourses =
    userCourses.filter(
      course => {

        const progress =
          getCourseProgress(
            course
          );


        return (

          progress.total > 0

          &&

          progress.completed ===
          progress.total

        );

      }
    );



  // ========================================================
  // EM ANDAMENTO
  // ========================================================

  const inProgressCourses =
    userCourses.filter(
      course => {

        const progress =
          getCourseProgress(
            course
          );


        return (

          progress.completed > 0

          &&

          progress.completed <
          progress.total

        );

      }
    );



  // ========================================================
  // HORAS CONCLUÍDAS
  // ========================================================
  //
  // TEMPORÁRIO:
  //
  // Consideramos a carga horária completa
  // quando todas as atividades forem concluídas.
  //
  // Depois essa informação dependerá da aprovação
  // do Admin.
  //
  // ========================================================

  const totalCompletedHours =
    completedCourses.reduce(
      (
        total,
        course
      ) => {

        return (
          total +
          Number(
            course.hours || 0
          )
        );

      },
      0
    );



  // ========================================================
  // EXIBIR CONTADORES
  // ========================================================

  const mandatoryCount =
    document.getElementById(
      "mandatoryCount"
    );


  if (
    mandatoryCount
  ) {

    mandatoryCount.textContent =
      mandatoryCourses.length;

  }



  const inProgressCount =
    document.getElementById(
      "inProgressCount"
    );


  if (
    inProgressCount
  ) {

    inProgressCount.textContent =
      inProgressCourses.length;

  }



  const completedCount =
    document.getElementById(
      "completedCount"
    );


  if (
    completedCount
  ) {

    completedCount.textContent =
      completedCourses.length;

  }



  const totalHours =
    document.getElementById(
      "totalHours"
    );


  if (
    totalHours
  ) {

    totalHours.textContent =
      `${totalCompletedHours}h`;

  }

}



// ==========================================================
// AVISO DO MATERIAL
// ==========================================================
//
// Ainda não temos download real pelo Supabase Storage.
//
// ==========================================================

function showMaterialNotice(
  activityId
) {

  const course =
    courses.find(
      item =>
        String(item.id) ===
        String(currentCourseId)
    );


  if (
    !course
  ) {

    return;

  }



  const activity =
    course.activities.find(
      item =>
        String(item.id) ===
        String(activityId)
    );


  if (
    !activity
  ) {

    return;

  }



  if (
    !activity.resource
  ) {

    alert(
      "Nenhum material foi disponibilizado para esta atividade."
    );


    return;

  }



  alert(

    "Nesta etapa do projeto o material está registrado como:\n\n"

    +

    activity.resource

    +

    "\n\nO download real será conectado ao Supabase Storage posteriormente."

  );

}



// ==========================================================
// CLICAR FORA DO MODAL
// ==========================================================

const courseModal =
  document.getElementById(
    "courseModal"
  );


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
// LOGOUT
// ==========================================================
//
// Essa parte agora utiliza exatamente
// a mesma sessão usada na tela de Férias.
//
// ==========================================================

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


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



      // ====================================================
      // APAGAR SESSÃO
      // ====================================================

      clearSession();



      // ====================================================
      // VOLTAR AO LOGIN
      // ====================================================

      window.location.href =
        "/login/";

    }
  );

}



// ==========================================================
// INICIALIZAÇÃO
// ==========================================================
//
// FLUXO:
//
// /treinamentos/
//       ↓
// existe access_token?
//       ↓
// existe usuario_logado?
//       ↓
// perfil = colaborador?
//       ↓
// SIM
//       ↓
// mostra usuário real
//       ↓
// carrega cursos
//
// ==========================================================

async function initializeTrainingPage() {

  console.log(
    "Iniciando tela de Treinamentos..."
  );



  // ========================================================
  // VALIDAR SESSÃO
  // ========================================================

  const validSession =
    validateUserSession();


  if (
    !validSession
  ) {

    return;

  }



  // ========================================================
  // MOSTRAR USUÁRIO REAL
  // ========================================================

  renderCurrentUser();



  console.log(
    "Colaborador autenticado:",
    currentUser.name
  );


  console.log(
    "Setor do colaborador:",
    currentUser.sector
  );



  // ========================================================
  // CARREGAR CURSOS
  // ========================================================

  await loadCourses();



  console.log(
    "Tela de Treinamentos carregada com sucesso."
  );

}



// ==========================================================
// INICIAR QUANDO O HTML ESTIVER PRONTO
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeTrainingPage
);