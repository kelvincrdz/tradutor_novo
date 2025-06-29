#!/bin/bash

# Script de inicialização para produção - EPUB Translator
# Uso: ./start_production.sh

set -e

echo "🚀 Iniciando EPUB Translator em modo produção..."

# Verificar se o Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale o Python 3 primeiro."
    exit 1
fi

# Verificar se o pip está instalado
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 não encontrado. Instale o pip3 primeiro."
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p uploads
mkdir -p epub_files
mkdir -p logs

# Instalar dependências
echo "📦 Instalando dependências..."
pip3 install -r requirements.txt

# Verificar se o Gunicorn está instalado
if ! command -v gunicorn &> /dev/null; then
    echo "❌ Gunicorn não encontrado. Instalando..."
    pip3 install gunicorn
fi

# Carregar variáveis de ambiente se existir
if [ -f .env ]; then
    echo "🔧 Carregando variáveis de ambiente..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Definir variáveis padrão se não estiverem definidas
export FLASK_ENV=${FLASK_ENV:-production}
export FLASK_DEBUG=${FLASK_DEBUG:-False}
export PORT=${PORT:-8000}
export GUNICORN_BIND=${GUNICORN_BIND:-0.0.0.0:8000}
export GUNICORN_WORKERS=${GUNICORN_WORKERS:-4}

# Verificar permissões
echo "🔐 Verificando permissões..."
chmod 755 uploads
chmod 755 epub_files
chmod 755 logs

# Iniciar o servidor
echo "🌐 Iniciando servidor na porta $PORT..."
echo "📊 Workers: $GUNICORN_WORKERS"
echo "🔗 URL: http://localhost:$PORT"

# Executar com Gunicorn
exec gunicorn \
    --config gunicorn.conf.py \
    --bind $GUNICORN_BIND \
    --workers $GUNICORN_WORKERS \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --log-level info \
    wsgi:app 