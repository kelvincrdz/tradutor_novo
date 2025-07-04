from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for, flash
from werkzeug.utils import secure_filename
import os
import json
import zipfile
import tempfile
import shutil
from bs4 import BeautifulSoup
import re
from deep_translator import GoogleTranslator
import uuid
from datetime import datetime
import hashlib
import markdown

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_aqui'

# Configurações
PASTA_UPLOADS = 'uploads'
EPUB_PASTA = 'epub_files'
DIC_FILE = 'dicionario.json'
PERMITIR_EXTENCAO = {'epub'}

# Criar diretórios se não existirem
os.makedirs(PASTA_UPLOADS, exist_ok=True)
os.makedirs(EPUB_PASTA, exist_ok=True)

def _func_PermiteArquivo(var_strNomeArquivo):
    return '.' in var_strNomeArquivo and var_strNomeArquivo.rsplit('.', 1)[1].lower() in PERMITIR_EXTENCAO

def _func_ObterHashArquivo(var_strCaminho):
    """Calcula o hash MD5 de um arquivo para detectar duplicatas"""
    var_objHashMD5 = hashlib.md5()
    with open(var_strCaminho, "rb") as var_objArquivo:
        for var_strChunk in iter(lambda: var_objArquivo.read(4096), b""):
            var_objHashMD5.update(var_strChunk)
    return var_objHashMD5.hexdigest()

def _func_EncontrarEpubPorHash(var_strHashArquivo):
    """Procura por um EPUB existente com o mesmo hash"""
    if not os.path.exists(EPUB_PASTA):
        return None
    
    for var_strNomeArquivo in os.listdir(EPUB_PASTA):
        if var_strNomeArquivo.endswith('_content.json'):
            var_strIdArquivo = var_strNomeArquivo.replace('_content.json', '')
            # Verificar se existe o arquivo original
            var_listArquivosOriginais = [f for f in os.listdir(PASTA_UPLOADS) if f.startswith(var_strIdArquivo)]
            if var_listArquivosOriginais:
                var_strCaminhoOriginal = os.path.join(PASTA_UPLOADS, var_listArquivosOriginais[0])
                if os.path.exists(var_strCaminhoOriginal):
                    var_strHashOriginal = _func_ObterHashArquivo(var_strCaminhoOriginal)
                    if var_strHashOriginal == var_strHashArquivo:
                        return var_strIdArquivo
    return None

def _func_CarregarDicionario():
    """Carrega o dicionário de tradução personalizado"""
    if os.path.exists(DIC_FILE):
        with open(DIC_FILE, 'r', encoding='utf-8') as var_objArquivo:
            return json.load(var_objArquivo)
    return {}

def _func_SalvarDicionario(var_dicDicionario):
    """Salva o dicionário de tradução personalizado"""
    with open(DIC_FILE, 'w', encoding='utf-8') as var_objArquivo:
        json.dump(var_dicDicionario, var_objArquivo, ensure_ascii=False, indent=2)

def _func_ExtrairConteudoEpub(var_strCaminhoEpub):
    """Extrai o conteúdo de um arquivo EPUB"""
    var_dicConteudo = {
        'title': '',
        'chapters': [],
        'metadata': {}
    }
    
    try:
        with zipfile.ZipFile(var_strCaminhoEpub, 'r') as var_objEpub:
            # Encontrar o arquivo container.xml
            var_strContainerXML = var_objEpub.read('META-INF/container.xml')
            var_objSoup = BeautifulSoup(var_strContainerXML, 'xml')
            var_strCaminhoOPF = var_objSoup.find('rootfile')['full-path']
            
            # Ler o arquivo OPF
            var_strConteudoOPF = var_objEpub.read(var_strCaminhoOPF)
            var_objSoupOPF = BeautifulSoup(var_strConteudoOPF, 'xml')
            
            # Extrair título
            var_objElementoTitulo = var_objSoupOPF.find('dc:title')
            if var_objElementoTitulo:
                var_dicConteudo['title'] = var_objElementoTitulo.text
            
            # Encontrar o diretório base
            var_strDiretorioOPF = os.path.dirname(var_strCaminhoOPF)
            
            # Procurar toc.ncx e nav.xhtml
            var_strCaminhoTOCNCX = None
            var_strCaminhoNavXHTML = None
            for info in var_objEpub.infolist():
                if info.filename.lower().endswith('toc.ncx'):
                    var_strCaminhoTOCNCX = info.filename
                if info.filename.lower().endswith('nav.xhtml'):
                    var_strCaminhoNavXHTML = info.filename
            # 1. Extrair nomes do toc.ncx
            toc_ncx_titles = []
            if var_strCaminhoTOCNCX:
                try:
                    toc_ncx_xml = var_objEpub.read(var_strCaminhoTOCNCX)
                    soup_ncx = BeautifulSoup(toc_ncx_xml, 'xml')
                    navpoints = soup_ncx.find_all('navPoint')
                    for nav in navpoints:
                        label = nav.find('navLabel')
                        text = label.find('text').text.strip() if label and label.find('text') else None
                        toc_ncx_titles.append(text)
                except Exception as e:
                    print(f'Erro ao ler toc.ncx: {e}')
            # 2. Extrair nomes do nav.xhtml
            nav_xhtml_titles = []
            if var_strCaminhoNavXHTML:
                try:
                    nav_xhtml = var_objEpub.read(var_strCaminhoNavXHTML)
                    soup_nav = BeautifulSoup(nav_xhtml, 'html.parser')
                    nav = soup_nav.find('nav')
                    if nav:
                        for a in nav.find_all('a'):
                            nav_xhtml_titles.append(a.text.strip())
                except Exception as e:
                    print(f'Erro ao ler nav.xhtml: {e}')
            # Encontrar o arquivo de manifesto
            var_objManifesto = var_objSoupOPF.find('manifest')
            if var_objManifesto:
                # Encontrar arquivos HTML
                var_listArquivosHTML = []
                for var_objItem in var_objManifesto.find_all('item'):
                    if var_objItem.get('media-type') == 'application/xhtml+xml':
                        var_strHref = var_objItem['href']
                        if not var_strHref.startswith('http'):
                            if var_strDiretorioOPF:
                                var_strHref = f"{var_strDiretorioOPF}/{var_strHref}"
                        var_listArquivosHTML.append(var_strHref)
                # Ler cada arquivo HTML
                for var_intIndice, var_strArquivoHTML in enumerate(var_listArquivosHTML):
                    try:
                        var_strConteudoHTML = var_objEpub.read(var_strArquivoHTML)
                        var_objSoupHTML = BeautifulSoup(var_strConteudoHTML, 'html.parser')
                        # Extrair texto preservando formatação
                        def _func_ExtrairTextoFormatado(var_objElemento):
                            if var_objElemento.name in ['p', 'div', 'section']:
                                var_strTexto = var_objElemento.get_text()
                                for var_objBR in var_objElemento.find_all('br'):
                                    var_objBR.replace_with('\n')
                                return var_strTexto.strip() + '\n\n'
                            elif var_objElemento.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                                return var_objElemento.get_text().strip() + '\n\n'
                            elif var_objElemento.name in ['br']:
                                return '\n'
                            elif var_objElemento.name in ['blockquote']:
                                var_strTexto = var_objElemento.get_text()
                                for var_objBR in var_objElemento.find_all('br'):
                                    var_objBR.replace_with('\n')
                                return var_strTexto.strip() + '\n\n'
                            else:
                                return var_objElemento.get_text().strip()
                        var_strTextoFormatado = ""
                        for var_objElemento in var_objSoupHTML.find_all(['p', 'div', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']):
                            var_strTextoFormatado += _func_ExtrairTextoFormatado(var_objElemento)
                        if not var_strTextoFormatado.strip():
                            var_strTexto = var_objSoupHTML.get_text()
                            for var_objBR in var_objSoupHTML.find_all('br'):
                                var_objBR.replace_with('\n')
                            var_listLinhas = []
                            for var_strLinha in var_strTexto.splitlines():
                                var_strLinha = var_strLinha.strip()
                                if var_strLinha:
                                    var_listLinhas.append(var_strLinha)
                            var_strTexto = '\n\n'.join(var_listLinhas)
                        else:
                            var_strTexto = var_strTextoFormatado
                        var_strTexto = var_strTexto.strip()
                        var_strTexto = re.sub(r'\n{3,}', '\n\n', var_strTexto)
                        var_strTexto = re.sub(r'\n([^\-\n])', r'\n\1', var_strTexto)
                        # 3. Buscar título no conteúdo (primeiro h1 ou h2)
                        cap_title = None
                        h1 = var_objSoupHTML.find('h1')
                        h2 = var_objSoupHTML.find('h2')
                        if h1 and h1.text.strip():
                            cap_title = h1.text.strip()
                        elif h2 and h2.text.strip():
                            cap_title = h2.text.strip()
                        # 1. Prioridade toc.ncx
                        if var_intIndice < len(toc_ncx_titles) and toc_ncx_titles[var_intIndice]:
                            cap_title = toc_ncx_titles[var_intIndice]
                        # 2. Prioridade nav.xhtml
                        elif var_intIndice < len(nav_xhtml_titles) and nav_xhtml_titles[var_intIndice]:
                            cap_title = nav_xhtml_titles[var_intIndice]
                        # 4. Nome padrão
                        if not cap_title:
                            cap_title = f'Capítulo {var_intIndice+1}'
                        if var_strTexto.strip():
                            var_dicConteudo['chapters'].append({
                                'id': var_intIndice,
                                'title': cap_title,
                                'content': var_strTexto,
                                'html_content': str(var_objSoupHTML)
                            })
                    except Exception as var_objErro:
                        print(f"Erro ao processar arquivo {var_strArquivoHTML}: {var_objErro}")
                        continue
    except Exception as var_objErro:
        print(f"Erro ao extrair EPUB: {var_objErro}")
    return var_dicConteudo

def _func_TraduzirTexto(var_strTexto, var_strIdiomaOrigem='auto', var_strIdiomaDestino='pt'):
    """Traduz texto usando Deep Translator, dividindo textos longos em partes menores"""
    try:
        # Limite do Google Translate (5000 caracteres)
        var_intMaxCaracteres = 4500  # Usar 4500 para ter margem de segurança
        
        # Se o texto é menor que o limite, traduzir normalmente
        if len(var_strTexto) <= var_intMaxCaracteres:
            var_objTradutor = GoogleTranslator(source=var_strIdiomaOrigem, target=var_strIdiomaDestino)
            return var_objTradutor.translate(var_strTexto)
        
        # Para textos longos, dividir em partes
        print(f"Texto muito longo ({len(var_strTexto)} caracteres), dividindo em partes...")
        
        # Tentar dividir por parágrafos primeiro
        var_listParagrafos = var_strTexto.split('\n\n')
        
        # Se não há parágrafos bem definidos, dividir por sentenças
        if len(var_listParagrafos) <= 1:
            # Dividir por pontos finais, exclamação e interrogação
            var_listSentencas = []
            var_strSentencaAtual = ""
            
            for var_strCaractere in var_strTexto:
                var_strSentencaAtual += var_strCaractere
                if var_strCaractere in '.!?':
                    var_listSentencas.append(var_strSentencaAtual.strip())
                    var_strSentencaAtual = ""
            
            # Adicionar a última sentença se não terminou com pontuação
            if var_strSentencaAtual.strip():
                var_listSentencas.append(var_strSentencaAtual.strip())
            
            # Usar sentenças como base para divisão
            var_listPartesTexto = var_listSentencas
        else:
            # Usar parágrafos como base para divisão
            var_listPartesTexto = var_listParagrafos
        
        var_listPartesTraduzidas = []
        var_strParteAtual = ""
        
        for var_strParte in var_listPartesTexto:
            # Se adicionar esta parte excederia o limite
            if len(var_strParteAtual) + len(var_strParte) > var_intMaxCaracteres:
                # Traduzir a parte atual se não estiver vazia
                if var_strParteAtual.strip():
                    var_objTradutor = GoogleTranslator(source=var_strIdiomaOrigem, target=var_strIdiomaDestino)
                    var_strParteTraduzida = var_objTradutor.translate(var_strParteAtual.strip())
                    var_listPartesTraduzidas.append(var_strParteTraduzida)
                
                # Se uma parte individual é muito longa, dividir ainda mais
                if len(var_strParte) > var_intMaxCaracteres:
                    # Dividir em chunks menores
                    var_listChunks = [var_strParte[i:i+var_intMaxCaracteres] for i in range(0, len(var_strParte), var_intMaxCaracteres)]
                    for var_strChunk in var_listChunks:
                        if var_strChunk.strip():
                            var_objTradutor = GoogleTranslator(source=var_strIdiomaOrigem, target=var_strIdiomaDestino)
                            var_strChunkTraduzido = var_objTradutor.translate(var_strChunk.strip())
                            var_listPartesTraduzidas.append(var_strChunkTraduzido)
                else:
                    # Iniciar nova parte com a parte atual
                    var_strParteAtual = var_strParte
            else:
                # Adicionar parte à parte atual
                if var_strParteAtual:
                    if len(var_listParagrafos) > 1:
                        var_strParteAtual += '\n\n' + var_strParte
                    else:
                        var_strParteAtual += ' ' + var_strParte
                else:
                    var_strParteAtual = var_strParte
        
        # Traduzir a última parte se não estiver vazia
        if var_strParteAtual.strip():
            var_objTradutor = GoogleTranslator(source=var_strIdiomaOrigem, target=var_strIdiomaDestino)
            var_strParteTraduzida = var_objTradutor.translate(var_strParteAtual.strip())
            var_listPartesTraduzidas.append(var_strParteTraduzida)
        
        # Juntar todas as partes traduzidas
        if len(var_listParagrafos) > 1:
            var_strTraducaoFinal = '\n\n'.join(var_listPartesTraduzidas)
        else:
            var_strTraducaoFinal = ' '.join(var_listPartesTraduzidas)
        
        print(f"Tradução concluída em {len(var_listPartesTraduzidas)} partes")
        
        return var_strTraducaoFinal
        
    except Exception as var_objErro:
        print(f"Erro na tradução: {var_objErro}")
        return var_strTexto

def _func_AplicarDicionario(var_strTexto, var_dicDicionario):
    """Aplica o dicionário personalizado ao texto"""
    import re
    
    # Ordenar as entradas do dicionário por tamanho (mais longas primeiro)
    # para evitar que expressões menores substituam partes de expressões maiores
    var_listEntradasOrdenadas = sorted(var_dicDicionario.items(), key=lambda x: len(x[0]), reverse=True)
    
    for var_strOriginal, var_strTraducao in var_listEntradasOrdenadas:
        # Criar um padrão regex que busca a palavra/expressão exata
        # \b garante que estamos no início/fim de uma palavra
        var_strPadrao = r'\b' + re.escape(var_strOriginal) + r'\b'
        
        # Fazer a substituição usando regex com flag case-insensitive
        var_strTexto = re.sub(var_strPadrao, var_strTraducao, var_strTexto, flags=re.IGNORECASE)
    
    return var_strTexto

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def _func_UploadArquivo():
    if 'file' not in request.files:
        flash('Nenhum arquivo selecionado')
        return redirect(request.url)
    
    var_objArquivo = request.files['file']
    if var_objArquivo.filename == '':
        flash('Nenhum arquivo selecionado')
        return redirect(request.url)
    
    if var_objArquivo and _func_PermiteArquivo(var_objArquivo.filename):
        # Salvar arquivo temporariamente para calcular hash
        var_strCaminhoTemporario = os.path.join(PASTA_UPLOADS, f"temp_{secure_filename(var_objArquivo.filename)}")
        var_objArquivo.save(var_strCaminhoTemporario)
        
        # Calcular hash do arquivo
        var_strHashArquivo = _func_ObterHashArquivo(var_strCaminhoTemporario)
        
        # Verificar se já existe um EPUB com o mesmo hash
        var_strIdArquivoExistente = _func_EncontrarEpubPorHash(var_strHashArquivo)
        
        if var_strIdArquivoExistente:
            # Carregar informações do EPUB existente
            var_strCaminhoArquivoAtual = os.path.join(EPUB_PASTA, f"{var_strIdArquivoExistente}_content.json")
            if os.path.exists(var_strCaminhoArquivoAtual):
                with open(var_strCaminhoArquivoAtual, 'r', encoding='utf-8') as var_objArquivoLeitura:
                    var_dicConteudoExistente = json.load(var_objArquivoLeitura)
                
                # Remover arquivo temporário
                os.remove(var_strCaminhoTemporario)
                
                # Retornar informações sobre o arquivo existente
                return jsonify({
                    'duplicate': True,
                    'existing_file_id': var_strIdArquivoExistente,
                    'title': var_dicConteudoExistente.get('title', 'EPUB Sem Título'),
                    'chapters_count': len(var_dicConteudoExistente.get('chapters', [])),
                    'has_translation': any(chapter.get('translated_content') for chapter in var_dicConteudoExistente.get('chapters', []))
                })
        
        # Se não é duplicata, continuar com o upload normal
        var_strNomeArquivo = secure_filename(var_objArquivo.filename)
        var_strIdArquivo = str(uuid.uuid4())
        var_strCaminhoFinal = os.path.join(PASTA_UPLOADS, f"{var_strIdArquivo}_{var_strNomeArquivo}")
        
        # Mover arquivo temporário para localização final
        os.rename(var_strCaminhoTemporario, var_strCaminhoFinal)
        
        # Extrair conteúdo do EPUB
        var_dicConteudo = _func_ExtrairConteudoEpub(var_strCaminhoFinal)
        
        if not var_dicConteudo['chapters']:
            flash('Não foi possível extrair conteúdo do EPUB')
            return redirect(url_for('index'))
        
        # Salvar informações do arquivo
        var_dicInfoEpub = {
            'id': var_strIdArquivo,
            'filename': var_strNomeArquivo,
            'title': var_dicConteudo['title'] or var_strNomeArquivo,
            'upload_date': datetime.now().isoformat(),
            'chapters_count': len(var_dicConteudo['chapters']),
            'path': var_strCaminhoFinal,
            'file_hash': var_strHashArquivo
        }
        
        # Salvar conteúdo em arquivo temporário
        var_strCaminhoArquivoAtual = os.path.join(EPUB_PASTA, f"{var_strIdArquivo}_content.json")
        with open(var_strCaminhoArquivoAtual, 'w', encoding='utf-8') as var_objArquivoEscrita:
            json.dump(var_dicConteudo, var_objArquivoEscrita, ensure_ascii=False, indent=2)
        
        return jsonify({
            'duplicate': False,
            'file_id': var_strIdArquivo,
            'redirect_url': url_for('reader', file_id=var_strIdArquivo)
        })
    
    flash('Tipo de arquivo não permitido')
    return redirect(url_for('index'))

@app.route('/upload/force', methods=['POST'])
def _func_ForcarUpload():
    """Força o upload de um arquivo mesmo sendo duplicado"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    var_objArquivo = request.files['file']
    if var_objArquivo.filename == '':
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    if var_objArquivo and _func_PermiteArquivo(var_objArquivo.filename):
        var_strNomeArquivo = secure_filename(var_objArquivo.filename)
        var_strIdArquivo = str(uuid.uuid4())
        var_strCaminho = os.path.join(PASTA_UPLOADS, f"{var_strIdArquivo}_{var_strNomeArquivo}")
        var_objArquivo.save(var_strCaminho)
        
        # Extrair conteúdo do EPUB
        var_dicConteudo = _func_ExtrairConteudoEpub(var_strCaminho)
        
        if not var_dicConteudo['chapters']:
            return jsonify({'success': False, 'error': 'Não foi possível extrair conteúdo do EPUB'})
        
        # Salvar informações do arquivo
        var_dicInfoEpub = {
            'id': var_strIdArquivo,
            'filename': var_strNomeArquivo,
            'title': var_dicConteudo['title'] or var_strNomeArquivo,
            'upload_date': datetime.now().isoformat(),
            'chapters_count': len(var_dicConteudo['chapters']),
            'path': var_strCaminho
        }
        
        # Salvar conteúdo em arquivo temporário
        var_strCaminhoArquivoAtual = os.path.join(EPUB_PASTA, f"{var_strIdArquivo}_content.json")
        with open(var_strCaminhoArquivoAtual, 'w', encoding='utf-8') as var_objArquivoEscrita:
            json.dump(var_dicConteudo, var_objArquivoEscrita, ensure_ascii=False, indent=2)
        
        return jsonify({
            'success': True,
            'file_id': var_strIdArquivo,
            'redirect_url': url_for('reader', file_id=var_strIdArquivo)
        })
    
    return jsonify({'success': False, 'error': 'Tipo de arquivo não permitido'})

@app.route('/reader/<file_id>')
def reader(file_id):
    var_strCaminhoArquivoAtual = os.path.join(EPUB_PASTA, f"{file_id}_content.json")
    
    if not os.path.exists(var_strCaminhoArquivoAtual):
        flash('Arquivo não encontrado')
        return redirect(url_for('index'))
    
    with open(var_strCaminhoArquivoAtual, 'r', encoding='utf-8') as var_objArquivoLeitura:
        var_dicDadosEpub = json.load(var_objArquivoLeitura)
    
    return render_template('reader.html', epub_data=var_dicDadosEpub, file_id=file_id)

@app.route('/translate', methods=['POST'])
def _func_Traduzir():
    var_dicDados = request.get_json()
    var_strTexto = var_dicDados.get('text', '')
    var_strIdiomaOrigem = var_dicDados.get('source_lang', 'auto')
    var_strIdiomaDestino = var_dicDados.get('target_lang', 'pt')
    var_intIndiceCapitulo = var_dicDados.get('chapter_index')
    var_strIdArquivo = var_dicDados.get('file_id')
    
    # Carregar dicionário
    var_dicDicionario = _func_CarregarDicionario()
    
    # Aplicar dicionário primeiro
    var_strTextoComDicionario = _func_AplicarDicionario(var_strTexto, var_dicDicionario)
    
    # Traduzir
    var_strTextoTraduzido = _func_TraduzirTexto(var_strTextoComDicionario, var_strIdiomaOrigem, var_strIdiomaDestino)
    
    # Se foi fornecido var_strIdArquivo e var_intIndiceCapitulo, salvar a tradução
    if var_strIdArquivo and var_intIndiceCapitulo is not None:
        try:
            var_strCaminhoArquivoAtual = os.path.join(EPUB_PASTA, f"{var_strIdArquivo}_content.json")
            if os.path.exists(var_strCaminhoArquivoAtual):
                with open(var_strCaminhoArquivoAtual, 'r', encoding='utf-8') as var_objArquivoLeitura:
                    var_dicConteudo = json.load(var_objArquivoLeitura)
                
                if var_intIndiceCapitulo < len(var_dicConteudo['chapters']):
                    # Salvar tradução no capítulo
                    var_dicConteudo['chapters'][var_intIndiceCapitulo]['translated_content'] = var_strTextoTraduzido
                    var_dicConteudo['chapters'][var_intIndiceCapitulo]['original_content'] = var_dicConteudo['chapters'][var_intIndiceCapitulo]['content']
                    var_dicConteudo['chapters'][var_intIndiceCapitulo]['content'] = var_strTextoTraduzido
                    
                    # Salvar arquivo atualizado
                    with open(var_strCaminhoArquivoAtual, 'w', encoding='utf-8') as var_objArquivoEscrita:
                        json.dump(var_dicConteudo, var_objArquivoEscrita, ensure_ascii=False, indent=2)
        except Exception as var_objErro:
            print(f"Erro ao salvar tradução: {var_objErro}")
    
    return jsonify({'translated_text': var_strTextoTraduzido})

@app.route('/translate_all/<file_id>', methods=['POST'])
def _func_TraduzirTodosCapitulos(file_id):
    """Traduz todos os capítulos de um EPUB usando o dicionário personalizado"""
    var_strCaminhoArquivoAtual = os.path.join(EPUB_PASTA, f"{file_id}_content.json")
    
    if not os.path.exists(var_strCaminhoArquivoAtual):
        return jsonify({'success': False, 'error': 'Arquivo não encontrado'})
    
    try:
        with open(var_strCaminhoArquivoAtual, 'r', encoding='utf-8') as var_objArquivoLeitura:
            var_dicConteudo = json.load(var_objArquivoLeitura)
        
        # Carregar dicionário personalizado
        var_dicDicionario = _func_CarregarDicionario()
        
        # Traduzir todos os capítulos
        var_intContadorTraduzidos = 0
        for var_intIndice, var_dicCapitulo in enumerate(var_dicConteudo['chapters']):
            # Aplicar dicionário primeiro
            var_strTextoComDicionario = _func_AplicarDicionario(var_dicCapitulo['content'], var_dicDicionario)
            
            # Traduzir o texto
            var_strTextoTraduzido = _func_TraduzirTexto(var_strTextoComDicionario, 'auto', 'pt')
            
            # Salvar tradução no capítulo
            var_dicCapitulo['translated_content'] = var_strTextoTraduzido
            var_dicCapitulo['original_content'] = var_dicCapitulo['content']
            var_dicCapitulo['content'] = var_strTextoTraduzido
            
            var_intContadorTraduzidos += 1
        
        # Salvar conteúdo atualizado
        with open(var_strCaminhoArquivoAtual, 'w', encoding='utf-8') as var_objArquivoEscrita:
            json.dump(var_dicConteudo, var_objArquivoEscrita, ensure_ascii=False, indent=2)
        
        return jsonify({
            'success': True,
            'message': f'{var_intContadorTraduzidos} capítulos traduzidos com sucesso!',
            'translated_count': var_intContadorTraduzidos
        })
        
    except Exception as var_objErro:
        return jsonify({'success': False, 'error': f'Erro ao traduzir: {str(var_objErro)}'})

@app.route('/dicionario')
def _func_PaginaDicionario():
    var_dicDicionario = _func_CarregarDicionario()
    return render_template('dicionario.html', dicionario=var_dicDicionario)

@app.route('/dicionario/add', methods=['POST'])
def _func_AdicionarEntradaDicionario():
    var_dicDados = request.get_json()
    var_strOriginal = var_dicDados.get('original', '').strip()
    # Aceita tanto 'translated' quanto 'translation' para compatibilidade
    var_strTraducao = var_dicDados.get('translated', var_dicDados.get('translation', '')).strip()
    
    if var_strOriginal and var_strTraducao:
        var_dicDicionario = _func_CarregarDicionario()
        var_dicDicionario[var_strOriginal] = var_strTraducao
        _func_SalvarDicionario(var_dicDicionario)
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Campos vazios'})

@app.route('/dicionario/remove', methods=['POST'])
def _func_RemoverEntradaDicionario():
    var_dicDados = request.get_json()
    var_strOriginal = var_dicDados.get('original', '').strip()
    
    if var_strOriginal:
        var_dicDicionario = _func_CarregarDicionario()
        if var_strOriginal in var_dicDicionario:
            del var_dicDicionario[var_strOriginal]
            _func_SalvarDicionario(var_dicDicionario)
            return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Entrada não encontrada'})

@app.route('/dicionario/upload', methods=['POST'])
def _func_UploadDicionario():
    """Upload de dicionário personalizado"""
    if 'dictionary_file' not in request.files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    var_objArquivo = request.files['dictionary_file']
    if var_objArquivo.filename == '':
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    # Verificar extensão do arquivo
    if not var_objArquivo.filename.endswith('.json'):
        return jsonify({'success': False, 'error': 'Apenas arquivos JSON são permitidos'})
    
    try:
        # Ler e validar o arquivo JSON
        var_strConteudo = var_objArquivo.read().decode('utf-8')
        var_dicNovoDicionario = json.loads(var_strConteudo)
        
        # Validar se é um dicionário válido
        if not isinstance(var_dicNovoDicionario, dict):
            return jsonify({'success': False, 'error': 'Formato de arquivo inválido'})
        
        # Carregar dicionário atual e mesclar
        var_dicDicionarioAtual = _func_CarregarDicionario()
        var_dicDicionarioAtual.update(var_dicNovoDicionario)
        
        # Salvar dicionário mesclado
        _func_SalvarDicionario(var_dicDicionarioAtual)
        
        return jsonify({
            'success': True, 
            'message': f'Dicionário carregado com sucesso! {len(var_dicNovoDicionario)} entradas adicionadas.',
            'entries_count': len(var_dicDicionarioAtual)
        })
        
    except json.JSONDecodeError:
        return jsonify({'success': False, 'error': 'Arquivo JSON inválido'})
    except Exception as var_objErro:
        return jsonify({'success': False, 'error': f'Erro ao processar arquivo: {str(var_objErro)}'})

@app.route('/dicionario/download')
def _func_DownloadDicionario():
    """Download do dicionário personalizado"""
    try:
        var_dicDicionario = _func_CarregarDicionario()
        
        # Criar arquivo temporário
        var_objArquivoTemporario = tempfile.NamedTemporaryFile(delete=False, suffix='.json', mode='w', encoding='utf-8')
        json.dump(var_dicDicionario, var_objArquivoTemporario, ensure_ascii=False, indent=2)
        var_objArquivoTemporario.close()
        
        return send_file(
            var_objArquivoTemporario.name,
            as_attachment=True,
            download_name='dicionario_personalizado.json',
            mimetype='application/json'
        )
        
    except Exception as var_objErro:
        return jsonify({'success': False, 'error': f'Erro ao gerar arquivo: {str(var_objErro)}'})

@app.route('/dicionario/clear', methods=['POST'])
def _func_LimparDicionario():
    """Limpa todas as entradas do dicionário personalizado"""
    try:
        # Salvar dicionário vazio
        _func_SalvarDicionario({})
        
        return jsonify({
            'success': True,
            'message': 'Dicionário limpo com sucesso! Todas as entradas foram removidas.',
            'entries_count': 0
        })
        
    except Exception as var_objErro:
        return jsonify({'success': False, 'error': f'Erro ao limpar dicionário: {str(var_objErro)}'})

@app.route('/download/<file_id>')
def _func_DownloadEpub(file_id):
    """Download do EPUB traduzido"""
    try:
        var_strCaminhoArquivo = os.path.join(EPUB_PASTA, f'{file_id}_content.json')
        if not os.path.exists(var_strCaminhoArquivo):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        # Carregar dados do arquivo
        with open(var_strCaminhoArquivo, 'r', encoding='utf-8') as var_objArquivo:
            var_dicDados = json.load(var_objArquivo)
        
        # Verificar se há traduções
        var_boolTemTraducao = any(var_dicCapitulo.get('translated_content') for var_dicCapitulo in var_dicDados.get('chapters', []))
        
        if not var_boolTemTraducao:
            return jsonify({'error': 'Nenhuma tradução encontrada para download'}), 400
        
        # Criar arquivo temporário para download
        var_strArquivoTemporario = f'temp_{file_id}.txt'
        with open(var_strArquivoTemporario, 'w', encoding='utf-8') as var_objArquivo:
            var_objArquivo.write(f"Título: {var_dicDados.get('title', 'Sem título')}\n")
            var_objArquivo.write("=" * 50 + "\n\n")
            
            for var_dicCapitulo in var_dicDados.get('chapters', []):
                var_objArquivo.write(f"{var_dicCapitulo.get('title', 'Capítulo')}\n")
                var_objArquivo.write("-" * 30 + "\n")
                var_objArquivo.write(var_dicCapitulo.get('translated_content', var_dicCapitulo.get('content', '')))
                var_objArquivo.write("\n\n")
        
        return send_file(var_strArquivoTemporario, as_attachment=True, download_name=f"{var_dicDados.get('title', 'epub')}_traduzido.txt")
    
    except Exception as var_objErro:
        print(f"Erro no download: {var_objErro}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/changelog')
def _func_PaginaChangelog():
    """Página de changelog com histórico de alterações"""
    try:
        # Ler o arquivo CHANGELOG.md
        var_strCaminhoChangelog = 'CHANGELOG.md'
        if os.path.exists(var_strCaminhoChangelog):
            with open(var_strCaminhoChangelog, 'r', encoding='utf-8') as var_objArquivo:
                var_strConteudoMarkdown = var_objArquivo.read()
        else:
            var_strConteudoMarkdown = "# Changelog\n\nNenhum changelog disponível."
        
        # Converter Markdown para HTML (apenas extensões essenciais)
        var_strConteudoHTML = markdown.markdown(
            var_strConteudoMarkdown,
            extensions=[
                'markdown.extensions.tables',
                'markdown.extensions.fenced_code',
                'markdown.extensions.nl2br'
            ]
        )
        
        return render_template('changelog.html', changelog_content=var_strConteudoHTML)
    
    except Exception as var_objErro:
        print(f"Erro ao carregar changelog: {var_objErro}")
        return render_template('changelog.html', changelog_content="<h1>Erro</h1><p>Erro ao carregar o changelog.</p>")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 