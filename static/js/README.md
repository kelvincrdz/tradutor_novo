# Arquivos JavaScript - EPUB Translator

Este diretório contém todos os arquivos JavaScript organizados de forma modular para o projeto EPUB Translator.

## Estrutura dos Arquivos

### `main.js`
Arquivo principal com funções utilitárias e comuns para toda a aplicação:
- Funções de notificação (`mostrarNotificacao`)
- Funções de validação (`validarEmail`, `validarArquivo`)
- Funções de manipulação de DOM (`aguardarDOM`)
- Funções de requisição (`fazerRequisicao`)
- Funções de utilidade (`debounce`, `throttle`, `formatarTexto`)
- Funções de modal (`abrirModal`, `fecharModal`)
- Funções de loading (`mostrarLoading`, `ocultarLoading`)
- Inicialização de tooltips, confirmações e formulários

### `dark-mode.js`
Funcionalidade específica para o modo escuro:
- Inicialização do modo escuro
- Alternância entre temas claro/escuro
- Persistência da preferência do usuário
- Atualização de ícones baseada no tema

### `index.js`
Funcionalidades específicas da página inicial:
- Upload de arquivos EPUB
- Drag and drop
- Modal de arquivo duplicado
- Validação de arquivos
- Redirecionamento após upload

### `reader.js`
Funcionalidades específicas do leitor de EPUB:
- Navegação entre capítulos
- Tradução de capítulos individuais
- Tradução de todos os capítulos
- Modal de tradução
- Barra de dicionário rápido
- Alternância entre texto original e traduzido
- Progresso de tradução

### `dicionario.js`
Funcionalidades específicas da página do dicionário:
- Adição de entradas ao dicionário
- Edição de entradas existentes
- Remoção de entradas
- Busca no dicionário
- Upload/importação de dicionário
- Modal de edição

### `marcadores.js`, `estatisticas.js`, `cronometro.js`
Estes arquivos são utilizados apenas se incluídos manualmente. No momento, não estão incluídos diretamente nos templates HTML, mas suas funções podem ser chamadas via `main.js` se necessário.

## Organização e Boas Práticas

### Convenções de Nomenclatura
- Funções: Prefixo `_func_` seguido de nome descritivo em camelCase
- Variáveis: Prefixo `var_` seguido de tipo e nome descritivo
- Constantes: Prefixo `const_` seguido de nome descritivo

### Verificações de Segurança
- Todas as funções verificam se o DOM está carregado antes de executar
- Verificação da existência de elementos antes de manipulá-los
- Tratamento de erros em todas as requisições fetch

### Modularidade
- Cada arquivo tem responsabilidades específicas
- Funções utilitárias centralizadas em `main.js`
- Dependências claras entre arquivos

### Compatibilidade
- Uso de ES6+ com fallbacks para navegadores mais antigos
- Verificação de suporte a APIs modernas
- Tratamento de erros robusto

## Ordem de Carregamento

Os arquivos são carregados na seguinte ordem:

1. `main.js` - Funções utilitárias (carregado em todas as páginas)
2. `dark-mode.js` - Modo escuro (carregado em todas as páginas)
3. Arquivo específico da página:
   - `index.js` - Página inicial
   - `reader.js` - Leitor de EPUB
   - `dicionario.js` - Página do dicionário

## Dependências

- Material UI JavaScript (carregado via CDN)
- APIs nativas do navegador (fetch, localStorage, etc.)
- Funções utilitárias do `main.js`

## Manutenção

Para adicionar novas funcionalidades:
1. Identifique o arquivo apropriado baseado na responsabilidade
2. Siga as convenções de nomenclatura existentes
3. Adicione verificações de segurança necessárias
4. Teste em diferentes navegadores
5. Documente as mudanças neste README 