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
  // Remove highlights anteriores
  capitulo.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
  // Procura e destaca a frase sem sobrescrever todo o HTML
  const nodes = Array.from(capitulo.childNodes);
  let found = false;
  nodes.forEach(node => {
    if (found) return;
    if (node.nodeType === 3) { // texto puro
      const idx = node.textContent.toLowerCase().indexOf(frase.toLowerCase());
      if (idx !== -1) {
        const before = node.textContent.slice(0, idx);
        const match = node.textContent.slice(idx, idx + frase.length);
        const after = node.textContent.slice(idx + frase.length);
        const span = document.createElement('span');
        span.className = 'tts-highlight';
        span.textContent = match;
        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));
        capitulo.replaceChild(frag, node);
        found = true;
        // Scroll automático para o highlight
        setTimeout(() => {
          span.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 50);
      }
    } else if (node.nodeType === 1) {
      destacarFraseNoNode(node, frase);
    }
  });
}

function destacarFraseNoNode(node, frase) {
  if (!node) return;
  node.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
  const nodes = Array.from(node.childNodes);
  let found = false;
  nodes.forEach(child => {
    if (found) return;
    if (child.nodeType === 3) {
      const idx = child.textContent.toLowerCase().indexOf(frase.toLowerCase());
      if (idx !== -1) {
        const before = child.textContent.slice(0, idx);
        const match = child.textContent.slice(idx, idx + frase.length);
        const after = child.textContent.slice(idx + frase.length);
        const span = document.createElement('span');
        span.className = 'tts-highlight';
        span.textContent = match;
        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));
        node.replaceChild(frag, child);
        found = true;
        // Scroll automático para o highlight
        setTimeout(() => {
          span.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 50);
      }
    } else if (child.nodeType === 1) {
      destacarFraseNoNode(child, frase);
    }
  });
}

function limparHighlight() {
  const leitor = document.getElementById('readerText');
  if (!leitor) return;
  const capitulo = leitor.querySelector('.mui-chapter-text');
  if (!capitulo) return;
  capitulo.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
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
  // Divide em parágrafos e frases
  const paragrafos = texto.split(/\n+/).filter(Boolean);
  paragrafoAtual = 0;
  function lerParagrafo() {
    if (paragrafoAtual >= paragrafos.length) {
      limparHighlight();
      if (typeof callbackAoFinal === 'function') callbackAoFinal();
      return;
    }
    const frases = paragrafos[paragrafoAtual].match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [paragrafos[paragrafoAtual]];
    frasesAtuais = frases;
    idxFraseAtual = 0;
    function lerFrase() {
      if (idxFraseAtual >= frases.length) {
        paragrafoAtual++;
        if (modoLeituraContínuo) lerParagrafo();
        else limparHighlight();
        return;
      }
      const frase = frases[idxFraseAtual].trim();
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
    let paragrafo = e.target.closest('p, .mui-chapter-text, .mui-chapter-content');
    if (paragrafo) {
      var_objetoTTS.sintetizador.cancel();
      lerTextoTTS(paragrafo.innerText || paragrafo.textContent);
    }
  });
}

// Passagem automática de capítulo e tradução automática
function iniciarLeituraCapituloAtualETTS() {
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
  if (!texto) return;
  lerTextoTTS(texto, function() {
    // Ao terminar o capítulo, passar para o próximo
    if (typeof window.var_intCapituloAtual !== 'undefined' && typeof window.var_listCapitulos !== 'undefined') {
      const proximo = window.var_intCapituloAtual + 1;
      if (proximo < window.var_listCapitulos.length) {
        const cap = window.var_listCapitulos[proximo];
        // Se não estiver traduzido, traduzir antes de ler
        if (!cap.translated_content) {
          if (typeof _func_TraduzirCapituloAtual === 'function') {
            // Troca para o próximo capítulo
            if (typeof _func_CarregarCapitulo === 'function') {
              _func_CarregarCapitulo(proximo);
            }
            // Traduz e só lê após tradução
            _func_TraduzirCapituloAtual();
            // Espera tradução (polling)
            let tentativas = 0;
            function aguardarTraducao() {
              tentativas++;
              if (cap.translated_content) {
                iniciarLeituraCapituloAtualETTS();
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
          if (typeof _func_CarregarCapitulo === 'function') {
            _func_CarregarCapitulo(proximo);
            setTimeout(() => iniciarLeituraCapituloAtualETTS(), 500);
          }
        }
      } else {
        notificarTTS('Leitura finalizada!');
      }
    }
  });
} 