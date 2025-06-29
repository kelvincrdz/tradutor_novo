#!/usr/bin/env python3
"""
Script de inicialização para o EPUB Translator
"""

import os
import sys
import importlib

def check_dependencies():
    """Verifica se todas as dependências estão instaladas"""
    dependencies = [
        ("flask", "flask"),
        ("werkzeug", "werkzeug"),
        ("beautifulsoup4", "bs4"),
        ("deep-translator", "deep_translator"),
        ("lxml", "lxml"),
    ]
    
    missing_deps = []
    
    for package_name, import_name in dependencies:
        try:
            importlib.import_module(import_name)
            print(f"✅ {package_name}")
        except ImportError:
            print(f"❌ {package_name} - NÃO INSTALADO")
            missing_deps.append(package_name)
    
    if missing_deps:
        print("\n⚠️  Dependências faltando!")
        print("📦 Execute: pip install -r requirements.txt")
        print("🔍 Ou execute: python check_dependencies.py")
        return False
    
    return True

def check_python_version():
    """Verifica se a versão do Python é compatível"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python {version.major}.{version.minor} não é suportado.")
        print("📋 Requer Python 3.8 ou superior.")
        return False
    return True

def main():
    """Função principal para iniciar a aplicação"""
    
    print("🔍 Verificando ambiente...")
    
    # Verificar versão do Python
    if not check_python_version():
        sys.exit(1)
    
    # Verificar dependências
    
    print("\n📦 Verificando dependências...")
    if not check_dependencies():
        sys.exit(1)
    
    # Verificar se os diretórios necessários existem
    os.makedirs('uploads', exist_ok=True)
    os.makedirs('epub_files', exist_ok=True)
    
    print("\n🚀 Iniciando EPUB Translator...")
    print("📚 Leitor e Tradutor de EPUB")
    print("=" * 50)
    print("🌐 Acesse: http://localhost:5000")
    print("🛑 Para parar: Ctrl+C")
    print("=" * 50)
    
    try:
        # Importar e iniciar a aplicação Flask
        from app import app
        
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 Aplicação encerrada pelo usuário")
    except ImportError as e:
        print(f"❌ Erro ao importar aplicação: {e}")
        print("🔍 Verifique se todas as dependências estão instaladas")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro ao iniciar aplicação: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 