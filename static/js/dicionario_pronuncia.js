// dicionario_pronuncia.js
// Gerenciamento do dicionário de pronúncia para TTS

// Elementos do DOM
const var_objFormAdicionar = document.getElementById('formAdicionarPronuncia');
const var_objFormUpload = document.getElementById('formUploadPronuncia');
const var_objListaPronuncias = document.getElementById('listaPronuncias');
const var_objCampoPalavra = document.getElementById('palavra');
const var_objCampoPronuncia = document.getElementById('pronuncia');
const var_objArquivoPronuncia = document.getElementById('arquivoPronuncia');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    _func_ConfigurarEventos();
    console.log('Dicionário de pronúncia inicializado');
});

function _func_ConfigurarEventos() {
    // Formulário de adicionar entrada
    if (var_objFormAdicionar) {
        var_objFormAdicionar.addEventListener('submit', _func_AdicionarEntradaPronuncia);
    }
    
    // Formulário de upload
    if (var_objFormUpload) {
        var_objFormUpload.addEventListener('submit', _func_UploadDicionarioPronuncia);
    }
    
    // Busca em tempo real
    const var_objSearchInput = document.getElementById('searchInput');
    if (var_objSearchInput) {
        var_objSearchInput.addEventListener('input', _func_BuscarEntradas);
    }
    
    // Modal de edição
    const var_objEditModal = document.getElementById('editModal');
    const var_objEditModalOverlay = document.getElementById('editModalOverlay');
    const var_objCloseEditModal = document.getElementById('closeEditModal');
    
    if (var_objEditModalOverlay) {
        var_objEditModalOverlay.addEventListener('click', _func_FecharModalEdicao);
    }
    
    if (var_objCloseEditModal) {
        var_objCloseEditModal.addEventListener('click', _func_FecharModalEdicao);
    }
    
    // Configurar eventos para testar pronúncia
    _func_ConfigurarEventosTestePronuncia();
    
    // Configurar área de upload
    _func_ConfigurarAreaUpload();
    
    // Foco automático no primeiro campo
    if (var_objCampoPalavra) {
        var_objCampoPalavra.focus();
    }
}

async function _func_AdicionarEntradaPronuncia(var_objEvento) {
    var_objEvento.preventDefault();
    
    const var_strPalavra = var_objCampoPalavra.value.trim();
    const var_strPronuncia = var_objCampoPronuncia.value.trim();
    
    // Validação
    if (!var_strPalavra || !var_strPronuncia) {
        _func_MostrarNotificacao('Preencha todos os campos', 'error');
        return;
    }
    
    if (var_strPalavra === var_strPronuncia) {
        _func_MostrarNotificacao('A pronúncia deve ser diferente da palavra original', 'warning');
        return;
    }
    
    try {
        // Desabilitar botão durante a requisição
        const var_objBotao = var_objFormAdicionar.querySelector('button[type="submit"]');
        const var_strTextoOriginal = var_objBotao.innerHTML;
        var_objBotao.disabled = true;
        var_objBotao.innerHTML = '<i class="mui-icon">hourglass_empty</i> Adicionando...';
        
        const var_objResposta = await fetch('/dicionario-pronuncia/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                palavra: var_strPalavra,
                pronuncia: var_strPronuncia
            })
        });
        
        const var_dicResultado = await var_objResposta.json();
        
        if (var_dicResultado.success) {
            _func_MostrarNotificacao(var_dicResultado.message, 'success');
            _func_LimparFormulario();
            _func_AdicionarItemNaLista(var_strPalavra, var_strPronuncia);
        } else {
            _func_MostrarNotificacao(var_dicResultado.error, 'error');
        }
        
    } catch (var_objErro) {
        console.error('Erro ao adicionar entrada:', var_objErro);
        _func_MostrarNotificacao('Erro ao adicionar entrada. Tente novamente.', 'error');
    } finally {
        // Reabilitar botão
        const var_objBotao = var_objFormAdicionar.querySelector('button[type="submit"]');
        var_objBotao.disabled = false;
        var_objBotao.innerHTML = var_strTextoOriginal;
    }
}

async function _func_RemoverEntradaPronuncia(var_strPalavra, var_boolConfirmar = true) {
    if (var_boolConfirmar && !confirm(`Tem certeza que deseja remover a entrada "${var_strPalavra}"?`)) {
        return;
    }
    
    try {
        const var_objResposta = await fetch('/dicionario-pronuncia/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                palavra: var_strPalavra
            })
        });
        
        const var_dicResultado = await var_objResposta.json();
        
        if (var_dicResultado.success) {
            _func_MostrarNotificacao(var_dicResultado.message, 'success');
            _func_RemoverItemDaLista(var_strPalavra);
        } else {
            _func_MostrarNotificacao(var_dicResultado.error, 'error');
        }
        
    } catch (var_objErro) {
        console.error('Erro ao remover entrada:', var_objErro);
        _func_MostrarNotificacao('Erro ao remover entrada. Tente novamente.', 'error');
    }
}

async function _func_UploadDicionarioPronuncia(var_objEvento) {
    var_objEvento.preventDefault();
    console.log('Upload iniciado');
    
    const var_objArquivo = var_objArquivoPronuncia.files[0];
    console.log('Arquivo selecionado:', var_objArquivo);
    
    if (!var_objArquivo) {
        _func_MostrarNotificacao('Selecione um arquivo', 'error');
        return;
    }
    
    if (!var_objArquivo.name.endsWith('.json')) {
        _func_MostrarNotificacao('Apenas arquivos JSON são permitidos', 'error');
        return;
    }
    
    try {
        // Desabilitar botão durante a requisição
        const var_objBotao = var_objFormUpload.querySelector('button[type="submit"]');
        const var_strTextoOriginal = var_objBotao.innerHTML;
        var_objBotao.disabled = true;
        var_objBotao.innerHTML = '<i class="mui-icon">hourglass_empty</i> Importando...';
        
        const var_objFormData = new FormData();
        var_objFormData.append('file', var_objArquivo);
        
        const var_objResposta = await fetch('/dicionario-pronuncia/upload', {
            method: 'POST',
            body: var_objFormData
        });
        
        const var_dicResultado = await var_objResposta.json();
        
        if (var_dicResultado.success) {
            _func_MostrarNotificacao(var_dicResultado.message, 'success');
            _func_LimparFormularioUpload();
            // Recarregar a página para mostrar as novas entradas
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            _func_MostrarNotificacao(var_dicResultado.error, 'error');
        }
        
    } catch (var_objErro) {
        console.error('Erro ao fazer upload:', var_objErro);
        _func_MostrarNotificacao('Erro ao fazer upload. Tente novamente.', 'error');
    } finally {
        // Reabilitar botão
        const var_objBotao = var_objFormUpload.querySelector('button[type="submit"]');
        var_objBotao.disabled = false;
        var_objBotao.innerHTML = var_strTextoOriginal;
    }
}

async function _func_DownloadDicionarioPronuncia() {
    try {
        const var_objResposta = await fetch('/dicionario-pronuncia/download');
        
        if (var_objResposta.ok) {
            const var_objBlob = await var_objResposta.blob();
            const var_objUrl = window.URL.createObjectURL(var_objBlob);
            const var_objLink = document.createElement('a');
            var_objLink.href = var_objUrl;
            var_objLink.download = 'dicionario_pronuncia.json';
            document.body.appendChild(var_objLink);
            var_objLink.click();
            document.body.removeChild(var_objLink);
            window.URL.revokeObjectURL(var_objUrl);
            
            _func_MostrarNotificacao('Download iniciado com sucesso!', 'success');
        } else {
            const var_dicResultado = await var_objResposta.json();
            _func_MostrarNotificacao(var_dicResultado.error, 'error');
        }
        
    } catch (var_objErro) {
        console.error('Erro ao fazer download:', var_objErro);
        _func_MostrarNotificacao('Erro ao fazer download. Tente novamente.', 'error');
    }
}

async function _func_LimparDicionarioPronuncia() {
    if (!confirm('Tem certeza que deseja limpar todo o dicionário de pronúncia? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const var_objResposta = await fetch('/dicionario-pronuncia/clear', {
            method: 'POST'
        });
        
        const var_dicResultado = await var_objResposta.json();
        
        if (var_dicResultado.success) {
            _func_MostrarNotificacao(var_dicResultado.message, 'success');
            _func_LimparLista();
        } else {
            _func_MostrarNotificacao(var_dicResultado.error, 'error');
        }
        
    } catch (var_objErro) {
        console.error('Erro ao limpar dicionário:', var_objErro);
        _func_MostrarNotificacao('Erro ao limpar dicionário. Tente novamente.', 'error');
    }
}

function _func_LimparFormulario() {
    if (var_objCampoPalavra) var_objCampoPalavra.value = '';
    if (var_objCampoPronuncia) var_objCampoPronuncia.value = '';
    if (var_objCampoPalavra) var_objCampoPalavra.focus();
}

function _func_LimparFormularioUpload() {
    if (var_objArquivoPronuncia) var_objArquivoPronuncia.value = '';
}

function _func_AdicionarItemNaLista(var_strPalavra, var_strPronuncia) {
    if (!var_objListaPronuncias) return;
    
    // Remover estado vazio se existir
    const var_objEstadoVazio = var_objListaPronuncias.querySelector('.mui-empty-state');
    if (var_objEstadoVazio) {
        var_objEstadoVazio.remove();
    }
    
    const var_objItem = document.createElement('div');
    var_objItem.className = 'mui-list-item';
    var_objItem.setAttribute('data-palavra', var_strPalavra);
    
    var_objItem.innerHTML = `
        <div class="mui-list-item-content">
            <div class="mui-list-item-primary">
                <strong>${var_strPalavra}</strong>
            </div>
            <div class="mui-list-item-secondary">
                Pronúncia: <em>${var_strPronuncia}</em>
            </div>
        </div>
        <div class="mui-list-item-actions">
            <button class="mui-button mui-button--icon mui-button--danger" onclick="_func_RemoverEntradaPronuncia('${var_strPalavra}')">
                <i class="mui-icon">delete</i>
            </button>
        </div>
    `;
    
    // Adicionar com animação
    var_objItem.style.opacity = '0';
    var_objItem.style.transform = 'translateY(-20px)';
    var_objListaPronuncias.appendChild(var_objItem);
    
    // Animar entrada
    setTimeout(() => {
        var_objItem.style.transition = 'all 0.3s ease';
        var_objItem.style.opacity = '1';
        var_objItem.style.transform = 'translateY(0)';
    }, 10);
}

function _func_RemoverItemDaLista(var_strPalavra) {
    const var_objItem = var_objListaPronuncias.querySelector(`[data-palavra="${var_strPalavra}"]`);
    if (var_objItem) {
        // Animar saída
        var_objItem.style.transition = 'all 0.3s ease';
        var_objItem.style.opacity = '0';
        var_objItem.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            var_objItem.remove();
            
            // Verificar se a lista ficou vazia
            if (var_objListaPronuncias.children.length === 0) {
                _func_MostrarEstadoVazio();
            }
        }, 300);
    }
}

function _func_LimparLista() {
    if (!var_objListaPronuncias) return;
    
    // Animar saída de todos os itens
    const var_listItens = var_objListaPronuncias.querySelectorAll('.mui-list-item');
    var_listItens.forEach((var_objItem, var_intIndice) => {
        setTimeout(() => {
            var_objItem.style.transition = 'all 0.3s ease';
            var_objItem.style.opacity = '0';
            var_objItem.style.transform = 'translateY(-20px)';
        }, var_intIndice * 50);
    });
    
    // Mostrar estado vazio após animação
    setTimeout(() => {
        var_objListaPronuncias.innerHTML = '';
        _func_MostrarEstadoVazio();
    }, var_listItens.length * 50 + 300);
}

function _func_MostrarEstadoVazio() {
    if (!var_objListaPronuncias) return;
    
    var_objListaPronuncias.innerHTML = `
        <div class="mui-empty-state">
            <i class="mui-icon mui-icon--large">volume_up</i>
            <h3>Nenhuma entrada encontrada</h3>
            <p>Adicione palavras e suas pronúncias para melhorar a narração TTS.</p>
        </div>
    `;
}

function _func_BuscarEntradas() {
    const var_objSearchInput = document.getElementById('searchInput');
    const var_objSearchResults = document.getElementById('searchResults');
    const var_strTermoBusca = var_objSearchInput.value.toLowerCase().trim();
    
    if (!var_objSearchResults) return;
    
    if (!var_strTermoBusca) {
        var_objSearchResults.innerHTML = '';
        return;
    }
    
    const var_listItensDicionario = document.querySelectorAll('.mui-dicionario-item');
    const var_listResultados = [];
    
    var_listItensDicionario.forEach((var_objItem) => {
        const var_strPalavra = var_objItem.querySelector('.mui-dicionario-item__original').textContent.toLowerCase();
        const var_strPronuncia = var_objItem.querySelector('.mui-dicionario-item__translated').textContent.toLowerCase();
        
        if (var_strPalavra.includes(var_strTermoBusca) || var_strPronuncia.includes(var_strTermoBusca)) {
            var_listResultados.push(var_objItem.cloneNode(true));
        }
    });
    
    if (var_listResultados.length > 0) {
        var_objSearchResults.innerHTML = `
            <div class="mui-search-results-header">
                <span class="mui-icon mui-icon--search"></span>
                <span>${var_listResultados.length} resultado(s) encontrado(s)</span>
            </div>
        `;
        
        const var_objResultadosContainer = document.createElement('div');
        var_objResultadosContainer.className = 'mui-dicionario-list';
        var_listResultados.forEach(var_objItem => {
            var_objResultadosContainer.appendChild(var_objItem);
        });
        var_objSearchResults.appendChild(var_objResultadosContainer);
    } else {
        var_objSearchResults.innerHTML = `
            <div class="mui-empty-state">
                <span class="mui-icon mui-icon--search"></span>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente usar termos diferentes na busca.</p>
            </div>
        `;
    }
}

function _func_EditarEntradaPronuncia(var_strPalavra, var_strPronuncia) {
    const var_objEditModal = document.getElementById('editModal');
    const var_objEditPalavra = document.getElementById('editPalavra');
    const var_objEditPronuncia = document.getElementById('editPronuncia');
    
    if (var_objEditModal && var_objEditPalavra && var_objEditPronuncia) {
        var_objEditPalavra.value = var_strPalavra;
        var_objEditPronuncia.value = var_strPronuncia;
        
        // Armazenar dados para salvar
        var_objEditModal.setAttribute('data-original-palavra', var_strPalavra);
        
        var_objEditModal.classList.add('mui-modal--open');
        var_objEditPalavra.focus();
    }
}

function _func_FecharModalEdicao() {
    const var_objEditModal = document.getElementById('editModal');
    if (var_objEditModal) {
        var_objEditModal.classList.remove('mui-modal--open');
    }
}

async function _func_SalvarEdicao() {
    const var_objEditModal = document.getElementById('editModal');
    const var_objEditPalavra = document.getElementById('editPalavra');
    const var_objEditPronuncia = document.getElementById('editPronuncia');
    
    if (!var_objEditModal || !var_objEditPalavra || !var_objEditPronuncia) return;
    
    const var_strPalavraOriginal = var_objEditModal.getAttribute('data-original-palavra');
    const var_strNovaPalavra = var_objEditPalavra.value.trim();
    const var_strNovaPronuncia = var_objEditPronuncia.value.trim();
    
    if (!var_strNovaPalavra || !var_strNovaPronuncia) {
        _func_MostrarNotificacao('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        // Remover entrada antiga
        await _func_RemoverEntradaPronuncia(var_strPalavraOriginal, false);
        
        // Adicionar nova entrada
        const var_objResposta = await fetch('/dicionario-pronuncia/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                palavra: var_strNovaPalavra,
                pronuncia: var_strNovaPronuncia
            })
        });
        
        const var_dicResultado = await var_objResposta.json();
        
        if (var_dicResultado.success) {
            _func_MostrarNotificacao('Entrada editada com sucesso!', 'success');
            _func_FecharModalEdicao();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            _func_MostrarNotificacao(var_dicResultado.error, 'error');
        }
        
    } catch (var_objErro) {
        console.error('Erro ao editar entrada:', var_objErro);
        _func_MostrarNotificacao('Erro ao editar entrada. Tente novamente.', 'error');
    }
}

function _func_MostrarNotificacao(var_strMensagem, var_strTipo) {
    const var_objNotificacoes = document.getElementById('notificacoes');
    if (!var_objNotificacoes) return;
    
    const var_objNotificacao = document.createElement('div');
    var_objNotificacao.className = `mui-notification mui-notification--${var_strTipo}`;
    var_objNotificacao.innerHTML = `
        <div class="mui-notification-content">
            <i class="mui-icon">${_func_ObterIconeNotificacao(var_strTipo)}</i>
            <span>${var_strMensagem}</span>
        </div>
        <button class="mui-notification-close" onclick="this.parentElement.remove()">
            <i class="mui-icon">close</i>
        </button>
    `;
    
    var_objNotificacoes.appendChild(var_objNotificacao);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (var_objNotificacao.parentElement) {
            var_objNotificacao.style.opacity = '0';
            setTimeout(() => {
                if (var_objNotificacao.parentElement) {
                    var_objNotificacao.remove();
                }
            }, 300);
        }
    }, 5000);
}

function _func_ObterIconeNotificacao(var_strTipo) {
    const var_dicIcones = {
        'success': 'check_circle',
        'error': 'error',
        'warning': 'warning',
        'info': 'info'
    };
    return var_dicIcones[var_strTipo] || 'info';
}

// ===== FUNÇÕES PARA TESTAR PRONÚNCIA =====

// Configurar eventos para testar pronúncia
function _func_ConfigurarEventosTestePronuncia() {
    // Habilitar/desabilitar botão de testar no formulário
    const var_objCampoPronuncia = document.getElementById('pronuncia');
    const var_objBtnTestar = document.getElementById('btnTestarPronuncia');
    
    if (var_objCampoPronuncia && var_objBtnTestar) {
        var_objCampoPronuncia.addEventListener('input', function() {
            var_objBtnTestar.disabled = !this.value.trim();
        });
    }
    
    // Habilitar/desabilitar botão de testar no modal
    const var_objCampoPronunciaModal = document.getElementById('editPronuncia');
    const var_objBtnTestarModal = document.getElementById('btnTestarPronunciaModal');
    
    if (var_objCampoPronunciaModal && var_objBtnTestarModal) {
        var_objCampoPronunciaModal.addEventListener('input', function() {
            var_objBtnTestarModal.disabled = !this.value.trim();
        });
    }
}

// Testar pronúncia de uma entrada existente
function _func_TestarPronuncia(pronuncia) {
    if (!pronuncia || !pronuncia.trim()) {
        _func_MostrarNotificacao('Nenhuma pronúncia para testar', 'warning');
        return;
    }
    
    _func_ExecutarTestePronuncia(pronuncia);
}

// Testar pronúncia do formulário de adição
function _func_TestarPronunciaFormulario() {
    const var_objCampoPronuncia = document.getElementById('pronuncia');
    if (!var_objCampoPronuncia || !var_objCampoPronuncia.value.trim()) {
        _func_MostrarNotificacao('Digite uma pronúncia para testar', 'warning');
        return;
    }
    
    _func_ExecutarTestePronuncia(var_objCampoPronuncia.value.trim());
}

// Testar pronúncia do modal de edição
function _func_TestarPronunciaModal() {
    const var_objCampoPronuncia = document.getElementById('editPronuncia');
    if (!var_objCampoPronuncia || !var_objCampoPronuncia.value.trim()) {
        _func_MostrarNotificacao('Digite uma pronúncia para testar', 'warning');
        return;
    }
    
    _func_ExecutarTestePronuncia(var_objCampoPronuncia.value.trim());
}

// Executar o teste de pronúncia usando TTS
function _func_ExecutarTestePronuncia(pronuncia) {
    // Verificar se o navegador suporta speech synthesis
    if (!window.speechSynthesis) {
        _func_MostrarNotificacao('Seu navegador não suporta síntese de fala', 'error');
        return;
    }
    
    // Cancelar qualquer fala em andamento
    window.speechSynthesis.cancel();
    
    // Criar utterance
    const utterance = new SpeechSynthesisUtterance(pronuncia);
    
    // Configurar voz em português se disponível
    const voices = window.speechSynthesis.getVoices();
    const portugueseVoice = voices.find(voice => 
        voice.lang.includes('pt') || voice.lang.includes('pt-BR') || voice.lang.includes('pt-PT')
    );
    
    if (portugueseVoice) {
        utterance.voice = portugueseVoice;
    }
    
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Velocidade um pouco mais lenta
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Eventos para feedback
    utterance.onstart = function() {
        _func_MostrarNotificacao('Reproduzindo pronúncia...', 'info');
    };
    
    utterance.onend = function() {
        _func_MostrarNotificacao('Teste de pronúncia concluído', 'success');
    };
    
    utterance.onerror = function(event) {
        console.error('Erro na síntese de fala:', event);
        _func_MostrarNotificacao('Erro ao reproduzir pronúncia', 'error');
    };
    
    // Executar a fala
    window.speechSynthesis.speak(utterance);
}

// ===== FUNÇÕES PARA CONFIGURAR UPLOAD =====

// Configurar área de upload
function _func_ConfigurarAreaUpload() {
    const var_objUploadArea = document.getElementById('dicionarioUploadArea');
    const var_objArquivoInput = document.getElementById('arquivoPronuncia');
    
    if (var_objUploadArea && var_objArquivoInput) {
        // Clique na área de upload
        var_objUploadArea.addEventListener('click', function() {
            var_objArquivoInput.click();
        });
        
        // Drag and drop
        var_objUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('mui-upload-area--dragover');
        });
        
        var_objUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('mui-upload-area--dragover');
        });
        
        var_objUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('mui-upload-area--dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                var_objArquivoInput.files = files;
                _func_AtualizarNomeArquivo(files[0].name);
            }
        });
        
        // Mudança no input de arquivo
        var_objArquivoInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                _func_AtualizarNomeArquivo(this.files[0].name);
            }
        });
    }
}

// Atualizar nome do arquivo na área de upload
function _func_AtualizarNomeArquivo(nomeArquivo) {
    const var_objUploadArea = document.getElementById('dicionarioUploadArea');
    if (var_objUploadArea) {
        const var_objTexto = var_objUploadArea.querySelector('.mui-upload-text');
        if (var_objTexto) {
            var_objTexto.innerHTML = `<strong>Arquivo selecionado:</strong> ${nomeArquivo}`;
        }
    }
} 