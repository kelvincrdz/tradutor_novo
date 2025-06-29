# EPUB Translator

Um aplicativo web moderno para tradução e leitura de arquivos EPUB, desenvolvido com Flask e Python, utilizando Material UI para uma interface limpa e responsiva.

## 🚀 Características

- **Upload de EPUB**: Suporte para upload de arquivos EPUB
- **Tradução Automática**: Tradução usando Google Translate e Deep Translator
- **Dicionário Personalizado**: Crie suas próprias traduções personalizadas
- **Interface Moderna**: Design Material UI responsivo e intuitivo
- **Leitor Integrado**: Visualize e edite traduções diretamente no navegador
- **Download**: Baixe o EPUB traduzido para leitura offline

## 🛠️ Tecnologias Utilizadas

- **Backend**: Flask (Python)
- **Frontend**: Material UI (MUI)
- **Tradução**: Deep Translator (Google Translate)
- **Processamento**: BeautifulSoup, zipfile
- **Estilização**: CSS3 com variáveis CSS e design responsivo

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd tradutor_novo
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Execute o aplicativo:
```bash
python app.py
```

4. Acesse no navegador:
```
http://localhost:5000
```

## 🎨 Interface

### Design Material UI
- **App Bar**: Navegação fixa no topo
- **Cards**: Componentes organizados em cards
- **Botões**: Botões com variantes (contained, outlined)
- **Formulários**: Inputs estilizados com Material Design
- **Modais**: Diálogos para edição e tradução
- **Notificações**: Sistema de notificações toast
- **Responsivo**: Adaptação para dispositivos móveis

### Componentes Principais
- **Hero Section**: Apresentação principal
- **Upload Area**: Área de drag & drop para arquivos
- **Feature Cards**: Exibição de recursos
- **Steps**: Guia de uso passo a passo
- **Reader Panel**: Interface de leitura com sidebar
- **Dictionary List**: Lista de entradas do dicionário
- **Search**: Busca em tempo real

## 🔧 Funcionalidades

### Upload e Processamento
- Suporte para arquivos EPUB
- Extração automática de conteúdo
- Preservação de formatação
- Processamento de capítulos

### Tradução
- Detecção automática de idioma
- Tradução por capítulos
- Aplicação de dicionário personalizado
- Edição manual de traduções

### Dicionário
- Adição de entradas personalizadas
- Busca em tempo real
- Edição e remoção de entradas
- Persistência em JSON

### Leitor
- Navegação por capítulos
- Visualização lado a lado
- Controles de tradução
- Download do EPUB traduzido

## 📱 Responsividade

O aplicativo é totalmente responsivo e se adapta a diferentes tamanhos de tela:

- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado com grid responsivo
- **Mobile**: Layout otimizado para toque

## 🎯 Como Usar

1. **Upload**: Faça upload de um arquivo EPUB
2. **Tradução**: O sistema traduzirá automaticamente
3. **Revisão**: Revise e edite as traduções
4. **Dicionário**: Adicione traduções personalizadas
5. **Download**: Baixe o EPUB traduzido

## 📁 Estrutura do Projeto

```
tradutor_novo/
├── app.py                 # Aplicação principal Flask
├── config.py             # Configurações
├── requirements.txt      # Dependências Python
├── static/
│   └── css/
│       └── base.css      # Estilos Material UI
├── templates/
│   ├── base.html         # Template base
│   ├── index.html        # Página inicial
│   ├── reader.html       # Interface do leitor
│   └── dictionary.html   # Gerenciamento do dicionário
├── uploads/              # Arquivos temporários
├── epub_files/           # Conteúdo extraído
└── dictionary.json       # Dicionário personalizado
```

## 🔄 Atualizações Recentes

### Material UI Integration
- **Design System**: Implementação completa do Material Design
- **Componentes**: Uso de componentes prontos do MUI
- **Responsividade**: Melhor adaptação para dispositivos móveis
- **Performance**: CSS otimizado e carregamento eficiente

### Melhorias na Interface
- **App Bar**: Navegação moderna e fixa
- **Cards**: Organização visual melhorada
- **Botões**: Variantes consistentes
- **Formulários**: Inputs com validação visual
- **Modais**: Diálogos para ações complexas

## 🚀 Próximas Funcionalidades

- [ ] Suporte a múltiplos idiomas de destino
- [ ] Histórico de traduções
- [ ] Exportação em diferentes formatos
- [ ] Integração com APIs de tradução avançadas
- [ ] Sistema de usuários e projetos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou envie um pull request.

---

Desenvolvido com ❤️ usando Flask e Material UI 