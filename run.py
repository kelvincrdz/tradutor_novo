#!/usr/bin/env python3
"""
Script de inicialização para o EPUB Translator
"""

import os
import sys
import importlib

def _func_VerificarDependencias():
    """Verifica se todas as dependências estão instaladas"""
    var_listDependencias = [
        ("flask", "flask"),
        ("werkzeug", "werkzeug"),
        ("beautifulsoup4", "bs4"),
        ("deep-translator", "deep_translator"),
        ("lxml", "lxml"),
    ]
    
    var_listDependenciasFaltantes = []
    
    for var_strNomePacote, var_strNomeImport in var_listDependencias:
        try:
            importlib.import_module(var_strNomeImport)
            print(f"✅ {var_strNomePacote}")
        except ImportError:
            print(f"❌ {var_strNomePacote} - NÃO INSTALADO")
            var_listDependenciasFaltantes.append(var_strNomePacote)
    
    if var_listDependenciasFaltantes:
        print("\n⚠️  Dependências faltando!")
        print("📦 Execute: pip install -r requirements.txt")
        print("🔍 Ou execute: python check_dependencies.py")
        return False
    
    return True

def _func_VerificarVersaoPython():
    """Verifica se a versão do Python é compatível"""
    var_objVersao = sys.version_info
    if var_objVersao.major < 3 or (var_objVersao.major == 3 and var_objVersao.minor < 8):
        print(f"❌ Python {var_objVersao.major}.{var_objVersao.minor} não é suportado.")
        print("📋 Requer Python 3.8 ou superior.")
        return False
    return True

def _func_FuncaoPrincipal():
    """Função principal para iniciar a aplicação"""
    
    print("🔍 Verificando ambiente...")
    
    # Verificar versão do Python
    if not _func_VerificarVersaoPython():
        sys.exit(1)
    
    # Verificar dependências
    
    print("\n📦 Verificando dependências...")
    if not _func_VerificarDependencias():
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
    except ImportError as var_objErro:
        print(f"❌ Erro ao importar aplicação: {var_objErro}")
        print("🔍 Verifique se todas as dependências estão instaladas")
        sys.exit(1)
    except Exception as var_objErro:
        print(f"❌ Erro ao iniciar aplicação: {var_objErro}")
        sys.exit(1)

if __name__ == '__main__':
    _func_FuncaoPrincipal() 