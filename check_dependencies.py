#!/usr/bin/env python3
"""
Script de verificação de dependências para o EPUB Translator
Verifica se todas as bibliotecas necessárias estão instaladas
"""

import importlib
import sys
import subprocess
from typing import List, Tuple

def check_package(package_name: str, import_name: str = None) -> Tuple[bool, str]:
    """
    Verifica se um pacote está instalado
    
    Args:
        package_name: Nome do pacote para instalação
        import_name: Nome para importação (se diferente do package_name)
    
    Returns:
        Tuple[bool, str]: (está_instalado, mensagem)
    """
    if import_name is None:
        import_name = package_name
    
    try:
        importlib.import_module(import_name)
        return True, f"✅ {package_name} - OK"
    except ImportError:
        return False, f"❌ {package_name} - NÃO INSTALADO"

def install_package(package_name: str) -> bool:
    """
    Instala um pacote usando pip
    
    Args:
        package_name: Nome do pacote para instalar
    
    Returns:
        bool: True se instalado com sucesso, False caso contrário
    """
    try:
        print(f"📦 Instalando {package_name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Erro ao instalar {package_name}")
        return False

def check_dependencies() -> List[Tuple[str, bool, str]]:
    """
    Verifica todas as dependências da aplicação
    
    Returns:
        List[Tuple[str, bool, str]]: Lista de (pacote, instalado, mensagem)
    """
    dependencies = [
        ("flask", "flask"),
        ("werkzeug", "werkzeug"),
        ("beautifulsoup4", "bs4"),
        ("deep-translator", "deep_translator"),
        ("lxml", "lxml"),  # Parser XML para BeautifulSoup
    ]
    
    results = []
    for package_name, import_name in dependencies:
        installed, message = check_package(package_name, import_name)
        results.append((package_name, installed, message))
    
    return results

def main():
    """Função principal"""
    print("🔍 Verificando dependências do EPUB Translator...")
    print("=" * 60)
    
    # Verificar dependências
    results = check_dependencies()
    
    # Exibir resultados
    all_installed = True
    for package_name, installed, message in results:
        print(message)
        if not installed:
            all_installed = False
    
    print("=" * 60)
    
    if all_installed:
        print("🎉 Todas as dependências estão instaladas!")
        print("🚀 Você pode iniciar a aplicação com: python run.py")
        return True
    else:
        print("⚠️  Algumas dependências estão faltando.")
        
        # Perguntar se deseja instalar automaticamente
        response = input("\n❓ Deseja instalar as dependências faltantes automaticamente? (s/n): ")
        
        if response.lower() in ['s', 'sim', 'y', 'yes']:
            print("\n📦 Instalando dependências faltantes...")
            
            for package_name, installed, message in results:
                if not installed:
                    if install_package(package_name):
                        print(f"✅ {package_name} instalado com sucesso!")
                    else:
                        print(f"❌ Falha ao instalar {package_name}")
                        return False
            
            print("\n🎉 Todas as dependências foram instaladas!")
            print("🚀 Você pode iniciar a aplicação com: python run.py")
            return True
        else:
            print("\n📋 Para instalar manualmente, execute:")
            print("pip install -r requirements.txt")
            print("\n📖 Ou instale cada dependência individualmente:")
            for package_name, installed, message in results:
                if not installed:
                    print(f"pip install {package_name}")
            return False

def check_python_version():
    """Verifica se a versão do Python é compatível"""
    print("🐍 Verificando versão do Python...")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python {version.major}.{version.minor} não é suportado.")
        print("📋 Requer Python 3.8 ou superior.")
        return False
    else:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
        return True

if __name__ == '__main__':
    print("🔍 Verificador de Dependências - EPUB Translator")
    print("=" * 60)
    
    # Verificar versão do Python
    if not check_python_version():
        sys.exit(1)
    
    print()
    
    # Verificar dependências
    if main():
        print("\n🎯 Verificação concluída com sucesso!")
    else:
        print("\n❌ Verificação falhou. Instale as dependências e tente novamente.")
        sys.exit(1) 