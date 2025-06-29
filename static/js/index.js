document.addEventListener('DOMContentLoaded', function() {
    const var_objAreaUpload = document.getElementById('uploadArea');
    const var_objInputArquivo = document.getElementById('fileInput');
    const var_objFormularioUpload = document.querySelector('.mui-upload-form');
    const var_objModalDuplicado = document.getElementById('duplicateModal');
    const var_objBotaoFecharModal = document.getElementById('closeDuplicateModal');
    const var_objOverlayModal = document.getElementById('duplicateModalOverlay');
    const var_objBotaoUsarExistente = document.getElementById('useExistingBtn');
    const var_objBotaoUploadNovo = document.getElementById('uploadNewBtn');
    
    let var_objArquivoAtual = null;
    let var_dicDadosDuplicado = null;
    
    // Verificar se todos os elementos existem
    if (!var_objAreaUpload || !var_objInputArquivo || !var_objFormularioUpload) {
        console.error('Elementos de upload não foram encontrados');
        return;
    }
    
    // Funcionalidade de drag and drop
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
            _func_ProcessarSelecaoArquivo();
        }
    });
    
    // Clique para selecionar arquivo
    var_objAreaUpload.addEventListener('click', function() {
        var_objInputArquivo.click();
    });
    
    // Mudança no input de arquivo
    var_objInputArquivo.addEventListener('change', function() {
        _func_ProcessarSelecaoArquivo();
    });
    
    function _func_ProcessarSelecaoArquivo() {
        if (var_objInputArquivo.files.length > 0) {
            const var_strNomeArquivo = var_objInputArquivo.files[0].name;
            const var_objTextoUpload = var_objAreaUpload.querySelector('.mui-upload-text');
            if (var_objTextoUpload) {
                var_objTextoUpload.innerHTML = `<strong>Arquivo selecionado:</strong> ${var_strNomeArquivo}`;
            }
            var_objArquivoAtual = var_objInputArquivo.files[0];
        }
    }
    
    // Envio do formulário
    var_objFormularioUpload.addEventListener('submit', function(var_objEvento) {
        var_objEvento.preventDefault();
        
        if (!var_objArquivoAtual) {
            utils.mostrarNotificacao('Por favor, selecione um arquivo.', 'error');
            return;
        }
        
        // Mostrar estado de carregamento
        const var_objBotaoEnviar = var_objFormularioUpload.querySelector('button[type="submit"]');
        const var_strTextoOriginal = var_objBotaoEnviar.innerHTML;
        var_objBotaoEnviar.disabled = true;
        var_objBotaoEnviar.innerHTML = '<span class="mui-icon mui-icon--upload"></span> Verificando...';
        
        // Criar FormData
        const var_objFormData = new FormData();
        var_objFormData.append('file', var_objArquivoAtual);
        
        // Enviar requisição
        fetch('/upload', {
            method: 'POST',
            body: var_objFormData
        })
        .then(var_objResposta => var_objResposta.json())
        .then(var_dicDados => {
            if (var_dicDados.duplicate) {
                // Mostrar modal de duplicado
                var_dicDadosDuplicado = var_dicDados;
                _func_MostrarModalDuplicado(var_dicDados);
            } else {
                // Redirecionar para o leitor
                window.location.href = var_dicDados.redirect_url;
            }
        })
        .catch(var_objErro => {
            utils.mostrarNotificacao('Erro ao fazer upload: ' + var_objErro.message, 'error');
        })
        .finally(() => {
            var_objBotaoEnviar.disabled = false;
            var_objBotaoEnviar.innerHTML = var_strTextoOriginal;
        });
    });
    
    function _func_MostrarModalDuplicado(var_dicDados) {
        if (!var_objModalDuplicado) {
            console.error('Modal de duplicado não foi encontrado');
            return;
        }
        
        // Atualizar conteúdo do modal
        const var_objTitulo = document.getElementById('duplicateTitle');
        const var_objCapitulos = document.getElementById('duplicateChapters');
        const var_objElementoStatus = document.getElementById('duplicateStatus');
        
        if (var_objTitulo) {
            var_objTitulo.textContent = var_dicDados.title;
        }
        if (var_objCapitulos) {
            var_objCapitulos.textContent = `Capítulos: ${var_dicDados.chapters_count}`;
        }
        
        if (var_objElementoStatus) {
            if (var_dicDados.has_translation) {
                var_objElementoStatus.className = 'mui-duplicate-status translated';
                var_objElementoStatus.innerHTML = '<span class="mui-icon mui-icon--check"></span><span>Já traduzido</span>';
            } else {
                var_objElementoStatus.className = 'mui-duplicate-status not-translated';
                var_objElementoStatus.innerHTML = '<span class="mui-icon mui-icon--translate"></span><span>Não traduzido</span>';
            }
        }
        
        // Mostrar modal
        var_objModalDuplicado.classList.add('mui-modal--open');
    }
    
    // Event listeners do modal
    if (var_objBotaoFecharModal) {
        var_objBotaoFecharModal.addEventListener('click', _func_FecharModal);
    }
    if (var_objOverlayModal) {
        var_objOverlayModal.addEventListener('click', _func_FecharModal);
    }
    
    if (var_objBotaoUsarExistente) {
        var_objBotaoUsarExistente.addEventListener('click', function() {
            if (var_dicDadosDuplicado) {
                window.location.href = `/reader/${var_dicDadosDuplicado.existing_file_id}`;
            }
        });
    }
    
    if (var_objBotaoUploadNovo) {
        var_objBotaoUploadNovo.addEventListener('click', function() {
            if (var_objArquivoAtual) {
                // Forçar upload
                const var_objFormData = new FormData();
                var_objFormData.append('file', var_objArquivoAtual);
                
                fetch('/upload/force', {
                    method: 'POST',
                    body: var_objFormData
                })
                .then(var_objResposta => var_objResposta.json())
                .then(var_dicDados => {
                    if (var_dicDados.success) {
                        window.location.href = var_dicDados.redirect_url;
                    } else {
                        utils.mostrarNotificacao('Erro ao fazer upload: ' + var_dicDados.error, 'error');
                    }
                })
                .catch(var_objErro => {
                    utils.mostrarNotificacao('Erro ao fazer upload: ' + var_objErro.message, 'error');
                });
            }
            _func_FecharModal();
        });
    }
    
    function _func_FecharModal() {
        if (var_objModalDuplicado) {
            var_objModalDuplicado.classList.remove('mui-modal--open');
        }
        // Resetar formulário
        var_objFormularioUpload.reset();
        var_objArquivoAtual = null;
        var_dicDadosDuplicado = null;
        const var_objTextoUpload = var_objAreaUpload.querySelector('.mui-upload-text');
        if (var_objTextoUpload) {
            var_objTextoUpload.innerHTML = '<strong>Clique para selecionar</strong> ou arraste o arquivo EPUB aqui';
        }
    }
}); 