// ==========================================================
// CONTROLE DAS ATIVIDADES CONCLUÍDAS
// ==========================================================

// Cada posição representa uma atividade.
//
// false = ainda não concluída
// true  = concluída

const completedActivities = {
  1: false,
  2: false,
  3: false,
  4: false
};


// ==========================================================
// ABRIR MODAL
// ==========================================================

function openCourseModal() {

  const modal =
    document.getElementById("courseModal");

  // Exibe o modal.
  modal.classList.add("show");

  // Evita que a página atrás do modal continue rolando.
  document.body.style.overflow = "hidden";
}


// ==========================================================
// FECHAR MODAL
// ==========================================================

function closeCourseModal() {

  const modal =
    document.getElementById("courseModal");

  modal.classList.remove("show");

  // Libera novamente a rolagem da página.
  document.body.style.overflow = "auto";
}


// ==========================================================
// QUANDO O USUÁRIO SELECIONA UM ARQUIVO
// ==========================================================

function handleFileUpload(input, activityId) {

  // Pegamos o primeiro arquivo selecionado.
  const file = input.files[0];

  // Caso nenhum arquivo tenha sido selecionado,
  // encerramos a função.
  if (!file) {
    return;
  }


  // Local onde será exibido o nome do arquivo.
  const uploadedFileContainer =
    document.getElementById(
      `uploadedFile${activityId}`
    );


  // Criamos visualmente o arquivo enviado.
  uploadedFileContainer.innerHTML = `

    <div class="uploaded-file-icon">

      <i class="fa-solid fa-file"></i>

    </div>


    <div class="uploaded-file-info">

      <strong>
        ${file.name}
      </strong>

      <span>
        Arquivo anexado com sucesso
      </span>

    </div>


    <button
      class="remove-file"
      onclick="removeFile(${activityId})"
      title="Remover arquivo"
    >

      <i class="fa-solid fa-trash"></i>

    </button>

  `;


  // Mostramos o arquivo.
  uploadedFileContainer.classList.add("show");


  // Marcamos a atividade como concluída.
  completedActivities[activityId] = true;


  // Atualizamos o visual da atividade.
  updateActivityStatus(activityId);


  // Atualizamos o progresso geral.
  updateCourseProgress();
}


// ==========================================================
// ATUALIZAR O STATUS VISUAL DA ATIVIDADE
// ==========================================================

function updateActivityStatus(activityId) {

  // Procuramos o card correspondente à atividade.
  const activityCard =
    document.querySelector(
      `[data-activity="${activityId}"]`
    );


  // Pegamos o texto de status.
  const status =
    activityCard.querySelector(
      ".activity-status"
    );


  if (completedActivities[activityId]) {

    // Adicionamos a classe que deixa o card verde.
    activityCard.classList.add("completed");

    // Alteramos o texto.
    status.textContent = "Concluída";

  } else {

    // Voltamos ao estado original.
    activityCard.classList.remove("completed");

    status.textContent = "Pendente";

  }

}


// ==========================================================
// REMOVER UM ARQUIVO
// ==========================================================

function removeFile(activityId) {

  // Pegamos o input correspondente.
  const input =
    document.getElementById(
      `file${activityId}`
    );


  // Removemos o arquivo selecionado.
  input.value = "";


  // Pegamos a área visual do arquivo.
  const uploadedFileContainer =
    document.getElementById(
      `uploadedFile${activityId}`
    );


  // Limpamos o conteúdo.
  uploadedFileContainer.innerHTML = "";


  // Escondemos novamente.
  uploadedFileContainer.classList.remove("show");


  // A atividade volta para pendente.
  completedActivities[activityId] = false;


  // Atualizamos o visual.
  updateActivityStatus(activityId);


  // Atualizamos o progresso.
  updateCourseProgress();
}


// ==========================================================
// CALCULAR PROGRESSO DO CURSO
// ==========================================================

function updateCourseProgress() {

  // Pegamos todas as atividades.
  const activities =
    Object.values(completedActivities);


  // Quantidade total.
  const totalActivities =
    activities.length;


  // Contamos quantas possuem valor true.
  const completed =
    activities.filter(
      activity => activity === true
    ).length;


  // Calculamos a porcentagem.
  const percentage =
    Math.round(
      (completed / totalActivities) * 100
    );


  // Atualizamos o texto.
  document.getElementById(
    "courseProgressText"
  ).textContent =
    `${completed} de ${totalActivities} atividades concluídas`;


  // Atualizamos porcentagem.
  document.getElementById(
    "courseProgressPercentage"
  ).textContent =
    `${percentage}%`;


  // Atualizamos a barra.
  document.getElementById(
    "courseProgressFill"
  ).style.width =
    `${percentage}%`;


  // Verificamos se o treinamento foi concluído.
  const completedMessage =
    document.getElementById(
      "courseCompletedMessage"
    );


  if (percentage === 100) {

    completedMessage.classList.add("show");

  } else {

    completedMessage.classList.remove("show");

  }

}


// ==========================================================
// FECHAR AO CLICAR FORA DO MODAL
// ==========================================================

const modalOverlay =
  document.getElementById("courseModal");


modalOverlay.addEventListener(
  "click",
  function (event) {

    // Só fechamos caso o usuário clique exatamente
    // na área escura externa.
    if (event.target === modalOverlay) {

      closeCourseModal();

    }

  }
);


// ==========================================================
// FECHAR MODAL COM ESC
// ==========================================================

document.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Escape") {

      closeCourseModal();

    }

  }
);