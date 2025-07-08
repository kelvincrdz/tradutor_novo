// tts.js
// Controle do TTS usando Web Speech API com melhorias e correções

// Objeto global do TTS com melhor estrutura
var_objetoTTS = {
  sintetizador: null,
  listaVozes: [],
  vozAtual: null,
  velocidade: 1,
  tom: 1,
  volume: 1,
  pausaFrase: 400,
  simbolosPausa: '.?!',
  leituraEmAndamento: false,
  leituraPausada: false,
  callbackAtual: null,
  timeoutAtual: null,
  
  // Inicializar sintetizador
  inicializar() {
    if (typeof speechSynthesis !== 'undefined') {
      this.sintetizador = window.speechSynthesis;
      this.configurarEventListeners();
      return true;
    }
    console.error('Web Speech API não disponível neste navegador');
    return false;
  },
  
  // Configurar listeners de eventos
  configurarEventListeners() {
    if (!this.sintetizador) return;
    
    this.sintetizador.addEventListener('end', () => {
      this.leituraEmAndamento = false;
      this.leituraPausada = false;
      if (this.callbackAtual) {
        this.callbackAtual();
        this.callbackAtual = null;
      }
    });
    
    this.sintetizador.addEventListener('cancel', () => {
      this.leituraEmAndamento = false;
      this.leituraPausada = false;
      this.callbackAtual = null;
      limparHighlight();
    });
    
    this.sintetizador.addEventListener('error', (event) => {
      console.error('Erro no TTS:', event.error);
      this.leituraEmAndamento = false;
      this.leituraPausada = false;
      this.callbackAtual = null;
      limparHighlight();
      mostrarNotificacao('Erro na leitura de áudio', 'error');
    });
    
    this.sintetizador.addEventListener('pause', () => {
      this.leituraPausada = true;
    });
    
    this.sintetizador.addEventListener('resume', () => {
      this.leituraPausada = false;
    });
  },
  
  // Definir configurações
  definirVelocidade(valor) {
    this.velocidade = parseFloat(valor);
    this.sincronizarControles();
  },
  
  definirTom(valor) {
    this.tom = parseFloat(valor);
    this.sincronizarControles();
  },
  
  definirVolume(valor) {
    this.volume = parseFloat(valor);
    this.sincronizarControles();
  },
  
  definirPausaFrase(valor) {
    this.pausaFrase = parseInt(valor);
  },
  
  definirSimbolosPausa(valor) {
    this.simbolosPausa = valor.replace(/\s+/g, '');
  },
  
  // Sincronizar controles
  sincronizarControles() {
    // Controles do leitor principal
    const controleVelocidade = document.getElementById('controle_velocidade');
    const valorVelocidade = document.getElementById('valor_velocidade');
    const controleTom = document.getElementById('controle_tom');
    const valorTom = document.getElementById('valor_tom');
    const controleVolume = document.getElementById('controle_volume');
    const valorVolume = document.getElementById('valor_volume');
    
    if (controleVelocidade && valorVelocidade) {
      controleVelocidade.value = this.velocidade;
      valorVelocidade.textContent = this.velocidade.toFixed(1);
    }
    
    if (controleTom && valorTom) {
      controleTom.value = this.tom;
      valorTom.textContent = this.tom.toFixed(1);
    }
    
    if (controleVolume && valorVolume) {
      controleVolume.value = this.volume;
      valorVolume.textContent = this.volume.toFixed(1);
    }
    
    // Controles do player TTS
    const speedControl = document.getElementById('speedControl');
    const speedControlValue = document.getElementById('speedControlValue');
    const pitchControl = document.getElementById('pitchControl');
    const pitchControlValue = document.getElementById('pitchControlValue');
    const volumeControl = document.getElementById('volumeControl');
    const volumeControlValue = document.getElementById('volumeControlValue');
    
    if (speedControl && speedControlValue) {
      speedControl.value = this.velocidade;
      speedControlValue.textContent = this.velocidade.toFixed(1);
    }
    
    if (pitchControl && pitchControlValue) {
      pitchControl.value = this.tom;
      pitchControlValue.textContent = this.tom.toFixed(1);
    }
    
    if (volumeControl && volumeControlValue) {
      volumeControl.value = this.volume;
      volumeControlValue.textContent = this.volume.toFixed(1);
    }
  },

  updatePauseControl() {
    if (this.pauseControl && typeof var_objetoTTS !== 'undefined') {
      const pauseValue = parseInt(this.pauseControl.value);
      var_objetoTTS.definirPausaFrase(pauseValue);
      // Salvar no localStorage
      localStorage.setItem('ttsPauseValue', pauseValue);
      console.log('Pausa entre frases alterada para:', pauseValue + 'ms');
    }
  }
};

// Adicionar flag para controlar se a voz foi selecionada manualmente
var vozSelecionadaManual = false;

// Flag para controlar se está lendo
var leituraEmAndamento = false;

// Função para detectar idioma sem mudar a voz automaticamente
function detectarIdioma(texto) {
  if (!texto) return 'pt-BR';
  
  // Análise simples baseada em caracteres comuns
  const caracteresPortugues = /[áàâãéèêíìîóòôõúùûç]/gi;
  const caracteresIngleses = /[a-z]/gi;
  
  const portugues = (texto.match(caracteresPortugues) || []).length;
  const ingles = (texto.match(caracteresIngleses) || []).length;
  
  if (portugues > ingles * 0.1) {
    return 'pt-BR';
  } else if (ingles > 0) {
    return 'en-US';
  }
  
  return 'pt-BR'; // Padrão
}

function selecionarVozPorIdioma(idioma) {
  // Só selecionar voz automaticamente se não foi selecionada manualmente
  if (vozSelecionadaManual) return;
  
  if (!var_objetoTTS.listaVozes.length) return;
  
  // Procurar por voz específica do idioma
  let voz = var_objetoTTS.listaVozes.find(v => v.lang && v.lang.startsWith(idioma));
  
  // Se não encontrar, procurar por qualquer voz do idioma
  if (!voz) {
    voz = var_objetoTTS.listaVozes.find(v => v.lang && v.lang.includes(idioma.split('-')[0]));
  }
  
  // Se ainda não encontrar, usar a primeira voz disponível
  if (!voz && var_objetoTTS.listaVozes.length > 0) {
    voz = var_objetoTTS.listaVozes[0];
  }
  
  if (voz) {
    var_objetoTTS.vozAtual = voz;
    atualizarSeletoresVoz();
  }
}

// Remover listeners antigos - agora gerenciados pelo objeto var_objetoTTS

function inicializarTTS() {
  // Inicializar sintetizador
  if (!var_objetoTTS.inicializar()) {
    mostrarNotificacao('TTS não disponível neste navegador', 'error');
    return;
  }
  
  // Carregar vozes
  carregarVozesTTS();
  
  // Configurar controles do leitor principal
  const seletorVoz = document.getElementById('seletor_voz');
  const botaoTesteVoz = document.getElementById('botao_teste_voz');
  const controleVelocidade = document.getElementById('controle_velocidade');
  const controleTom = document.getElementById('controle_tom');
  const controleVolume = document.getElementById('controle_volume');
  const botaoIniciarLeitura = document.getElementById('botao_iniciar_leitura');
  const botaoPausarLeitura = document.getElementById('botao_pausar_leitura');
  const botaoPararLeitura = document.getElementById('botao_parar_leitura');

  if (seletorVoz) seletorVoz.addEventListener('change', selecionarVozTTS);
  if (botaoTesteVoz) botaoTesteVoz.addEventListener('click', testarVozTTS);
  if (controleVelocidade) controleVelocidade.addEventListener('input', ajustarVelocidadeTTS);
  if (controleTom) controleTom.addEventListener('input', ajustarTomTTS);
  if (controleVolume) controleVolume.addEventListener('input', ajustarVolumeTTS);
  if (botaoIniciarLeitura) botaoIniciarLeitura.addEventListener('click', iniciarLeituraCapituloAtualETTS);
  if (botaoPausarLeitura) botaoPausarLeitura.addEventListener('click', pausarLeituraTTS);
  if (botaoPararLeitura) botaoPararLeitura.addEventListener('click', pararLeituraTTS);
  
  // Inicializar funcionalidade de toggle dos controles
  inicializarToggleTTS();
  
  // Sincronizar controles
  var_objetoTTS.sincronizarControles();
  
  console.log('TTS inicializado com sucesso');
}

function carregarVozesTTS() {
  if (!var_objetoTTS.sintetizador) return;
  
  // Tentar carregar vozes imediatamente
  var_objetoTTS.listaVozes = var_objetoTTS.sintetizador.getVoices();
  
  // Se não há vozes, aguardar o evento onvoiceschanged
  if (var_objetoTTS.listaVozes.length === 0) {
    var_objetoTTS.sintetizador.onvoiceschanged = () => {
      var_objetoTTS.listaVozes = var_objetoTTS.sintetizador.getVoices();
      preencherSeletoresVoz();
    };
  } else {
    preencherSeletoresVoz();
  }
}

function preencherSeletoresVoz() {
  // Preencher seletor do leitor principal
  const seletor = document.getElementById('seletor_voz');
  if (seletor) {
    seletor.innerHTML = '';
    var_objetoTTS.listaVozes.forEach((voz, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${voz.name} (${voz.lang || 'N/A'})`;
      seletor.appendChild(opt);
    });
    
    // Carregar voz salva ou selecionar a primeira
    const savedVoice = localStorage.getItem('ttsSelectedVoice');
    if (savedVoice && var_objetoTTS.listaVozes.length > 0) {
      const voiceIndex = parseInt(savedVoice);
      if (voiceIndex >= 0 && voiceIndex < var_objetoTTS.listaVozes.length) {
        seletor.selectedIndex = voiceIndex;
        var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[voiceIndex];
        vozSelecionadaManual = true;
      } else {
        seletor.selectedIndex = 0;
        var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[0];
        vozSelecionadaManual = false;
      }
    } else if (var_objetoTTS.listaVozes.length > 0) {
      seletor.selectedIndex = 0;
      var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[0];
      vozSelecionadaManual = false;
    }
  }
  
  // Preencher seletor do player TTS
  const voiceSelect = document.getElementById('voiceSelect');
  if (voiceSelect) {
    voiceSelect.innerHTML = '';
    var_objetoTTS.listaVozes.forEach((voz, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${voz.name} (${voz.lang || 'N/A'})`;
      voiceSelect.appendChild(opt);
    });
    
    // Carregar voz salva ou selecionar a primeira
    const savedVoice = localStorage.getItem('ttsSelectedVoice');
    if (savedVoice && var_objetoTTS.listaVozes.length > 0) {
      const voiceIndex = parseInt(savedVoice);
      if (voiceIndex >= 0 && voiceIndex < var_objetoTTS.listaVozes.length) {
        voiceSelect.selectedIndex = voiceIndex;
        var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[voiceIndex];
        vozSelecionadaManual = true;
      } else {
        voiceSelect.selectedIndex = 0;
        var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[0];
        vozSelecionadaManual = false;
      }
    } else if (var_objetoTTS.listaVozes.length > 0) {
      voiceSelect.selectedIndex = 0;
      var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[0];
      vozSelecionadaManual = false;
    }
  }
  
  console.log(`${var_objetoTTS.listaVozes.length} vozes carregadas`);
}

function atualizarSeletoresVoz() {
  if (!var_objetoTTS.vozAtual) return;
  
  const seletor = document.getElementById('seletor_voz');
  const voiceSelect = document.getElementById('voiceSelect');
  
  const indice = var_objetoTTS.listaVozes.indexOf(var_objetoTTS.vozAtual);
  
  if (seletor && indice >= 0) {
    seletor.value = indice;
  }
  
  if (voiceSelect && indice >= 0) {
    voiceSelect.value = indice;
  }
}

function selecionarVozTTS() {
  const seletor = document.getElementById('seletor_voz');
  if (!seletor) return;
  
  const idx = parseInt(seletor.value);
  if (idx >= 0 && idx < var_objetoTTS.listaVozes.length) {
    var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[idx];
    vozSelecionadaManual = true;
    atualizarSeletoresVoz();
    
    // Salvar a seleção no localStorage
    localStorage.setItem('ttsSelectedVoice', idx);
    
    // Se estiver lendo, aplicar a nova voz imediatamente sem parar
    if (var_objetoTTS.sintetizador && var_objetoTTS.sintetizador.speaking) {
      // Aplicar a nova voz ao próximo trecho que será lido
      // Não cancelar a leitura atual, apenas atualizar a configuração
      console.log('Voz alterada em tempo real para:', var_objetoTTS.vozAtual.name);
    }
  }
}

function testarVozTTS() {
  if (!var_objetoTTS.vozAtual) {
    mostrarNotificacao('Nenhuma voz selecionada', 'error');
    return;
  }
  
  const fala = new SpeechSynthesisUtterance('Esta é uma amostra da voz selecionada para teste.');
  fala.voice = var_objetoTTS.vozAtual;
  fala.rate = var_objetoTTS.velocidade;
  fala.pitch = var_objetoTTS.tom;
  fala.volume = var_objetoTTS.volume;
  
  var_objetoTTS.sintetizador.cancel();
  var_objetoTTS.sintetizador.speak(fala);
  
  mostrarNotificacao('Testando voz...', 'info');
}

function ajustarVelocidadeTTS() {
  const controle = document.getElementById('controle_velocidade');
  const valor = document.getElementById('valor_velocidade');
  
  if (controle && valor) {
    const val = parseFloat(controle.value);
    var_objetoTTS.definirVelocidade(val);
  }
}

function ajustarTomTTS() {
  const controle = document.getElementById('controle_tom');
  const valor = document.getElementById('valor_tom');
  
  if (controle && valor) {
    const val = parseFloat(controle.value);
    var_objetoTTS.definirTom(val);
  }
}

function ajustarVolumeTTS() {
  const controle = document.getElementById('controle_volume');
  const valor = document.getElementById('valor_volume');
  
  if (controle && valor) {
    const val = parseFloat(controle.value);
    var_objetoTTS.definirVolume(val);
  }
}

// Função sincronizarControlesTTS agora é um método do objeto var_objetoTTS
// Remover wrapper desnecessário

function aplicarSubstituicoesInteligentes(texto) {
  // Substituições para o áudio, sem alterar o texto visual
  let substituicoes = [
    [/\bSR\./gi, 'Senhor'],
    [/\bSRA\./gi, 'Senhora'],
    [/\bDR\./gi, 'Doutor'],
    [/\bDRA\./gi, 'Doutora'],
    [/\bPROF\./gi, 'Professor'],
    [/\bPROFA\./gi, 'Professora'],
    // Adicione mais conforme necessário
  ];
  substituicoes.forEach(([regex, valor]) => {
    texto = texto.replace(regex, valor);
  });
  // Pausas de pontuação: usa valor do input e símbolos personalizados
  let pausa = var_objetoTTS.pausaFrase || 400;
  const inputPausa = document.getElementById('controle_pausa_frase');
  if (inputPausa) {
    const val = parseInt(inputPausa.value);
    if (!isNaN(val) && val >= 0) pausa = val;
  }
  let simbolos = '.!?';
  const inputSimbolos = document.getElementById('simbolos_pausa');
  if (inputSimbolos) {
    simbolos = inputSimbolos.value.replace(/\s+/g, '');
  }
  // Monta regex dinâmico para símbolos
  const regexSimbolos = new RegExp('([' + simbolos.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '])([^\s])', 'g');
  texto = texto.replace(regexSimbolos, '$1 $2'); // Garante espaço após símbolo
  // NÃO adicionar tags <break time...> para o TTS Web Speech API
  // texto = texto.replace(regexSimbolosPausa, `$1 <break time="${pausa}ms"/>`);
  // texto = texto.replace(/([,;:])/g, '$1 <break time="200ms"/>' );
  // Remover qualquer tag <break ...> que esteja no texto
  texto = texto.replace(/<break[^>]*>/gi, '');
  return texto;
}

// Highlight sincronizado
function destacarFrase(frase) {
  // Destaca apenas dentro do texto do capítulo
  const leitor = document.getElementById('readerText');
  if (!leitor) return;
  const capitulo = leitor.querySelector('.mui-chapter-text');
  if (!capitulo) return;
  
  // Verificar se a frase está vazia ou é muito pequena
  if (!frase || frase.trim().length < 2) return;
  
  // Remove highlights anteriores
  capitulo.querySelectorAll('.tts-highlight').forEach(el => {
    // Verificar se o elemento ainda existe antes de tentar removê-lo
    if (el && el.parentNode) {
      el.classList.remove('tts-highlight');
    }
  });
  
  // Procura e destaca a frase sem sobrescrever todo o HTML
  const nodes = Array.from(capitulo.childNodes);
  let found = false;
  
  // Função recursiva para processar nós
  function processarNode(node) {
    if (found || !node) return;
    
    if (node.nodeType === 3) { // texto puro
      const nodeText = node.textContent;
      if (!nodeText || nodeText.trim().length === 0) return;
      
      const idx = nodeText.toLowerCase().indexOf(frase.toLowerCase());
      if (idx !== -1) {
        const before = nodeText.slice(0, idx);
        const match = nodeText.slice(idx, idx + frase.length);
        const after = nodeText.slice(idx + frase.length);
        
        const span = document.createElement('span');
        span.className = 'tts-highlight';
        span.textContent = match;
        
        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));
        
        // Verificar se o nó ainda existe antes de substituí-lo
        if (node.parentNode) {
          node.parentNode.replaceChild(frag, node);
        }
        
        found = true;
        // Scroll automático para o highlight
        setTimeout(() => {
          if (span && span.scrollIntoView) {
            span.scrollIntoView({behavior: 'smooth', block: 'center'});
          }
        }, 50);
      }
    } else if (node.nodeType === 1) {
      // Processar elementos filhos recursivamente
      const childNodes = Array.from(node.childNodes);
      for (const child of childNodes) {
        if (found) break;
        processarNode(child);
      }
    }
  }
  
  // Processar todos os nós
  for (const node of nodes) {
    if (found) break;
    processarNode(node);
  }
}

function limparHighlight() {
  const leitor = document.getElementById('readerText');
  if (!leitor) return;
  const capitulo = leitor.querySelector('.mui-chapter-text');
  if (!capitulo) return;
  
  // Remover highlights de forma segura
  const highlights = capitulo.querySelectorAll('.tts-highlight');
  highlights.forEach(el => {
    if (el && el.parentNode) {
      // Substituir o elemento highlight pelo seu texto
      const textNode = document.createTextNode(el.textContent);
      el.parentNode.replaceChild(textNode, el);
    }
  });
  
  // Normalizar o DOM para remover nós de texto vazios adjacentes
  capitulo.normalize();
}

// Configuração de modo de leitura
let modoLeituraContínuo = true;

// Botões de navegação e modo
function criarBotoesTTS() {
  const controles = document.getElementById('controles_tts');
  if (!controles || document.getElementById('tts_nav_buttons')) return;
  const nav = document.createElement('div');
  nav.id = 'tts_nav_buttons';
  nav.style.display = 'flex';
  nav.style.gap = '0.5rem';
  nav.style.marginTop = '1rem';
  nav.innerHTML = `
    <button id="tts_pular_frase" class="mui-button mui-button--outlined" title="Próxima frase"><span class="mui-icon mui-icon--navigate_next"></span>Frase</button>
    <button id="tts_pular_paragrafo" class="mui-button mui-button--outlined" title="Próximo parágrafo"><span class="mui-icon mui-icon--navigate_next"></span>Parágrafo</button>
    <button id="tts_pular_capitulo" class="mui-button mui-button--outlined" title="Próximo capítulo"><span class="mui-icon mui-icon--navigate_next"></span>Capítulo</button>
    <label style="display:flex;align-items:center;gap:0.5rem;margin-left:1rem;">
      <input type="checkbox" id="tts_modo_continuo" checked style="margin-right:0.3rem;">Modo contínuo
    </label>
  `;
  controles.appendChild(nav);
  document.getElementById('tts_modo_continuo').addEventListener('change', e => {
    modoLeituraContínuo = e.target.checked;
  });
}
criarBotoesTTS();

// Variáveis de controle para navegação
let frasesAtuais = [];
let idxFraseAtual = 0;
let paragrafoAtual = 0;

// Leitura com ênfase em palavras importantes (negrito)
function aplicarEnfase(frase) {
  // Se houver <b> ou <strong>, aumenta o pitch/volume dessas palavras
  const temp = document.createElement('div');
  temp.innerHTML = frase;
  let partes = [];
  temp.childNodes.forEach(node => {
    if (node.nodeType === 3) {
      partes.push({texto: node.textContent, enfase: false});
    } else if (node.nodeType === 1 && (node.tagName === 'B' || node.tagName === 'STRONG')) {
      partes.push({texto: node.textContent, enfase: true});
    }
  });
  return partes;
}

function lerFraseComEnfase(frase, onend) {
  const partes = aplicarEnfase(frase);
  let idx = 0;
  function lerParte() {
    if (idx >= partes.length) { onend && onend(); return; }
    const parte = partes[idx];
    let textoProcessado = aplicarSubstituicoesInteligentes(parte.texto);
    textoProcessado = aplicarPausasVisuais(textoProcessado);
    
    let fala = new SpeechSynthesisUtterance(textoProcessado);
    
    // Sempre usar a voz atual configurada
    if (var_objetoTTS.vozAtual) {
      fala.voice = var_objetoTTS.vozAtual;
    }
    
    fala.rate = var_objetoTTS.velocidade;
    fala.pitch = parte.enfase ? var_objetoTTS.tom + 0.5 : var_objetoTTS.tom;
    fala.volume = parte.enfase ? Math.min(var_objetoTTS.volume + 0.2, 2) : var_objetoTTS.volume;
    fala.onend = function() { idx++; lerParte(); };
    var_objetoTTS.sintetizador.speak(fala);
  }
  lerParte();
}

// Leitura por frase com highlight, detecção de idioma, ênfase e modo contínuo/página
function lerTextoTTS(texto, callbackAoFinal) {
  // Verificar se já está lendo e cancelar se necessário
  if (var_objetoTTS.leituraEmAndamento || (var_objetoTTS.sintetizador && var_objetoTTS.sintetizador.speaking)) {
    if (var_objetoTTS.sintetizador) {
      var_objetoTTS.sintetizador.cancel();
    }
    var_objetoTTS.leituraEmAndamento = false;
    // Aguardar um pouco para garantir que a leitura anterior foi completamente parada
    setTimeout(() => {
      lerTextoTTS(texto, callbackAoFinal);
    }, 100);
    return;
  }
  
  // Verificar se o texto é válido
  if (!texto || texto.trim().length === 0) {
    if (typeof callbackAoFinal === 'function') callbackAoFinal();
    return;
  }
  
  // Verificar se o TTS está disponível
  if (!var_objetoTTS.sintetizador) {
    mostrarNotificacao('TTS não disponível', 'error');
    if (typeof callbackAoFinal === 'function') callbackAoFinal();
    return;
  }
  
  // Marcar que a leitura está em andamento
  var_objetoTTS.leituraEmAndamento = true;
  var_objetoTTS.callbackAtual = callbackAoFinal;
  
  // Divide em parágrafos e frases
  const paragrafos = texto.split(/\n+/).filter(Boolean);
  paragrafoAtual = 0;
  
  function lerParagrafo() {
    if (paragrafoAtual >= paragrafos.length) {
      limparHighlight();
      leituraEmAndamento = false;
      if (typeof callbackAoFinal === 'function') callbackAoFinal();
      return;
    }
    
    const frases = paragrafos[paragrafoAtual].match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [paragrafos[paragrafoAtual]];
    frasesAtuais = frases;
    idxFraseAtual = 0;
    
    function lerFrase() {
      if (idxFraseAtual >= frases.length) {
        paragrafoAtual++;
        if (modoLeituraContínuo) {
          lerParagrafo();
        } else {
          limparHighlight();
          leituraEmAndamento = false;
        }
        return;
      }
      
      const frase = frases[idxFraseAtual].trim();
      
      // Verificar se a frase é válida
      if (!frase || frase.length < 2) {
        idxFraseAtual++;
        lerFrase();
        return;
      }
      
      // Destacar a frase atual
      destacarFrase(frase);
      
      // Detecção de idioma apenas se a voz não foi selecionada manualmente
      if (!vozSelecionadaManual) {
        const idioma = detectarIdioma(frase);
        selecionarVozPorIdioma(idioma);
      }
      
      lerFraseComEnfase(frase, function() {
        idxFraseAtual++;
        // Aplicar pausa configurada entre frases
        const pausaConfigurada = var_objetoTTS.pausaFrase || 400;
        setTimeout(() => {
          lerFrase();
        }, pausaConfigurada);
      });
    }
    
    lerFrase();
  }
  
  lerParagrafo();
}

// Navegação
if (document.getElementById('tts_pular_frase')) {
  document.getElementById('tts_pular_frase').onclick = function() {
    idxFraseAtual++;
    if (frasesAtuais && idxFraseAtual < frasesAtuais.length) {
      var_objetoTTS.sintetizador.cancel();
      destacarFrase(frasesAtuais[idxFraseAtual]);
      lerFraseComEnfase(frasesAtuais[idxFraseAtual]);
    }
  };
}
if (document.getElementById('tts_pular_paragrafo')) {
  document.getElementById('tts_pular_paragrafo').onclick = function() {
    paragrafoAtual++;
    var_objetoTTS.sintetizador.cancel();
    lerTextoTTS(document.getElementById('readerText').innerText);
  };
}
if (document.getElementById('tts_pular_capitulo')) {
  document.getElementById('tts_pular_capitulo').onclick = function() {
    // Simula evento de próximo capítulo
    if (typeof _func_CarregarCapitulo === 'function') {
      _func_CarregarCapitulo(window.var_intCapituloAtual + 1);
      setTimeout(() => lerTextoTTS(document.getElementById('readerText').innerText), 500);
    }
  };
}

// Notificações sonoras
function notificarTTS(msg) {
  if (window.Notification && Notification.permission === 'granted') {
    new Notification(msg);
  } else if (window.Notification && Notification.permission !== 'denied') {
    Notification.requestPermission().then(function (permission) {
      if (permission === 'granted') new Notification(msg);
    });
  }
}
// Exemplo: notificarTTS('Capítulo finalizado!');

// Função para inicializar o toggle dos controles de TTS
function inicializarToggleTTS() {
  const toggleButton = document.getElementById('toggle_tts_controls');
  const controlesTTS = document.getElementById('controles_tts');
  const toggleText = toggleButton?.querySelector('.toggle-text');
  const toggleIcon = toggleButton?.querySelector('.mui-icon');
  
  if (!toggleButton || !controlesTTS) {
    console.error('Elementos de toggle TTS não encontrados');
    return;
  }
  
  // Verificar estado salvo no localStorage
  const ttsVisible = localStorage.getItem('tts_controls_visible') === 'true';
  
  // Aplicar estado inicial
  if (ttsVisible) {
    controlesTTS.classList.remove('mui-tts-hidden');
    controlesTTS.classList.add('mui-tts-visible');
    toggleButton.classList.add('mui-button--active');
    if (toggleText) toggleText.textContent = 'Ocultar TTS';
    if (toggleIcon) toggleIcon.classList.remove('mui-icon--volume_up');
    if (toggleIcon) toggleIcon.classList.add('mui-icon--volume_off');
  } else {
    controlesTTS.classList.add('mui-tts-hidden');
    controlesTTS.classList.remove('mui-tts-visible');
    toggleButton.classList.remove('mui-button--active');
    if (toggleText) toggleText.textContent = 'Mostrar TTS';
    if (toggleIcon) toggleIcon.classList.add('mui-icon--volume_up');
    if (toggleIcon) toggleIcon.classList.remove('mui-icon--volume_off');
  }
  
  // Adicionar event listener para toggle
  toggleButton.addEventListener('click', function() {
    const isVisible = controlesTTS.classList.contains('mui-tts-visible');
    
    if (isVisible) {
      // Ocultar controles
      controlesTTS.classList.remove('mui-tts-visible');
      controlesTTS.classList.add('mui-tts-hidden');
      toggleButton.classList.remove('mui-button--active');
      if (toggleText) toggleText.textContent = 'Mostrar TTS';
      if (toggleIcon) {
        toggleIcon.classList.remove('mui-icon--volume_off');
        toggleIcon.classList.add('mui-icon--volume_up');
      }
      localStorage.setItem('tts_controls_visible', 'false');
    } else {
      // Mostrar controles
      controlesTTS.classList.remove('mui-tts-hidden');
      controlesTTS.classList.add('mui-tts-visible');
      toggleButton.classList.add('mui-button--active');
      if (toggleText) toggleText.textContent = 'Ocultar TTS';
      if (toggleIcon) {
        toggleIcon.classList.remove('mui-icon--volume_up');
        toggleIcon.classList.add('mui-icon--volume_off');
      }
      localStorage.setItem('tts_controls_visible', 'true');
    }
  });
}

function pausarLeituraTTS() {
  if (var_objetoTTS.sintetizador && var_objetoTTS.sintetizador.speaking && !var_objetoTTS.sintetizador.paused) {
    var_objetoTTS.sintetizador.pause();
    var_objetoTTS.leituraPausada = true;
    mostrarNotificacao('Leitura pausada', 'info');
  }
}

function retomarLeituraTTS() {
  if (var_objetoTTS.sintetizador && var_objetoTTS.sintetizador.paused) {
    var_objetoTTS.sintetizador.resume();
    var_objetoTTS.leituraPausada = false;
    mostrarNotificacao('Leitura retomada', 'info');
  }
}

function pararLeituraTTS() {
  if (var_objetoTTS.sintetizador) {
    var_objetoTTS.sintetizador.cancel();
  }
  var_objetoTTS.leituraEmAndamento = false;
  var_objetoTTS.leituraPausada = false;
  var_objetoTTS.callbackAtual = null;
  limparHighlight();
  mostrarNotificacao('Leitura parada', 'info');
}

function obterTextoParaLeituraTTS() {
  // Obtém apenas o texto do capítulo, ignorando o título
  const elementoTexto = document.getElementById('readerText');
  if (elementoTexto) {
    const capitulo = elementoTexto.querySelector('.mui-chapter-text');
    if (capitulo) {
      return capitulo.innerText || capitulo.textContent;
    }
    return elementoTexto.innerText || elementoTexto.textContent;
  }
  return '';
}

document.addEventListener('DOMContentLoaded', function() {
  const sliderPausa = document.getElementById('controle_pausa_frase');
  const valorPausa = document.getElementById('valor_pausa_frase');
  if (sliderPausa && valorPausa) {
    sliderPausa.addEventListener('input', function() {
      valorPausa.textContent = sliderPausa.value;
    });
  }
});

// Clique para ler a partir do parágrafo
const leitor = document.getElementById('readerText');
if (leitor) {
  leitor.addEventListener('click', function(e) {
    // Só inicia leitura, não altera o DOM
    let paragrafo = e.target.closest('p, .mui-chapter-text, .mui-chapter-content');
    if (paragrafo && paragrafo.classList.contains('mui-chapter-text')) {
      e.preventDefault();
      e.stopPropagation();
      
      // Iniciar leitura a partir do clique
      iniciarLeituraAPartirDoClique(e, paragrafo);
    }
  });
  
  // Função auxiliar para iniciar leitura a partir do clique
  function iniciarLeituraAPartirDoClique(e, paragrafo) {
    // Verificar se já está lendo
    if (leituraEmAndamento || var_objetoTTS.sintetizador.speaking) {
      var_objetoTTS.sintetizador.cancel();
      leituraEmAndamento = false;
      // Aguardar um pouco para garantir que a leitura anterior foi completamente parada
      setTimeout(() => {
        iniciarLeituraAPartirDoClique(e, paragrafo);
      }, 100);
      return;
    }
    
    // Obter texto original sem highlights
    const textoOriginal = obterTextoParaLeituraTTS();
    if (!textoOriginal) return;
    
    // Calcular posição do clique no texto
    const rect = paragrafo.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Encontrar a posição aproximada no texto baseada na posição do mouse
    const linhas = textoOriginal.split('\n');
    const alturaLinha = rect.height / linhas.length;
    const linhaClicada = Math.floor(mouseY / alturaLinha);
    
    if (linhaClicada >= 0 && linhaClicada < linhas.length) {
      // Encontrar a posição na linha clicada
      const linha = linhas[linhaClicada];
      const larguraCaractere = rect.width / linha.length;
      const posicaoNaLinha = Math.floor(mouseX / larguraCaractere);
      
      // Calcular posição absoluta no texto
      let posicaoAbsoluta = 0;
      for (let i = 0; i < linhaClicada; i++) {
        posicaoAbsoluta += linhas[i].length + 1; // +1 para \n
      }
      posicaoAbsoluta += Math.min(posicaoNaLinha, linha.length);
      
      // Criar texto a partir da posição clicada
      const textoAPartirDoClique = textoOriginal.substring(posicaoAbsoluta);
      
      if (textoAPartirDoClique.trim()) {
        // Limpar highlights existentes antes de iniciar nova leitura
        limparHighlight();
        // Iniciar leitura com o texto a partir do clique
        lerTextoTTS(textoAPartirDoClique);
      }
    }
  }
  
  // Highlight por trecho no hover
  leitor.addEventListener('mouseover', function(e) {
    if (e.target.closest('.mui-chapter-text')) {
      const capitulo = e.target.closest('.mui-chapter-text');
      
      // Limpar highlights anteriores
      capitulo.querySelectorAll('.hover-highlight').forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
      
      // Criar highlight no trecho onde está o mouse
      if (e.target.nodeType === 3) { // Text node
        const textNode = e.target;
        const text = textNode.textContent;
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const charIndex = Math.floor((mouseX / rect.width) * text.length);
        
        if (charIndex >= 0 && charIndex < text.length) {
          const start = Math.max(0, charIndex - 20);
          const end = Math.min(text.length, charIndex + 20);
          const highlightedText = text.substring(start, end);
          
          const before = text.substring(0, start);
          const after = text.substring(end);
          const span = document.createElement('span');
          span.className = 'hover-highlight';
          span.textContent = highlightedText;
          
          const frag = document.createDocumentFragment();
          if (before) frag.appendChild(document.createTextNode(before));
          frag.appendChild(span);
          if (after) frag.appendChild(document.createTextNode(after));
          
          textNode.parentNode.replaceChild(frag, textNode);
        }
      }
    }
  });
  
  // Limpar highlight quando o mouse sai
  leitor.addEventListener('mouseout', function(e) {
    if (e.target.closest('.mui-chapter-text')) {
      const capitulo = e.target.closest('.mui-chapter-text');
      capitulo.querySelectorAll('.hover-highlight').forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
    }
  });
}

// Passagem automática de capítulo e tradução automática
function iniciarLeituraCapituloAtualETTS() {
  // Verificar se já está lendo e cancelar se necessário
  if (leituraEmAndamento || var_objetoTTS.sintetizador.speaking) {
    var_objetoTTS.sintetizador.cancel();
    leituraEmAndamento = false;
    // Aguardar um pouco para garantir que a leitura anterior foi completamente parada
    setTimeout(() => {
      iniciarLeituraCapituloAtualETTS();
    }, 100);
    return;
  }
  
  // Garante que sempre há uma voz selecionada
  if (!var_objetoTTS.vozAtual && var_objetoTTS.listaVozes.length > 0) {
    var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[0];
    const seletor = document.getElementById('seletor_voz');
    if (seletor) seletor.selectedIndex = 0;
  }
  
  modoLeituraContínuo = true;
  const checkbox = document.getElementById('tts_modo_continuo');
  if (checkbox && !checkbox.checked) checkbox.checked = true;
  
  const texto = obterTextoParaLeituraTTS();
  if (!texto || texto.trim().length === 0) {
    console.warn('Nenhum texto encontrado para leitura');
    return;
  }
  
  // Limpar highlights existentes antes de iniciar nova leitura
  limparHighlight();
  
  lerTextoTTS(texto, function() {
    // Ao terminar o capítulo, passar para o próximo
    if (typeof window.var_intCapituloAtual !== 'undefined' && typeof window.var_listCapitulos !== 'undefined') {
      const proximo = window.var_intCapituloAtual + 1;
      if (proximo < window.var_listCapitulos.length) {
        const cap = window.var_listCapitulos[proximo];
        // Se não estiver traduzido, traduzir antes de ler
        if (!cap.translated_content) {
          if (typeof _func_TraduzirCapituloAtual === 'function') {
            // Traduz e só lê após tradução
            _func_TraduzirCapituloAtual();
            // Espera tradução (polling)
            let tentativas = 0;
            function aguardarTraducao() {
              tentativas++;
              if (cap.translated_content) {
                // Aguardar um pouco antes de iniciar a leitura do próximo capítulo
                setTimeout(() => {
                  iniciarLeituraCapituloAtualETTS();
                }, 500);
              } else if (tentativas < 30) {
                setTimeout(aguardarTraducao, 1000);
              } else {
                notificarTTS('Tradução do capítulo demorou demais.');
              }
            }
            aguardarTraducao();
            return;
          }
        } else {
          // Se já está traduzido, apenas notificar que pode passar para o próximo
          notificarTTS('Capítulo finalizado. Clique em próximo para continuar.');
        }
      } else {
        notificarTTS('Leitura finalizada!');
      }
    }
  });
}

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
  // Criar elemento de notificação
  const notificacao = document.createElement('div');
  notificacao.className = `mui-notification mui-notification--${tipo}`;
  notificacao.innerHTML = `
    <span class="mui-icon mui-icon--${tipo === 'error' ? 'error' : tipo === 'success' ? 'check_circle' : 'info'}"></span>
    <span class="mui-notification__message">${mensagem}</span>
  `;
  
  // Adicionar ao DOM
  document.body.appendChild(notificacao);
  
  // Mostrar com animação
  setTimeout(() => notificacao.classList.add('mui-notification--show'), 100);
  
  // Remover após 3 segundos
  setTimeout(() => {
    notificacao.classList.remove('mui-notification--show');
    setTimeout(() => {
      if (notificacao.parentNode) {
        notificacao.parentNode.removeChild(notificacao);
      }
    }, 300);
  }, 3000);
}

// Função para resetar seleção manual (útil para voltar à detecção automática)
function resetarSelecaoManual() {
  vozSelecionadaManual = false;
  localStorage.removeItem('ttsSelectedVoice');
  console.log('Seleção manual resetada - voltando à detecção automática de idioma');
}

// Função para forçar seleção manual
function forcarSelecaoManual() {
  vozSelecionadaManual = true;
  console.log('Seleção manual forçada - detecção automática desabilitada');
}

// Função para aplicar pausas visuais no texto
function aplicarPausasVisuais(texto) {
  if (!var_objetoTTS.simbolosPausa) return texto;
  
  const simbolos = var_objetoTTS.simbolosPausa;
  const escapedSymbols = simbolos.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regexSimbolos = new RegExp(`([${escapedSymbols}])`, 'g');
  
  // Adicionar espaços após símbolos de pausa para melhor legibilidade
  return texto.replace(regexSimbolos, '$1 ');
} 