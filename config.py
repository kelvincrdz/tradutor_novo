import os

class Config:
    """Configurações base da aplicação"""
    
    # Configurações básicas
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sua_chave_secreta_aqui'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Configurações de upload
    UPLOAD_FOLDER = 'uploads'
    EPUB_FOLDER = 'epub_files'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'epub'}
    
    # Configurações de tradução
    DEFAULT_SOURCE_LANG = 'auto'
    DEFAULT_TARGET_LANG = 'pt'
    
    # Idiomas suportados
    SUPPORTED_LANGUAGES = {
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
    CACHE_TIMEOUT = 3600  # 1 hora
    
    # Configurações de segurança
    SESSION_COOKIE_SECURE = False  # True em produção com HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Configurações de logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = 'epub_translator.log'

class DevelopmentConfig(Config):
    """Configurações para desenvolvimento"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Configurações para produção"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True
    
    # Em produção, use uma chave secreta forte
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(24)

class TestingConfig(Config):
    """Configurações para testes"""
    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False

# Dicionário de configurações
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 