# 🚀 Guia de Deploy - EPUB Translator

Este guia explica como fazer o deploy do EPUB Translator em produção.

## 📋 Pré-requisitos

- Python 3.8 ou superior
- pip3
- Acesso root/sudo (para algumas configurações)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd tradutor_novo
```

### 2. Configure o ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite as configurações
nano .env
```

### 3. Instale as dependências
```bash
pip3 install -r requirements.txt
```

### 4. Configure as permissões
```bash
chmod +x start_production.sh
chmod 755 uploads epub_files logs
```

## 🚀 Execução

### Método 1: Script de inicialização (Recomendado)
```bash
./start_production.sh
```

### Método 2: Gunicorn manual
```bash
gunicorn --config gunicorn.conf.py wsgi:app
```

### Método 3: Python direto
```bash
python3 wsgi.py
```

## ⚙️ Configurações

### Variáveis de Ambiente Importantes

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `SECRET_KEY` | Chave secreta da aplicação | `dev-secret-key-change-in-production` |
| `PORT` | Porta do servidor | `8000` |
| `GUNICORN_WORKERS` | Número de workers | `4` |
| `GUNICORN_TIMEOUT` | Timeout das requisições | `120` |
| `MAX_CONTENT_LENGTH` | Tamanho máximo de upload | `52428800` (50MB) |

### Configurações de Segurança

1. **Altere a SECRET_KEY**:
   ```bash
   # Gere uma chave segura
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Configure HTTPS** (recomendado):
   - Use um proxy reverso (Nginx/Apache)
   - Configure certificados SSL

3. **Configure firewall**:
   ```bash
   # Permitir apenas a porta necessária
   ufw allow 8000
   ```

## 📊 Monitoramento

### Logs
Os logs são salvos em:
- `logs/access.log` - Logs de acesso
- `logs/error.log` - Logs de erro
- `logs/epub_translator.log` - Logs da aplicação

### Verificar status
```bash
# Verificar processos
ps aux | grep gunicorn

# Verificar logs
tail -f logs/error.log
```

## 🔧 Configurações Avançadas

### Nginx (Proxy Reverso)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Configurações para uploads grandes
    client_max_body_size 50M;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
```

### Systemd Service
Crie `/etc/systemd/system/epub-translator.service`:
```ini
[Unit]
Description=EPUB Translator
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/path/to/tradutor_novo
Environment=PATH=/path/to/tradutor_novo/venv/bin
ExecStart=/path/to/tradutor_novo/venv/bin/gunicorn --config gunicorn.conf.py wsgi:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Ative o serviço:
```bash
sudo systemctl enable epub-translator
sudo systemctl start epub-translator
```

## 🐳 Docker (Opcional)

### Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN mkdir -p uploads epub_files logs
RUN chmod 755 uploads epub_files logs

EXPOSE 8000

CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  epub-translator:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./uploads:/app/uploads
      - ./epub_files:/app/epub_files
      - ./logs:/app/logs
    environment:
      - FLASK_ENV=production
      - SECRET_KEY=your-secret-key
    restart: unless-stopped
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de permissão**:
   ```bash
   chmod 755 uploads epub_files logs
   ```

2. **Porta já em uso**:
   ```bash
   # Verificar processos
   lsof -i :8000
   # Matar processo
   kill -9 <PID>
   ```

3. **Erro de memória**:
   - Reduza o número de workers
   - Aumente o timeout

4. **Uploads falhando**:
   - Verifique o tamanho máximo
   - Verifique permissões do diretório

### Logs de Debug
```bash
# Ver logs em tempo real
tail -f logs/error.log

# Ver logs da aplicação
tail -f logs/epub_translator.log
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs
2. Consulte este guia
3. Abra uma issue no repositório

---

**Nota**: Sempre teste em ambiente de desenvolvimento antes de fazer deploy em produção! 