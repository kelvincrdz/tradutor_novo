// Dados dos capítulos
let var_listCapitulos = [];
let var_intCapituloAtual = 0;
let var_boolMostrandoOriginal = false;

// Elementos do DOM
let var_objListaCapitulos;
let var_objTextoLeitor;
let var_objCapituloAtual;
let var_objTotalCapitulos;
let var_objBotaoAnterior;
let var_objBotaoProximo;
let var_objBotaoTraduzir;
let var_objBotaoTraduzirTudo;
let var_objBotaoAlternarOriginal;
let var_objOverlayCarregamento;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    _func_InicializarElementos();
    _func_InicializarLeitor();
    // Configurar barra de dicionário rápido após inicializar o leitor
    setTimeout(() => {
        _func_ConfigurarBarraDicionarioRapido();
    }, 100);
});

function _func_InicializarElementos() {
    // Elementos do DOM
    var_objListaCapitulos = document.getElementById('chapterList');
    var_objTextoLeitor = document.getElementById('readerText');
    var_objCapituloAtual = document.getElementById('currentChapter');
    var_objTotalCapitulos = document.getElementById('totalChapters');
    var_objBotaoAnterior = document.getElementById('prevChapter');
    var_objBotaoProximo = document.getElementById('nextChapter');
    var_objBotaoTraduzir = document.getElementById('translateBtn');
    var_objBotaoTraduzirTudo = document.getElementById('translateAllBtn');
    var_objBotaoAlternarOriginal = document.getElementById('toggleOriginalBtn');
    var_objOverlayCarregamento = document.getElementById('loadingOverlay');
}

function _func_InicializarLeitor() {
    // Verificar se o DOM está completamente carregado
    if (document.readyState !== 'complete') {
        console.warn('DOM não está completamente carregado, tentando novamente em 100ms');
        setTimeout(_func_InicializarLeitor, 100);
        return;
    }
    
    // Verificar se todos os elementos necessários existem
    if (!var_objListaCapitulos || !var_objBotaoAnterior || !var_objBotaoProximo || 
        !var_objBotaoTraduzir || !var_objBotaoTraduzirTudo || !var_objBotaoAlternarOriginal) {
        console.error('Alguns elementos do leitor não foram encontrados');
        return;
    }

    // Configurar navegação de capítulos
    var_objListaCapitulos.addEventListener('click', function(var_objEvento) {
        if (var_objEvento.target.closest('.mui-chapter-item')) {
            const var_objItemCapitulo = var_objEvento.target.closest('.mui-chapter-item');
            const var_intIndiceCapitulo = parseInt(var_objItemCapitulo.dataset.chapter);
            _func_CarregarCapitulo(var_intIndiceCapitulo);
        }
    });

    // Configurar botões de navegação
    var_objBotaoAnterior.addEventListener('click', function() {
        if (var_intCapituloAtual > 0) {
            _func_CarregarCapitulo(var_intCapituloAtual - 1);
        }
    });

    var_objBotaoProximo.addEventListener('click', function() {
        if (var_intCapituloAtual < var_listCapitulos.length - 1) {
            _func_CarregarCapitulo(var_intCapituloAtual + 1);
        }
    });

    // Configurar botão de tradução
    var_objBotaoTraduzir.addEventListener('click', function() {
        _func_TraduzirCapituloAtual();
    });

    // Configurar botão de traduzir tudo
    var_objBotaoTraduzirTudo.addEventListener('click', function() {
        _func_TraduzirTodosCapitulos();
    });

    // Configurar botão de alternar original
    var_objBotaoAlternarOriginal.addEventListener('click', function() {
        _func_AlternarVisualizacaoOriginal();
    });

    // Atualizar informações iniciais
    _func_AtualizarInformacoesCapitulo();
}

function _func_CarregarCapitulo(var_intIndice) {
    // Verificar se o DOM está completamente carregado
    if (document.readyState !== 'complete') {
        console.warn('DOM não está completamente carregado, tentando novamente em 100ms');
        setTimeout(() => _func_CarregarCapitulo(var_intIndice), 100);
        return;
    }
    
    if (var_intIndice < 0 || var_intIndice >= var_listCapitulos.length) {
        return;
    }

    // Verificar se os elementos necessários existem
    if (!var_objTextoLeitor || !var_objListaCapitulos || !var_objCapituloAtual || 
        !var_objTotalCapitulos || !var_objBotaoAnterior || !var_objBotaoProximo || 
        !var_objBotaoAlternarOriginal) {
        console.error('Alguns elementos para carregar capítulo não foram encontrados');
        return;
    }

    var_intCapituloAtual = var_intIndice;
    const var_dicCapitulo = var_listCapitulos[var_intIndice];

    // Atualizar conteúdo
    var_objTextoLeitor.innerHTML = `
        <div class="mui-chapter-content" data-chapter="${var_intIndice}">
            <h2 class="mui-chapter-title">${var_dicCapitulo.title}</h2>
            <div class="mui-chapter-text">
                ${var_boolMostrandoOriginal && var_dicCapitulo.original_content 
                    ? var_dicCapitulo.original_content.replace(/\n/g, '<br>')
                    : var_dicCapitulo.content.replace(/\n/g, '<br>')}
            </div>
        </div>
    `;

    // Atualizar seleção na lista
    const var_listItensCapitulo = var_objListaCapitulos.querySelectorAll('.mui-chapter-item');
    var_listItensCapitulo.forEach((var_objItem, var_intIndiceItem) => {
        if (var_intIndiceItem === var_intIndice) {
            var_objItem.classList.add('mui-chapter-item--active');
        } else {
            var_objItem.classList.remove('mui-chapter-item--active');
        }
    });

    // Atualizar informações do capítulo
    _func_AtualizarInformacoesCapitulo();

    // Atualizar estado dos botões
    var_objBotaoAnterior.disabled = var_intIndice === 0;
    var_objBotaoProximo.disabled = var_intIndice === var_listCapitulos.length - 1;

    // Mostrar/ocultar botão de alternar original
    if (var_dicCapitulo.original_content && var_dicCapitulo.translated_content) {
        var_objBotaoAlternarOriginal.style.display = 'inline-flex';
    } else {
        var_objBotaoAlternarOriginal.style.display = 'none';
    }
}

function _func_AtualizarInformacoesCapitulo() {
    // Verificar se o DOM está completamente carregado
    if (document.readyState !== 'complete') {
        console.warn('DOM não está completamente carregado, tentando novamente em 100ms');
        setTimeout(_func_AtualizarInformacoesCapitulo, 100);
        return;
    }
    
    if (!var_objCapituloAtual || !var_objTotalCapitulos) {
        console.error('Elementos para atualizar informações do capítulo não foram encontrados');
        return;
    }
    
    var_objCapituloAtual.textContent = var_intCapituloAtual + 1;
    var_objTotalCapitulos.textContent = var_listCapitulos.length;
}

function _func_AlternarVisualizacaoOriginal() {
    var_boolMostrandoOriginal = !var_boolMostrandoOriginal;
    
    const var_dicCapitulo = var_listCapitulos[var_intCapituloAtual];
    const var_objTextoCapitulo = var_objTextoLeitor.querySelector('.mui-chapter-text');
    
    if (var_objTextoCapitulo) {
        if (var_boolMostrandoOriginal && var_dicCapitulo.original_content) {
            var_objTextoCapitulo.innerHTML = var_dicCapitulo.original_content.replace(/\n/g, '<br>');
            var_objBotaoAlternarOriginal.innerHTML = '<span class="mui-icon mui-icon--translate"></span> Ver tradução';
        } else {
            var_objTextoCapitulo.innerHTML = var_dicCapitulo.content.replace(/\n/g, '<br>');
            var_objBotaoAlternarOriginal.innerHTML = '<span class="mui-icon mui-icon--visibility"></span> Ver original';
        }
    }
}

function _func_TraduzirCapituloAtual() {
    // Verificar se o DOM está completamente carregado
    if (document.readyState !== 'complete') {
        console.warn('DOM não está completamente carregado, tentando novamente em 100ms');
        setTimeout(_func_TraduzirCapituloAtual, 100);
        return;
    }
    
    if (!var_objOverlayCarregamento || !var_objBotaoTraduzir) {
        console.error('Elementos para tradução não foram encontrados');
        return;
    }
    
    const var_dicCapitulo = var_listCapitulos[var_intCapituloAtual];
    
    // Verificar se já tem tradução
    if (var_dicCapitulo.translated_content) {
        _func_MostrarNotificacao('Este capítulo já foi traduzido.', 'info');
        return;
    }

    // Mostrar overlay de carregamento
    var_objOverlayCarregamento.classList.add('mui-loading-overlay--show');
    var_objBotaoTraduzir.innerHTML = '<span class="mui-icon mui-icon--hourglass_empty"></span> Traduzindo...';
    var_objBotaoTraduzir.disabled = true;

    // Enviar requisição de tradução
    fetch('/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: var_dicCapitulo.original_content || var_dicCapitulo.content,
            source_lang: 'auto',
            target_lang: 'pt',
            chapter_index: var_intCapituloAtual,
            file_id: window.fileId
        })
    })
    .then(var_objResposta => var_objResposta.json())
    .then(var_dicDados => {
        if (var_dicDados.translated_text) {
            // Atualizar capítulo com a tradução
            var_listCapitulos[var_intCapituloAtual].translated_content = var_dicDados.translated_text;
            var_listCapitulos[var_intCapituloAtual].content = var_dicDados.translated_text;
            if (!var_listCapitulos[var_intCapituloAtual].original_content) {
                var_listCapitulos[var_intCapituloAtual].original_content = var_dicCapitulo.content;
            }

            // Atualizar o conteúdo diretamente no mui-chapter-content
            const var_objTextoCapitulo = var_objTextoLeitor.querySelector('.mui-chapter-text');
            if (var_objTextoCapitulo) {
                var_objTextoCapitulo.innerHTML = var_dicDados.translated_text.replace(/\n/g, '<br>');
            }
            
            // Mostrar botão de alternar original
            var_objBotaoAlternarOriginal.style.display = 'inline-flex';
            
            _func_MostrarNotificacao('Capítulo traduzido com sucesso!', 'success');
        } else {
            throw new Error(var_dicDados.error || 'Erro desconhecido');
        }
    })
    .catch(var_objErro => {
        _func_MostrarNotificacao('Erro ao traduzir: ' + var_objErro.message, 'error');
    })
    .finally(() => {
        var_objBotaoTraduzir.innerHTML = '<span class="mui-icon mui-icon--translate"></span> Traduzir Capítulo';
        var_objBotaoTraduzir.disabled = false;
        var_objOverlayCarregamento.classList.remove('mui-loading-overlay--show');
    });
}

function _func_TraduzirTodosCapitulos() {
    // Verificar se o DOM está completamente carregado
    if (document.readyState !== 'complete') {
        console.warn('DOM não está completamente carregado, tentando novamente em 100ms');
        setTimeout(_func_TraduzirTodosCapitulos, 100);
        return;
    }
    
    const var_objModalProgresso = document.getElementById('progressModal');
    const var_objTextoProgresso = document.getElementById('progressText');
    const var_objDetalhesProgresso = document.getElementById('progressDetails');
    const var_objPreenchimentoProgresso = document.getElementById('progressFill');
    const var_objPorcentagemProgresso = document.getElementById('progressPercentage');
    const var_objBotaoDownload = document.getElementById('downloadTranslatedBtn');
    const var_objBotaoCancelar = document.getElementById('cancelProgress');
    const var_objSimultaneo = document.getElementById('progressSimultaneous');
    const var_objBotaoCancelarTraducao = document.getElementById('cancelProgressBtn');
    
    // Verificar se todos os elementos do modal existem
    if (!var_objModalProgresso || !var_objTextoProgresso || !var_objDetalhesProgresso || 
        !var_objPreenchimentoProgresso || !var_objPorcentagemProgresso || 
        !var_objBotaoDownload || !var_objBotaoCancelar || !var_objSimultaneo || !var_objBotaoCancelarTraducao) {
        console.error('Elementos do modal de progresso não foram encontrados');
        _func_MostrarNotificacao('Erro ao abrir modal de progresso', 'error');
        return;
    }
    
    // Verificar se já foi traduzido
    const var_boolJaTraduzido = var_listCapitulos.every(var_dicCapitulo => var_dicCapitulo.translated_content || var_dicCapitulo._originalContent);
    
    if (var_boolJaTraduzido) {
        // Se já foi traduzido, perguntar se quer traduzir novamente
        if (confirm('Este EPUB já foi traduzido. Deseja traduzir novamente?')) {
            _func_IniciarTraducaoSimultanea();
        } else {
            // Se não quiser traduzir novamente, apenas atualizar o conteúdo atual
            _func_AtualizarConteudoAposTraducao();
        }
        return;
    }
    
    _func_IniciarTraducaoSimultanea();
    
    function _func_IniciarTraducaoSimultanea() {
        // Verificar se todos os elementos do modal existem novamente
        if (!var_objModalProgresso || !var_objTextoProgresso || !var_objDetalhesProgresso || 
            !var_objPreenchimentoProgresso || !var_objPorcentagemProgresso || 
            !var_objBotaoDownload || !var_objBotaoCancelar || !var_objSimultaneo || !var_objBotaoCancelarTraducao) {
            console.error('Elementos do modal de progresso não foram encontrados na inicialização');
            _func_MostrarNotificacao('Erro ao inicializar tradução', 'error');
            return;
        }
        
        // Mostrar modal de progresso
        var_objModalProgresso.classList.add('mui-modal--open');
        
        // Mostrar botão de cancelar tradução
        var_objBotaoCancelarTraducao.style.display = 'inline-flex';
        var_objBotaoDownload.style.display = 'none';
        var_objBotaoCancelar.style.display = 'none';
        
        // Configurar progresso inicial
        const var_intTotalCapitulos = var_listCapitulos.length;
        let var_intCapitulosCompletados = 0;
        let var_intCapitulosEmAndamento = 0;
        const var_intMaximoSimultaneo = 3; // Máximo de 3 traduções simultâneas
        let var_boolTraducaoCancelada = false;
        
        // Array para controlar quais capítulos estão sendo traduzidos
        const var_listCapitulosEmAndamento = new Set();
        
        function _func_AtualizarProgresso() {
            if (!var_objPreenchimentoProgresso || !var_objPorcentagemProgresso || !var_objDetalhesProgresso) {
                console.error('Elementos de progresso não foram encontrados');
                return;
            }
            
            const var_intPorcentagem = Math.round((var_intCapitulosCompletados / var_intTotalCapitulos) * 100);
            var_objPreenchimentoProgresso.style.width = `${var_intPorcentagem}%`;
            var_objPorcentagemProgresso.textContent = `${var_intPorcentagem}%`;
            
            if (var_intCapitulosEmAndamento > 0) {
                var_objDetalhesProgresso.textContent = `${var_intCapitulosCompletados} completados, ${var_intCapitulosEmAndamento} em andamento de ${var_intTotalCapitulos}`;
                // Mostrar indicador de tradução simultânea
                if (var_objSimultaneo) {
                    var_objSimultaneo.style.display = 'flex';
                }
            } else {
                var_objDetalhesProgresso.textContent = `${var_intCapitulosCompletados} de ${var_intTotalCapitulos} capítulos traduzidos`;
                // Ocultar indicador de tradução simultânea
                if (var_objSimultaneo) {
                    var_objSimultaneo.style.display = 'none';
                }
            }
        }
        
        function _func_TraduzirCapitulo(var_intIndice) {
            if (var_boolTraducaoCancelada) {
                return;
            }
            
            if (!var_objTextoProgresso || !var_objPreenchimentoProgresso || !var_objPorcentagemProgresso || 
                !var_objDetalhesProgresso || !var_objBotaoDownload || !var_objBotaoCancelar || !var_objBotaoCancelarTraducao) {
                console.error('Elementos de progresso não foram encontrados na tradução');
                _func_MostrarNotificacao('Erro ao traduzir capítulo', 'error');
                return;
            }
            
            if (var_intIndice >= var_intTotalCapitulos) {
                // Verificar se ainda há traduções em andamento
                if (var_intCapitulosEmAndamento > 0) {
                    // Aguardar um pouco e verificar novamente
                    setTimeout(() => _func_VerificarConclusao(), 500);
                    return;
                }
                
                // Tradução completa
                _func_FinalizarTraducao();
                return;
            }
            
            // Verificar se já atingiu o limite de traduções simultâneas
            if (var_intCapitulosEmAndamento >= var_intMaximoSimultaneo) {
                // Aguardar um pouco e tentar novamente
                setTimeout(() => _func_TraduzirCapitulo(var_intIndice), 1000);
                return;
            }
            
            // Iniciar tradução deste capítulo
            var_intCapitulosEmAndamento++;
            var_listCapitulosEmAndamento.add(var_intIndice);
            _func_AtualizarProgresso();
            
            var_objTextoProgresso.textContent = `Traduzindo capítulos simultaneamente...`;
            
            const var_dicCapitulo = var_listCapitulos[var_intIndice];
            
            fetch('/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: var_dicCapitulo.content,
                    source_lang: 'auto',
                    target_lang: 'pt',
                    chapter_index: var_intIndice,
                    file_id: window.fileId
                })
            })
            .then(var_objResposta => var_objResposta.json())
            .then(var_dicDados => {
                if (var_boolTraducaoCancelada) {
                    return;
                }
                
                if (var_dicDados.translated_text) {
                    var_listCapitulos[var_intIndice].content = var_dicDados.translated_text;
                    var_listCapitulos[var_intIndice].translated_content = var_dicDados.translated_text;
                    var_listCapitulos[var_intIndice]._originalContent = var_listCapitulos[var_intIndice].original_content || var_listCapitulos[var_intIndice].content;
                    
                    // Se este é o capítulo atual, atualizar a visualização
                    if (var_intIndice === var_intCapituloAtual) {
                        _func_CarregarCapitulo(var_intCapituloAtual);
                    }
                    
                    // Marcar como concluído
                    var_intCapitulosCompletados++;
                    var_intCapitulosEmAndamento--;
                    var_listCapitulosEmAndamento.delete(var_intIndice);
                    _func_AtualizarProgresso();
                    
                    // Continuar com próximo capítulo
                    _func_TraduzirCapitulo(var_intIndice + 1);
                } else {
                    throw new Error(var_dicDados.error || 'Erro desconhecido');
                }
            })
            .catch(var_objErro => {
                if (var_boolTraducaoCancelada) {
                    return;
                }
                
                console.error(`Erro ao traduzir capítulo ${var_intIndice + 1}:`, var_objErro);
                
                // Marcar como concluído (com erro)
                var_intCapitulosCompletados++;
                var_intCapitulosEmAndamento--;
                var_listCapitulosEmAndamento.delete(var_intIndice);
                _func_AtualizarProgresso();
                
                // Continuar com próximo capítulo mesmo com erro
                _func_TraduzirCapitulo(var_intIndice + 1);
            });
        }
        
        function _func_VerificarConclusao() {
            if (var_intCapitulosEmAndamento > 0) {
                // Ainda há traduções em andamento, verificar novamente
                setTimeout(() => _func_VerificarConclusao(), 500);
            } else {
                // Todas as traduções foram concluídas
                _func_FinalizarTraducao();
            }
        }
        
        function _func_FinalizarTraducao() {
            if (!var_objTextoProgresso || !var_objPreenchimentoProgresso || !var_objPorcentagemProgresso || 
                !var_objDetalhesProgresso || !var_objBotaoDownload || !var_objBotaoCancelar || !var_objBotaoCancelarTraducao) {
                console.error('Elementos de progresso não foram encontrados na finalização');
                return;
            }
            
            var_objTextoProgresso.textContent = 'Tradução concluída!';
            var_objPreenchimentoProgresso.style.width = '100%';
            var_objPorcentagemProgresso.textContent = '100%';
            var_objDetalhesProgresso.textContent = `${var_intTotalCapitulos} capítulos traduzidos`;
            
            // Ocultar indicador de tradução simultânea
            if (var_objSimultaneo) {
                var_objSimultaneo.style.display = 'none';
            }
            
            // Ocultar botão de cancelar tradução
            var_objBotaoCancelarTraducao.style.display = 'none';
            
            // Mostrar botão de download e fechar modal após 2 segundos
            setTimeout(() => {
                var_objBotaoDownload.style.display = 'inline-flex';
                var_objBotaoCancelar.style.display = 'inline-flex';
            }, 1000);
            
            // Atualizar conteúdo do leitor
            _func_AtualizarConteudoAposTraducao();
        }
        
        // Iniciar tradução simultânea
        _func_TraduzirCapitulo(0);
    }
    
    // Event listeners
    var_objBotaoCancelarTraducao.addEventListener('click', function() {
        if (!var_objModalProgresso || !var_objBotaoDownload || !var_objBotaoCancelar || !var_objBotaoCancelarTraducao) {
            console.error('Elementos do modal não foram encontrados no cancelar tradução');
            return;
        }
        
        var_boolTraducaoCancelada = true;
        var_objModalProgresso.classList.remove('mui-modal--open');
        var_objBotaoDownload.style.display = 'none';
        var_objBotaoCancelar.style.display = 'none';
        var_objBotaoCancelarTraducao.style.display = 'none';
        _func_MostrarNotificacao('Tradução cancelada pelo usuário', 'info');
    });
    
    var_objBotaoDownload.addEventListener('click', function() {
        if (!var_objModalProgresso || !var_objBotaoDownload || !var_objBotaoCancelar || !var_objBotaoCancelarTraducao) {
            console.error('Elementos do modal não foram encontrados no download');
            return;
        }
        
        var_objModalProgresso.classList.remove('mui-modal--open');
        var_objBotaoDownload.style.display = 'none';
        var_objBotaoCancelar.style.display = 'none';
        var_objBotaoCancelarTraducao.style.display = 'none';
        // Fazer download em nova aba
        window.open(`/download/${window.fileId}`, '_blank');
    });
}

// Função para atualizar conteúdo após tradução
function _func_AtualizarConteudoAposTraducao() {
    // Verificar se o DOM está completamente carregado
    if (document.readyState !== 'complete') {
        console.warn('DOM não está completamente carregado, tentando novamente em 100ms');
        setTimeout(_func_AtualizarConteudoAposTraducao, 100);
        return;
    }
    
    if (!var_objListaCapitulos) {
        console.error('Lista de capítulos não foi encontrada');
        return;
    }
    
    // Atualizar o capítulo atual se necessário
    _func_CarregarCapitulo(var_intCapituloAtual);
    
    // Atualizar a lista de capítulos para mostrar indicadores de tradução
    const var_listItensCapitulo = var_objListaCapitulos.querySelectorAll('.mui-chapter-item');
    var_listItensCapitulo.forEach((var_objItem, var_intIndiceItem) => {
        const var_dicCapitulo = var_listCapitulos[var_intIndiceItem];
        if (var_dicCapitulo.translated_content) {
            var_objItem.classList.add('mui-chapter-item--translated');
        }
    });
    
    // Mostrar notificação de sucesso
    _func_MostrarNotificacao('Tradução concluída! Todos os capítulos foram traduzidos.', 'success');
}

function _func_MostrarNotificacao(var_strMensagem, var_strTipo) {
    // Verificar se o DOM está completamente carregado
    if (document.readyState !== 'complete') {
        console.warn('DOM não está completamente carregado, tentando novamente em 100ms');
        setTimeout(() => _func_MostrarNotificacao(var_strMensagem, var_strTipo), 100);
        return;
    }
    
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

function _func_ConfigurarBarraDicionarioRapido() {
    // Verificar se o DOM está completamente carregado
    if (document.readyState !== 'complete') {
        console.warn('DOM não está completamente carregado, tentando novamente em 100ms');
        setTimeout(_func_ConfigurarBarraDicionarioRapido, 100);
        return;
    }
    
    const var_objTextoLeitor = document.getElementById('readerText');
    const var_objBarraDicionarioRapido = document.getElementById('quickDictBar');
    const var_objInputOriginal = document.getElementById('quickDictOriginal');
    const var_objInputTraducao = document.getElementById('quickDictTranslation');
    const var_objFormularioDicionario = document.getElementById('quickDictForm');
    const var_objBotaoCancelarDicionario = document.getElementById('quickDictCancel');

    // Verificar se todos os elementos existem
    if (!var_objTextoLeitor || !var_objBarraDicionarioRapido || !var_objInputOriginal || 
        !var_objInputTraducao || !var_objFormularioDicionario || !var_objBotaoCancelarDicionario) {
        console.warn('Alguns elementos da barra de dicionário rápido não foram encontrados');
        return;
    }

    // Detecta seleção de texto
    var_objTextoLeitor.addEventListener('mouseup', function() {
        setTimeout(() => {
            const var_objSelecao = window.getSelection();
            const var_strTextoSelecionado = var_objSelecao ? var_objSelecao.toString().trim() : '';
            if (var_strTextoSelecionado.length > 0) {
                var_objInputOriginal.value = var_strTextoSelecionado;
                var_objInputTraducao.value = '';
                var_objBarraDicionarioRapido.style.display = 'flex';
                var_objInputTraducao.focus();
            }
        }, 10);
    });

    // Cancela barra
    var_objBotaoCancelarDicionario.addEventListener('click', function() {
        var_objBarraDicionarioRapido.style.display = 'none';
        var_objInputOriginal.value = '';
        var_objInputTraducao.value = '';
        window.getSelection().removeAllRanges();
    });

    // Envia tradução personalizada
    var_objFormularioDicionario.addEventListener('submit', function(var_objEvento) {
        var_objEvento.preventDefault();
        const var_strOriginal = var_objInputOriginal.value.trim();
        const var_strTraduzido = var_objInputTraducao.value.trim();
        
        if (!var_strOriginal || !var_strTraduzido) {
            return;
        }
        
        const var_dicDadosRequisicao = { original: var_strOriginal, translated: var_strTraduzido };
        
        fetch('/dicionario/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(var_dicDadosRequisicao)
        })
        .then(var_objResposta => var_objResposta.json())
        .then(var_dicDados => {
            if (var_dicDados.success) {
                _func_MostrarNotificacao('Tradução adicionada ao dicionário!', 'success');
                var_objBarraDicionarioRapido.style.display = 'none';
                var_objInputOriginal.value = '';
                var_objInputTraducao.value = '';
                window.getSelection().removeAllRanges();
            } else {
                _func_MostrarNotificacao('Erro ao adicionar: ' + (var_dicDados.error || 'Erro desconhecido'), 'error');
            }
        })
        .catch(var_objErro => {
            _func_MostrarNotificacao('Erro ao adicionar: ' + var_objErro.message, 'error');
        });
    });
}

// Função para inicializar dados dos capítulos
function _func_InicializarDadosCapitulos(dadosCapitulos, fileId) {
    var_listCapitulos = dadosCapitulos;
    window.fileId = fileId;
}