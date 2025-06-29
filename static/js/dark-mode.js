// Dark Mode Functionality
function _func_InicializarModoEscuro() {
    const var_objBotaoModoEscuro = document.getElementById('darkModeToggle');
    const var_objHtml = document.documentElement;
    
    // Check for saved theme preference or default to light mode
    const var_strTemaAtual = localStorage.getItem('theme') || 'light';
    var_objHtml.setAttribute('data-theme', var_strTemaAtual);
    _func_AtualizarIconeModoEscuro(var_strTemaAtual);
    
    // Toggle theme function
    function _func_AlternarTema() {
        const var_strTemaAtual = var_objHtml.getAttribute('data-theme');
        const var_strNovoTema = var_strTemaAtual === 'dark' ? 'light' : 'dark';
        
        var_objHtml.setAttribute('data-theme', var_strNovoTema);
        localStorage.setItem('theme', var_strNovoTema);
        _func_AtualizarIconeModoEscuro(var_strNovoTema);
    }
    
    // Update icon based on theme
    function _func_AtualizarIconeModoEscuro(var_strTema) {
        const var_objIcone = var_objBotaoModoEscuro.querySelector('.mui-icon');
        if (var_strTema === 'dark') {
            var_objIcone.className = 'mui-icon mui-icon--light-mode';
            var_objBotaoModoEscuro.title = 'Alternar Modo Claro';
        } else {
            var_objIcone.className = 'mui-icon mui-icon--dark-mode';
            var_objBotaoModoEscuro.title = 'Alternar Modo Escuro';
        }
    }
    
    // Add event listener
    if (var_objBotaoModoEscuro) {
        var_objBotaoModoEscuro.addEventListener('click', _func_AlternarTema);
    }
}

// Initialize dark mode when DOM is loaded
document.addEventListener('DOMContentLoaded', _func_InicializarModoEscuro); 