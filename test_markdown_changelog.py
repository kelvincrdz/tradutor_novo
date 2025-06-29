#!/usr/bin/env python3
"""
Teste para verificar se o Markdown está sendo renderizado corretamente na página do changelog
"""

import requests
import sys
import os

def test_markdown_rendering():
    """Testa se o Markdown está sendo renderizado corretamente"""
    
    # URL base (pode ser alterada para produção)
    base_url = "http://localhost:5000"
    
    print("🧪 Testando renderização do Markdown na página do changelog...")
    
    try:
        # Testar página do changelog
        print(f"📄 Acessando página do changelog: {base_url}/changelog")
        response = requests.get(f"{base_url}/changelog")
        
        if response.status_code == 200:
            print("✅ Página do changelog carregada com sucesso")
            
            # Verificar se o conteúdo HTML está presente (indicando que o Markdown foi convertido)
            if "<h1>" in response.text and "<h2>" in response.text:
                print("✅ Tags HTML encontradas (Markdown convertido)")
            else:
                print("❌ Tags HTML NÃO encontradas (Markdown não convertido)")
                return False
            
            # Verificar se há elementos específicos do Markdown renderizado
            if "Changelog - Sistema de Tradução" in response.text:
                print("✅ Título do changelog encontrado")
            else:
                print("❌ Título do changelog NÃO encontrado")
                return False
            
            # Verificar se há listas renderizadas
            if "<ul>" in response.text or "<ol>" in response.text:
                print("✅ Listas HTML encontradas")
            else:
                print("⚠️  Listas HTML não encontradas (pode ser normal se não houver listas)")
            
            # Verificar se há links renderizados
            if "<a href=" in response.text:
                print("✅ Links HTML encontrados")
            else:
                print("⚠️  Links HTML não encontrados (pode ser normal se não houver links)")
            
            # Verificar se há código renderizado
            if "<code>" in response.text or "<pre>" in response.text:
                print("✅ Blocos de código HTML encontrados")
            else:
                print("⚠️  Blocos de código HTML não encontrados (pode ser normal se não houver código)")
            
            # Verificar se NÃO há texto Markdown bruto
            if "## [" in response.text or "### ✨" in response.text:
                print("❌ Texto Markdown bruto ainda presente (não foi convertido)")
                return False
            else:
                print("✅ Texto Markdown bruto não encontrado (convertido corretamente)")
                
        else:
            print(f"❌ Erro ao carregar página do changelog: {response.status_code}")
            return False
            
        print("\n🎉 Teste de renderização do Markdown passou! O changelog está sendo exibido formatado.")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão. Certifique-se de que o servidor está rodando.")
        print("💡 Execute: python app.py")
        return False
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

if __name__ == "__main__":
    success = test_markdown_rendering()
    sys.exit(0 if success else 1) 