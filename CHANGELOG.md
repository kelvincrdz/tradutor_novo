# Changelog - Sistema de Tradução de EPUBs

## [1.6.0] - 2024-12-19

### 🎯 Melhorias no TTS Player - Leitura por Frases

#### **Área Central - Exibição de Frases Individuais**
- **Problema anterior:** A área central mostrava parágrafos completos durante a leitura
- **Solução implementada:**
  - A área central agora exibe apenas a frase/trecho que está sendo lido no momento
  - Implementação de extração inteligente de frases usando regex
  - Sincronização visual entre a frase sendo lida e o texto exibido

#### **Sidebar com Formatação Textual**
- **Problema anterior:** Texto na sidebar sem formatação adequada
- **Solução implementada:**
  - Formatação preservando quebras de linha e parágrafos
  - Estrutura visual clara com parágrafos separados
  - Estilização Material UI com hover effects

#### **Seleção por Trechos com Highlight**
- **Problema anterior:** Sem possibilidade de seleção específica de trechos
- **Solução implementada:**
  - Click em parágrafos para selecionar e começar leitura
  - Highlight visual da frase sendo lida
  - Navegação automática para o trecho selecionado

#### **Navegação por Símbolos de Pausa**
- **Implementado:** Divisão do texto baseada em símbolos de pausa configuráveis
- **Funcionalidades:**
  - Cada símbolo de pausa cria um trecho clicável
  - Click em trechos para começar leitura daquele ponto
  - Atualização automática da sidebar ao alterar símbolos
  - Indicador visual do número de trechos criados

### 🔧 Correções no TTS - Seleção de Voz e Detecção de Idioma

#### **Mudança Automática para Inglês Durante a Leitura**
- **Problema:** O sistema mudava automaticamente para inglês durante a leitura
- **Solução:**
  - Adicionada flag `vozSelecionadaManual` para controlar seleção do usuário
  - Detecção automática de idioma desabilitada quando voz é selecionada manualmente
  - Preservação da seleção manual durante toda a sessão

#### **Mudança de Voz em Tempo Real**
- **Problema:** Ao mudar a voz, a leitura parava e reiniciava
- **Solução:**
  - Mudança de voz aplicada imediatamente sem parar a leitura
  - Nova voz aplicada na próxima frase/trecho
  - Preservação do estado de leitura atual

#### **Persistência da Seleção de Voz**
- **Problema:** A seleção de voz não era salva e voltava para a primeira voz
- **Solução:**
  - Salvamento da seleção no localStorage
  - Carregamento da voz salva ao inicializar
  - Sincronização entre diferentes seletores de voz

### ⚡ Correções no TTS - Pausa Entre Frases

#### **Aplicação Correta da Pausa**
- **Antes:** A pausa era fixa em 500ms ou não era aplicada
- **Depois:** A pausa configurada é aplicada corretamente entre frases
- **Implementação:**
  - Aplicação da pausa configurada entre cada frase
  - Funciona tanto no leitor principal quanto no player TTS
  - Valor padrão de 400ms quando não configurado

#### **Persistência da Configuração**
- **Implementado:** Salvamento e carregamento da pausa no localStorage
- **Funcionalidades:**
  - Salvamento automático no localStorage
  - Carregamento da configuração ao inicializar
  - Sincronização entre diferentes controles

#### **Pausas Visuais no Texto**
- **Implementado:** Aplicação de espaços após símbolos de pausa
- **Benefícios:**
  - Melhor legibilidade do texto processado
  - Integração com símbolos configurados
  - Feedback visual das pausas

### 🎛️ Melhorias no TTS - Sincronização de Controles e Interface

#### **Sincronização Completa de Controles**
- **Problema:** Os controles secundários não eram sincronizados com o painel de configurações
- **Solução:** Implementada sincronização bidirecional entre todos os controles
- **Funcionalidades:**
  - Controles secundários sincronizados com painel de configurações
  - Controles do painel sincronizados com controles secundários
  - Atualização em tempo real de todos os valores
  - Persistência de configurações entre sessões

#### **Controles Secundários Expandidos**
- **Adicionados:** Controles completos nos controles secundários
- **Novos Controles:**
  - **Volume:** Controle deslizante com ícone
  - **Velocidade:** Controle deslizante com valor em tempo real
  - **Tom:** Controle deslizante para ajustar pitch da voz
  - **Pausa:** Controle deslizante para pausa entre frases

#### **Botão de Capítulos no Header**
- **Movido:** Botão de capítulos do canto superior direito para o header
- **Melhorias:**
  - Posicionamento mais intuitivo no header
  - Melhor integração visual com outros controles
  - Acesso mais fácil e visível

### 📱 Funcionalidades Técnicas Implementadas

#### **Sincronização Bidirecional**
```javascript
// Sincronizar controles secundários com painel
syncSecondaryControls() {
    // Volume, velocidade, tom e pausa sincronizados
}

// Sincronizar painel com controles secundários
syncSettingsControls() {
    // Todos os controles do painel sincronizados
}
```

#### **Novos Controles Secundários**
```javascript
// Controles de tom
updatePitch() {
    // Sincronização automática com painel
}

// Controles de pausa
updatePause() {
    // Salvamento automático no localStorage
}

// Toggle da sidebar
toggleSidebar() {
    // Controle da sidebar de capítulos
}
```

#### **Extração Inteligente de Frases**
```javascript
extractSentences(text) {
    // Dividir por pontuação final (.!?) mantendo a pontuação
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences
        .map(s => s.trim())
        .filter(s => s.length > 5);
}
```

#### **Leitura Sequencial com Pausas**
```javascript
readSentences(sentences, index) {
    // Leitura frase por frase com pausas configuráveis
    const pausaConfigurada = var_objetoTTS.pausaFrase || 400;
    setTimeout(() => {
        this.readSentences(sentences, index + 1);
    }, pausaConfigurada);
}
```

### 🎨 Estilos CSS Adicionados

#### **Header Controls**
```css
.tts-header-controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.tts-chapters-btn {
    background: rgba(124, 96, 255, 0.8);
}
```

#### **Controles Secundários Expandidos**
```css
.tts-volume-control,
.tts-speed-control,
.tts-pitch-control,
.tts-pause-control {
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    background: rgba(255,255,255,0.1);
    padding: 8px 12px;
    border-radius: 20px;
    backdrop-filter: blur(10px);
}
```

#### **Highlight da Frase Sendo Lida**
```css
.tts-sentence-highlight {
    background: linear-gradient(90deg, rgba(124, 96, 255, 0.3) 0%, rgba(124, 96, 255, 0.2) 100%);
    color: #fff;
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid rgba(124, 96, 255, 0.5);
    box-shadow: 0 2px 8px rgba(124, 96, 255, 0.3);
    animation: tts-highlight-pulse 2s ease-in-out infinite;
}
```

### 🎯 Benefícios das Melhorias

#### **Experiência do Usuário**
- Controles mais acessíveis e intuitivos
- Sincronização automática entre interfaces
- Feedback visual imediato das mudanças
- Foco na frase sendo lida
- Navegação intuitiva por trechos

#### **Funcionalidade**
- Controle completo sem abrir painel de configurações
- Acesso rápido aos controles mais usados
- Persistência de configurações
- Mudança de voz em tempo real
- Pausas configuráveis entre frases

#### **Interface**
- Layout mais limpo e organizado
- Botão de capítulos em posição mais lógica
- Controles secundários mais completos
- Formatação adequada do texto na sidebar
- Highlight visual da posição atual

#### **Performance**
- Sincronização eficiente entre controles
- Carregamento otimizado de configurações
- Atualização em tempo real
- Processamento eficiente de texto
- Navegação otimizada por nós DOM

### 📋 Como Usar as Novas Funcionalidades

#### **Controles Secundários:**
1. Passe o mouse sobre a área de controles
2. Use os sliders para ajustar volume, velocidade, tom e pausa
3. As mudanças são aplicadas imediatamente

#### **Botão de Capítulos:**
1. Clique no botão "Capítulos" no header
2. A sidebar será aberta/fechada
3. Navegue pelos capítulos e trechos

#### **Seleção por Trechos:**
1. Clique em qualquer parágrafo da sidebar
2. A leitura começará a partir daquele trecho
3. O highlight mostrará a posição atual

#### **Configuração de Pausa:**
1. Altere o valor no controle "Pausa entre frases (ms)"
2. A configuração é aplicada imediatamente
3. A pausa é mantida entre sessões

#### **Mudança de Voz:**
1. Selecione uma voz no seletor
2. A voz será aplicada imediatamente
3. A seleção será salva automaticamente
4. A detecção automática será desabilitada

### 🔧 Compatibilidade

- Funciona com Web Speech API
- Compatível com diferentes navegadores
- Preserva configurações entre sessões
- Sincroniza múltiplos seletores de voz
- Responsivo para dispositivos móveis

### 📝 Notas Técnicas

- **Arquivos Modificados**: `static/js/tts.js`, `static/js/tts-player.js`, `templates/tts_player.html`
- **Impacto**: Melhorias significativas na experiência do TTS
- **Compatibilidade**: Total com versões anteriores
- **Performance**: Melhorada com sincronização eficiente

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

- **Versão 1.6.0**: Melhorias significativas no TTS Player com leitura por frases, sincronização de controles, correções de voz e pausa
- **Versão 1.5.0**: Correções críticas no sistema TTS para resolver problema de triplicação de texto
- **Versão 1.4.0**: Foco em melhorias no sistema de dicionário e correções de bugs críticos
- **Versão 1.3.0**: Introdução do sistema de dicionário personalizado e modo escuro
- **Versão 1.2.0**: Implementação da tradução simultânea e sistema de notificações
- **Versão 1.1.0**: Adição da tradução individual e melhorias na interface
- **Versão 1.0.0**: Lançamento inicial com funcionalidades básicas 