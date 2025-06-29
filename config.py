import os

class _cls_Configuracao:
    """Configurações base da aplicação"""
    
    # Configurações básicas
    var_strChaveSecreta = os.environ.get('SECRET_KEY') or 'sua_chave_secreta_aqui'
    var_boolModoDebug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Configurações de upload
    var_strPastaUpload = 'uploads'
    var_strPastaEpub = 'epub_files'
    var_intTamanhoMaximoConteudo = 16 * 1024 * 1024  # 16MB max file size
    var_setExtensoesPermitidas = {'epub'}
    
    # Configurações de tradução
    var_strIdiomaOrigemPadrao = 'auto'
    var_strIdiomaDestinoPadrao = 'pt'
    
    # Idiomas suportados
    var_dicIdiomasSuportados = {
        'auto': 'Detectar automaticamente',
        'en': 'Inglês',
        'es': 'Espanhol',
        'fr': 'Francês',
        'de': 'Alemão',
        'it': 'Italiano',
        'pt': 'Português',
        'ja': 'Japonês',
        'ko': 'Coreano',
        'zh': 'Chinês',
        'ru': 'Russo',
        'ar': 'Árabe'
    }
    
    # Configurações de cache
    var_intTimeoutCache = 3600  # 1 hora
    
    # Configurações de segurança
    var_boolCookieSessaoSeguro = False  # True em produção com HTTPS
    var_boolCookieSessaoHttpOnly = True
    var_strCookieSessaoSameSite = 'Lax'
    
    # Configurações de logging
    var_strNivelLog = os.environ.get('LOG_LEVEL', 'INFO')
    var_strArquivoLog = 'epub_translator.log'

class _cls_ConfiguracaoDesenvolvimento(_cls_Configuracao):
    """Configurações para desenvolvimento"""
    var_boolModoDebug = True
    var_boolModoTeste = False

class _cls_ConfiguracaoProducao(_cls_Configuracao):
    """Configurações para produção"""
    var_boolModoDebug = False
    var_boolModoTeste = False
    var_boolCookieSessaoSeguro = True
    
    # Em produção, use uma chave secreta forte
    var_strChaveSecreta = os.environ.get('SECRET_KEY') or os.urandom(24)

class _cls_ConfiguracaoTeste(_cls_Configuracao):
    """Configurações para testes"""
    var_boolModoTeste = True
    var_boolModoDebug = True
    var_boolCSRFHabilitado = False

# Dicionário de configurações
var_dicConfiguracoes = {
    'development': _cls_ConfiguracaoDesenvolvimento,
    'production': _cls_ConfiguracaoProducao,
    'testing': _cls_ConfiguracaoTeste,
    'default': _cls_ConfiguracaoDesenvolvimento
} 