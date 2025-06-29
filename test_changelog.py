#!/usr/bin/env python3
"""
Script de teste para verificar se a página de changelog está funcionando corretamente
"""

import requests
import json
import time

def test_changelog_page():
    """Testa se a página de changelog carrega corretamente"""
    
    print("🧪 Testando página de changelog...")
    
    # URL base do servidor
    base_url = "http://localhost:5000"
    
    try:
        # Testar se a página do changelog carrega
        response = requests.get(f"{base_url}/changelog", timeout=10)
        
        if response.status_code == 200:
            print("✅ Página de changelog carregando corretamente")
            
            # Verificar se contém elementos esperados
            content = response.text
            
            if "Changelog" in content:
                print("✅ Título do changelog encontrado")
            else:
                print("❌ Título do changelog não encontrado")
                return False
            
            if "Histórico de Alterações" in content:
                print("✅ Subtítulo encontrado")
            else:
                print("❌ Subtítulo não encontrado")
                return False
            
            if "1.4.0" in content:
                print("✅ Versão mais recente encontrada")
            else:
                print("❌ Versão mais recente não encontrada")
                return False
            
            if "✨" in content or "🔧" in content or "🐛" in content:
                print("✅ Emojis de categorias encontrados")
            else:
                print("⚠️ Emojis de categorias não encontrados (pode ser normal)")
            
            return True
        else:
            print(f"❌ Erro ao carregar changelog: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_changelog_file():
    """Testa se o arquivo CHANGELOG.md existe e é válido"""
    
    print("\n🧪 Testando arquivo CHANGELOG.md...")
    
    try:
        with open('CHANGELOG.md', 'r', encoding='utf-8') as file:
            content = file.read()
            
        if content.strip():
            print("✅ Arquivo CHANGELOG.md existe e não está vazio")
            
            # Verificar estrutura básica
            if "# Changelog" in content:
                print("✅ Cabeçalho principal encontrado")
            else:
                print("❌ Cabeçalho principal não encontrado")
                return False
            
            if "## [" in content:
                print("✅ Seções de versão encontradas")
            else:
                print("❌ Seções de versão não encontradas")
                return False
            
            if "### ✨" in content or "### 🔧" in content or "### 🐛" in content:
                print("✅ Categorias de alterações encontradas")
            else:
                print("⚠️ Categorias de alterações não encontradas")
            
            return True
        else:
            print("❌ Arquivo CHANGELOG.md está vazio")
            return False
            
    except FileNotFoundError:
        print("❌ Arquivo CHANGELOG.md não encontrado")
        return False
    except Exception as e:
        print(f"❌ Erro ao ler arquivo: {e}")
        return False

def test_navigation_link():
    """Testa se o link de navegação está presente na página inicial"""
    
    print("\n🧪 Testando link de navegação...")
    
    base_url = "http://localhost:5000"
    
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        
        if response.status_code == 200:
            content = response.text
            
            if "Changelog" in content and "history" in content:
                print("✅ Link de changelog encontrado na navegação")
                return True
            else:
                print("❌ Link de changelog não encontrado na navegação")
                return False
        else:
            print(f"❌ Erro ao carregar página inicial: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao testar navegação: {e}")
        return False

def main():
    """Função principal de teste"""
    
    print("🚀 Iniciando testes da página de changelog...")
    print("=" * 50)
    
    # Testar arquivo
    file_ok = test_changelog_file()
    
    # Testar página
    page_ok = test_changelog_page()
    
    # Testar navegação
    nav_ok = test_navigation_link()
    
    print("\n" + "=" * 50)
    print("📊 RESULTADOS DOS TESTES:")
    print(f"Arquivo CHANGELOG.md: {'✅ OK' if file_ok else '❌ FALHOU'}")
    print(f"Página de changelog: {'✅ OK' if page_ok else '❌ FALHOU'}")
    print(f"Link de navegação: {'✅ OK' if nav_ok else '❌ FALHOU'}")
    
    if file_ok and page_ok and nav_ok:
        print("\n🎉 Todos os testes passaram! A página de changelog está funcionando corretamente.")
        return True
    else:
        print("\n⚠️ Alguns testes falharam. Verifique os logs acima.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 