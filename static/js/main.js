// Funções utilitárias e comuns para toda a aplicação

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo) {
    if (!mensagem || !tipo) {
        console.error('Parâmetros inválidos para notificação');
        return;
    }
    
    const notificacao = document.createElement('div');
    notificacao.className = `mui-notification mui-notification--${tipo}`;
    notificacao.innerHTML = `
        <span class="mui-icon mui-icon--${tipo === 'success' ? 'check' : 'error'}"></span>
        <span class="mui-notification__message">${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.classList.add('mui-notification--show');
    }, 100);
    
    setTimeout(() => {
        notificacao.classList.remove('mui-notification--show');
        setTimeout(() => {
            if (document.body.contains(notificacao)) {
                document.body.removeChild(notificacao);
            }
        }, 300);
    }, 3000);
}

// Função para verificar se o DOM está carregado
function aguardarDOM(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Função para fazer requisições fetch com tratamento de erro
async function fazerRequisicao(url, opcoes = {}) {
    try {
        const resposta = await fetch(url, opcoes);
        const dados = await resposta.json();
        
        if (!resposta.ok) {
            throw new Error(dados.error || `Erro ${resposta.status}: ${resposta.statusText}`);
        }
        
        return dados;
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        throw erro;
    }
}

// Função para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Função para throttle
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Função para formatar texto
function formatarTexto(texto, maxLength = 100) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
}

// Função para validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Função para validar arquivo
function validarArquivo(arquivo, tiposPermitidos = [], tamanhoMaximo = 10 * 1024 * 1024) {
    if (!arquivo) return { valido: false, erro: 'Nenhum arquivo selecionado' };
    
    if (tiposPermitidos.length > 0 && !tiposPermitidos.includes(arquivo.type)) {
        return { valido: false, erro: 'Tipo de arquivo não permitido' };
    }
    
    if (arquivo.size > tamanhoMaximo) {
        return { valido: false, erro: 'Arquivo muito grande' };
    }
    
    return { valido: true };
}

// Função para copiar texto para clipboard
async function copiarParaClipboard(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (erro) {
        console.error('Erro ao copiar para clipboard:', erro);
        return false;
    }
}

// Função para download de arquivo
function downloadArquivo(url, nomeArquivo) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para abrir modal
function abrirModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) {
        modal.classList.add('mui-modal--open');
    }
}

// Função para fechar modal
function fecharModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) {
        modal.classList.remove('mui-modal--open');
    }
}

// Função para mostrar loading
function mostrarLoading(idOverlay = 'loadingOverlay') {
    const overlay = document.getElementById(idOverlay);
    if (overlay) {
        overlay.classList.add('mui-loading-overlay--show');
    }
}

// Função para ocultar loading
function ocultarLoading(idOverlay = 'loadingOverlay') {
    const overlay = document.getElementById(idOverlay);
    if (overlay) {
        overlay.classList.remove('mui-loading-overlay--show');
    }
}

// Função para inicializar tooltips
function inicializarTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(elemento => {
        elemento.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'mui-tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            
            this._tooltip = tooltip;
        });
        
        elemento.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                document.body.removeChild(this._tooltip);
                this._tooltip = null;
            }
        });
    });
}

// Função para inicializar confirmações
function inicializarConfirmacoes() {
    document.addEventListener('click', function(evento) {
        if (evento.target.matches('[data-confirm]')) {
            const mensagem = evento.target.getAttribute('data-confirm');
            if (!confirm(mensagem)) {
                evento.preventDefault();
                evento.stopPropagation();
            }
        }
    });
}

// Função para inicializar formulários
function inicializarFormularios() {
    const formularios = document.querySelectorAll('form[data-ajax]');
    formularios.forEach(formulario => {
        formulario.addEventListener('submit', function(evento) {
            evento.preventDefault();
            
            const formData = new FormData(this);
            const url = this.action || window.location.pathname;
            const metodo = this.method || 'POST';
            
            mostrarLoading();
            
            fetch(url, {
                method: metodo,
                body: formData
            })
            .then(resposta => resposta.json())
            .then(dados => {
                if (dados.success) {
                    mostrarNotificacao(dados.message || 'Operação realizada com sucesso!', 'success');
                    if (dados.redirect) {
                        setTimeout(() => window.location.href = dados.redirect, 1000);
                    }
                } else {
                    mostrarNotificacao(dados.error || 'Erro na operação', 'error');
                }
            })
            .catch(erro => {
                mostrarNotificacao('Erro na requisição: ' + erro.message, 'error');
            })
            .finally(() => {
                ocultarLoading();
            });
        });
    });
}

// Inicialização quando o DOM estiver carregado
aguardarDOM(function() {
    inicializarTooltips();
    inicializarConfirmacoes();
    inicializarFormularios();
    // Estatísticas
    const botaoEstatisticas = document.getElementById('botao_estatisticas');
    const modalEstatisticas = document.getElementById('modal_estatisticas');
    const botaoFecharEstatisticas = document.getElementById('botao_fechar_estatisticas');
    if (botaoEstatisticas && modalEstatisticas) {
        botaoEstatisticas.addEventListener('click', function() {
            modalEstatisticas.style.display = 'flex';
            if (typeof inicializarEstatisticas === 'function') inicializarEstatisticas();
        });
    }
    if (botaoFecharEstatisticas && modalEstatisticas) {
        botaoFecharEstatisticas.addEventListener('click', function() {
            modalEstatisticas.style.display = 'none';
        });
    }
    // Marcadores
    const botaoMarcadores = document.getElementById('botao_marcadores');
    const modalMarcadores = document.getElementById('modal_marcadores');
    const botaoFecharMarcadores = document.getElementById('botao_fechar_marcadores');
    if (botaoMarcadores && modalMarcadores) {
        botaoMarcadores.addEventListener('click', function() {
            modalMarcadores.style.display = 'flex';
            if (typeof inicializarMarcadores === 'function') inicializarMarcadores();
        });
    }
    if (botaoFecharMarcadores && modalMarcadores) {
        botaoFecharMarcadores.addEventListener('click', function() {
            modalMarcadores.style.display = 'none';
        });
    }
    // Cronômetro
    const botaoCronometro = document.getElementById('botao_cronometro');
    const modalCronometro = document.getElementById('modal_cronometro');
    const botaoFecharCronometro = document.getElementById('botao_fechar_cronometro');
    if (botaoCronometro && modalCronometro) {
        botaoCronometro.addEventListener('click', function() {
            modalCronometro.style.display = 'flex';
            if (typeof inicializarCronometro === 'function') inicializarCronometro();
        });
    }
    if (botaoFecharCronometro && modalCronometro) {
        botaoFecharCronometro.addEventListener('click', function() {
            modalCronometro.style.display = 'none';
        });
    }
});

// Exportar funções para uso global
window.utils = {
    mostrarNotificacao,
    aguardarDOM,
    fazerRequisicao,
    debounce,
    throttle,
    formatarTexto,
    validarEmail,
    validarArquivo,
    copiarParaClipboard,
    downloadArquivo,
    abrirModal,
    fecharModal,
    mostrarLoading,
    ocultarLoading
}; 