#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import time
from pathlib import Path
from typing import List, Dict, Optional

from ebooklib import epub
from bs4 import BeautifulSoup, NavigableString, Tag
import deepl
import requests
from urllib.parse import urljoin, urlparse


class EPUBTranslator:
    def __init__(self, deepl_api_key: str, source_lang: str = 'EN', target_lang: str = 'PT-BR'):
        """
        Inicializa o tradutor de EPUB
        
        Args:
            deepl_api_key: Chave da API do DeepL
            source_lang: Idioma de origem (ex: 'EN', 'ES', 'FR')
            target_lang: Idioma de destino (ex: 'PT-BR', 'PT-PT', 'ES', 'FR')
        """
        self.translator = deepl.Translator(deepl_api_key)
        self.source_lang = source_lang
        self.target_lang = target_lang
        self.processed_texts = {}  # Cache para evitar traduções duplicadas
        
    def extract_epub_structure(self, epub_path: str) -> Dict:
        """
        Extrai toda a estrutura do EPUB
        
        Args:
            epub_path: Caminho para o arquivo EPUB
            
        Returns:
            Dict com informações da estrutura do EPUB
        """
        book = epub.read_epub(epub_path)
        
        structure = {
            'metadata': self._extract_metadata(book),
            'spine': [],
            'images': [],
            'stylesheets': [],
            'fonts': [],
            'other_items': [],
            'toc': book.toc,
            'guide': book.guide
        }
        
        # Analisa cada item do livro
        for item in book.get_items():
            if item.get_type() == epub.EpubItem.DOCUMENT:
                # Documentos HTML/XHTML
                structure['spine'].append({
                    'id': item.get_id(),
                    'file_name': item.get_name(),
                    'content': item.get_content().decode('utf-8'),
                    'media_type': item.get_media_type(),
                    'properties': getattr(item, 'properties', [])
                })
            elif item.get_type() == epub.EpubItem.IMAGE:
                # Imagens
                structure['images'].append({
                    'id': item.get_id(),
                    'file_name': item.get_name(),
                    'content': item.get_content(),
                    'media_type': item.get_media_type()
                })
            elif item.get_type() == epub.EpubItem.STYLE:
                # Folhas de estilo CSS
                structure['stylesheets'].append({
                    'id': item.get_id(),
                    'file_name': item.get_name(),
                    'content': item.get_content().decode('utf-8'),
                    'media_type': item.get_media_type()
                })
            elif item.media_type in ['application/font-woff', 'application/font-woff2', 
                                   'font/woff', 'font/woff2', 'application/x-font-ttf']:
                # Fontes
                structure['fonts'].append({
                    'id': item.get_id(),
                    'file_name': item.get_name(),
                    'content': item.get_content(),
                    'media_type': item.get_media_type()
                })
            else:
                # Outros itens
                structure['other_items'].append({
                    'id': item.get_id(),
                    'file_name': item.get_name(),
                    'content': item.get_content(),
                    'media_type': item.get_media_type()
                })
        
        return structure
    
    def _extract_metadata(self, book) -> Dict:
        """Extrai metadados do EPUB"""
        metadata = {}
        
        # Metadados básicos
        metadata['title'] = book.get_metadata('DC', 'title')
        metadata['creator'] = book.get_metadata('DC', 'creator')
        metadata['language'] = book.get_metadata('DC', 'language')
        metadata['publisher'] = book.get_metadata('DC', 'publisher')
        metadata['date'] = book.get_metadata('DC', 'date')
        metadata['description'] = book.get_metadata('DC', 'description')
        metadata['subject'] = book.get_metadata('DC', 'subject')
        metadata['rights'] = book.get_metadata('DC', 'rights')
        metadata['identifier'] = book.get_metadata('DC', 'identifier')
        
        return metadata
    
    def translate_text(self, text: str, preserve_html: bool = True) -> str:
        """
        Traduz texto usando DeepL
        
        Args:
            text: Texto para traduzir
            preserve_html: Se deve preservar tags HTML
            
        Returns:
            Texto traduzido
        """
        if not text.strip():
            return text
            
        # Verifica cache
        if text in self.processed_texts:
            return self.processed_texts[text]
        
        try:
            # Traduz texto
            if preserve_html:
                result = self.translator.translate_text(
                    text, 
                    source_lang=self.source_lang,
                    target_lang=self.target_lang,
                    tag_handling='html'
                )
            else:
                result = self.translator.translate_text(
                    text,
                    source_lang=self.source_lang, 
                    target_lang=self.target_lang
                )
            
            translated_text = result.text
            self.processed_texts[text] = translated_text
            
            # Pausa para evitar rate limiting
            time.sleep(0.1)
            
            return translated_text
            
        except Exception as e:
            print(f"Erro ao traduzir texto: {e}")
            return text
    
    def translate_html_content(self, html_content: str) -> str:
        """
        Traduz conteúdo HTML preservando formatação
        
        Args:
            html_content: Conteúdo HTML para traduzir
            
        Returns:
            Conteúdo HTML traduzido
        """
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Tags que contêm texto que deve ser traduzido
        text_tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 
                    'li', 'td', 'th', 'em', 'strong', 'i', 'b', 'u', 'blockquote',
                    'figcaption', 'caption', 'label', 'legend', 'title']
        
        # Traduz texto em tags específicas
        for tag_name in text_tags:
            for tag in soup.find_all(tag_name):
                if tag.string and tag.string.strip():
                    # Texto direto na tag
                    original_text = tag.string.strip()
                    if self._should_translate(original_text):
                        translated = self.translate_text(original_text, preserve_html=False)
                        tag.string.replace_with(translated)
                else:
                    # Texto misto com outras tags
                    self._translate_mixed_content(tag)
        
        # Traduz atributos específicos
        self._translate_attributes(soup)
        
        return str(soup)
    
    def _translate_mixed_content(self, tag: Tag):
        """Traduz conteúdo misto (texto + tags)"""
        for content in tag.contents:
            if isinstance(content, NavigableString):
                text = content.strip()
                if text and self._should_translate(text):
                    translated = self.translate_text(text, preserve_html=False)
                    content.replace_with(translated)
    
    def _translate_attributes(self, soup: BeautifulSoup):
        """Traduz atributos específicos como title, alt, etc."""
        # Traduz atributos alt de imagens
        for img in soup.find_all('img'):
            if img.get('alt'):
                original_alt = img['alt']
                if self._should_translate(original_alt):
                    img['alt'] = self.translate_text(original_alt, preserve_html=False)
        
        # Traduz atributos title
        for element in soup.find_all(attrs={'title': True}):
            original_title = element['title']
            if self._should_translate(original_title):
                element['title'] = self.translate_text(original_title, preserve_html=False)
    
    def _should_translate(self, text: str) -> bool:
        """Verifica se um texto deve ser traduzido"""
        # Não traduz texto muito curto, números, URLs, etc.
        if len(text.strip()) < 3:
            return False
        
        # Não traduz se for apenas números ou símbolos
        if re.match(r'^[\d\s\-\.\,\:\;\!\?\(\)\[\]]+$', text):
            return False
        
        # Não traduz URLs
        if re.match(r'https?://', text):
            return False
        
        return True
    
    def translate_epub(self, input_path: str, output_path: str):
        """
        Traduz um arquivo EPUB completo
        
        Args:
            input_path: Caminho do arquivo EPUB original
            output_path: Caminho para salvar o EPUB traduzido
        """
        print(f"Iniciando tradução de {input_path}...")
        
        # Extrai estrutura do EPUB
        print("Extraindo estrutura do EPUB...")
        structure = self.extract_epub_structure(input_path)
        
        # Cria novo livro
        book = epub.EpubBook()
        
        # Adiciona metadados traduzidos
        print("Traduzindo metadados...")
        self._add_translated_metadata(book, structure['metadata'])
        
        # Traduz e adiciona documentos
        print("Traduzindo conteúdo...")
        document_items = []
        for i, doc in enumerate(structure['spine']):
            print(f"Traduzindo documento {i+1}/{len(structure['spine'])}: {doc['file_name']}")
            
            # Traduz conteúdo HTML
            translated_content = self.translate_html_content(doc['content'])
            
            # Cria item do documento
            item = epub.EpubHtml(
                title=f"Chapter {i+1}",
                file_name=doc['file_name'],
                content=translated_content
            )
            item.set_id(doc['id'])
            
            book.add_item(item)
            document_items.append(item)
        
        # Adiciona imagens
        print("Adicionando imagens...")
        for img in structure['images']:
            item = epub.EpubItem(
                uid=img['id'],
                file_name=img['file_name'],
                media_type=img['media_type'],
                content=img['content']
            )
            book.add_item(item)
        
        # Adiciona folhas de estilo
        print("Adicionando estilos...")
        for style in structure['stylesheets']:
            item = epub.EpubItem(
                uid=style['id'],
                file_name=style['file_name'],
                media_type=style['media_type'],
                content=style['content'].encode('utf-8')
            )
            book.add_item(item)
        
        # Adiciona fontes
        print("Adicionando fontes...")
        for font in structure['fonts']:
            item = epub.EpubItem(
                uid=font['id'],
                file_name=font['file_name'],
                media_type=font['media_type'],
                content=font['content']
            )
            book.add_item(item)
        
        # Adiciona outros itens
        for other in structure['other_items']:
            item = epub.EpubItem(
                uid=other['id'],
                file_name=other['file_name'],
                media_type=other['media_type'],
                content=other['content']
            )
            book.add_item(item)
        
        # Configura spine
        book.spine = ['nav'] + document_items
        
        # Adiciona navegação
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())
        
        # Salva o arquivo
        print(f"Salvando EPUB traduzido em {output_path}...")
        epub.write_epub(output_path, book)
        
        print("Tradução concluída!")
    
    def _add_translated_metadata(self, book, metadata: Dict):
        """Adiciona metadados traduzidos ao livro"""
        # Título
        if metadata.get('title'):
            for title_info in metadata['title']:
                original_title = title_info[0]
                translated_title = self.translate_text(original_title, preserve_html=False)
                book.set_title(translated_title)
        
        # Autor
        if metadata.get('creator'):
            for creator_info in metadata['creator']:
                book.add_author(creator_info[0])
        
        # Idioma (muda para o idioma de destino)
        book.set_language(self.target_lang.lower().replace('-', '_'))
        
        # Outros metadados
        if metadata.get('publisher'):
            for pub_info in metadata['publisher']:
                book.add_metadata('DC', 'publisher', pub_info[0])
        
        if metadata.get('description'):
            for desc_info in metadata['description']:
                original_desc = desc_info[0]
                translated_desc = self.translate_text(original_desc, preserve_html=False)
                book.add_metadata('DC', 'description', translated_desc)
        
        if metadata.get('subject'):
            for subj_info in metadata['subject']:
                original_subj = subj_info[0]
                translated_subj = self.translate_text(original_subj, preserve_html=False)
                book.add_metadata('DC', 'subject', translated_subj)
        
        if metadata.get('rights'):
            for rights_info in metadata['rights']:
                book.add_metadata('DC', 'rights', rights_info[0])
        
        if metadata.get('identifier'):
            for id_info in metadata['identifier']:
                book.set_identifier(id_info[0])


def main():
    """Exemplo de uso"""
    # Configuração
    DEEPL_API_KEY = "SUA_CHAVE_API_DEEPL_AQUI"  # Substitua pela sua chave
    INPUT_EPUB = "livro_original.epub"
    OUTPUT_EPUB = "livro_traduzido.epub"
    SOURCE_LANG = "EN"  # Idioma de origem
    TARGET_LANG = "PT-BR"  # Idioma de destino
    
    # Verifica se o arquivo existe
    if not os.path.exists(INPUT_EPUB):
        print(f"Erro: Arquivo {INPUT_EPUB} não encontrado!")
        return
    
    # Inicializa tradutor
    translator = EPUBTranslator(
        deepl_api_key=DEEPL_API_KEY,
        source_lang=SOURCE_LANG,
        target_lang=TARGET_LANG
    )
    
    try:
        # Traduz o EPUB
        translator.translate_epub(INPUT_EPUB, OUTPUT_EPUB)
        print(f"✅ Tradução concluída! Arquivo salvo em: {OUTPUT_EPUB}")
        
    except Exception as e:
        print(f"❌ Erro durante a tradução: {e}")


if __name__ == "__main__":
    main()