document.addEventListener('DOMContentLoaded', function() {
    _func_ConfigurarFormularioAdicao();
    _func_ConfigurarUploadArquivo();
    _func_ConfigurarBusca();
    _func_ConfigurarModalEdicao();
});

function _func_ConfigurarFormularioAdicao() {
    const var_objFormularioAdicao = document.getElementById('addEntryForm');
    
    if (!var_objFormularioAdicao) {
        console.error('Formulário de adição não foi encontrado');
        return;
    }
    
    var_objFormularioAdicao.addEventListener('submit', function(var_objEvento) {
        var_objEvento.preventDefault();
        _func_AdicionarEntrada();
    });
}

function _func_ConfigurarUploadArquivo() {
    const var_objFormularioUpload = document.getElementById('uploadForm');
    const var_objAreaUpload = document.getElementById('dicionarioUploadArea');
    const var_objInputArquivo = document.getElementById('dicionarioFile');
    
    if (!var_objFormularioUpload || !var_objAreaUpload || !var_objInputArquivo) {
        console.error('Elementos de upload não foram encontrados');
        return;
    }
    
    var_objFormularioUpload.addEventListener('submit', function(var_objEvento) {
        var_objEvento.preventDefault();
        _func_UploadDicionario();
    });
    
    // Drag and drop functionality
    var_objAreaUpload.addEventListener('dragover', function(var_objEvento) {
        var_objEvento.preventDefault();
        var_objAreaUpload.classList.add('mui-upload-area--dragover');
    });
    
    var_objAreaUpload.addEventListener('dragleave', function(var_objEvento) {
        var_objEvento.preventDefault();
        var_objAreaUpload.classList.remove('mui-upload-area--dragover');
    });
    
    var_objAreaUpload.addEventListener('drop', function(var_objEvento) {
        var_objEvento.preventDefault();
        var_objAreaUpload.classList.remove('mui-upload-area--dragover');
        const var_listArquivos = var_objEvento.dataTransfer.files;
        if (var_listArquivos.length > 0) {
            var_objInputArquivo.files = var_listArquivos;
        }
    });
    
    // Click to select file
    var_objAreaUpload.addEventListener('click', function() {
        var_objInputArquivo.click();
    });
    
    // File input change
    var_objInputArquivo.addEventListener('change', function() {
        if (this.files.length > 0) {
            const var_strNomeArquivo = this.files[0].name;
            const var_objTextoUpload = var_objAreaUpload.querySelector('.mui-upload-text');
            if (var_objTextoUpload) {
                var_objTextoUpload.innerHTML = `<strong>Arquivo selecionado:</strong> ${var_strNomeArquivo}`;
            }
        }
    });
}

function _func_ConfigurarBusca() {
    const var_objInputBusca = document.getElementById('searchInput');
    const var_objResultadosBusca = document.getElementById('searchResults');
    
    if (!var_objInputBusca || !var_objResultadosBusca) {
        console.error('Elementos de busca não foram encontrados');
        return;
    }
    
    var_objInputBusca.addEventListener('input', function() {
        const var_strTermoBusca = this.value.toLowerCase().trim();
        
        if (var_strTermoBusca.length === 0) {
            var_objResultadosBusca.innerHTML = '';
            return;
        }
        
        // Buscar nas entradas do dicionário
        const var_listItensDicionario = document.querySelectorAll('.mui-dicionario-item');
        let var_intResultadosEncontrados = 0;
        
        var_listItensDicionario.forEach(var_objItem => {
            const var_strOriginal = var_objItem.querySelector('.mui-dicionario-item__original').textContent.toLowerCase();
            const var_strTraduzido = var_objItem.querySelector('.mui-dicionario-item__translated').textContent.toLowerCase();
            
            if (var_strOriginal.includes(var_strTermoBusca) || var_strTraduzido.includes(var_strTermoBusca)) {
                var_objItem.style.display = 'block';
                var_intResultadosEncontrados++;
            } else {
                var_objItem.style.display = 'none';
            }
        });
        
        // Mostrar contador de resultados
        if (var_intResultadosEncontrados > 0) {
            var_objResultadosBusca.innerHTML = `<p class="mui-search-count">${var_intResultadosEncontrados} resultado(s) encontrado(s)</p>`;
        } else {
            var_objResultadosBusca.innerHTML = '<p class="mui-search-count">Nenhum resultado encontrado</p>';
        }
    });
}

function _func_ConfigurarModalEdicao() {
    const var_objModalEdicao = document.getElementById('editModal');
    const var_objOverlayModal = document.getElementById('editModalOverlay');
    const var_objBotaoFecharModal = document.getElementById('closeEditModal');
    
    if (!var_objModalEdicao || !var_objOverlayModal || !var_objBotaoFecharModal) {
        console.error('Elementos do modal de edição não foram encontrados');
        return;
    }
    
    var_objBotaoFecharModal.addEventListener('click', _func_FecharModalEdicao);
    var_objOverlayModal.addEventListener('click', _func_FecharModalEdicao);
}

function _func_AdicionarEntrada() {
    const var_strOriginal = document.getElementById('originalText').value.trim();
    const var_strTraduzido = document.getElementById('translatedText').value.trim();
    
    if (!var_strOriginal || !var_strTraduzido) {
        _func_MostrarNotificacao('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    fetch('/dicionario/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            original: var_strOriginal,
            translated: var_strTraduzido
        })
    })
    .then(var_objResposta => var_objResposta.json())
    .then(var_dicDados => {
        if (var_dicDados.success) {
            _func_MostrarNotificacao('Entrada adicionada com sucesso!', 'success');
            document.getElementById('addEntryForm').reset();
            // Reload page to show new entry
            setTimeout(() => location.reload(), 1000);
        } else {
            _func_MostrarNotificacao('Erro ao adicionar entrada: ' + var_dicDados.error, 'error');
        }
    })
    .catch(var_objErro => {
        _func_MostrarNotificacao('Erro ao adicionar entrada: ' + var_objErro.message, 'error');
    });
}

function _func_UploadDicionario() {
    const var_objInputArquivo = document.getElementById('dicionarioFile');
    const var_objArquivo = var_objInputArquivo.files[0];
    
    if (!var_objArquivo) {
        _func_MostrarNotificacao('Por favor, selecione um arquivo.', 'error');
        return;
    }
    
    if (!var_objArquivo.name.endsWith('.json')) {
        _func_MostrarNotificacao('Por favor, selecione apenas arquivos JSON.', 'error');
        return;
    }
    
    const var_objFormData = new FormData();
    var_objFormData.append('dictionary_file', var_objArquivo);
    
    fetch('/dicionario/upload', {
        method: 'POST',
        body: var_objFormData
    })
    .then(var_objResposta => var_objResposta.json())
    .then(var_dicDados => {
        if (var_dicDados.success) {
            _func_MostrarNotificacao(var_dicDados.message, 'success');
            var_objInputArquivo.value = '';
            // Reload page to show new entries
            setTimeout(() => location.reload(), 1000);
        } else {
            _func_MostrarNotificacao('Erro ao importar dicionário: ' + var_dicDados.error, 'error');
        }
    })
    .catch(var_objErro => {
        _func_MostrarNotificacao('Erro ao importar dicionário: ' + var_objErro.message, 'error');
    });
}

function _func_EditarEntrada(var_strOriginal, var_strTraduzido) {
    const var_objInputOriginal = document.getElementById('editOriginalText');
    const var_objInputTraduzido = document.getElementById('editTranslatedText');
    const var_objModal = document.getElementById('editModal');
    
    if (!var_objInputOriginal || !var_objInputTraduzido || !var_objModal) {
        console.error('Elementos do modal de edição não foram encontrados');
        return;
    }
    
    var_objInputOriginal.value = var_strOriginal;
    var_objInputTraduzido.value = var_strTraduzido;
    var_objModal.classList.add('mui-modal--open');
}

function _func_FecharModalEdicao() {
    const var_objModal = document.getElementById('editModal');
    if (var_objModal) {
        var_objModal.classList.remove('mui-modal--open');
    }
}

function _func_SalvarEdicao() {
    const var_strOriginal = document.getElementById('editOriginalText').value.trim();
    const var_strTraduzido = document.getElementById('editTranslatedText').value.trim();
    
    if (!var_strOriginal || !var_strTraduzido) {
        _func_MostrarNotificacao('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    // For simplicity, we'll remove the old entry and add the new one
    // In a real application, you might want a dedicated edit endpoint
    fetch('/dicionario/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            original: var_strOriginal
        })
    })
    .then(() => {
        return fetch('/dicionario/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                original: var_strOriginal,
                translated: var_strTraduzido
            })
        });
    })
    .then(var_objResposta => var_objResposta.json())
    .then(var_dicDados => {
        if (var_dicDados.success) {
            _func_MostrarNotificacao('Entrada atualizada com sucesso!', 'success');
            _func_FecharModalEdicao();
            setTimeout(() => location.reload(), 1000);
        } else {
            _func_MostrarNotificacao('Erro ao atualizar entrada: ' + var_dicDados.error, 'error');
        }
    })
    .catch(var_objErro => {
        _func_MostrarNotificacao('Erro ao atualizar entrada: ' + var_objErro.message, 'error');
    });
}

function _func_RemoverEntrada(var_strOriginal) {
    if (!confirm('Tem certeza que deseja remover esta entrada?')) {
        return;
    }
    
    fetch('/dicionario/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            original: var_strOriginal
        })
    })
    .then(var_objResposta => var_objResposta.json())
    .then(var_dicDados => {
        if (var_dicDados.success) {
            _func_MostrarNotificacao('Entrada removida com sucesso!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            _func_MostrarNotificacao('Erro ao remover entrada: ' + var_dicDados.error, 'error');
        }
    })
    .catch(var_objErro => {
        _func_MostrarNotificacao('Erro ao remover entrada: ' + var_objErro.message, 'error');
    });
}

function _func_MostrarNotificacao(var_strMensagem, var_strTipo) {
    if (!var_strMensagem || !var_strTipo) {
        console.error('Parâmetros inválidos para notificação');
        return;
    }
    
    const var_objNotificacao = document.createElement('div');
    var_objNotificacao.className = `mui-notification mui-notification--${var_strTipo}`;
    var_objNotificacao.innerHTML = `
        <span class="mui-icon mui-icon--${var_strTipo === 'success' ? 'check' : 'error'}"></span>
        <span class="mui-notification__message">${var_strMensagem}</span>
    `;
    
    document.body.appendChild(var_objNotificacao);
    
    setTimeout(() => {
        var_objNotificacao.classList.add('mui-notification--show');
    }, 100);
    
    setTimeout(() => {
        var_objNotificacao.classList.remove('mui-notification--show');
        setTimeout(() => {
            if (document.body.contains(var_objNotificacao)) {
                document.body.removeChild(var_objNotificacao);
            }
        }, 300);
    }, 3000);
}

function _func_LimparDicionario() {
    // Confirmar com o usuário antes de limpar
    if (!confirm('ATENÇÃO: Esta ação irá remover TODAS as entradas do dicionário!\n\nEsta ação não pode ser desfeita. Tem certeza que deseja continuar?')) {
        return;
    }
    
    // Segunda confirmação para maior segurança
    if (!confirm('CONFIRMAÇÃO FINAL: Você está prestes a apagar todas as entradas do dicionário.\n\nDigite "LIMPAR" para confirmar:')) {
        return;
    }
    
    // Mostrar indicador de carregamento
    const var_objBotaoLimpar = event.target;
    const var_strTextoOriginal = var_objBotaoLimpar.innerHTML;
    var_objBotaoLimpar.innerHTML = '<span class="mui-icon mui-icon--sync"></span> Limpando...';
    var_objBotaoLimpar.disabled = true;
    
    fetch('/dicionario/clear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(var_objResposta => var_objResposta.json())
    .then(var_dicDados => {
        if (var_dicDados.success) {
            _func_MostrarNotificacao(var_dicDados.message, 'success');
            // Recarregar a página para mostrar o estado vazio
            setTimeout(() => location.reload(), 1000);
        } else {
            _func_MostrarNotificacao('Erro ao limpar dicionário: ' + var_dicDados.error, 'error');
            // Restaurar botão em caso de erro
            var_objBotaoLimpar.innerHTML = var_strTextoOriginal;
            var_objBotaoLimpar.disabled = false;
        }
    })
    .catch(var_objErro => {
        _func_MostrarNotificacao('Erro ao limpar dicionário: ' + var_objErro.message, 'error');
        // Restaurar botão em caso de erro
        var_objBotaoLimpar.innerHTML = var_strTextoOriginal;
        var_objBotaoLimpar.disabled = false;
    });
} 