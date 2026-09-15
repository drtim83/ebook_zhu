import os
import json
from ebooklib import epub

WORKSPACE = '/Users/drtimothytok/VibeCoding/Ebook'
OUTPUT_DIR = os.path.join(WORKSPACE, 'ebook_output')
CLEANED_DIR = os.path.join(OUTPUT_DIR, 'cleaned_pages')
OCR_DIR = os.path.join(OUTPUT_DIR, 'ocr_text')
ENG_JSON = os.path.join(OUTPUT_DIR, 'english_translation.json')
EPUB_PATH = os.path.join(OUTPUT_DIR, 'Zhu_Family_Lineage_Bilingual_Edition.epub')

def generate_bilingual_epub():
    book = epub.EpubBook()
    book.set_identifier('zhu-family-lineage-bilingual-2026')
    book.set_title('海南省文昌市 祝氏族谱 (Bilingual Edition)')
    book.set_language('zh')
    book.add_author('文昌祝氏家族 / Zhu Zhaoke')

    # Cover
    cover_img_path = os.path.join(CLEANED_DIR, 'page_002.jpg')
    with open(cover_img_path, 'rb') as f:
        book.set_cover('cover.jpg', f.read())

    chapters = []
    
    # Section 1: English Translation
    with open(ENG_JSON, 'r', encoding='utf-8') as f:
        eng_sections = json.load(f)
        
    eng_toc = []
    for s_idx, sec in enumerate(eng_sections, 1):
        title = sec['title']
        paras = sec['paragraphs']
        chap_html = f"<h2>{title}</h2>" + "".join(f"<p>{p}</p>" for p in paras)
        
        chap = epub.EpubHtml(
            title=f"EN: {title[:30]}",
            file_name=f'en_section_{s_idx:03d}.xhtml',
            lang='en'
        )
        chap.content = f"""
        <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
        <head>
          <title>{title}</title>
          <style>
            body {{ font-family: sans-serif; line-height: 1.7; padding: 20px; color: #222; max-width: 800px; margin: 0 auto; }}
            h2 {{ color: #8B0000; border-bottom: 1px solid #ddd; padding-bottom: 8px; }}
            p {{ margin-bottom: 14px; text-align: justify; }}
          </style>
        </head>
        <body>
          {chap_html}
        </body>
        </html>
        """
        book.add_item(chap)
        chapters.append(chap)
        eng_toc.append(chap)

    # Section 2: Scanned Cleaned Pages with OCR
    page_files = sorted([f for f in os.listdir(CLEANED_DIR) if f.startswith('page_') and f.endswith('.jpg')])
    total_pages = len(page_files)
    page_toc = []
    for idx in range(1, total_pages + 1):
        img_name = f"page_{idx:03d}.jpg"
        img_path = os.path.join(CLEANED_DIR, img_name)
        txt_path = os.path.join(OCR_DIR, f"page_{idx:03d}.txt")
        ocr_text = ""
        if os.path.exists(txt_path):
            with open(txt_path, 'r', encoding='utf-8') as f:
                ocr_text = f.read()

        with open(img_path, 'rb') as f:
            img_item = epub.EpubItem(
                uid=f"img_{idx:03d}",
                file_name=f"images/{img_name}",
                media_type="image/jpeg",
                content=f.read()
            )
            book.add_item(img_item)

        chap = epub.EpubHtml(title=f'第 {idx} 页 (Page {idx})', file_name=f'page_{idx:03d}.xhtml', lang='zh')
        escaped_text = ocr_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
        chap.content = f"""
        <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh">
        <head>
          <title>第 {idx} 页</title>
          <style>
            body {{ text-align: center; margin: 0; padding: 10px; background-color: #fff; font-family: sans-serif; }}
            .page-image {{ max-width: 100%; height: auto; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
            .ocr-box {{ text-align: left; margin: 20px auto; max-width: 700px; padding: 15px; background: #fafafa; border: 1px solid #eee; font-size: 0.9em; line-height: 1.8; color: #333; }}
            .page-label {{ font-size: 0.85em; color: #888; margin-bottom: 8px; }}
          </style>
        </head>
        <body>
          <div class="page-label">页码: {idx} / Page {idx}</div>
          <img class="page-image" src="images/{img_name}" alt="第 {idx} 页" />
          <div class="ocr-box">
            <h4>【识别文本 / OCR Text】</h4>
            <p>{escaped_text or '<i>无识别文本</i>'}</p>
          </div>
        </body>
        </html>
        """
        book.add_item(chap)
        chapters.append(chap)
        page_toc.append(chap)

    book.toc = (
        (epub.Section('English Edition & Historical Commentary'), tuple(eng_toc)),
        (epub.Section(f'Facsimile Pages & Chinese OCR ({total_pages} Pages)'), tuple(page_toc))
    )
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    book.spine = ['nav'] + chapters

    epub.write_epub(EPUB_PATH, book)
    print(f"Generated Bilingual EPUB: {EPUB_PATH} (Size: {os.path.getsize(EPUB_PATH)} bytes)")
    
    # Copy to Downloads
    dst = '/Users/drtimothytok/Downloads/Zhu_Family_Lineage_Bilingual_Edition.epub'
    import shutil
    shutil.copy2(EPUB_PATH, dst)
    print(f"Copied to {dst}")

if __name__ == '__main__':
    generate_bilingual_epub()
