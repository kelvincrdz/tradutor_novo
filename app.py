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

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_aqui'

# Configurações
UPLOAD_FOLDER = 'uploads'
EPUB_FOLDER = 'epub_files'
DICTIONARY_FILE = 'dictionary.json'
ALLOWED_EXTENSIONS = {'epub'}

# Criar diretórios se não existirem
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EPUB_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_hash(file_path):
    """Calcula o hash MD5 de um arquivo para detectar duplicatas"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def find_existing_epub_by_hash(file_hash):
    """Procura por um EPUB existente com o mesmo hash"""
    if not os.path.exists(EPUB_FOLDER):
        return None
    
    for filename in os.listdir(EPUB_FOLDER):
        if filename.endswith('_content.json'):
            file_id = filename.replace('_content.json', '')
            # Verificar se existe o arquivo original
            original_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.startswith(file_id)]
            if original_files:
                original_file_path = os.path.join(UPLOAD_FOLDER, original_files[0])
                if os.path.exists(original_file_path):
                    original_hash = get_file_hash(original_file_path)
                    if original_hash == file_hash:
                        return file_id
    return None

def load_dictionary():
    """Carrega o dicionário de tradução personalizado"""
    if os.path.exists(DICTIONARY_FILE):
        with open(DICTIONARY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_dictionary(dictionary):
    """Salva o dicionário de tradução personalizado"""
    with open(DICTIONARY_FILE, 'w', encoding='utf-8') as f:
        json.dump(dictionary, f, ensure_ascii=False, indent=2)

def extract_epub_content(epub_path):
    """Extrai o conteúdo de um arquivo EPUB"""
    content = {
        'title': '',
        'chapters': [],
        'metadata': {}
    }
    
    try:
        with zipfile.ZipFile(epub_path, 'r') as epub:
            # Encontrar o arquivo container.xml
            container_xml = epub.read('META-INF/container.xml')
            soup = BeautifulSoup(container_xml, 'xml')
            opf_path = soup.find('rootfile')['full-path']
            
            # Ler o arquivo OPF
            opf_content = epub.read(opf_path)
            opf_soup = BeautifulSoup(opf_content, 'xml')
            
            # Extrair título
            title_elem = opf_soup.find('dc:title')
            if title_elem:
                content['title'] = title_elem.text
            
            # Encontrar o diretório base
            opf_dir = os.path.dirname(opf_path)
            
            # Encontrar o arquivo de manifesto
            manifest = opf_soup.find('manifest')
            if manifest:
                # Encontrar arquivos HTML
                html_files = []
                for item in manifest.find_all('item'):
                    if item.get('media-type') == 'application/xhtml+xml':
                        href = item['href']
                        if not href.startswith('http'):
                            if opf_dir:
                                href = f"{opf_dir}/{href}"
                        html_files.append(href)
                
                # Ler cada arquivo HTML
                for i, html_file in enumerate(html_files):
                    try:
                        html_content = epub.read(html_file)
                        soup = BeautifulSoup(html_content, 'html.parser')
                        
                        # Extrair texto preservando formatação
                        def extract_formatted_text(element):
                            """Extrai texto preservando formatação básica"""
                            if element.name in ['p', 'div', 'section']:
                                # Preservar quebras de linha dentro do elemento
                                text = element.get_text()
                                # Substituir quebras HTML por quebras de texto
                                for br in element.find_all('br'):
                                    br.replace_with('\n')
                                # Adicionar quebra de linha dupla para parágrafos
                                return text.strip() + '\n\n'
                            elif element.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                                # Títulos com quebra dupla
                                return element.get_text().strip() + '\n\n'
                            elif element.name in ['br']:
                                # Quebra de linha simples
                                return '\n'
                            elif element.name in ['blockquote']:
                                # Citações com quebra dupla
                                text = element.get_text()
                                for br in element.find_all('br'):
                                    br.replace_with('\n')
                                return text.strip() + '\n\n'
                            else:
                                # Texto normal
                                return element.get_text().strip()
                        
                        # Extrair texto com formatação
                        formatted_text = ""
                        for element in soup.find_all(['p', 'div', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']):
                            formatted_text += extract_formatted_text(element)
                        
                        # Se não encontrou elementos estruturados, usar get_text() normal
                        if not formatted_text.strip():
                            text = soup.get_text()
                            # Preservar quebras de linha existentes
                            for br in soup.find_all('br'):
                                br.replace_with('\n')
                            # Limpar texto preservando quebras de linha
                            lines = []
                            for line in text.splitlines():
                                line = line.strip()
                                if line:
                                    lines.append(line)
                            text = '\n\n'.join(lines)
                        else:
                            text = formatted_text
                        
                        # Limpar texto final
                        text = text.strip()
                        # Remover quebras de linha excessivas
                        text = re.sub(r'\n{3,}', '\n\n', text)
                        # Preservar quebras simples dentro de parágrafos
                        text = re.sub(r'\n([^-\n])', r'\n\1', text)
                        
                        if text.strip():
                            content['chapters'].append({
                                'id': i,
                                'title': f'Capítulo {i+1}',
                                'content': text,
                                'html_content': str(soup)
                            })
                    except Exception as e:
                        print(f"Erro ao processar arquivo {html_file}: {e}")
                        continue
                        
    except Exception as e:
        print(f"Erro ao extrair EPUB: {e}")
    
    return content

def translate_text(text, source_lang='auto', target_lang='pt'):
    """Traduz texto usando Deep Translator, dividindo textos longos em partes menores"""
    try:
        # Limite do Google Translate (5000 caracteres)
        MAX_CHARS = 4500  # Usar 4500 para ter margem de segurança
        
        # Se o texto é menor que o limite, traduzir normalmente
        if len(text) <= MAX_CHARS:
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            return translator.translate(text)
        
        # Para textos longos, dividir em partes
        print(f"Texto muito longo ({len(text)} caracteres), dividindo em partes...")
        
        # Tentar dividir por parágrafos primeiro
        paragraphs = text.split('\n\n')
        
        # Se não há parágrafos bem definidos, dividir por sentenças
        if len(paragraphs) <= 1:
            # Dividir por pontos finais, exclamação e interrogação
            sentences = []
            current_sentence = ""
            
            for char in text:
                current_sentence += char
                if char in '.!?':
                    sentences.append(current_sentence.strip())
                    current_sentence = ""
            
            # Adicionar a última sentença se não terminou com pontuação
            if current_sentence.strip():
                sentences.append(current_sentence.strip())
            
            # Usar sentenças como base para divisão
            text_parts = sentences
        else:
            # Usar parágrafos como base para divisão
            text_parts = paragraphs
        
        translated_parts = []
        current_part = ""
        
        for part in text_parts:
            # Se adicionar esta parte excederia o limite
            if len(current_part) + len(part) > MAX_CHARS:
                # Traduzir a parte atual se não estiver vazia
                if current_part.strip():
                    translator = GoogleTranslator(source=source_lang, target=target_lang)
                    translated_part = translator.translate(current_part.strip())
                    translated_parts.append(translated_part)
                
                # Se uma parte individual é muito longa, dividir ainda mais
                if len(part) > MAX_CHARS:
                    # Dividir em chunks menores
                    chunks = [part[i:i+MAX_CHARS] for i in range(0, len(part), MAX_CHARS)]
                    for chunk in chunks:
                        if chunk.strip():
                            translator = GoogleTranslator(source=source_lang, target=target_lang)
                            translated_chunk = translator.translate(chunk.strip())
                            translated_parts.append(translated_chunk)
                else:
                    # Iniciar nova parte com a parte atual
                    current_part = part
            else:
                # Adicionar parte à parte atual
                if current_part:
                    if len(paragraphs) > 1:
                        current_part += '\n\n' + part
                    else:
                        current_part += ' ' + part
                else:
                    current_part = part
        
        # Traduzir a última parte se não estiver vazia
        if current_part.strip():
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated_part = translator.translate(current_part.strip())
            translated_parts.append(translated_part)
        
        # Juntar todas as partes traduzidas
        if len(paragraphs) > 1:
            final_translation = '\n\n'.join(translated_parts)
        else:
            final_translation = ' '.join(translated_parts)
        
        print(f"Tradução concluída em {len(translated_parts)} partes")
        
        return final_translation
        
    except Exception as e:
        print(f"Erro na tradução: {e}")
        return text

def apply_dictionary(text, dictionary):
    """Aplica o dicionário personalizado ao texto"""
    for original, translation in dictionary.items():
        text = text.replace(original, translation)
    return text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('Nenhum arquivo selecionado')
        return redirect(request.url)
    
    file = request.files['file']
    if file.filename == '':
        flash('Nenhum arquivo selecionado')
        return redirect(request.url)
    
    if file and allowed_file(file.filename):
        # Salvar arquivo temporariamente para calcular hash
        temp_file_path = os.path.join(UPLOAD_FOLDER, f"temp_{secure_filename(file.filename)}")
        file.save(temp_file_path)
        
        # Calcular hash do arquivo
        file_hash = get_file_hash(temp_file_path)
        
        # Verificar se já existe um EPUB com o mesmo hash
        existing_file_id = find_existing_epub_by_hash(file_hash)
        
        if existing_file_id:
            # Carregar informações do EPUB existente
            content_file = os.path.join(EPUB_FOLDER, f"{existing_file_id}_content.json")
            if os.path.exists(content_file):
                with open(content_file, 'r', encoding='utf-8') as f:
                    existing_content = json.load(f)
                
                # Remover arquivo temporário
                os.remove(temp_file_path)
                
                # Retornar informações sobre o arquivo existente
                return jsonify({
                    'duplicate': True,
                    'existing_file_id': existing_file_id,
                    'title': existing_content.get('title', 'EPUB Sem Título'),
                    'chapters_count': len(existing_content.get('chapters', [])),
                    'has_translation': any(chapter.get('translated_content') for chapter in existing_content.get('chapters', []))
                })
        
        # Se não é duplicata, continuar com o upload normal
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        final_file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{filename}")
        
        # Mover arquivo temporário para localização final
        os.rename(temp_file_path, final_file_path)
        
        # Extrair conteúdo do EPUB
        content = extract_epub_content(final_file_path)
        
        if not content['chapters']:
            flash('Não foi possível extrair conteúdo do EPUB')
            return redirect(url_for('index'))
        
        # Salvar informações do arquivo
        epub_info = {
            'id': file_id,
            'filename': filename,
            'title': content['title'] or filename,
            'upload_date': datetime.now().isoformat(),
            'chapters_count': len(content['chapters']),
            'file_path': final_file_path,
            'file_hash': file_hash
        }
        
        # Salvar conteúdo em arquivo temporário
        content_file = os.path.join(EPUB_FOLDER, f"{file_id}_content.json")
        with open(content_file, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'duplicate': False,
            'file_id': file_id,
            'redirect_url': url_for('reader', file_id=file_id)
        })
    
    flash('Tipo de arquivo não permitido')
    return redirect(url_for('index'))

@app.route('/upload/force', methods=['POST'])
def force_upload():
    """Força o upload de um arquivo mesmo sendo duplicado"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{filename}")
        file.save(file_path)
        
        # Extrair conteúdo do EPUB
        content = extract_epub_content(file_path)
        
        if not content['chapters']:
            return jsonify({'success': False, 'error': 'Não foi possível extrair conteúdo do EPUB'})
        
        # Salvar informações do arquivo
        epub_info = {
            'id': file_id,
            'filename': filename,
            'title': content['title'] or filename,
            'upload_date': datetime.now().isoformat(),
            'chapters_count': len(content['chapters']),
            'file_path': file_path
        }
        
        # Salvar conteúdo em arquivo temporário
        content_file = os.path.join(EPUB_FOLDER, f"{file_id}_content.json")
        with open(content_file, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'redirect_url': url_for('reader', file_id=file_id)
        })
    
    return jsonify({'success': False, 'error': 'Tipo de arquivo não permitido'})

@app.route('/reader/<file_id>')
def reader(file_id):
    content_file = os.path.join(EPUB_FOLDER, f"{file_id}_content.json")
    
    if not os.path.exists(content_file):
        flash('Arquivo não encontrado')
        return redirect(url_for('index'))
    
    with open(content_file, 'r', encoding='utf-8') as f:
        epub_data = json.load(f)
    
    return render_template('reader.html', epub_data=epub_data, file_id=file_id)

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data.get('text', '')
    source_lang = data.get('source_lang', 'auto')
    target_lang = data.get('target_lang', 'pt')
    chapter_index = data.get('chapter_index')
    file_id = data.get('file_id')
    
    # Carregar dicionário
    dictionary = load_dictionary()
    
    # Aplicar dicionário primeiro
    text_with_dict = apply_dictionary(text, dictionary)
    
    # Traduzir
    translated_text = translate_text(text_with_dict, source_lang, target_lang)
    
    # Se foi fornecido file_id e chapter_index, salvar a tradução
    if file_id and chapter_index is not None:
        try:
            content_file = os.path.join(EPUB_FOLDER, f"{file_id}_content.json")
            if os.path.exists(content_file):
                with open(content_file, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                
                if chapter_index < len(content['chapters']):
                    # Salvar tradução no capítulo
                    content['chapters'][chapter_index]['translated_content'] = translated_text
                    content['chapters'][chapter_index]['original_content'] = content['chapters'][chapter_index]['content']
                    content['chapters'][chapter_index]['content'] = translated_text
                    
                    # Salvar arquivo atualizado
                    with open(content_file, 'w', encoding='utf-8') as f:
                        json.dump(content, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Erro ao salvar tradução: {e}")
    
    return jsonify({'translated_text': translated_text})

@app.route('/translate_all/<file_id>', methods=['POST'])
def translate_all_chapters(file_id):
    """Traduz todos os capítulos de um EPUB usando o dicionário personalizado"""
    content_file = os.path.join(EPUB_FOLDER, f"{file_id}_content.json")
    
    if not os.path.exists(content_file):
        return jsonify({'success': False, 'error': 'Arquivo não encontrado'})
    
    try:
        with open(content_file, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        # Carregar dicionário personalizado
        dictionary = load_dictionary()
        
        # Traduzir todos os capítulos
        translated_count = 0
        for i, chapter in enumerate(content['chapters']):
            # Aplicar dicionário primeiro
            text_with_dict = apply_dictionary(chapter['content'], dictionary)
            
            # Traduzir o texto
            translated_text = translate_text(text_with_dict, 'auto', 'pt')
            
            # Salvar tradução no capítulo
            chapter['translated_content'] = translated_text
            chapter['original_content'] = chapter['content']
            chapter['content'] = translated_text
            
            translated_count += 1
        
        # Salvar conteúdo atualizado
        with open(content_file, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'success': True,
            'message': f'{translated_count} capítulos traduzidos com sucesso!',
            'translated_count': translated_count
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erro ao traduzir: {str(e)}'})

@app.route('/dictionary')
def dictionary_page():
    dictionary = load_dictionary()
    return render_template('dictionary.html', dictionary=dictionary)

@app.route('/dictionary/add', methods=['POST'])
def add_dictionary_entry():
    data = request.get_json()
    original = data.get('original', '').strip()
    # Aceita tanto 'translated' quanto 'translation' para compatibilidade
    translation = data.get('translated', data.get('translation', '')).strip()
    
    if original and translation:
        dictionary = load_dictionary()
        dictionary[original] = translation
        save_dictionary(dictionary)
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Campos vazios'})

@app.route('/dictionary/remove', methods=['POST'])
def remove_dictionary_entry():
    data = request.get_json()
    original = data.get('original', '').strip()
    
    if original:
        dictionary = load_dictionary()
        if original in dictionary:
            del dictionary[original]
            save_dictionary(dictionary)
            return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Entrada não encontrada'})

@app.route('/dictionary/upload', methods=['POST'])
def upload_dictionary():
    """Upload de dicionário personalizado"""
    if 'dictionary_file' not in request.files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    file = request.files['dictionary_file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    # Verificar extensão do arquivo
    if not file.filename.endswith('.json'):
        return jsonify({'success': False, 'error': 'Apenas arquivos JSON são permitidos'})
    
    try:
        # Ler e validar o arquivo JSON
        content = file.read().decode('utf-8')
        new_dictionary = json.loads(content)
        
        # Validar se é um dicionário válido
        if not isinstance(new_dictionary, dict):
            return jsonify({'success': False, 'error': 'Formato de arquivo inválido'})
        
        # Carregar dicionário atual e mesclar
        current_dictionary = load_dictionary()
        current_dictionary.update(new_dictionary)
        
        # Salvar dicionário mesclado
        save_dictionary(current_dictionary)
        
        return jsonify({
            'success': True, 
            'message': f'Dicionário carregado com sucesso! {len(new_dictionary)} entradas adicionadas.',
            'entries_count': len(current_dictionary)
        })
        
    except json.JSONDecodeError:
        return jsonify({'success': False, 'error': 'Arquivo JSON inválido'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erro ao processar arquivo: {str(e)}'})

@app.route('/dictionary/download')
def download_dictionary():
    """Download do dicionário personalizado"""
    try:
        dictionary = load_dictionary()
        
        # Criar arquivo temporário
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.json', mode='w', encoding='utf-8')
        json.dump(dictionary, temp_file, ensure_ascii=False, indent=2)
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name='dicionario_personalizado.json',
            mimetype='application/json'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erro ao gerar arquivo: {str(e)}'})

@app.route('/download/<file_id>')
def download_epub(file_id):
    content_file = os.path.join(EPUB_FOLDER, f"{file_id}_content.json")
    
    if not os.path.exists(content_file):
        flash('Arquivo não encontrado')
        return redirect(url_for('index'))
    
    with open(content_file, 'r', encoding='utf-8') as f:
        content = json.load(f)
    
    # Verificar se já existe tradução
    has_translation = any(chapter.get('translated_content') for chapter in content['chapters'])
    
    if has_translation:
        # Usar traduções existentes
        translated_chapters = []
        for chapter in content['chapters']:
            translated_chapter = {
                'id': chapter['id'],
                'title': chapter['title'],
                'content': chapter.get('translated_content', chapter['content']),
                'original_content': chapter.get('original_content', chapter['content'])
            }
            translated_chapters.append(translated_chapter)
    else:
        # Traduzir todos os capítulos usando o dicionário personalizado
        dictionary = load_dictionary()
        translated_chapters = []
        for i, chapter in enumerate(content['chapters']):
            # Aplicar dicionário primeiro
            text_with_dict = apply_dictionary(chapter['content'], dictionary)
            
            # Traduzir o texto
            translated_text = translate_text(text_with_dict, 'auto', 'pt')
            
            # Criar capítulo traduzido
            translated_chapter = {
                'id': chapter['id'],
                'title': chapter['title'],
                'content': translated_text,
                'original_content': chapter['content']
            }
            translated_chapters.append(translated_chapter)
    
    # Criar um EPUB com o conteúdo traduzido
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.epub')
    temp_file.close()
    
    with zipfile.ZipFile(temp_file.name, 'w') as epub:
        # Adicionar arquivos básicos do EPUB
        epub.writestr('META-INF/container.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>''')
        
        # Criar content.opf
        content_opf = f'''<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>{content.get('title', 'EPUB Traduzido')} (Traduzido)</dc:title>
        <dc:language>pt</dc:language>
        <dc:creator>EPUB Translator</dc:creator>
        <dc:description>EPUB traduzido automaticamente com dicionário personalizado</dc:description>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="css" href="style.css" media-type="text/css"/>
'''
        
        for i, chapter in enumerate(translated_chapters):
            content_opf += f'        <item id="chapter{i}" href="chapter{i}.html" media-type="application/xhtml+xml"/>\n'
        
        content_opf += '''    </manifest>
    <spine toc="ncx">
'''
        
        for i in range(len(translated_chapters)):
            content_opf += f'        <itemref idref="chapter{i}"/>\n'
        
        content_opf += '''    </spine>
</package>'''
        
        epub.writestr('OEBPS/content.opf', content_opf)
        
        # Adicionar CSS
        epub.writestr('OEBPS/style.css', '''body { 
    font-family: "Times New Roman", serif; 
    margin: 2em; 
    line-height: 1.6; 
    text-align: justify;
}
h1, h2, h3 { 
    color: #333; 
    text-align: center;
    margin-top: 2em;
    margin-bottom: 1em;
}
p { 
    text-indent: 2em;
    margin-bottom: 1em;
}
.content {
    max-width: 800px;
    margin: 0 auto;
}''')
        
        # Adicionar capítulos traduzidos
        for i, chapter in enumerate(translated_chapters):
            # Formatar o conteúdo traduzido para HTML
            formatted_content = chapter['content'].replace('\n\n', '</p><p>').replace('\n', ' ')
            if not formatted_content.startswith('<p>'):
                formatted_content = f'<p>{formatted_content}</p>'
            
            chapter_html = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>{chapter['title']}</title>
    <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
    <div class="content">
        <h1>{chapter['title']}</h1>
        {formatted_content}
    </div>
</body>
</html>'''
            epub.writestr(f'OEBPS/chapter{i}.html', chapter_html)
        
        # Adicionar arquivo de navegação (toc.ncx)
        toc_ncx = f'''<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="epub-translator-{file_id}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text>{content.get('title', 'EPUB Traduzido')}</text>
    </docTitle>
    <navMap>
'''
        
        for i, chapter in enumerate(translated_chapters):
            toc_ncx += f'''        <navPoint id="chapter{i}" playOrder="{i+1}">
            <navLabel>
                <text>{chapter['title']}</text>
            </navLabel>
            <content src="chapter{i}.html"/>
        </navPoint>
'''
        
        toc_ncx += '''    </navMap>
</ncx>'''
        
        epub.writestr('OEBPS/toc.ncx', toc_ncx)
    
    return send_file(temp_file.name, as_attachment=True, download_name=f"traduzido_{content.get('title', 'epub')}.epub")

if __name__ == '__main__':
    app.run(debug=True) 