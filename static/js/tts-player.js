// tts-player.js
// Player TTS dedicado com design de player de vídeo e melhorias

class TTSPlayer {
    constructor(chapters, fileId, coverUrl) {
        this.chapters = chapters || [];
        this.fileId = fileId;
        this.coverUrl = coverUrl;
        this.currentChapter = 0;
        this.currentParagraph = 0;
        this.paragraphs = [];
        this.currentSentence = '';
        this.isPlaying = false;
        this.isSettingsOpen = false;
        this.isSecondaryControlsVisible = false;
        
        // Elementos do DOM
        this.background = document.getElementById('ttsBackground');
        this.currentText = document.getElementById('currentText');
        this.bookTitle = document.getElementById('bookTitle');
        this.chapterTitle = document.getElementById('chapterTitle');
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.currentTime = document.getElementById('currentTime');
        this.totalTime = document.getElementById('totalTime');
        this.secondaryControls = document.getElementById('secondaryControls');
        
        // Controles de configuração
        this.voiceSelect = document.getElementById('voiceSelect');
        this.testVoiceBtn = document.getElementById('testVoiceBtn');
        this.speedControl = document.getElementById('speedControl');
        this.speedControlValue = document.getElementById('speedControlValue');
        this.pitchControl = document.getElementById('pitchControl');
        this.pitchControlValue = document.getElementById('pitchControlValue');
        this.volumeControl = document.getElementById('volumeControl');
        this.volumeControlValue = document.getElementById('volumeControlValue');
        this.pauseControl = document.getElementById('pauseControl');
        this.pauseSymbols = document.getElementById('pauseSymbols');
        
        // Controles secundários
        this.volumeSlider = document.getElementById('volumeSlider');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.pitchSlider = document.getElementById('pitchSlider');
        this.pitchValue = document.getElementById('pitchValue');
        this.pauseSlider = document.getElementById('pauseSlider');
        this.pauseValue = document.getElementById('pauseValue');
        this.chaptersBtn = document.getElementById('chaptersBtn');
        
        this.init();
    }
    
    init() {
        this.setupBackground();
        this.setupEventListeners();
        this.loadSettings();
        this.initializeTTS();
        this.loadChapter(0);
        this.createSidebar();
        this.carregarDicionarioPronuncia();
        console.log('Player TTS inicializado com sucesso');
    }
    
    setupBackground() {
        if (this.coverUrl && this.background) {
            // Aplicar background baseado na capa
            this.background.style.setProperty('--cover-url', `url(${this.coverUrl})`);
            this.background.classList.add('with-cover');
            
            // Análise de cores da capa para personalizar o background
            this.analyzeCoverColors(this.coverUrl);
        }
    }
    
    analyzeCoverColors(coverUrl) {
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';
        tempImg.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = tempImg.width;
                canvas.height = tempImg.height;
                ctx.drawImage(tempImg, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
                
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                const isDark = brightness < 128;
                
                if (isDark) {
                    this.background.style.background = `linear-gradient(135deg, rgba(${r},${g},${b},0.9) 0%, rgba(${r},${g},${b},0.7) 100%), var(--cover-url)`;
                } else {
                    this.background.style.background = `linear-gradient(135deg, rgba(${r},${g},${b},0.3) 0%, rgba(${r},${g},${b},0.1) 100%), var(--cover-url)`;
                }
                
            } catch (error) {
                console.warn('Erro ao analisar capa:', error);
                this.background.style.background = `linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%), var(--cover-url)`;
            }
        };
        
        tempImg.onerror = () => {
            console.warn('Erro ao carregar capa para análise');
        };
        
        tempImg.src = coverUrl;
    }
    
    setupEventListeners() {
        // Controles principais
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousParagraph());
        this.nextBtn.addEventListener('click', () => this.nextParagraph());
        this.settingsBtn.addEventListener('click', () => this.toggleSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        
        // Barra de progresso
        this.progressBar.addEventListener('click', (e) => this.seekToPosition(e));
        
        // Controles secundários
        this.volumeSlider.addEventListener('input', () => this.updateVolume());
        this.speedSlider.addEventListener('input', () => this.updateSpeed());
        this.pitchSlider.addEventListener('input', () => this.updatePitch());
        this.pauseSlider.addEventListener('input', () => this.updatePause());
        
        // Botão de capítulos
        this.chaptersBtn.addEventListener('click', () => this.toggleSidebar());
        
        // Configurações
        this.voiceSelect.addEventListener('change', () => this.updateVoice());
        this.testVoiceBtn.addEventListener('click', () => this.testVoice());
        this.speedControl.addEventListener('input', () => this.updateSpeedControl());
        this.pitchControl.addEventListener('input', () => this.updatePitchControl());
        this.volumeControl.addEventListener('input', () => this.updateVolumeControl());
        this.pauseControl.addEventListener('input', () => this.updatePauseControl());
        this.pauseControl.addEventListener('change', () => this.saveSettings());
        this.pauseSymbols.addEventListener('input', () => this.updatePauseSymbols());
        this.pauseSymbols.addEventListener('change', () => this.updateSidebarText());
        
        // Clique fora para fechar configurações
        document.addEventListener('click', (e) => {
            if (e.target === this.settingsPanel) {
                this.closeSettings();
            }
        });
        
        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlay();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.previousParagraph();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.nextParagraph();
            } else if (e.code === 'Escape') {
                this.closeSettings();
            }
        });
        
        // Mostrar controles secundários ao passar o mouse
        const controlsArea = document.querySelector('.tts-controls');
        if (controlsArea) {
            controlsArea.addEventListener('mouseenter', () => this.showSecondaryControls());
            controlsArea.addEventListener('mouseleave', () => this.hideSecondaryControls());
        }
    }
    
    initializeTTS() {
        // Verificar se o TTS está disponível
        if (typeof var_objetoTTS !== 'undefined' && var_objetoTTS.sintetizador) {
            console.log('TTS (Web Speech API) inicializado com sucesso');
            this.loadVoices();
        } else {
            console.warn('Web Speech API não disponível ou tts.js não carregado');
            this.showTTSNotAvailable();
        }
    }
    
    showTTSNotAvailable() {
        if (this.currentText) {
            this.currentText.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <span class="mui-icon" style="font-size: 48px; color: #f44336;">error</span>
                    <h3 style="margin: 16px 0;">TTS Não Disponível</h3>
                    <p>O Text-to-Speech não está disponível neste navegador.</p>
                    <p>Tente usar Chrome, Edge ou Firefox.</p>
                </div>
            `;
        }
    }
    
    loadVoices() {
        if (typeof var_objetoTTS !== 'undefined' && var_objetoTTS.listaVozes) {
            this.voiceSelect.innerHTML = '';
            
            var_objetoTTS.listaVozes.forEach((voice, idx) => {
                const option = document.createElement('option');
                option.value = idx;
                option.textContent = `${voice.name} (${voice.lang || 'N/A'})`;
                this.voiceSelect.appendChild(option);
            });
            
            // Carregar voz salva ou selecionar a primeira
            const savedVoice = localStorage.getItem('ttsSelectedVoice');
            if (savedVoice) {
                const voiceIndex = parseInt(savedVoice);
                if (voiceIndex >= 0 && voiceIndex < var_objetoTTS.listaVozes.length) {
                    this.voiceSelect.value = voiceIndex;
                    var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[voiceIndex];
                } else {
                    // Se a voz salva não existe mais, usar a primeira
                    this.voiceSelect.value = 0;
                    var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[0];
                    localStorage.setItem('ttsSelectedVoice', '0');
                }
            } else if (var_objetoTTS.listaVozes.length > 0) {
                // Primeira vez - selecionar primeira voz
                this.voiceSelect.value = 0;
                var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[0];
                localStorage.setItem('ttsSelectedVoice', '0');
            }
        } else {
            // Simulação ou mensagem amigável
            if (this.voiceSelect) {
                this.voiceSelect.innerHTML = '<option>Carregando vozes...</option>';
            }
        }
    }
    
    loadChapter(chapterIndex) {
        if (chapterIndex < 0 || chapterIndex >= this.chapters.length) {
            return;
        }
        
        this.currentChapter = chapterIndex;
        const chapter = this.chapters[chapterIndex];
        
        // Atualizar informações do capítulo
        if (this.chapterTitle) {
            this.chapterTitle.textContent = chapter.title;
        }
        
        // Extrair parágrafos
        this.paragraphs = this.extractParagraphs(chapter.content);
        this.currentParagraph = 0;
        
        // Atualizar display
        this.updateDisplay();
        
        this.updateSidebarText();
        
        console.log(`Capítulo carregado: ${chapter.title} com ${this.paragraphs.length} parágrafos`);
    }
    
    extractParagraphs(text) {
        if (!text) return [];
        
        // Obter símbolos de pausa configurados
        let pauseSymbols = '.?!';
        if (this.pauseSymbols) {
            pauseSymbols = this.pauseSymbols.value || '.?!';
        }
        
        // Criar regex dinâmico baseado nos símbolos de pausa
        const escapedSymbols = pauseSymbols.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const pauseRegex = new RegExp(`[^${escapedSymbols}]+[${escapedSymbols}]+`, 'g');
        
        // Dividir por símbolos de pausa
        const segments = text.match(pauseRegex) || [];
        
        // Se não encontrar segmentos, dividir por parágrafos tradicionais
        if (segments.length === 0) {
            return text
                .split(/\n\s*\n/)
                .map(p => p.trim())
                .filter(p => p.length > 0)
                .map(p => p.replace(/\n/g, ' '))
                .filter(p => p.length > 10);
        }
        
        // Filtrar e limpar segmentos
        return segments
            .map(segment => segment.trim())
            .filter(segment => segment.length > 5)
            .map(segment => segment.replace(/\n/g, ' '));
    }
    
    // Extrair frases de um texto
    extractSentences(text) {
        if (!text) return [];
        
        // Dividir por pontuação final (.!?) mantendo a pontuação
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        return sentences
            .map(s => s.trim())
            .filter(s => s.length > 5);
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    play() {
        if (this.paragraphs.length === 0) {
            // Tenta avançar para o próximo capítulo automaticamente
            if (this.currentChapter < this.chapters.length - 1) {
                this.loadChapter(this.currentChapter + 1);
                this.play();
            } else {
                if (this.currentText) {
                    this.currentText.innerHTML = 'Nenhum texto disponível para leitura nos capítulos seguintes.';
                }
                console.warn('Nenhum parágrafo disponível para leitura');
            }
            return;
        }
        
        this.isPlaying = true;
        this.playBtn.classList.add('playing');
        this.playBtn.innerHTML = '<span class="mui-icon">pause</span>';
        
        if (typeof lerTextoTTS === 'function' && typeof var_objetoTTS !== 'undefined') {
            const currentText = this.paragraphs[this.currentParagraph];
            if (currentText) {
                // Extrair frases do parágrafo atual
                const sentences = this.extractSentences(currentText);
                if (sentences.length > 0) {
                    this.readSentences(sentences, 0);
                } else {
                    // Se não conseguir extrair frases, ler o texto completo
                    this.readText(currentText);
                }
            }
        } else {
            // Simulação para demonstração
            this.simulateReading();
        }
    }
    
    readSentences(sentences, index) {
        if (!this.isPlaying || index >= sentences.length) {
            this.onTTSEnd();
            return;
        }
        
        const sentence = sentences[index];
        this.currentSentence = sentence;
        this.updateCurrentText();
        this.highlightSentenceInSidebar(sentence);
        
        // Aplicar dicionário de pronúncia
        const sentenceComPronuncia = this.aplicarDicionarioPronuncia(sentence);
        
        if (typeof lerTextoTTS === 'function') {
            lerTextoTTS(sentenceComPronuncia, () => {
                // Próxima frase com pausa configurada
                const pausaConfigurada = var_objetoTTS.pausaFrase || 400;
                setTimeout(() => {
                    this.readSentences(sentences, index + 1);
                }, pausaConfigurada);
            });
        } else {
            // Simulação
            setTimeout(() => {
                this.readSentences(sentences, index + 1);
            }, 3000);
        }
    }
    
    readText(text) {
        this.currentSentence = text;
        this.updateCurrentText();
        this.highlightSentenceInSidebar(text);
        
        // Aplicar dicionário de pronúncia
        const textComPronuncia = this.aplicarDicionarioPronuncia(text);
        
        if (typeof lerTextoTTS === 'function') {
            lerTextoTTS(textComPronuncia, () => {
                this.onTTSEnd();
            });
        } else {
            // Simulação
            setTimeout(() => {
                this.onTTSEnd();
            }, 3000);
        }
    }
    
    updateCurrentText() {
        if (this.currentText) {
            this.currentText.textContent = this.currentSentence;
        }
    }
    
    highlightSentenceInSidebar(sentence) {
        if (this.sidebarText) {
            // Remover highlights anteriores
            this.sidebarText.querySelectorAll('.tts-sentence-highlight').forEach(el => {
                el.classList.remove('tts-sentence-highlight');
            });
            
            // Encontrar e destacar a frase atual
            const textNodes = this.getTextNodes(this.sidebarText);
            for (const node of textNodes) {
                const text = node.textContent;
                const index = text.indexOf(sentence);
                if (index !== -1) {
                    // Criar highlight
                    const before = text.substring(0, index);
                    const after = text.substring(index + sentence.length);
                    
                    const fragment = document.createDocumentFragment();
                    if (before) fragment.appendChild(document.createTextNode(before));
                    
                    const span = document.createElement('span');
                    span.className = 'tts-sentence-highlight';
                    span.textContent = sentence;
                    fragment.appendChild(span);
                    
                    if (after) fragment.appendChild(document.createTextNode(after));
                    
                    node.parentNode.replaceChild(fragment, node);
                    
                    // Scroll para o highlight
                    span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }
        }
    }
    
    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        return textNodes;
    }
    
    pause() {
        this.isPlaying = false;
        this.playBtn.classList.remove('playing');
        this.playBtn.innerHTML = '<span class="mui-icon">play_arrow</span>';
        
        if (typeof pausarLeituraTTS === 'function') {
            pausarLeituraTTS();
        }
    }
    
    resume() {
        this.isPlaying = true;
        this.playBtn.classList.add('playing');
        this.playBtn.innerHTML = '<span class="mui-icon">pause</span>';
        if (typeof retomarLeituraTTS === 'function') {
            retomarLeituraTTS();
        }
    }
    
    stop() {
        this.isPlaying = false;
        this.playBtn.classList.remove('playing');
        this.playBtn.innerHTML = '<span class="mui-icon">play_arrow</span>';
        
        if (typeof pararLeituraTTS === 'function') {
            pararLeituraTTS();
        }
        
        this.currentParagraph = 0;
        this.currentSentence = '';
        this.updateDisplay();
        
        // Limpar highlights
        if (this.sidebarText) {
            this.sidebarText.querySelectorAll('.tts-sentence-highlight').forEach(el => {
                el.classList.remove('tts-sentence-highlight');
            });
        }
    }
    
    previousParagraph() {
        if (this.currentParagraph > 0) {
            this.currentParagraph--;
            this.updateDisplay();
            this.highlightCurrentText();
        } else if (this.currentChapter > 0) {
            this.loadChapter(this.currentChapter - 1);
        }
    }
    
    nextParagraph() {
        if (this.currentParagraph < this.paragraphs.length - 1) {
            this.currentParagraph++;
            this.updateDisplay();
            this.highlightCurrentText();
        } else if (this.currentChapter < this.chapters.length - 1) {
            this.loadChapter(this.currentChapter + 1);
        }
    }
    
    seekToPosition(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        
        const totalParagraphs = this.paragraphs.length;
        const newParagraph = Math.floor(percentage * totalParagraphs);
        
        if (newParagraph >= 0 && newParagraph < totalParagraphs) {
            this.currentParagraph = newParagraph;
            this.updateDisplay();
            this.highlightCurrentText();
        }
    }
    
    updateDisplay() {
        // Atualizar texto atual (mostrar parágrafo completo quando não está lendo)
        if (this.currentText && this.paragraphs.length > 0) {
            if (!this.isPlaying) {
                this.currentText.textContent = this.paragraphs[this.currentParagraph];
            }
        }
        
        // Atualizar barra de progresso
        if (this.progressFill) {
            const progress = this.paragraphs.length > 0 ? 
                (this.currentParagraph / (this.paragraphs.length - 1)) * 100 : 0;
            this.progressFill.style.width = progress + '%';
        }
        
        // Atualizar tempo
        if (this.currentTime) {
            this.currentTime.textContent = this.formatTime(this.currentParagraph * 3);
        }
        
        if (this.totalTime) {
            this.totalTime.textContent = this.formatTime(this.paragraphs.length * 3);
        }
        
        // Atualizar estado dos botões
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentParagraph === 0 && this.currentChapter === 0;
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentParagraph === this.paragraphs.length - 1 && 
                                   this.currentChapter === this.chapters.length - 1;
        }
    }
    
    highlightCurrentText() {
        if (this.currentText) {
            this.currentText.classList.add('highlighted');
            setTimeout(() => {
                this.currentText.classList.remove('highlighted');
            }, 500);
        }
    }
    
    toggleSettings() {
        this.isSettingsOpen = !this.isSettingsOpen;
        this.settingsPanel.classList.toggle('show', this.isSettingsOpen);
    }
    
    closeSettings() {
        this.isSettingsOpen = false;
        this.settingsPanel.classList.remove('show');
    }
    
    showSecondaryControls() {
        this.isSecondaryControlsVisible = true;
        this.secondaryControls.classList.add('show');
    }
    
    hideSecondaryControls() {
        this.isSecondaryControlsVisible = false;
        this.secondaryControls.classList.remove('show');
    }
    
    updateVoice() {
        if (typeof var_objetoTTS !== 'undefined' && this.voiceSelect) {
            const idx = parseInt(this.voiceSelect.value);
            if (idx >= 0 && idx < var_objetoTTS.listaVozes.length) {
                var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[idx];
                // Marcar como selecionada manualmente
                if (typeof vozSelecionadaManual !== 'undefined') {
                    vozSelecionadaManual = true;
                }
                // Salvar a seleção no localStorage
                localStorage.setItem('ttsSelectedVoice', idx);
                
                // Se estiver lendo, aplicar a nova voz imediatamente sem parar
                if (var_objetoTTS.sintetizador && var_objetoTTS.sintetizador.speaking) {
                    console.log('Voz alterada em tempo real para:', var_objetoTTS.vozAtual.name);
                    // A nova voz será aplicada automaticamente na próxima frase
                }
            }
        }
    }
    
    testVoice() {
        if (typeof testarVozTTS === 'function') {
            testarVozTTS();
        }
    }
    
    updateSpeedControl() {
        if (this.speedControl && this.speedControlValue) {
            const value = this.speedControl.value;
            this.speedControlValue.textContent = value;
            if (typeof var_objetoTTS !== 'undefined') {
                var_objetoTTS.definirVelocidade(parseFloat(value));
                // Sincronizar controles secundários
                this.syncSecondaryControls();
            }
        }
    }
    
    updatePitchControl() {
        if (this.pitchControl && this.pitchControlValue) {
            const value = this.pitchControl.value;
            this.pitchControlValue.textContent = value;
            
            if (typeof var_objetoTTS !== 'undefined') {
                var_objetoTTS.definirTom(parseFloat(value));
                // Sincronizar controles secundários
                this.syncSecondaryControls();
            }
        }
    }
    
    updateVolumeControl() {
        if (this.volumeControl && this.volumeControlValue) {
            const value = this.volumeControl.value;
            this.volumeControlValue.textContent = value;
            
            if (typeof var_objetoTTS !== 'undefined') {
                var_objetoTTS.definirVolume(parseFloat(value));
                // Sincronizar controles secundários
                this.syncSecondaryControls();
            }
        }
    }
    
    updatePauseControl() {
        if (this.pauseControl && typeof var_objetoTTS !== 'undefined') {
            const pauseValue = parseInt(this.pauseControl.value);
            var_objetoTTS.definirPausaFrase(pauseValue);
            // Salvar no localStorage
            localStorage.setItem('ttsPauseValue', pauseValue);
            console.log('Pausa entre frases alterada para:', pauseValue + 'ms');
        }
    }
    
    updatePauseSymbols() {
        if (this.pauseSymbols && typeof var_objetoTTS !== 'undefined') {
            var_objetoTTS.definirSimbolosPausa(this.pauseSymbols.value);
            // Atualizar sidebar com novos símbolos de pausa
            this.updateSidebarText();
        }
    }
    
    updateVolume() {
        if (this.volumeSlider && typeof var_objetoTTS !== 'undefined') {
            const value = parseFloat(this.volumeSlider.value);
            var_objetoTTS.definirVolume(value);
            // Sincronizar controles do painel de configurações
            this.syncSettingsControls();
        }
    }
    
    updateSpeed() {
        if (this.speedSlider && this.speedValue && typeof var_objetoTTS !== 'undefined') {
            const value = this.speedSlider.value;
            this.speedValue.textContent = value + 'x';
            var_objetoTTS.definirVelocidade(parseFloat(value));
            // Sincronizar controles do painel de configurações
            this.syncSettingsControls();
        }
    }
    
    onTTSStart() {
        this.highlightCurrentText();
    }
    
    onTTSEnd() {
        if (this.isPlaying) {
            // Ir para o próximo parágrafo
            setTimeout(() => {
                if (this.currentParagraph < this.paragraphs.length - 1) {
                    this.currentParagraph++;
                    this.updateDisplay();
                    this.play();
                } else if (this.currentChapter < this.chapters.length - 1) {
                    this.loadChapter(this.currentChapter + 1);
                    this.play();
                } else {
                    this.stop();
                }
            }, 500);
        }
    }
    
    simulateReading() {
        // Simulação para demonstração
        const duration = 3000;
        const startTime = Date.now();
        
        const updateProgress = () => {
            if (!this.isPlaying) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                requestAnimationFrame(updateProgress);
            } else {
                this.onTTSEnd();
            }
        };
        
        updateProgress();
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('ttsPlayerSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                if (settings.voice && this.voiceSelect) {
                    this.voiceSelect.value = settings.voice;
                }
                if (settings.speed && this.speedControl) {
                    this.speedControl.value = settings.speed;
                    this.speedControlValue.textContent = settings.speed;
                }
                if (settings.pitch && this.pitchControl) {
                    this.pitchControl.value = settings.pitch;
                    this.pitchControlValue.textContent = settings.pitch;
                }
                if (settings.volume && this.volumeControl) {
                    this.volumeControl.value = settings.volume;
                    this.volumeControlValue.textContent = settings.volume;
                }
                if (settings.pause && this.pauseControl) {
                    this.pauseControl.value = settings.pause;
                }
                if (settings.symbols && this.pauseSymbols) {
                    this.pauseSymbols.value = settings.symbols;
                }
                
            } catch (e) {
                console.error('Erro ao carregar configurações:', e);
            }
        }
        
        // Carregar pausa salva
        const savedPause = localStorage.getItem('ttsPauseValue');
        if (savedPause && this.pauseControl) {
            this.pauseControl.value = savedPause;
            if (typeof var_objetoTTS !== 'undefined') {
                var_objetoTTS.definirPausaFrase(parseInt(savedPause));
            }
        }
        
        // Carregar controles secundários
        if (typeof var_objetoTTS !== 'undefined') {
            this.syncSecondaryControls();
        }
        
        // Carregar voz selecionada
        const savedVoice = localStorage.getItem('ttsSelectedVoice');
        if (savedVoice && this.voiceSelect) {
            const voiceIndex = parseInt(savedVoice);
            if (voiceIndex >= 0 && voiceIndex < this.voiceSelect.options.length) {
                this.voiceSelect.value = voiceIndex;
                if (typeof var_objetoTTS !== 'undefined' && var_objetoTTS.listaVozes[voiceIndex]) {
                    var_objetoTTS.vozAtual = var_objetoTTS.listaVozes[voiceIndex];
                }
            }
        }
    }
    
    saveSettings() {
        const settings = {
            voice: this.voiceSelect?.value,
            speed: this.speedControl?.value,
            pitch: this.pitchControl?.value,
            volume: this.volumeControl?.value,
            pause: this.pauseControl?.value,
            symbols: this.pauseSymbols?.value
        };
        
        localStorage.setItem('ttsPlayerSettings', JSON.stringify(settings));
        
        // Salvar pausa separadamente também
        if (this.pauseControl) {
            localStorage.setItem('ttsPauseValue', this.pauseControl.value);
        }
    }
    
    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'ttsSidebar';
        sidebar.className = 'mui-paper';
        sidebar.style.position = 'fixed';
        sidebar.style.top = '0';
        sidebar.style.left = '-350px';
        sidebar.style.width = '350px';
        sidebar.style.height = '100vh';
        sidebar.style.background = '#23232b';
        sidebar.style.overflowY = 'auto';
        sidebar.style.zIndex = '2000';
        sidebar.style.color = '#fff';
        sidebar.style.boxShadow = '2px 0 8px rgba(0,0,0,0.2)';
        sidebar.style.display = 'flex';
        sidebar.style.flexDirection = 'column';
        sidebar.style.transition = 'left 0.3s';

        // Botão de fechar
        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Fechar';
        closeBtn.className = 'mui-button mui-button--outlined';
        closeBtn.style.margin = '10px';
        closeBtn.style.alignSelf = 'flex-end';
        closeBtn.onclick = () => { sidebar.style.left = '-350px'; };
        sidebar.appendChild(closeBtn);

        // Campo de busca
        const searchContainer = document.createElement('div');
        searchContainer.style.padding = '0 10px 10px 10px';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'ttsSidebarSearchInput';
        searchInput.placeholder = 'Pesquisar no texto...';
        searchInput.className = 'mui-input';
        searchInput.style.width = '100%';
        searchInput.style.marginBottom = '8px';
        searchContainer.appendChild(searchInput);
        sidebar.appendChild(searchContainer);

        // Lista de capítulos
        const chapterList = document.createElement('ul');
        chapterList.className = 'mui-list';
        chapterList.style.listStyle = 'none';
        chapterList.style.padding = '0 10px';
        chapterList.style.margin = '0';
        chapterList.style.maxHeight = '200px';
        chapterList.style.overflowY = 'auto';
        this.chapters.forEach((cap, idx) => {
            const item = document.createElement('li');
            item.innerText = cap.title;
            item.className = 'mui-list-item';
            item.style.cursor = 'pointer';
            item.style.padding = '10px 0';
            item.onclick = () => {
                this.loadChapter(idx);
                this.updateSidebarText();
            };
            chapterList.appendChild(item);
        });
        sidebar.appendChild(chapterList);

        // Indicador de trechos
        const segmentIndicator = document.createElement('div');
        segmentIndicator.id = 'segmentIndicator';
        segmentIndicator.style.padding = '8px 10px';
        segmentIndicator.style.fontSize = '12px';
        segmentIndicator.style.color = 'rgba(255,255,255,0.7)';
        segmentIndicator.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        segmentIndicator.style.marginBottom = '10px';
        sidebar.appendChild(segmentIndicator);

        // Área de texto completo com formatação
        const textArea = document.createElement('div');
        textArea.id = 'ttsSidebarText';
        textArea.className = 'mui-paper';
        textArea.style.padding = '16px';
        textArea.style.whiteSpace = 'pre-line';
        textArea.style.fontSize = '15px';
        textArea.style.flex = '1';
        textArea.style.overflowY = 'auto';
        textArea.style.background = '#282838';
        textArea.style.maxHeight = 'calc(100vh - 250px)';
        textArea.style.lineHeight = '1.6';
        textArea.style.cursor = 'text';
        sidebar.appendChild(textArea);

        // Botão para começar leitura do trecho selecionado
        const startFromBtn = document.createElement('button');
        startFromBtn.innerText = 'Começar leitura daqui';
        startFromBtn.className = 'mui-button mui-button--contained';
        startFromBtn.style.margin = '10px';
        startFromBtn.style.alignSelf = 'flex-end';
        startFromBtn.onclick = () => {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : '';
            if (selectedText) {
                const paragraphs = this.extractParagraphs(this.chapters[this.currentChapter].content);
                let foundIdx = -1;
                for (let i = 0; i < paragraphs.length; i++) {
                    if (paragraphs[i].includes(selectedText)) {
                        foundIdx = i;
                        break;
                    }
                }
                if (foundIdx !== -1) {
                    this.currentParagraph = foundIdx;
                    this.updateDisplay();
                    this.play();
                    sidebar.style.left = '-350px';
                } else {
                    alert('Não foi possível encontrar o trecho selecionado entre os parágrafos.');
                }
            } else {
                alert('Selecione um trecho do texto para começar a leitura.');
            }
        };
        sidebar.appendChild(startFromBtn);

        document.body.appendChild(sidebar);
        this.sidebar = sidebar;
        this.sidebarText = textArea;
        this._sidebarSearchInput = searchInput;
        this._sidebarSearchInput.addEventListener('input', () => this.updateSidebarText());
        this.updateSidebarText();
    }
    
    updateSidebarText() {
        if (this.sidebarText && this.chapters[this.currentChapter]) {
            const content = this.chapters[this.currentChapter].content;
            const searchTerm = this._sidebarSearchInput ? this._sidebarSearchInput.value.trim().toLowerCase() : '';
            // Formatar o texto mantendo quebras de linha e parágrafos
            const formattedContent = content
                .replace(/\n\s*\n/g, '\n\n') // Normalizar quebras de parágrafo
                .replace(/\n/g, '\n') // Manter quebras de linha
                .trim();
            this.sidebarText.innerHTML = '';
            // Obter símbolos de pausa configurados
            let pauseSymbols = '.?!';
            if (this.pauseSymbols) {
                pauseSymbols = this.pauseSymbols.value || '.?!';
            }
            // Criar regex dinâmico baseado nos símbolos de pausa
            const escapedSymbols = pauseSymbols.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const pauseRegex = new RegExp(`[^${escapedSymbols}]+[${escapedSymbols}]+`, 'g');
            // Dividir por símbolos de pausa
            const segments = formattedContent.match(pauseRegex) || [];
            const showSegments = segments.length > 0;
            const items = showSegments ? segments : formattedContent.split(/\n\s*\n/);
            let count = 0;
            items.forEach((item, index) => {
                if (item.trim() && (!searchTerm || item.toLowerCase().includes(searchTerm))) {
                    const p = document.createElement('p');
                    p.style.margin = showSegments ? '0 0 12px 0' : '0 0 16px 0';
                    p.style.padding = showSegments ? '10px' : '12px';
                    p.style.borderRadius = '6px';
                    p.style.cursor = 'pointer';
                    p.style.transition = 'all 0.2s ease';
                    p.style.borderLeft = '3px solid transparent';
                    p.style.background = 'rgba(255,255,255,0.02)';
                    p.style.fontSize = showSegments ? '14px' : '';
                    p.style.lineHeight = showSegments ? '1.5' : '';
                    // Adicionar hover effect
                    p.addEventListener('mouseenter', () => {
                        p.style.backgroundColor = 'rgba(255,255,255,0.08)';
                        p.style.borderLeftColor = 'rgba(124, 96, 255, 0.5)';
                        p.style.transform = 'translateX(2px)';
                    });
                    p.addEventListener('mouseleave', () => {
                        p.style.backgroundColor = 'rgba(255,255,255,0.02)';
                        p.style.borderLeftColor = 'transparent';
                        p.style.transform = 'translateX(0)';
                    });
                    // Adicionar click para selecionar trecho/parágrafo
                    if (showSegments) {
                        p.addEventListener('click', () => {
                            this.selectSegmentFromSidebar(item.trim(), index);
                        });
                    } else {
                        p.addEventListener('click', () => {
                            this.selectParagraphFromSidebar(item);
                        });
                    }
                    // Destacar termo buscado
                    if (searchTerm) {
                        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                        p.innerHTML = item.trim().replace(regex, '<mark style="background: #7C60FF; color: #fff; border-radius: 3px; padding: 0 2px;">$1</mark>');
                    } else {
                        p.textContent = item.trim();
                    }
                    this.sidebarText.appendChild(p);
                    count++;
                }
            });
            // Atualizar indicador
            const segmentIndicator = document.getElementById('segmentIndicator');
            if (segmentIndicator) {
                if (showSegments) {
                    segmentIndicator.innerHTML = `<span class="mui-icon" style="font-size: 14px; margin-right: 5px;">segment</span> ${count} trechos encontrados${searchTerm ? ` para "${searchTerm}"` : ''}`;
                } else {
                    segmentIndicator.innerHTML = `<span class="mui-icon" style="font-size: 14px; margin-right: 5px;">article</span> ${count} parágrafos encontrados${searchTerm ? ` para "${searchTerm}"` : ''}`;
                }
            }
        }
    }
    
    selectSegmentFromSidebar(segmentText, index) {
        // Definir o parágrafo atual como o índice do segmento
        this.currentParagraph = index;
        this.updateDisplay();
        this.play();
    }
    
    selectParagraphFromSidebar(paragraphText) {
        // Encontrar o índice do parágrafo
        const paragraphs = this.extractParagraphs(this.chapters[this.currentChapter].content);
        const index = paragraphs.findIndex(p => p.includes(paragraphText.trim()));
        
        if (index !== -1) {
            this.currentParagraph = index;
            this.updateDisplay();
            this.play();
        }
    }

    // Sincronizar controles
    sincronizarControles() {
        // Controles do leitor principal
        const controleVelocidade = document.getElementById('controle_velocidade');
        const valorVelocidade = document.getElementById('valor_velocidade');
        const controleTom = document.getElementById('controle_tom');
        const valorTom = document.getElementById('valor_tom');
        const controleVolume = document.getElementById('controle_volume');
        const valorVolume = document.getElementById('valor_volume');
        
        if (controleVelocidade && valorVelocidade) {
            controleVelocidade.value = this.velocidade;
            valorVelocidade.textContent = this.velocidade.toFixed(1);
        }
        
        if (controleTom && valorTom) {
            controleTom.value = this.tom;
            valorTom.textContent = this.tom.toFixed(1);
        }
        
        if (controleVolume && valorVolume) {
            controleVolume.value = this.volume;
            valorVolume.textContent = this.volume.toFixed(1);
        }
        
        // Controles do player TTS
        const speedControl = document.getElementById('speedControl');
        const speedControlValue = document.getElementById('speedControlValue');
        const pitchControl = document.getElementById('pitchControl');
        const pitchControlValue = document.getElementById('pitchControlValue');
        const volumeControl = document.getElementById('volumeControl');
        const volumeControlValue = document.getElementById('volumeControlValue');
        
        if (speedControl && speedControlValue) {
            speedControl.value = this.velocidade;
            speedControlValue.textContent = this.velocidade.toFixed(1);
        }
        
        if (pitchControl && pitchControlValue) {
            pitchControl.value = this.tom;
            pitchControlValue.textContent = this.tom.toFixed(1);
        }
        
        if (volumeControl && volumeControlValue) {
            volumeControl.value = this.volume;
            volumeControlValue.textContent = this.volume.toFixed(1);
        }
        
        // Controles secundários do player TTS
        const volumeSlider = document.getElementById('volumeSlider');
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        
        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
        
        if (speedSlider && speedValue) {
            speedSlider.value = this.velocidade;
            speedValue.textContent = this.velocidade.toFixed(1) + 'x';
        }
    }

    syncSecondaryControls() {
        if (typeof var_objetoTTS !== 'undefined') {
            // Sincronizar volume
            if (this.volumeSlider) {
                this.volumeSlider.value = var_objetoTTS.volume;
            }
            
            // Sincronizar velocidade
            if (this.speedSlider && this.speedValue) {
                this.speedSlider.value = var_objetoTTS.velocidade;
                this.speedValue.textContent = var_objetoTTS.velocidade.toFixed(1) + 'x';
            }
            
            // Sincronizar tom
            if (this.pitchSlider && this.pitchValue) {
                this.pitchSlider.value = var_objetoTTS.tom;
                this.pitchValue.textContent = var_objetoTTS.tom.toFixed(1);
            }
            
            // Sincronizar pausa
            if (this.pauseSlider && this.pauseValue) {
                this.pauseSlider.value = var_objetoTTS.pausaFrase;
                this.pauseValue.textContent = var_objetoTTS.pausaFrase + 'ms';
            }
        }
    }

    syncSettingsControls() {
        if (typeof var_objetoTTS !== 'undefined') {
            // Sincronizar controles do painel de configurações
            if (this.speedControl && this.speedControlValue) {
                this.speedControl.value = var_objetoTTS.velocidade;
                this.speedControlValue.textContent = var_objetoTTS.velocidade.toFixed(1);
            }
            
            if (this.pitchControl && this.pitchControlValue) {
                this.pitchControl.value = var_objetoTTS.tom;
                this.pitchControlValue.textContent = var_objetoTTS.tom.toFixed(1);
            }
            
            if (this.volumeControl && this.volumeControlValue) {
                this.volumeControl.value = var_objetoTTS.volume;
                this.volumeControlValue.textContent = var_objetoTTS.volume.toFixed(1);
            }
            
            if (this.pauseControl) {
                this.pauseControl.value = var_objetoTTS.pausaFrase;
            }
        }
    }

    updatePitch() {
        if (this.pitchSlider && this.pitchValue && typeof var_objetoTTS !== 'undefined') {
            const value = this.pitchSlider.value;
            this.pitchValue.textContent = value;
            var_objetoTTS.definirTom(parseFloat(value));
            // Sincronizar controles do painel de configurações
            this.syncSettingsControls();
        }
    }
    
    updatePause() {
        if (this.pauseSlider && this.pauseValue && typeof var_objetoTTS !== 'undefined') {
            const value = this.pauseSlider.value;
            this.pauseValue.textContent = value + 'ms';
            var_objetoTTS.definirPausaFrase(parseInt(value));
            // Salvar no localStorage
            localStorage.setItem('ttsPauseValue', value);
        }
    }
    
    toggleSidebar() {
        if (this.sidebar) {
            const currentLeft = this.sidebar.style.left;
            if (currentLeft === '0px') {
                this.sidebar.style.left = '-350px';
            } else {
                this.sidebar.style.left = '0';
            }
        }
    }
    
    async carregarDicionarioPronuncia() {
        try {
            const response = await fetch('/dicionario-pronuncia');
            if (response.ok) {
                const dicionario = await response.json();
                this.dicionarioPronuncia = dicionario;
                console.log('Dicionário de pronúncia carregado:', Object.keys(dicionario).length, 'entradas');
            } else {
                console.warn('Erro ao carregar dicionário de pronúncia');
                this.dicionarioPronuncia = {};
            }
        } catch (error) {
            console.warn('Erro ao carregar dicionário de pronúncia:', error);
            this.dicionarioPronuncia = {};
        }
    }
    
    aplicarDicionarioPronuncia(texto) {
        if (!this.dicionarioPronuncia || Object.keys(this.dicionarioPronuncia).length === 0) {
            return texto;
        }
        
        let textoProcessado = texto;
        
        // Ordenar entradas por tamanho (mais longas primeiro) para evitar substituições parciais
        const entradasOrdenadas = Object.entries(this.dicionarioPronuncia)
            .sort((a, b) => b[0].length - a[0].length);
        
        for (const [palavraOriginal, pronuncia] of entradasOrdenadas) {
            // Usar regex para substituir apenas palavras completas
            const padrao = new RegExp(`\\b${palavraOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            textoProcessado = textoProcessado.replace(padrao, pronuncia);
        }
        
        return textoProcessado;
    }
} 