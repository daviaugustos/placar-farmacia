class PlacarFarmacia {
  constructor() {
    this.medicamentos = [
      "DesvenlafaxAnderson",
      "Renatril",
      "Karicicilina",
      "Jardenal",
      "DipiRonne",
      "Elietazepam",
      "Joycezumabe"
    ];

    this.progressoMedicamentos = {};
    this.medicamentos.forEach((med) => {
      this.progressoMedicamentos[med] = 0;
    });

    this.medicamentoSelecionado = this.medicamentos[0];
    this.metaGeralBase = 255; // 255 unidades = 98% para o medidor geral (meta da MCI)
    this.metaMedicamentoBase = 33; // 33 unidades = 90% para cada medicamento
    this.maximoTotal = 260; // 260 unidades = 100% para o medidor geral (estoque total)
    this.maximoMedicamento = 37; // 37 unidades = 100% para cada medicamento
    this.incremento = 1;

    // Cores específicas para cada medicamento
    this.coresMedicamentos = {
      DesvenlafaxAnderson: "#e91e63",
      Renatril: "#2196f3",
      Karicicilina: "#4caf50",
      Jardenal: "#ff9800",
      DipiRonne: "#9c27b0",
      Elietazepam: "#f44336",
      Joycezumabe: "#00bcd4"
    };

    // Rastrear estado das cores das cápsulas
    this.estadoBlister = {
      coresAtivas: [], // Array para armazenar as cores das cápsulas ativas
      cores: {} // Mapa para manter o controle das cores por índice
    };

    this.carregarDados(); // Carregar dados salvos
    this.inicializar();
  }

  inicializar() {
    this.configurarEventos();
    this.aplicarOrdemMedicamentos(); // Aplicar a ordem dos medicamentos no DOM
    this.atualizarDisplay();
    this.iniciarEsteira();
    this.atualizarSelecaoMedicamento();
  }

  aplicarOrdemMedicamentos() {
    // Aplicar a ordem dos medicamentos no DOM sem animação
    const container = document.querySelector(".medicamentos-container");
    if (!container) return;

    // Reordenar os elementos no DOM de acordo com a ordem em this.medicamentos
    this.medicamentos.forEach((nome) => {
      const box = container.querySelector(`[data-nome="${nome}"]`);
      if (box) {
        container.appendChild(box); // Move para o final (reordena)
      }
    });
  }

  configurarEventos() {
    document
      .getElementById("aumentar-btn")
      .addEventListener("click", () => this.aumentarMeta());
    document
      .getElementById("diminuir-btn")
      .addEventListener("click", () => this.diminuirMeta());
    document
      .getElementById("reset-btn")
      .addEventListener("click", () => this.resetarTodasMetas());
    document
      .getElementById("reset-individual-btn")
      .addEventListener("click", () => this.resetarMetaIndividual());
    document
      .getElementById("medicamento-select")
      .addEventListener("change", (e) => {
        this.medicamentoSelecionado = e.target.value;
        this.atualizarSelecaoMedicamento();
        this.salvarDados();
      });

    // Adicionar clique nas caixas dos medicamentos
    this.medicamentos.forEach((nome) => {
      const box = document.querySelector(`[data-nome="${nome}"]`);
      box.addEventListener("click", () => {
        this.medicamentoSelecionado = nome;
        document.getElementById("medicamento-select").value = nome;
        this.atualizarSelecaoMedicamento();
        this.salvarDados();
      });
    });
  }

  atualizarSelecaoMedicamento() {
    // Remover destaque de todas as caixas
    this.medicamentos.forEach((nome) => {
      const box = document.querySelector(`[data-nome="${nome}"]`);
      box.classList.remove("selected");
    });

    // Adicionar destaque à caixa selecionada
    const boxSelecionada = document.querySelector(
      `[data-nome="${this.medicamentoSelecionado}"]`
    );
    boxSelecionada.classList.add("selected");
  }

  aumentarMeta() {
    if (
      this.progressoMedicamentos[this.medicamentoSelecionado] < this.maximoTotal
    ) {
      this.progressoMedicamentos[this.medicamentoSelecionado] +=
        this.incremento;
      this.atualizarDisplay();
      this.adicionarCapsulasComValor(); // Adiciona a cápsula amarela
      this.adicionarEfeitoBrilho(
        document.querySelector(`[data-nome="${this.medicamentoSelecionado}"]`)
      );
      this.salvarDados(); // Salvar automaticamente
    }
  }

  diminuirMeta() {
    if (this.progressoMedicamentos[this.medicamentoSelecionado] > 0) {
      this.progressoMedicamentos[this.medicamentoSelecionado] -=
        this.incremento;
      this.atualizarDisplay();
      this.salvarDados(); // Salvar automaticamente
    }
  }

  resetarTodasMetas() {
    // Resetar o progresso de todos os medicamentos
    this.medicamentos.forEach((med) => {
      this.progressoMedicamentos[med] = 0;
    });

    // Resetar os indicadores de porcentagem
    const porcentagemSpans = document.querySelectorAll(".porcentagem");
    porcentagemSpans.forEach((span) => {
      span.textContent = "0 (0%)";
    });

    // Resetar as barras de progresso
    const barrasPreenchimento = document.querySelectorAll(
      ".barra-preenchimento"
    );
    barrasPreenchimento.forEach((barra) => {
      barra.style.width = "0%";
      barra.style.background = "linear-gradient(90deg, #ff9800, #f57c00)";
    });

    // Resetar o medidor geral
    const porcentagemGeral = document.getElementById("porcentagem-geral");
    if (porcentagemGeral) {
      porcentagemGeral.textContent = "0%";
    }

    // Resetar a barra de progresso geral
    const progressoFill = document.querySelector(".progress-fill");
    if (progressoFill) {
      progressoFill.style.width = "0%";
      progressoFill.style.background =
        "linear-gradient(90deg, #f44336, #ff9800)";
    }

    // Atualizar o display para garantir que tudo seja atualizado corretamente
    this.atualizarDisplay();

    // Salvar os dados resetados
    this.salvarDados();
  }

  resetarMetaIndividual() {
    this.progressoMedicamentos[this.medicamentoSelecionado] = 0;
    this.atualizarDisplay();
    this.salvarDados(); // Salvar automaticamente
  }

  calcularProgressoGeral() {
    const totalAtual = Object.values(this.progressoMedicamentos).reduce(
      (a, b) => a + b,
      0
    );
    // 255 = 98% (meta), 260 = 100% (estoque total)
    // Mostrar 98% quando atingir 255 medicamentos (meta da MCI)
    let progresso;
    if (totalAtual >= this.metaGeralBase) {
      // Se atingiu a meta (255), mostrar 98% + excedente proporcional
      const excedente = totalAtual - this.metaGeralBase;
      const percentualExcedente =
        (excedente / (this.maximoTotal - this.metaGeralBase)) * 2; // 2% de diferença entre meta e máximo
      progresso = 98 + percentualExcedente;
    } else {
      // Se ainda não atingiu a meta, calcular proporcionalmente até 98%
      progresso = (totalAtual / this.metaGeralBase) * 98;
    }
    return Math.min(Math.round(progresso * 100) / 100, 100); // Arredonda para 2 casas decimais
  }

  ordenarMedicamentosPorProgresso() {
    // Criar uma cópia dos medicamentos para ordenar
    const medicamentosOrdenados = [...this.medicamentos];

    // Ordenar por progresso (do maior para o menor)
    medicamentosOrdenados.sort((a, b) => {
      return this.progressoMedicamentos[b] - this.progressoMedicamentos[a];
    });

    // Se a ordem mudou, atualizar a ordem no DOM com animação
    if (
      JSON.stringify(medicamentosOrdenados) !==
      JSON.stringify(this.medicamentos)
    ) {
      const container = document.querySelector(".medicamentos-container");
      const boxes = Array.from(container.querySelectorAll(".medicamento-box"));

      // Guardar as posições atuais antes da reordenação
      const posicoes = {};
      boxes.forEach((box) => {
        const nome = box.getAttribute("data-nome");
        const rect = box.getBoundingClientRect();
        posicoes[nome] = { top: rect.top, left: rect.left };
      });

      // Reordenar os elementos no DOM
      medicamentosOrdenados.forEach((nome) => {
        const box = container.querySelector(`[data-nome="${nome}"]`);
        container.appendChild(box); // Move para o final (reordena)
      });

      // Aplicar animação de transição
      boxes.forEach((box) => {
        const nome = box.getAttribute("data-nome");
        const novaPos = box.getBoundingClientRect();
        const antigaPos = posicoes[nome];

        // Calcular o deslocamento
        const deltaX = antigaPos.left - novaPos.left;
        const deltaY = antigaPos.top - novaPos.top;

        // Aplicar animação FLIP (First-Last-Invert-Play)
        if (deltaX !== 0 || deltaY !== 0) {
          // Primeiro, posicionar no local antigo
          box.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          box.style.transition = "none";

          // Forçar reflow
          void box.offsetWidth;

          // Adicionar classe para destacar o item que está se movendo
          box.classList.add("movendo");

          // Animar para a nova posição
          box.style.transform = "";
          box.style.transition = "transform 0.5s ease-in-out";

          // Remover classe de destaque após a animação
          setTimeout(() => {
            box.classList.remove("movendo");
          }, 500);
        }
      });

      // Atualizar a ordem dos medicamentos na classe
      this.medicamentos = medicamentosOrdenados;
    }
  }

  atualizarDisplay() {
    // Atualizar medicamentos
    this.medicamentos.forEach((nome) => {
      const unidades = this.progressoMedicamentos[nome];
      let percentual;
      if (unidades >= 37) {
        percentual = 100;
      } else {
        percentual = (unidades / 37) * 100;
      }

      const box = document.querySelector(`[data-nome="${nome}"]`);
      const porcentagemSpan = box.querySelector(".porcentagem");
      const barraPreenchimento = box.querySelector(".barra-preenchimento");

      // Limpar qualquer conteúdo anterior
      porcentagemSpan.innerHTML = "";

      // Mostrar apenas a quantidade (sem porcentagem)
      porcentagemSpan.textContent = unidades;
      barraPreenchimento.style.width = percentual + "%";

      // Mudar cor da barra se passou da meta
      if (unidades > this.metaMedicamentoBase) {
        barraPreenchimento.style.background =
          "linear-gradient(90deg, #ff9800, #f57c00)";
      } else {
        barraPreenchimento.style.background =
          "linear-gradient(90deg, #4caf50, #8bc34a)";
      }
    });

    // Calcular progresso geral
    const progresso = this.calcularProgressoGeral();

    // Atualizar a porcentagem geral no cabeçalho do blister
    const porcentagemGeral = document.getElementById("porcentagem-geral");
    if (porcentagemGeral) {
      porcentagemGeral.textContent = `${Math.round(progresso)}%`;
    }

    // Atualizar a barra de progresso
    const progressoFill = document.querySelector(".progress-fill");
    if (progressoFill) {
      progressoFill.style.width = `${progresso}%`;

      // Atualizar a cor da barra com base no progresso
      if (progresso < 50) {
        progressoFill.style.background =
          "linear-gradient(90deg, #f44336, #ff9800)";
      } else if (progresso < 90) {
        progressoFill.style.background =
          "linear-gradient(90deg, #ff9800, #ffeb3b)";
      } else {
        progressoFill.style.background =
          "linear-gradient(90deg, #4caf50, #8bc34a)";
      }
    }

    // Atualizar os indicadores de porcentagem
    this.atualizarIndicadoresPorcentagem(progresso);

    // Atualizar o blíster
    this.atualizarBlisterPills(progresso);

    // Adicionar efeito especial quando atinge a meta geral (98%)
    if (progresso >= 98) {
      this.celebrarMeta();
    }

    // Restaurar medicamento selecionado no dropdown
    document.getElementById("medicamento-select").value =
      this.medicamentoSelecionado;

    // Ordenar medicamentos por progresso
    this.ordenarMedicamentosPorProgresso();
  }

  celebrarMeta() {
    // Adicionar classe de animação ao blíster
    const blister = document.querySelector(".blister");
    if (blister) {
      blister.classList.add("meta-atingida");

      // Remover a classe após a animação
      setTimeout(() => {
        blister.classList.remove("meta-atingida");
      }, 2000);
    }

    // Adicionar algumas cápsulas douradas para celebrar
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.criarCapsulaDourada();
      }, i * 300);
    }
  }

  adicionarEfeitoBrilho(elemento) {
    elemento.style.animation = "none";
    elemento.offsetHeight; // Trigger reflow
    elemento.style.animation = "fadeInUp 0.5s ease";

    setTimeout(() => {
      elemento.style.animation = "";
    }, 500);
  }

  iniciarEsteira() {
    // Adicionar a primeira cápsula imediatamente
    this.adicionarCapsulaContinuamente();

    // Configurar o intervalo para adicionar cápsulas continuamente
    setInterval(() => {
      this.adicionarCapsulaContinuamente();
    }, 3000); // 1 cápsula a cada 3 segundos
  }

  adicionarCapsulaContinuamente() {
    // Escolher um medicamento aleatório para a cor da cápsula
    const medicamentos = Object.keys(this.coresMedicamentos);
    const medicamentoAleatorio =
      medicamentos[Math.floor(Math.random() * medicamentos.length)];
    const corMedicamento = this.coresMedicamentos[medicamentoAleatorio];

    // Adicionar uma cápsula com a cor do medicamento aleatório
    this.criarCapsula(false, corMedicamento);
  }

  adicionarCapsulasComValor() {
    // Adicionar uma cápsula com a cor do medicamento selecionado
    const corMedicamento = this.coresMedicamentos[this.medicamentoSelecionado];
    this.criarCapsula(true, corMedicamento);
  }

  criarCapsula(comValor = false, corPersonalizada = null) {
    const esteira = document.getElementById("esteira-track");
    const capsula = document.createElement("div");

    // Usar cor personalizada ou cor do medicamento selecionado
    let corMedicamento;

    if (corPersonalizada) {
      // Se uma cor personalizada foi especificada, use-a
      corMedicamento = corPersonalizada;
    } else {
      // Se não houver cor personalizada, usar a cor do medicamento selecionado
      corMedicamento = this.coresMedicamentos[this.medicamentoSelecionado];
    }

    const corEscura = this.escurecerCor(corMedicamento, 20);
    const corClara = this.clarearCor(corMedicamento, 20);

    // Estilos da cápsula (vertical)
    Object.assign(capsula.style, {
      position: "absolute",
      width: "24px",
      height: "48px",
      background: `linear-gradient(135deg, ${corClara}, ${corMedicamento} 30%, ${corEscura} 70%)`,
      border: `2px solid ${corEscura}`,
      borderRadius: "15px 15px 8px 8px",
      top: `${30 + Math.random() * 40}%`,
      left: "-50px",
      transform: "translateY(-50%) rotate(0deg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold",
      fontSize: "0.8rem",
      boxShadow: `0 4px 15px ${this.hexToRgba(corMedicamento, 0.3)}`,
      zIndex: "10",
      willChange: "transform, opacity",
      transformOrigin: "center center",
      transition: "all 0.1s ease-out",
      cursor: "pointer"
    });

    // Adicionar efeito de brilho no topo da cápsula
    const topoBrilhante = document.createElement("div");
    topoBrilhante.style.position = "absolute";
    topoBrilhante.style.top = "0";
    topoBrilhante.style.left = "0";
    topoBrilhante.style.right = "0";
    topoBrilhante.style.height = "50%";
    topoBrilhante.style.background =
      "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))";
    topoBrilhante.style.borderRadius = "12px 12px 0 0";
    capsula.appendChild(topoBrilhante);

    // Adicionar efeito de sombra interna
    const sombraInterna = document.createElement("div");
    sombraInterna.style.position = "absolute";
    sombraInterna.style.top = "0";
    sombraInterna.style.left = "0";
    sombraInterna.style.right = "0";
    sombraInterna.style.bottom = "0";
    sombraInterna.style.borderRadius = "12px";
    sombraInterna.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.2)";
    sombraInterna.style.pointerEvents = "none";
    capsula.appendChild(sombraInterna);

    // Adicionar conteúdo da cápsula
    const conteudo = document.createElement("div");
    conteudo.style.position = "relative";
    conteudo.style.zIndex = "2";

    if (comValor) {
      const valorAtual =
        this.progressoMedicamentos[this.medicamentoSelecionado];
      conteudo.textContent = valorAtual;
      conteudo.style.fontSize = "0.9rem";
      conteudo.style.textShadow = "0 1px 2px rgba(0,0,0,0.5)";
    }

    capsula.appendChild(conteudo);

    // Efeito de hover
    capsula.addEventListener("mouseenter", () => {
      capsula.style.transform = `translateX(${
        parseFloat(capsula.style.left) + 5
      }px) translateY(-50%) scale(1.1)`;
      capsula.style.boxShadow = `0 6px 20px ${this.hexToRgba(
        corMedicamento,
        0.5
      )}`;
    });

    capsula.addEventListener("mouseleave", () => {
      capsula.style.transform = `translateX(${parseFloat(
        capsula.style.left
      )}px) translateY(-50%) scale(1)`;
      capsula.style.boxShadow = `0 4px 15px ${this.hexToRgba(
        corMedicamento,
        0.3
      )}`;
    });

    // Adicionar a cápsula à esteira
    esteira.appendChild(capsula);

    // Forçar reflow para garantir que a animação funcione
    void capsula.offsetWidth;

    // Configurar animação
    const duracao = 8000 + Math.random() * 4000; // Entre 8 e 12 segundos
    const atraso = Math.random() * 500; // Pequeno atraso aleatório

    // Iniciar animação após um pequeno atraso
    setTimeout(() => {
      const esteiraWidth = esteira.offsetWidth;
      const posicaoInicial = -50; // Começa fora da tela à esquerda
      const posicaoFinal = esteiraWidth + 50; // Termina fora da tela à direita

      // Usar requestAnimationFrame para animação suave
      let startTime = null;

      const animar = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progresso = (timestamp - startTime) / duracao;

        if (progresso < 1) {
          // Aplicar movimento de vaivém vertical suave
          const posY = Math.sin(progresso * Math.PI * 4) * 5; // Movimento de vaivém
          const posX =
            posicaoInicial + (posicaoFinal - posicaoInicial) * progresso;
          const rotacao = Math.sin(progresso * Math.PI * 8) * 5; // Pequena rotação

          capsula.style.left = `${posX}px`;
          capsula.style.transform = `translateY(calc(-50% + ${posY}px)) rotate(${rotacao}deg)`;

          // Continuar a animação
          requestAnimationFrame(animar);
        } else {
          // Remover cápsula após a animação
          if (capsula.parentNode) {
            capsula.parentNode.removeChild(capsula);
          }
        }
      };

      // Iniciar animação
      requestAnimationFrame(animar);
    }, atraso);

    // Remover cápsula após um tempo máximo (caso a animação não termine corretamente)
    setTimeout(() => {
      if (capsula.parentNode) {
        capsula.parentNode.removeChild(capsula);
      }
    }, duracao + atraso + 1000);
  }

  criarCapsulaDourada() {
    const esteira = document.getElementById("esteira-track");
    const capsula = document.createElement("div");
    capsula.className = "capsula";
    capsula.style.background = "linear-gradient(180deg, #ffd700, #ffb300)";
    capsula.style.borderColor = "#ff8f00";
    capsula.style.boxShadow = "0 4px 20px rgba(255, 215, 0, 0.7)";
    capsula.textContent = "★";
    capsula.style.fontSize = "1rem";

    esteira.appendChild(capsula);

    // Remover cápsula após a animação
    setTimeout(() => {
      if (capsula.parentNode) {
        capsula.parentNode.removeChild(capsula);
      }
    }, 8000);
  }

  salvarDados() {
    // Salvar os dados no localStorage
    const dados = {
      progressoMedicamentos: this.progressoMedicamentos,
      medicamentoSelecionado: this.medicamentoSelecionado,
      estadoBlister: this.estadoBlister,
      // Salvar também a ordem dos medicamentos para manter o ranking
      medicamentos: this.medicamentos
    };

    try {
      localStorage.setItem("placarFarmacia", JSON.stringify(dados));
      console.log("Dados salvos com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar dados:", e);
    }
  }

  carregarDados() {
    const dadosSalvos = localStorage.getItem("placarFarmacia");
    if (dadosSalvos) {
      try {
        const dados = JSON.parse(dadosSalvos);

        // Carregar progresso dos medicamentos
        if (dados.progressoMedicamentos) {
          Object.keys(dados.progressoMedicamentos).forEach((medicamento) => {
            if (this.medicamentos.includes(medicamento)) {
              this.progressoMedicamentos[medicamento] =
                dados.progressoMedicamentos[medicamento];
            }
          });
        }

        // Carregar medicamento selecionado
        if (
          dados.medicamentoSelecionado &&
          this.medicamentos.includes(dados.medicamentoSelecionado)
        ) {
          this.medicamentoSelecionado = dados.medicamentoSelecionado;
          const select = document.getElementById("medicamento-select");
          if (select) select.value = this.medicamentoSelecionado;
        }

        // Carregar estado do blister se existir
        if (dados.estadoBlister) {
          this.estadoBlister = dados.estadoBlister;
        }

        // Carregar a ordem dos medicamentos (ranking)
        if (dados.medicamentos && Array.isArray(dados.medicamentos)) {
          // Verificar se todos os medicamentos estão presentes
          const todosMedicamentosPresentes = dados.medicamentos.every((med) =>
            this.medicamentos.includes(med)
          );

          // Verificar se o tamanho é o mesmo
          if (
            todosMedicamentosPresentes &&
            dados.medicamentos.length === this.medicamentos.length
          ) {
            this.medicamentos = dados.medicamentos;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar dados salvos:", e);
      }
    }
  }

  // Atualizar os comprimidos do blíster
  atualizarBlisterPills(progressoGeral) {
    const blisterPills = document.getElementById("blister-pills");
    if (!blisterPills) return;

    // Limpar comprimidos existentes
    blisterPills.innerHTML = "";

    // Total de comprimidos no blíster (2 colunas x 7 linhas = 14 comprimidos)
    const totalComprimidos = 14;
    const totalLinhas = 7; // 7 linhas de 2 comprimidos cada

    // Cada linha corresponde a 14% do progresso total (cada mês representa 14%)
    const progressoPorLinha = 14.0; // 14% por linha

    // Calcular linhas completas baseado no progresso (1 linha a cada 14%)
    const linhasCompletas = Math.floor(progressoGeral / progressoPorLinha);

    // Calcular preenchimento na última linha parcialmente preenchida
    const progressoUltimaLinha =
      ((progressoGeral % progressoPorLinha) / progressoPorLinha) * 100;

    // Converter para comprimidos cheios (2 por linha)
    const comprimidosCheios = Math.min(linhasCompletas * 2, totalComprimidos);

    // Se estamos na última linha, calculamos o progresso para cada comprimido
    let progressoComprimido1 = 0;
    let progressoComprimido2 = 0;

    if (linhasCompletas < totalLinhas) {
      if (progressoUltimaLinha <= 50) {
        // Preencher só o primeiro comprimido da linha parcialmente
        progressoComprimido1 = progressoUltimaLinha * 2; // dobra o valor para escalar de 0-50% para 0-100%
        progressoComprimido2 = 0;
      } else {
        // Primeiro comprimido completo, segundo parcial
        progressoComprimido1 = 100;
        progressoComprimido2 = (progressoUltimaLinha - 50) * 2; // escala de 50-100% para 0-100%
      }
    }

    // Limpar estado de cápsulas que não devem estar preenchidas
    // Com o novo sistema baseado em linhas
    for (let i = 0; i < totalComprimidos; i++) {
      // Calcular a linha e posição invertida (de baixo para cima)
      const linhaAtual = Math.floor((totalComprimidos - i - 1) / 2);
      const indiceNaLinha = (totalComprimidos - i - 1) % 2;

      if (linhaAtual >= totalLinhas - linhasCompletas) {
        // Está em linha completamente preenchida
        continue;
      } else if (linhaAtual === totalLinhas - linhasCompletas - 1) {
        // Está na linha parcialmente preenchida
        if (indiceNaLinha === 0 && progressoComprimido2 > 0) continue;
        if (indiceNaLinha === 1 && progressoComprimido1 > 0) continue;
      } else {
        // Está em uma linha que não deve ter nenhum preenchimento
      }

      delete this.estadoBlister.cores[i];
    }

    // Atualizar o array de cores ativas
    this.estadoBlister.coresAtivas = [];

    // Criar linhas com 2 comprimidos cada
    const rows = [];
    for (let i = 0; i < totalComprimidos; i += 2) {
      const row = document.createElement("div");
      row.className = "pill-row";

      // Índices normais (0 a 9)
      const indice1 = i;
      const indice2 = i + 1;

      // Calcular linha atual (de cima para baixo, 0-4)
      const numeroLinha = Math.floor(i / 2);

      // Calcular linha invertida (de baixo para cima, 0-4)
      const linhaInvertida = totalLinhas - numeroLinha - 1;

      // Determinar preenchimento com base na linha
      let preenchimento1 = 0;
      let preenchimento2 = 0;

      if (linhaInvertida < linhasCompletas) {
        // Linha completa
        preenchimento1 = 100;
        preenchimento2 = 100;
      } else if (linhaInvertida === linhasCompletas) {
        // Linha parcial - usar os valores calculados anteriormente
        preenchimento1 = progressoComprimido1;
        preenchimento2 = progressoComprimido2;
      }

      // Criar primeiro comprimido da linha
      this.criarCapsulaBlister(
        row,
        indice1,
        preenchimento1 > 0, // está ativa se tiver algum preenchimento
        preenchimento1
      );

      // Segundo comprimido da linha (se existir)
      if (indice2 < totalComprimidos) {
        this.criarCapsulaBlister(
          row,
          indice2,
          preenchimento2 > 0, // está ativa se tiver algum preenchimento
          preenchimento2
        );
      }

      rows.push(row);
    }

    // Adicionar linhas ao blister na ordem normal (cima para baixo)
    rows.forEach((row) => {
      blisterPills.appendChild(row);
    });
  }

  // Cria uma cápsula no blíster
  criarCapsulaBlister(container, indice, estaCheia, progresso) {
    const pill = document.createElement("div");

    // Definir classe base e adicionar 'active' apenas se estiver preenchida
    pill.className = "pill" + (progresso > 0 ? " active" : "");

    // Se não estiver preenchida, adicionar classe para forçar o cinza
    if (progresso <= 0) {
      pill.classList.add("vazia");
    }

    // Cores fixas
    const corCheia = "#4caf50"; // Verde para cápsulas preenchidas
    const corVazia = "#e0e0e0"; // Cinza para cápsulas vazias
    const corBorda = "#d0d0d0"; // Borda mais escura para cápsulas vazias
    const corEscura = this.escurecerCor(corCheia, 20);

    // Criar fundo da cápsula (sempre transparente/branco para mostrar que está vazia)
    const fundo = document.createElement("div");
    fundo.className = "pill-fundo";
    fundo.style.position = "absolute";
    fundo.style.top = "0";
    fundo.style.left = "0";
    fundo.style.width = "100%";
    fundo.style.height = "100%";
    fundo.style.background = "rgba(255, 255, 255, 0.9)";
    fundo.style.borderRadius = "15px";
    fundo.style.border = `2px solid ${corBorda}`;
    pill.appendChild(fundo);

    // Criar preenchimento da cápsula (verde para a parte preenchida)
    if (progresso > 0) {
      const preenchimento = document.createElement("div");
      preenchimento.className = "pill-preenchimento";
      preenchimento.style.position = "absolute";
      preenchimento.style.top = "0";
      preenchimento.style.left = "0";
      preenchimento.style.width = progresso + "%";
      preenchimento.style.height = "100%";
      preenchimento.style.background = `linear-gradient(135deg, ${corCheia}, ${corEscura})`;
      preenchimento.style.borderRadius = "13px 0 0 13px";
      preenchimento.style.overflow = "hidden";
      preenchimento.style.transition = "width 0.3s ease";

      // Adicionar efeito de brilho apenas na parte colorida
      const brilho = document.createElement("div");
      brilho.className = "pill-brilho";
      brilho.style.width = "40%";
      preenchimento.appendChild(brilho);
      pill.appendChild(preenchimento);
    }

    // Adicionar texto apenas se estiver cheia
    // Removido texto META conforme solicitado pelo cliente

    container.appendChild(pill);
  }

  // Atualiza os indicadores de porcentagem
  atualizarIndicadoresPorcentagem(progresso) {
    // Buscar todos os indicadores de porcentagem
    const indicadores = document.querySelectorAll(".percentage-indicator");

    // Remover classe ativa de todos os indicadores
    indicadores.forEach((indicador) => {
      indicador.classList.remove("active");
      indicador.style.fontWeight = "normal";
      indicador.style.color = "#666";
    });

    // Destacar os indicadores adequados baseados no progresso atual
    indicadores.forEach((indicador) => {
      const valor = parseInt(indicador.getAttribute("data-value"));

      // Se o progresso for maior ou igual ao valor do indicador, destaque-o
      if (progresso >= valor) {
        indicador.classList.add("active");
        indicador.style.fontWeight = "bold";
        indicador.style.color = "#4caf50";
      }

      // Destacar o indicador mais próximo abaixo do progresso atual
      if (
        progresso < valor &&
        !document.querySelector(".percentage-indicator.next-target")
      ) {
        const indicadores = Array.from(
          document.querySelectorAll(".percentage-indicator")
        );
        const indicadoresAbaixo = indicadores.filter(
          (ind) => parseInt(ind.getAttribute("data-value")) > progresso
        );

        if (indicadoresAbaixo.length > 0) {
          const proximoIndicador = indicadoresAbaixo.reduce((prev, curr) => {
            return parseInt(curr.getAttribute("data-value")) <
              parseInt(prev.getAttribute("data-value"))
              ? curr
              : prev;
          });

          proximoIndicador.classList.add("next-target");
          proximoIndicador.style.borderLeftStyle = "solid";
        }
      }
    });
  }

  // Funções auxiliares para manipulação de cores
  escurecerCor(hex, porcentagem) {
    // Remove o # do início, se existir
    hex = hex.replace(/^#/, "");

    // Converte para valores RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Escurece a cor
    const escurecer = (c) =>
      Math.max(0, Math.min(255, Math.round((c * (100 - porcentagem)) / 100)));

    const novoR = escurecer(r);
    const novoG = escurecer(g);
    const novoB = escurecer(b);

    // Converte de volta para hex
    return `#${((novoR << 16) | (novoG << 8) | novoB)
      .toString(16)
      .padStart(6, "0")}`;
  }

  clarearCor(hex, porcentagem) {
    // Remove o # do início, se existir
    hex = hex.replace(/^#/, "");

    // Converte para valores RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Clareia a cor
    const clarear = (c) =>
      Math.max(
        0,
        Math.min(255, Math.round(c + (255 - c) * (porcentagem / 100)))
      );

    const novoR = clarear(r);
    const novoG = clarear(g);
    const novoB = clarear(b);

    // Converte de volta para hex
    return `#${((novoR << 16) | (novoG << 8) | novoB)
      .toString(16)
      .padStart(6, "0")}`;
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

// Inicializar o placar quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  window.placarInstance = new PlacarFarmacia();
});
