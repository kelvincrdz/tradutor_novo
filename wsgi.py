#!/usr/bin/env python3
"""
WSGI Configuration File para o EPUB Translator
Configuração para execução em produção
"""

import os
import sys

# Adicionar o diretório atual ao path
sys.path.insert(0, os.path.dirname(__file__))

# Configurar variáveis de ambiente para produção
os.environ['FLASK_ENV'] = 'production'
os.environ['FLASK_DEBUG'] = 'False'

# Importar a aplicação Flask
from app import app

# Configurações de produção
app.config['DEBUG'] = False
app.config['TESTING'] = False

# Configurar secret key para produção (deve ser alterada em produção)
if not app.config.get('SECRET_KEY'):
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configurar tamanho máximo de upload (50MB)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Configurar pasta de uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
EPUB_FOLDER = os.path.join(os.path.dirname(__file__), 'epub_files')

# Criar pastas se não existirem
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EPUB_FOLDER, exist_ok=True)

# Configurar pastas na aplicação
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['EPUB_FOLDER'] = EPUB_FOLDER

# Configurações de logging para produção
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    # Configurar logging para arquivo
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    file_handler = RotatingFileHandler(
        'logs/epub_translator.log', 
        maxBytes=10240000, 
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    
    app.logger.setLevel(logging.INFO)
    app.logger.info('EPUB Translator startup')

# Middleware para segurança básica
@app.after_request
def add_security_headers(response):
    """Adicionar headers de segurança básicos"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# Tratamento de erros para produção
@app.errorhandler(404)
def not_found_error(error):
    return {'error': 'Página não encontrada'}, 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Erro interno do servidor: {error}')
    return {'error': 'Erro interno do servidor'}, 500

@app.errorhandler(413)
def too_large(error):
    return {'error': 'Arquivo muito grande. Tamanho máximo: 50MB'}, 413

# Expor a aplicação para o PythonAnywhere
application = app

if __name__ == '__main__':
    # Para desenvolvimento local
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=False
    ) 