import json

with open('Edgedancer.json', 'r', encoding='utf-8') as file:
     stormlight_dict = json.load(file)

# Gera arquivo de texto com o dicionário
with open('dicionario_saida.txt', 'w', encoding='utf-8') as output_file:
    for english, portuguese in stormlight_dict.items():
        output_file.write(f"{english}\n")
        output_file.write(f"{portuguese}\n")
        output_file.write("\n")  # Quebra de linha extra

print("Arquivo 'dicionario_saida.txt' gerado com sucesso!")