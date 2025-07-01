// tts.js
// Controle do TTS usando Web Speech API

var_objetoTTS = {
  sintetizador: window.speechSynthesis,
  listaVozes: [],
  vozAtual: null,
  velocidade: 1,
  tom: 1,
  volume: 1,
};

// Variável para controlar se uma leitura está em andamento
let leituraEmAndamento = false;

// Importação dinâmica de franc-min para detecção de idioma
let franc;
(async () => {
  if (typeof window.franc === 'undefined') {
    const module = await import('/node_modules/franc-min/index.js');
    franc = module.franc;
  } else {
    franc = window.franc;
  }
})();

// Mapeamento de idiomas para vozes
function detectarIdioma(texto) {
  if (!franc) return 'pt';
  const lang = franc(texto);
  // Mapeamento básico
  if (lang === 'eng') return 'en-US';
  if (lang === 'spa') return 'es-ES';
  if (lang === 'fra') return 'fr-FR';
  if (lang === 'deu') return 'de-DE';
  if (lang === 'ita') return 'it-IT';
  if (lang === 'por') return 'pt-BR';
  return 'pt-BR';
}

function selecionarVozPorIdioma(idioma) {
  if (!var_objetoTTS.listaVozes.length) return;
  const voz = var_objetoTTS.listaVozes.find(v => v.lang && v.lang.startsWith(idioma));
  if (voz) var_objetoTTS.vozAtual = voz;
}

// Adicionar flag para saber se a voz foi selecionada manualmente
var vozSelecionadaManual = false;

// Listeners para detectar quando a leitura é interrompida
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener('end', function() {
    leituraEmAndamento = false;
  });
  
  speechSynthesis.addEventListener('cancel', function() {
    leituraEmAndamento = false;
    limparHighlight();
  });
  
  speechSynthesis.addEventListener('error', function() {
    leituraEmAndamento = false;
    limparHighlight();
  });
}

function inicializarTTS() {
  carregarVozesTTS();
  const seletorVoz = document.getElementById('seletor_voz');
  const botaoTesteVoz = document.getElementById('botao_teste_voz');
  const controleVelocidade = document.getElementById('controle_velocidade');
  const controleTom = document.getElementById('controle_tom');
  const controleVolume = document.getElementById('controle_volume');
  const botaoIniciarLeitura = document.getElementById('botao_iniciar_leitura');
  const botaoPausarLeitura = document.getElementById('botao_pausar_leitura');
  const botaoPararLeitura = document.getElementById('botao_parar_leitura');

  if (!seletorVoz || !botaoTesteVoz || !controleVelocidade || !controleTom || !controleVolume || !botaoIniciarLeitura || !botaoPausarLeitura || !botaoPararLeitura) {
    console.error('Um ou mais elementos de controle do TTS não foram encontrados no DOM.');
    return;
  }

  seletorVoz.addEventListener('change', selecionarVozTTS);
  botaoTesteVoz.addEventListener('click', testarVozTTS);
  controleVelocidade.addEventListener('input', ajustarVelocidadeTTS);
  controleTom.addEventListener('input', ajustarTomTTS);
  controleVolume.addEventListener('input', ajustarVolumeTTS);
  botaoIniciarLeitura.addEventListener('click', iniciarLeituraCapituloAtualETTS);
  botaoPausarLeitura.addEventListener('click', pausarLeituraTTS);
  botaoPararLeitura.addEventListener('click', pararLeituraTTS);
  
  // Inicializar funcionalidade de toggle dos controles
  inicializarToggleTTS();
}

function carregarVozesTTS() {
  var_objetoTTS.listaVozes = var_objetoTTS.sintetizador.getVoices();
  var seletor = document.getElementById('seletor_voz');
  seletor.innerHTML = '';
  var_objetoTTS.listaVozes.forEach(function(voz, idx) {
    var opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = voz.name + (voz.lang ? ' (' + voz.lang + ')' : '');
    seletor.appendChild(opt);
  });
  if (var_objetoTTS.listaVozes.length > 0) {
    seletor.selectedIndex = 0;
    var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[0];
    vozSelecionadaManual = false;
  }
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = carregarVozesTTS;
}

function selecionarVozTTS() {
  var seletor = document.getElementById('seletor_voz');
  var idx = seletor.value;
  var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[idx];
  vozSelecionadaManual = true;
  // Parar leitura atual e reiniciar com a nova voz, se estiver lendo
  if (var_objetoTTS.sintetizador.speaking) {
    var_objetoTTS.sintetizador.cancel();
    const texto = obterTextoParaLeituraTTS();
    if (texto) lerTextoTTS(texto);
  }
}

function testarVozTTS() {
  var fala = new SpeechSynthesisUtterance('Esta é uma amostra da voz selecionada.');
  fala.voice = var_objetoTTS.vozAtual;
  fala.rate = var_objetoTTS.velocidade;
  fala.pitch = var_objetoTTS.tom;
  fala.volume = var_objetoTTS.volume;
  var_objetoTTS.sintetizador.cancel();
  var_objetoTTS.sintetizador.speak(fala);
}

function ajustarVelocidadeTTS() {
  var val = parseFloat(document.getElementById('controle_velocidade').value);
  var_objetoTTS.velocidade = val;
  document.getElementById('valor_velocidade').textContent = val.toFixed(1);
}

function ajustarTomTTS() {
  var val = parseFloat(document.getElementById('controle_tom').value);
  var_objetoTTS.tom = val;
  document.getElementById('valor_tom').textContent = val.toFixed(1);
}

function ajustarVolumeTTS() {
  var val = parseFloat(document.getElementById('controle_volume').value);
  var_objetoTTS.volume = val;
  document.getElementById('valor_volume').textContent = val.toFixed(1);
}

function sincronizarControlesTTS() {
  document.getElementById('controle_velocidade').value = var_objetoTTS.velocidade;
  document.getElementById('valor_velocidade').textContent = var_objetoTTS.velocidade.toFixed(1);
  document.getElementById('controle_tom').value = var_objetoTTS.tom;
  document.getElementById('valor_tom').textContent = var_objetoTTS.tom.toFixed(1);
  document.getElementById('controle_volume').value = var_objetoTTS.volume;
  document.getElementById('valor_volume').textContent = var_objetoTTS.volume.toFixed(1);
}

var _antigoInicializarTTS = inicializarTTS;
inicializarTTS = function() {
  _antigoInicializarTTS();
  sincronizarControlesTTS();
};

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
  let pausa = 400;
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
    let fala = new SpeechSynthesisUtterance(aplicarSubstituicoesInteligentes(parte.texto));
    fala.voice = var_objetoTTS.vozAtual;
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
  if (leituraEmAndamento || var_objetoTTS.sintetizador.speaking) {
    var_objetoTTS.sintetizador.cancel();
    leituraEmAndamento = false;
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
  
  // Marcar que a leitura está em andamento
  leituraEmAndamento = true;
  
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
      
      // Detecção de idioma
      const idioma = detectarIdioma(frase);
      if (!vozSelecionadaManual) {
        selecionarVozPorIdioma(idioma);
      }
      
      lerFraseComEnfase(frase, function() {
        idxFraseAtual++;
        lerFrase();
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
  if (var_objetoTTS.sintetizador.speaking && !var_objetoTTS.sintetizador.paused) {
    var_objetoTTS.sintetizador.pause();
  }
}

function retomarLeituraTTS() {
  if (var_objetoTTS.sintetizador.paused) {
    var_objetoTTS.sintetizador.resume();
  }
}

function pararLeituraTTS() {
  var_objetoTTS.sintetizador.cancel();
  leituraEmAndamento = false;
  limparHighlight();
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