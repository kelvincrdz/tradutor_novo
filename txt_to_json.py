import json

def txt_to_json(input_file, output_file):
    """
    Converte um arquivo de texto no formato:
    palavra_ingles
    palavra_portugues
    
    Para um dicionário JSON
    """
    dictionary = {}
    
    try:
        with open(input_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            
        i = 0
        while i < len(lines):
            # Remove espaços em branco e quebras de linha
            line = lines[i].strip()
            
            # Se a linha não estiver vazia, é uma palavra em inglês
            if line:
                english_word = line
                
                # Próxima linha deve ser a tradução em português
                if i + 1 < len(lines):
                    portuguese_word = lines[i + 1].strip()
                    dictionary[english_word] = portuguese_word
                    i += 2  # Pula para a próxima entrada
                else:
                    print(f"Aviso: Palavra '{english_word}' não tem tradução")
                    i += 1
            else:
                i += 1  # Pula linhas vazias
        
        # Salva o dicionário em formato JSON
        with open(output_file, 'w', encoding='utf-8') as json_file:
            json.dump(dictionary, json_file, ensure_ascii=False, indent=2)
            
        print(f"Arquivo JSON '{output_file}' gerado com sucesso!")
        print(f"Total de entradas: {len(dictionary)}")
        
    except FileNotFoundError:
        print(f"Erro: Arquivo '{input_file}' não encontrado!")
    except Exception as e:
        print(f"Erro ao processar arquivo: {e}")

# Exemplo de uso
if __name__ == "__main__":
    input_txt = "Dic_2.txt"  # Arquivo de entrada
    output_json = "dicionario_convertido.json"  # Arquivo de saída
    
    txt_to_json(input_txt, output_json) 