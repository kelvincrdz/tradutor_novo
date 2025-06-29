#!/usr/bin/env python3
"""
Teste para verificar se o link do changelog está funcionando na página inicial
"""

import requests
import sys
import os

def test_changelog_link():
    """Testa se o link do changelog está funcionando"""
    
    # URL base (pode ser alterada para produção)
    base_url = "http://localhost:5000"
    
    print("🧪 Testando link do changelog na página inicial...")
    
    try:
        # Testar página inicial
        print(f"📄 Acessando página inicial: {base_url}/")
        response = requests.get(f"{base_url}/")
        
        if response.status_code == 200:
            print("✅ Página inicial carregada com sucesso")
            
            # Verificar se o link do changelog está presente
            if 'href="/changelog"' in response.text or 'href="{{ url_for(\'_func_PaginaChangelog\') }}"' in response.text:
                print("✅ Link do changelog encontrado na página inicial")
            else:
                print("❌ Link do changelog NÃO encontrado na página inicial")
                return False
                
        else:
            print(f"❌ Erro ao carregar página inicial: {response.status_code}")
            return False
            
        # Testar página do changelog diretamente
        print(f"📄 Testando página do changelog: {base_url}/changelog")
        changelog_response = requests.get(f"{base_url}/changelog")
        
        if changelog_response.status_code == 200:
            print("✅ Página do changelog carregada com sucesso")
            
            # Verificar se o conteúdo do changelog está presente
            if "Changelog" in changelog_response.text:
                print("✅ Conteúdo do changelog encontrado")
            else:
                print("❌ Conteúdo do changelog NÃO encontrado")
                return False
                
        else:
            print(f"❌ Erro ao carregar página do changelog: {changelog_response.status_code}")
            return False
            
        print("\n🎉 Todos os testes passaram! O link do changelog está funcionando corretamente.")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão. Certifique-se de que o servidor está rodando.")
        print("💡 Execute: python app.py")
        return False
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

if __name__ == "__main__":
    success = test_changelog_link()
    sys.exit(0 if success else 1) 