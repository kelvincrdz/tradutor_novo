# Changelog - Sistema de Tradução de EPUBs

## [1.5.0] - 2024-12-19

### 🐛 Correções de Bugs Críticos
- **Sistema TTS - Triplicação de Texto**
  - Corrigido problema de triplicação do texto ao clicar durante a leitura
  - Implementado controle de estado para evitar chamadas múltiplas simultâneas
  - Melhorada função `destacarFrase()` com verificações de segurança
  - Corrigida função `limparHighlight()` para remoção segura de elementos

### 🔧 Melhorias no Sistema TTS
- **Controle de Estado**
  - Adicionada variável global `leituraEmAndamento` para controle preciso
  - Listeners de eventos para detectar interrupções da leitura
  - Verificações de estado antes de iniciar nova leitura
  - Cancelamento adequado de leituras anteriores

- **Manipulação Segura do DOM**
  - Verificações de existência de elementos antes da manipulação
  - Processamento recursivo mais robusto dos nós do DOM
  - Normalização do DOM para remover nós vazios adjacentes
  - Substituição segura de elementos highlight por nós de texto

- **Funções de Leitura Aprimoradas**
  - `lerTextoTTS()`: Validação de texto e controle de estado
  - `iniciarLeituraCapituloAtualETTS()`: Verificações de segurança
  - `iniciarLeituraAPartirDoClique()`: Controle adequado de cancelamento
  - `pararLeituraTTS()`: Limpeza automática de highlights

### 🛡️ Segurança e Estabilidade
- **Prevenção de Conflitos**
  - Evita chamadas múltiplas simultâneas ao sistema TTS
  - Controle adequado de timing para transições entre capítulos
  - Verificações de validade de texto antes do processamento
  - Tratamento robusto de erros e estados inesperados

- **Compatibilidade**
  - Mantém total compatibilidade com sistema de tradução
  - Não afeta funcionalidades de tradução existentes
  - Preserva highlights visuais e navegação por clique
  - Mantém sincronização entre texto e áudio

### 📝 Notas Técnicas
- **Arquivos Modificados**: `static/js/tts.js`
- **Impacto**: Apenas no sistema TTS, sem afetar traduções
- **Compatibilidade**: Total com versões anteriores
- **Performance**: Melhorada com redução de processamento desnecessário

## [1.4.0] - 2024-12-19

### ✨ Novas Funcionalidades
- **Sistema de Dicionário Personalizado Melhorado**
  - Suporte a expressões compostas por múltiplas palavras
  - Tradução case-insensitive com regex
  - Ordenação por tamanho para evitar substituições incorretas
  - Exemplo: "Coinshot Mistings" → "Brumosos Lançamoedas"

- **Funcionalidade de Limpeza do Dicionário**
  - Botão "Limpar Dicionário" com confirmação dupla
  - Interface visual para ações em massa
  - Feedback visual durante a operação
  - Tratamento de erros robusto

### 🔧 Melhorias
- **Botão "Ver Original" Corrigido**
  - Lógica mais flexível para exibição do botão
  - Fallback automático para conteúdo original
  - Preservação do conteúdo original ao salvar traduções
  - Funcionamento tanto para tradução individual quanto simultânea

- **Interface do Usuário**
  - Melhor feedback visual para operações
  - Notificações mais informativas
  - Estilos CSS aprimorados para seções de ações

### 🐛 Correções de Bugs
- **Tradução Individual**
  - Corrigido erro "var_intCapitulosCompletados is not define"
  - Removido código duplicado incorreto entre funções
  - Lógica específica para cada tipo de tradução

- **Sistema de Dicionário**
  - Corrigida aplicação de traduções personalizadas
  - Melhor tratamento de expressões complexas
  - Prevenção de substituições incorretas

## [1.3.0] - 2024-12-18

### ✨ Novas Funcionalidades
- **Sistema de Dicionário Personalizado**
  - Interface para adicionar/editar traduções personalizadas
  - Aplicação automática de traduções durante a leitura
  - Persistência de dados em JSON
  - Busca rápida de termos

- **Modo Escuro**
  - Toggle para alternar entre tema claro e escuro
  - Persistência da preferência do usuário
  - Estilos CSS otimizados para ambos os temas

### 🔧 Melhorias
- **Interface do Leitor**
  - Navegação melhorada entre capítulos
  - Indicadores de progresso de tradução
  - Melhor organização dos controles

## [1.2.0] - 2024-12-17

### ✨ Novas Funcionalidades
- **Tradução Simultânea**
  - Tradução de múltiplos capítulos em paralelo
  - Modal de progresso com indicadores visuais
  - Controle de concorrência (máximo 3 traduções simultâneas)
  - Possibilidade de cancelar tradução em andamento

- **Sistema de Notificações**
  - Feedback visual para todas as operações
  - Diferentes tipos de notificação (success, error, info, warning)
  - Auto-dismiss para notificações de sucesso

### 🔧 Melhorias
- **Performance**
  - Otimização de requisições de tradução
  - Melhor gerenciamento de memória
  - Redução de tempo de carregamento

## [1.1.0] - 2024-12-16

### ✨ Novas Funcionalidades
- **Tradução Individual por Capítulo**
  - Botão para traduzir capítulo atual
  - Preservação do conteúdo original
  - Alternância entre texto original e traduzido

- **Sistema de Upload**
  - Suporte a arquivos EPUB
  - Validação de formato
  - Extração automática de capítulos

### 🔧 Melhorias
- **Interface**
  - Design responsivo
  - Navegação intuitiva
  - Feedback visual para operações

## [1.0.0] - 2024-12-15

### 🎉 Lançamento Inicial
- **Funcionalidades Básicas**
  - Upload de arquivos EPUB
  - Visualização de capítulos
  - Interface básica de leitor
  - Suporte a tradução via API externa

---

## Como Contribuir

Para reportar bugs ou sugerir melhorias:
1. Verifique se o problema já foi reportado
2. Forneça detalhes específicos sobre o problema
3. Inclua passos para reproduzir o erro
4. Especifique seu sistema operacional e versão do navegador

## Notas de Versão

- **Versão 1.5.0**: Correções críticas no sistema TTS para resolver problema de triplicação de texto
- **Versão 1.4.0**: Foco em melhorias no sistema de dicionário e correções de bugs críticos
- **Versão 1.3.0**: Introdução do sistema de dicionário personalizado e modo escuro
- **Versão 1.2.0**: Implementação da tradução simultânea e sistema de notificações
- **Versão 1.1.0**: Adição da tradução individual e melhorias na interface
- **Versão 1.0.0**: Lançamento inicial com funcionalidades básicas 