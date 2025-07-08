// spotify-player.js
// Controle do player TTS estilo Carrossel

class SpotifyPlayer {
    constructor() {
        this.player = document.getElementById('spotifyPlayer');
        this.playBtn = document.getElementById('playerPlay');
        this.prevBtn = document.getElementById('playerPrev');
        this.nextBtn = document.getElementById('playerNext');
        this.menuToggle = document.getElementById('playerMenuToggle');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.settingsPanel = document.getElementById('playerSettingsPanel');
        this.playerMenu = document.getElementById('playerMenu');
        this.leftPanel = document.getElementById('playerLeftPanel');
        this.rightPanel = document.getElementById('playerRightPanel');
        this.background = document.getElementById('playerBackground');
        
        this.title = document.getElementById('playerTitle');
        this.subtitle = document.getElementById('playerSubtitle');
        this.progress = document.getElementById('playerProgress');
        this.progressBar = document.getElementById('playerProgressBar');
        this.currentTime = document.getElementById('playerCurrentTime');
        this.totalTime = document.getElementById('playerTotalTime');
        
        this.isPlaying = false;
        this.isMenuOpen = false;
        this.isSettingsOpen = false;
        this.currentParagraph = 0;
        this.paragraphs = [];
        this.startTime = 0;
        this.totalDuration = 0;
        
        // Verificar se todos os elementos foram encontrados
        if (!this.player || !this.playBtn || !this.prevBtn || !this.nextBtn) {
            console.error('Elementos do player não encontrados');
            return;
        }
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.loadSettings();
        console.log('Player Carrossel inicializado com sucesso');
    }
    
    bindEvents() {
        // Controles principais
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousParagraph());
        this.nextBtn.addEventListener('click', () => this.nextParagraph());
        
        // Controles de interface
        this.menuToggle.addEventListener('click', () => this.toggleMenu());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        
        // Menu items
        document.getElementById('menuSettings').addEventListener('click', () => this.openSettings());
        document.getElementById('menuVolume').addEventListener('click', () => this.toggleVolume());
        document.getElementById('menuSpeed').addEventListener('click', () => this.toggleSpeed());
        document.getElementById('menuVoice').addEventListener('click', () => this.toggleVoice());
        document.getElementById('menuPitch').addEventListener('click', () => this.togglePitch());
        document.getElementById('menuPause').addEventListener('click', () => this.togglePause());
        
        // Clique fora para fechar menu e configurações
        document.addEventListener('click', (e) => {
            if (!this.player.contains(e.target)) {
                this.closeMenu();
                this.closeSettings();
            }
        });
        
        // Barra de progresso
        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => this.seekToPosition(e));
        }
        
        // Configurações
        this.bindSettingsEvents();
    }
    
    bindSettingsEvents() {
        const seletorVoz = document.getElementById('seletor_voz');
        const controleVelocidade = document.getElementById('controle_velocidade');
        const controleTom = document.getElementById('controle_tom');
        const controleVolume = document.getElementById('controle_volume');
        const controlePausa = document.getElementById('controle_pausa_frase');
        const simbolosPausa = document.getElementById('simbolos_pausa');
        const botaoTesteVoz = document.getElementById('botao_teste_voz');
        
        if (seletorVoz) seletorVoz.addEventListener('change', () => this.updateTTSVoice());
        if (controleVelocidade) controleVelocidade.addEventListener('input', () => this.updateTTSSpeed());
        if (controleTom) controleTom.addEventListener('input', () => this.updateTTSPitch());
        if (controleVolume) controleVolume.addEventListener('input', () => this.updateTTSVolume());
        if (controlePausa) controlePausa.addEventListener('input', () => this.updateTTSPause());
        if (simbolosPausa) simbolosPausa.addEventListener('input', () => this.updateTTSSymbols());
        if (botaoTesteVoz) botaoTesteVoz.addEventListener('click', () => this.testVoice());
    }
    
    setBookInfo(title, chapterTitle, coverUrl = null) {
        if (this.title) this.title.textContent = title || 'Livro sem título';
        if (this.subtitle) this.subtitle.textContent = chapterTitle || 'Capítulo 1';
        
        // Atualizar capa se fornecida
        if (coverUrl && this.player) {
            const coverImg = this.player.querySelector('.player__cover-img');
            if (coverImg) {
                coverImg.src = coverUrl;
            }
            
            // Aplicar background baseado na capa
            this.applyCoverBackground(coverUrl);
        } else {
            // Remover background personalizado se não há capa
            this.removeCoverBackground();
        }
    }
    
    applyCoverBackground(coverUrl) {
        if (!this.background) return;
        
        // Criar um elemento de imagem temporário para obter as cores da capa
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';
        tempImg.onload = () => {
            try {
                // Criar canvas para analisar a imagem
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = tempImg.width;
                canvas.height = tempImg.height;
                ctx.drawImage(tempImg, 0, 0);
                
                // Obter dados da imagem
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Calcular cores dominantes
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }
                
                // Calcular médias
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                
                // Determinar se a imagem é clara ou escura
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                const isDark = brightness < 128;
                
                // Aplicar background baseado na análise
                if (isDark) {
                    // Para imagens escuras, usar gradiente escuro com a cor dominante
                    this.background.style.background = `linear-gradient(135deg, rgba(${r},${g},${b},0.9) 0%, rgba(${r},${g},${b},0.7) 100%)`;
                    this.background.classList.add('with-cover');
                } else {
                    // Para imagens claras, usar gradiente claro com a cor dominante
                    this.background.style.background = `linear-gradient(135deg, rgba(${r},${g},${b},0.3) 0%, rgba(${r},${g},${b},0.1) 100%)`;
                    this.background.classList.remove('with-cover');
                }
                
                // Adicionar a capa como background com blur
                this.background.style.backgroundImage = `linear-gradient(135deg, rgba(${r},${g},${b},0.8) 0%, rgba(${r},${g},${b},0.6) 100%), url(${coverUrl})`;
                this.background.style.backgroundSize = 'cover';
                this.background.style.backgroundPosition = 'center';
                this.background.style.backgroundBlendMode = 'overlay';
                
            } catch (error) {
                console.warn('Erro ao analisar capa:', error);
                // Fallback: usar background padrão com blur da capa
                this.background.style.backgroundImage = `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%), url(${coverUrl})`;
                this.background.style.backgroundSize = 'cover';
                this.background.style.backgroundPosition = 'center';
                this.background.classList.add('with-cover');
            }
        };
        
        tempImg.onerror = () => {
            console.warn('Erro ao carregar capa para análise');
            // Fallback: usar background padrão
            this.removeCoverBackground();
        };
        
        tempImg.src = coverUrl;
    }
    
    removeCoverBackground() {
        if (!this.background) return;
        
        this.background.style.background = 'linear-gradient(135deg, #3F51B5 0%, #8BC34A 100%)';
        this.background.style.backgroundImage = '';
        this.background.style.backgroundSize = '';
        this.background.style.backgroundPosition = '';
        this.background.style.backgroundBlendMode = '';
        this.background.classList.remove('with-cover');
    }
    
    setParagraphs(paragraphs) {
        this.paragraphs = paragraphs || [];
        this.currentParagraph = 0;
        this.updateDisplay();
        console.log(`Player configurado com ${this.paragraphs.length} parágrafos`);
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        if (this.paragraphs.length === 0) {
            console.warn('Nenhum parágrafo disponível para leitura');
            return;
        }
        
        this.isPlaying = true;
        this.playBtn.classList.add('playing');
        this.playBtn.innerHTML = '<span class="mui-icon mui-icon--pause"></span>';
        
        if (typeof window.var_objetoTTS !== 'undefined') {
            // Usar o sistema TTS existente
            this.startTTSReading();
        } else {
            // Simular leitura para demonstração
            this.simulateReading();
        }
        
        this.startTime = Date.now();
        this.updateDisplay();
    }
    
    pause() {
        this.isPlaying = false;
        this.playBtn.classList.remove('playing');
        this.playBtn.innerHTML = '<span class="mui-icon mui-icon--play-arrow"></span>';
        
        if (typeof window.var_objetoTTS !== 'undefined') {
            window.var_objetoTTS.sintetizador.pause();
        }
        
        this.updateDisplay();
    }
    
    stop() {
        this.isPlaying = false;
        this.playBtn.classList.remove('playing');
        this.playBtn.innerHTML = '<span class="mui-icon mui-icon--play-arrow"></span>';
        
        if (typeof window.var_objetoTTS !== 'undefined') {
            window.var_objetoTTS.sintetizador.cancel();
        }
        
        this.currentParagraph = 0;
        this.updateDisplay();
    }
    
    previousParagraph() {
        if (this.currentParagraph > 0) {
            this.currentParagraph--;
            this.updateDisplay();
            this.highlightCurrentParagraph();
        }
    }
    
    nextParagraph() {
        if (this.currentParagraph < this.paragraphs.length - 1) {
            this.currentParagraph++;
            this.updateDisplay();
            this.highlightCurrentParagraph();
        }
    }
    
    startTTSReading() {
        if (typeof window.lerTextoTTS === 'function') {
            const currentText = this.paragraphs[this.currentParagraph];
            if (currentText) {
                window.lerTextoTTS(currentText, () => {
                    // Callback quando terminar de ler o parágrafo
                    if (this.isPlaying && this.currentParagraph < this.paragraphs.length - 1) {
                        this.currentParagraph++;
                        this.updateDisplay();
                        this.highlightCurrentParagraph();
                        setTimeout(() => this.startTTSReading(), 500);
                    } else {
                        this.stop();
                    }
                });
            }
        }
    }
    
    simulateReading() {
        // Simulação para demonstração
        const duration = 3000; // 3 segundos por parágrafo
        this.totalDuration = duration;
        
        const startTime = Date.now();
        const updateProgress = () => {
            if (!this.isPlaying) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (this.progress) {
                this.progress.style.width = (progress * 100) + '%';
            }
            
            if (this.currentTime) {
                this.currentTime.textContent = this.formatTime(elapsed / 1000);
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateProgress);
            } else {
                // Parágrafo terminou
                if (this.isPlaying && this.currentParagraph < this.paragraphs.length - 1) {
                    this.currentParagraph++;
                    this.updateDisplay();
                    this.highlightCurrentParagraph();
                    setTimeout(() => this.simulateReading(), 500);
                } else {
                    this.stop();
                }
            }
        };
        
        updateProgress();
    }
    
    highlightCurrentParagraph() {
        // Remover destaque anterior
        const highlightedElements = document.querySelectorAll('.paragraph-highlight');
        highlightedElements.forEach(el => el.classList.remove('paragraph-highlight'));
        
        // Destacar parágrafo atual
        const readerText = document.getElementById('readerText');
        if (readerText) {
            const paragraphs = readerText.querySelectorAll('p');
            if (paragraphs[this.currentParagraph]) {
                paragraphs[this.currentParagraph].classList.add('paragraph-highlight');
                paragraphs[this.currentParagraph].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }
    }
    
    seekToPosition(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        
        // Calcular novo parágrafo baseado na posição
        const newParagraph = Math.floor(percentage * this.paragraphs.length);
        if (newParagraph >= 0 && newParagraph < this.paragraphs.length) {
            this.currentParagraph = newParagraph;
            this.updateDisplay();
            this.highlightCurrentParagraph();
        }
    }
    
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            this.playerMenu.classList.add('show');
            this.leftPanel.classList.add('menu-open');
            this.rightPanel.classList.add('menu-open');
        } else {
            this.closeMenu();
        }
    }
    
    closeMenu() {
        this.isMenuOpen = false;
        this.playerMenu.classList.remove('show');
        this.leftPanel.classList.remove('menu-open');
        this.rightPanel.classList.remove('menu-open');
    }
    
    openSettings() {
        this.isSettingsOpen = true;
        this.settingsPanel.classList.add('show');
        this.closeMenu();
    }
    
    closeSettings() {
        this.isSettingsOpen = false;
        this.settingsPanel.classList.remove('show');
    }
    
    toggleVolume() {
        // Implementar controle de volume
        console.log('Toggle volume');
        this.closeMenu();
    }
    
    toggleSpeed() {
        // Implementar controle de velocidade
        console.log('Toggle speed');
        this.closeMenu();
    }
    
    toggleVoice() {
        // Implementar controle de voz
        console.log('Toggle voice');
        this.closeMenu();
    }
    
    togglePitch() {
        // Implementar controle de tom
        console.log('Toggle pitch');
        this.closeMenu();
    }
    
    togglePause() {
        // Implementar controle de pausas
        console.log('Toggle pause');
        this.closeMenu();
    }
    
    updateDisplay() {
        if (this.progress) {
            const progress = this.paragraphs.length > 0 ? 
                (this.currentParagraph / (this.paragraphs.length - 1)) * 100 : 0;
            this.progress.style.width = progress + '%';
        }
        
        if (this.currentTime) {
            this.currentTime.textContent = this.formatTime(this.currentParagraph * 3); // 3 segundos por parágrafo
        }
        
        if (this.totalTime) {
            this.totalTime.textContent = this.formatTime(this.paragraphs.length * 3);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateTTSVoice() {
        const seletorVoz = document.getElementById('seletor_voz');
        if (seletorVoz && typeof window.var_objetoTTS !== 'undefined') {
            window.var_objetoTTS.definirVoz(seletorVoz.value);
        }
    }
    
    updateTTSSpeed() {
        const controleVelocidade = document.getElementById('controle_velocidade');
        const valorVelocidade = document.getElementById('valor_velocidade');
        if (controleVelocidade && valorVelocidade) {
            valorVelocidade.textContent = controleVelocidade.value;
            if (typeof window.var_objetoTTS !== 'undefined') {
                window.var_objetoTTS.definirVelocidade(parseFloat(controleVelocidade.value));
            }
        }
    }
    
    updateTTSPitch() {
        const controleTom = document.getElementById('controle_tom');
        const valorTom = document.getElementById('valor_tom');
        if (controleTom && valorTom) {
            valorTom.textContent = controleTom.value;
            if (typeof window.var_objetoTTS !== 'undefined') {
                window.var_objetoTTS.definirTom(parseFloat(controleTom.value));
            }
        }
    }
    
    updateTTSVolume() {
        const controleVolume = document.getElementById('controle_volume');
        const valorVolume = document.getElementById('valor_volume');
        if (controleVolume && valorVolume) {
            valorVolume.textContent = controleVolume.value;
            if (typeof window.var_objetoTTS !== 'undefined') {
                window.var_objetoTTS.definirVolume(parseFloat(controleVolume.value));
            }
        }
    }
    
    updateTTSPause() {
        const controlePausa = document.getElementById('controle_pausa_frase');
        if (controlePausa && typeof window.var_objetoTTS !== 'undefined') {
            window.var_objetoTTS.definirPausaFrase(parseInt(controlePausa.value));
        }
    }
    
    updateTTSSymbols() {
        const simbolosPausa = document.getElementById('simbolos_pausa');
        if (simbolosPausa && typeof window.var_objetoTTS !== 'undefined') {
            window.var_objetoTTS.definirSimbolosPausa(simbolosPausa.value);
        }
    }
    
    testVoice() {
        if (typeof window.var_objetoTTS !== 'undefined') {
            window.var_objetoTTS.sintetizarTexto('Teste de voz do player Carrossel');
        }
    }
    
    loadSettings() {
        // Carregar configurações salvas
        const savedSettings = localStorage.getItem('spotifyPlayerSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                // Aplicar configurações
                if (settings.voice) {
                    const seletorVoz = document.getElementById('seletor_voz');
                    if (seletorVoz) seletorVoz.value = settings.voice;
                }
                if (settings.speed) {
                    const controleVelocidade = document.getElementById('controle_velocidade');
                    const valorVelocidade = document.getElementById('valor_velocidade');
                    if (controleVelocidade && valorVelocidade) {
                        controleVelocidade.value = settings.speed;
                        valorVelocidade.textContent = settings.speed;
                    }
                }
                // ... outras configurações
            } catch (e) {
                console.error('Erro ao carregar configurações:', e);
            }
        }
    }
    
    saveSettings() {
        // Salvar configurações
        const settings = {
            voice: document.getElementById('seletor_voz')?.value,
            speed: document.getElementById('controle_velocidade')?.value,
            pitch: document.getElementById('controle_tom')?.value,
            volume: document.getElementById('controle_volume')?.value,
            pause: document.getElementById('controle_pausa_frase')?.value,
            symbols: document.getElementById('simbolos_pausa')?.value
        };
        
        localStorage.setItem('spotifyPlayerSettings', JSON.stringify(settings));
    }
}

// Funções globais para integração
function updateBookInfo(title, chapterTitle) {
    if (window.spotifyPlayer) {
        window.spotifyPlayer.setBookInfo(title, chapterTitle);
    }
}

function setParagraphs(paragraphs) {
    if (window.spotifyPlayer) {
        window.spotifyPlayer.setParagraphs(paragraphs);
    }
}

// Inicializar player quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que todos os elementos estejam carregados
    setTimeout(() => {
        window.spotifyPlayer = new SpotifyPlayer();
    }, 100);
}); 