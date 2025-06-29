#!/usr/bin/env python3
"""
Script de verificação de dependências para o EPUB Translator
Verifica se todas as bibliotecas necessárias estão instaladas
"""

import importlib
import sys
import subprocess
from typing import List, Tuple

def _func_VerificarPacote(var_strNomePacote: str, var_strNomeImport: str = None) -> Tuple[bool, str]:
    """
    Verifica se um pacote está instalado
    
    Args:
        var_strNomePacote: Nome do pacote para instalação
        var_strNomeImport: Nome para importação (se diferente do var_strNomePacote)
    
    Returns:
        Tuple[bool, str]: (está_instalado, mensagem)
    """
    if var_strNomeImport is None:
        var_strNomeImport = var_strNomePacote
    
    try:
        importlib.import_module(var_strNomeImport)
        return True, f"✅ {var_strNomePacote} - OK"
    except ImportError:
        return False, f"❌ {var_strNomePacote} - NÃO INSTALADO"

def _func_InstalarPacote(var_strNomePacote: str) -> bool:
    """
    Instala um pacote usando pip
    
    Args:
        var_strNomePacote: Nome do pacote para instalar
    
    Returns:
        bool: True se instalado com sucesso, False caso contrário
    """
    try:
        print(f"📦 Instalando {var_strNomePacote}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", var_strNomePacote])
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Erro ao instalar {var_strNomePacote}")
        return False

def _func_VerificarDependencias() -> List[Tuple[str, bool, str]]:
    """
    Verifica todas as dependências da aplicação
    
    Returns:
        List[Tuple[str, bool, str]]: Lista de (pacote, instalado, mensagem)
    """
    var_listDependencias = [
        ("flask", "flask"),
        ("werkzeug", "werkzeug"),
        ("beautifulsoup4", "bs4"),
        ("deep-translator", "deep_translator"),
        ("lxml", "lxml"),  # Parser XML para BeautifulSoup
    ]
    
    var_listResultados = []
    for var_strNomePacote, var_strNomeImport in var_listDependencias:
        var_boolInstalado, var_strMensagem = _func_VerificarPacote(var_strNomePacote, var_strNomeImport)
        var_listResultados.append((var_strNomePacote, var_boolInstalado, var_strMensagem))
    
    return var_listResultados

def _func_FuncaoPrincipal():
    """Função principal"""
    print("🔍 Verificando dependências do EPUB Translator...")
    print("=" * 60)
    
    # Verificar dependências
    var_listResultados = _func_VerificarDependencias()
    
    # Exibir resultados
    var_boolTodasInstaladas = True
    for var_strNomePacote, var_boolInstalado, var_strMensagem in var_listResultados:
        print(var_strMensagem)
        if not var_boolInstalado:
            var_boolTodasInstaladas = False
    
    print("=" * 60)
    
    if var_boolTodasInstaladas:
        print("🎉 Todas as dependências estão instaladas!")
        print("🚀 Você pode iniciar a aplicação com: python run.py")
        return True
    else:
        print("⚠️  Algumas dependências estão faltando.")
        
        # Perguntar se deseja instalar automaticamente
        var_strResposta = input("\n❓ Deseja instalar as dependências faltantes automaticamente? (s/n): ")
        
        if var_strResposta.lower() in ['s', 'sim', 'y', 'yes']:
            print("\n📦 Instalando dependências faltantes...")
            
            for var_strNomePacote, var_boolInstalado, var_strMensagem in var_listResultados:
                if not var_boolInstalado:
                    if _func_InstalarPacote(var_strNomePacote):
                        print(f"✅ {var_strNomePacote} instalado com sucesso!")
                    else:
                        print(f"❌ Falha ao instalar {var_strNomePacote}")
                        return False
            
            print("\n🎉 Todas as dependências foram instaladas!")
            print("🚀 Você pode iniciar a aplicação com: python run.py")
            return True
        else:
            print("\n📋 Para instalar manualmente, execute:")
            print("pip install -r requirements.txt")
            print("\n📖 Ou instale cada dependência individualmente:")
            for var_strNomePacote, var_boolInstalado, var_strMensagem in var_listResultados:
                if not var_boolInstalado:
                    print(f"pip install {var_strNomePacote}")
            return False

def _func_VerificarVersaoPython():
    """Verifica se a versão do Python é compatível"""
    print("🐍 Verificando versão do Python...")
    
    var_objVersao = sys.version_info
    if var_objVersao.major < 3 or (var_objVersao.major == 3 and var_objVersao.minor < 8):
        print(f"❌ Python {var_objVersao.major}.{var_objVersao.minor} não é suportado.")
        print("📋 Requer Python 3.8 ou superior.")
        return False
    else:
        print(f"✅ Python {var_objVersao.major}.{var_objVersao.minor}.{var_objVersao.micro} - OK")
        return True

if __name__ == '__main__':
    print("🔍 Verificador de Dependências - EPUB Translator")
    print("=" * 60)
    
    # Verificar versão do Python
    if not _func_VerificarVersaoPython():
        sys.exit(1)
    
    print()
    
    # Verificar dependências
    if _func_FuncaoPrincipal():
        print("\n🎯 Verificação concluída com sucesso!")
    else:
        print("\n❌ Verificação falhou. Instale as dependências e tente novamente.")
        sys.exit(1) 