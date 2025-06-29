#!/usr/bin/env python3
"""
Configuração do Gunicorn para o EPUB Translator
"""

import os
import multiprocessing

# Configurações básicas
bind = os.environ.get('GUNICORN_BIND', '0.0.0.0:8000')
workers = os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1)
worker_class = os.environ.get('GUNICORN_WORKER_CLASS', 'sync')
worker_connections = os.environ.get('GUNICORN_WORKER_CONNECTIONS', 1000)

# Timeouts
timeout = int(os.environ.get('GUNICORN_TIMEOUT', 120))
keepalive = int(os.environ.get('GUNICORN_KEEPALIVE', 2))
graceful_timeout = int(os.environ.get('GUNICORN_GRACEFUL_TIMEOUT', 30))

# Logging
accesslog = os.environ.get('GUNICORN_ACCESS_LOG', '-')
errorlog = os.environ.get('GUNICORN_ERROR_LOG', '-')
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')

# Configurações de segurança
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Configurações de performance
max_requests = int(os.environ.get('GUNICORN_MAX_REQUESTS', 1000))
max_requests_jitter = int(os.environ.get('GUNICORN_MAX_REQUESTS_JITTER', 100))
preload_app = True

# Configurações específicas para uploads grandes
worker_tmp_dir = '/dev/shm'  # Usar RAM para arquivos temporários

# Configurações de processo
user = os.environ.get('GUNICORN_USER', None)
group = os.environ.get('GUNICORN_GROUP', None)

# Configurações de SSL (se necessário)
# keyfile = '/path/to/keyfile'
# certfile = '/path/to/certfile'

def when_ready(server):
    """Callback executado quando o servidor está pronto"""
    server.log.info("EPUB Translator está pronto para receber conexões")

def worker_int(worker):
    """Callback executado quando um worker é interrompido"""
    worker.log.info("Worker %s foi interrompido", worker.pid)

def pre_fork(server, worker):
    """Callback executado antes do fork do worker"""
    server.log.info("Worker %s será criado", worker.pid)

def post_fork(server, worker):
    """Callback executado após o fork do worker"""
    server.log.info("Worker %s foi criado", worker.pid)

def post_worker_init(worker):
    """Callback executado após a inicialização do worker"""
    worker.log.info("Worker %s foi inicializado", worker.pid) 