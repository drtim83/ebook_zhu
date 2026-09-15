import os
import sys
import zipfile
import json
import time
import re
import xml.etree.ElementTree as ET
import cv2
import numpy as np
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import ebooklib
from ebooklib import epub

WORKSPACE = '/Users/drtimothytok/VibeCoding/Ebook'
DOCX_PATH = os.path.join(WORKSPACE, 'Lineage- Sorted.docx')
OUTPUT_DIR = os.path.join(WORKSPACE, 'ebook_output')
RAW_DIR = os.path.join(OUTPUT_DIR, 'raw_pages')
CLEANED_DIR = os.path.join(OUTPUT_DIR, 'cleaned_pages')
OCR_DIR = os.path.join(OUTPUT_DIR, 'ocr_text')
TESSDATA_DIR = os.path.join(WORKSPACE, 'tessdata')

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(CLEANED_DIR, exist_ok=True)
os.makedirs(OCR_DIR, exist_ok=True)

def step1_extract_images():
    print("=== Step 1: Extracting images in document order from Word document ===")
    with zipfile.ZipFile(DOCX_PATH, 'r') as z:
        doc_xml = z.read('word/document.xml')
        rels_xml = z.read('word/_rels/document.xml.rels')
        
        rels_tree = ET.fromstring(rels_xml)
        rel_map = {elem.attrib.get('Id'): elem.attrib.get('Target') for elem in rels_tree}
        
        doc_tree = ET.fromstring(doc_xml)
        ns = {
            'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
            'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
        }
        blips = doc_tree.findall('.//a:blip', ns)
        
        ordered_targets = []
        for b in blips:
            embed = b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            if embed and embed in rel_map:
                ordered_targets.append(rel_map[embed])
                
        print(f"Found {len(ordered_targets)} image references in document.xml.")
        extracted_paths = []
        for idx, target in enumerate(ordered_targets, 1):
            data = z.read('word/' + target)
            ext = os.path.splitext(target)[1] or '.jpg'
            fname = f"page_{idx:03d}{ext}"
            fpath = os.path.join(RAW_DIR, fname)
            with open(fpath, 'wb') as f:
                f.write(data)
            extracted_paths.append(fpath)
            
    print(f"Extracted {len(extracted_paths)} raw images to {RAW_DIR}")
    return extracted_paths

def clean_page_image(image_path, out_path, page_num):
    img = cv2.imread(image_path)
    if img is None:
        return
        
    h, w = img.shape[:2]
    
    # Page 1 is the closed book physical inspection photo
    if page_num == 1:
        # Keep photo in full color, slightly enhance
        cv2.imwrite(out_path, img)
        return

    # Page 2 is the front cover (pinkish / parchment paper with black title box)
    if page_num == 2:
        # Detect book boundary on table
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        # Cover paper is low saturation compared to dark varnished wood
        mask = (hsv[:, :, 1] < 110) & (hsv[:, :, 2] > 110)
        mask = (mask * 255).astype(np.uint8)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (35, 35))
        closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            c = max(contours, key=cv2.contourArea)
            x, y, bw, bh = cv2.boundingRect(c)
            # Crop slightly inside to remove wood
            pad_x = int(bw * 0.02)
            pad_y = int(bh * 0.02)
            crop = img[y+pad_y : y+bh-pad_y, x+pad_x : x+bw-pad_x]
            cv2.imwrite(out_path, crop)
        else:
            cv2.imwrite(out_path, img)
        return

    # Interior pages (3 to 95):
    # 1. Detect paper boundary against wood table
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # Paper is high brightness, low-to-moderate saturation
    paper_mask = (hsv[:, :, 1] < 90) & (hsv[:, :, 2] > 105)
    paper_mask = (paper_mask * 255).astype(np.uint8)
    
    # Remove small noise and bridge letters
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
    closed = cv2.morphologyEx(paper_mask, cv2.MORPH_CLOSE, kernel_close)
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        x, y, bw, bh = cv2.boundingRect(c)
        # Check if table border exists on sides
        # Trim 1.5% margin to completely eliminate wood table bleeding
        crop_x1 = max(0, x + int(bw * 0.015))
        crop_x2 = min(w, x + bw - int(bw * 0.015))
        crop_y1 = max(0, y + int(bh * 0.01))
        crop_y2 = min(h, y + bh - int(bh * 0.01))
        cropped = img[crop_y1:crop_y2, crop_x1:crop_x2]
    else:
        cropped = img
        
    # 2. Whiten background and flatten illumination
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    
    # Large morphological closing to estimate varying illumination across page
    kernel_bg = cv2.getStructuringElement(cv2.MORPH_RECT, (31, 31))
    bg = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel_bg)
    
    # Division normalization to remove shadows and gradients
    norm = np.float32(gray) / (np.float32(bg) + 1e-5) * 255.0
    norm = np.clip(norm, 0, 255).astype(np.uint8)
    
    # Normalize dynamic range
    cleaned = cv2.normalize(norm, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    
    # Map upper tones (paper texture) to pure white (#FFFFFF)
    cleaned[cleaned > 218] = 255
    
    # Ensure text is solid dark by stretching lower mid-tones
    cleaned[cleaned < 70] = np.clip(cleaned[cleaned < 70] * 0.8, 0, 255).astype(np.uint8)
    
    cv2.imwrite(out_path, cleaned, [cv2.IMWRITE_JPEG_QUALITY, 95])

def step2_clean_all_pages(extracted_paths):
    print("=== Step 2: Flattening, deskewing and cleaning pages ===")
    cleaned_paths = []
    total = len(extracted_paths)
    for idx, path in enumerate(extracted_paths, 1):
        out_name = f"page_{idx:03d}.jpg"
        out_path = os.path.join(CLEANED_DIR, out_name)
        clean_page_image(path, out_path, idx)
        cleaned_paths.append(out_path)
        if idx % 10 == 0 or idx == total:
            print(f"  Cleaned {idx}/{total} pages...")
    return cleaned_paths

def run_tesseract_ocr(image_path):
    import subprocess
    cmd = [
        "/opt/homebrew/bin/tesseract",
        image_path,
        "stdout",
        "--tessdata-dir", TESSDATA_DIR,
        "-l", "chi_tra_vert+chi_sim_vert",
        "--psm", "5"
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
        return res.stdout.strip()
    except Exception as e:
        return ""

def step3_ocr_all_pages(cleaned_paths):
    print("=== Step 3: Running Vertical Chinese OCR across all pages ===")
    metadata = []
    total = len(cleaned_paths)
    
    full_book_text = []
    
    for idx, path in enumerate(cleaned_paths, 1):
        # Skip OCR on page 1 (photo of book spine)
        if idx == 1:
            ocr_text = "[照片: 祝氏族谱 书脊侧视图]"
        elif idx == 2:
            # Front cover is horizontal or vertical big titles
            import subprocess
            cmd = [
                "/opt/homebrew/bin/tesseract",
                path,
                "stdout",
                "--tessdata-dir", TESSDATA_DIR,
                "-l", "chi_tra+chi_sim",
                "--psm", "3"
            ]
            try:
                res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
                ocr_text = res.stdout.strip() or "海南省文昌市 祝氏族譜"
            except:
                ocr_text = "海南省文昌市 祝氏族譜"
        else:
            ocr_text = run_tesseract_ocr(path)
            
        # Clean up OCR text formatting
        # Save per-page text file
        txt_path = os.path.join(OCR_DIR, f"page_{idx:03d}.txt")
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(ocr_text)
            
        # Try to detect page number
        # Look for standalone number in first 100 characters or header
        page_num_match = re.search(r'\b(\d{1,3})\b', ocr_text[:120])
        detected_num = int(page_num_match.group(1)) if page_num_match else None
        
        im = Image.open(path)
        w, h = im.size
        
        meta = {
            "pageIndex": idx - 1,
            "displayPageNumber": idx,
            "detectedBookPageNumber": detected_num,
            "filename": os.path.basename(path),
            "width": w,
            "height": h,
            "charCount": len(ocr_text),
            "textSnippet": ocr_text[:120].replace('\n', ' ')
        }
        metadata.append(meta)
        
        full_book_text.append(f"--- [第 {idx} 页] --- \n" + ocr_text + "\n\n")
        
        if idx % 10 == 0 or idx == total:
            print(f"  OCR completed for {idx}/{total} pages...")
            
    meta_path = os.path.join(OUTPUT_DIR, 'book_metadata.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
        
    full_text_path = os.path.join(OUTPUT_DIR, 'Zhu_Family_Lineage_Complete_OCR.txt')
    with open(full_text_path, 'w', encoding='utf-8') as f:
        f.writelines(full_book_text)
        
    print(f"Saved OCR metadata to {meta_path} and full text to {full_text_path}")
    return metadata

def step4_generate_pdf(cleaned_paths):
    print("=== Step 4: Generating high-resolution publication PDF ===")
    pdf_path = os.path.join(OUTPUT_DIR, 'Zhu_Family_Lineage_Cleaned_Ebook.pdf')
    
    # Load all images via PIL
    images = []
    first_image = None
    
    for idx, p in enumerate(cleaned_paths):
        im = Image.open(p)
        if im.mode != 'RGB':
            im = im.convert('RGB')
        if idx == 0:
            first_image = im
        else:
            images.append(im)
            
    first_image.save(pdf_path, "PDF", resolution=150.0, save_all=True, append_images=images)
    print(f"Generated PDF: {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")
    return pdf_path

def step5_generate_epub(cleaned_paths, metadata):
    print("=== Step 5: Generating standard EPUB3 file ===")
    epub_path = os.path.join(OUTPUT_DIR, 'Zhu_Family_Lineage_Cleaned.epub')
    
    book = epub.EpubBook()
    book.set_identifier('zhu-family-lineage-wenchang-2026')
    book.set_title('海南省文昌市 祝氏族谱')
    book.set_language('zh')
    book.add_author('文昌祝氏家族')
    
    # Cover image (page 2)
    cover_path = cleaned_paths[1] if len(cleaned_paths) > 1 else cleaned_paths[0]
    with open(cover_path, 'rb') as f:
        book.set_cover('cover.jpg', f.read())
        
    chapters = []
    for idx, p in enumerate(cleaned_paths, 1):
        txt_file = os.path.join(OCR_DIR, f"page_{idx:03d}.txt")
        ocr_text = ""
        if os.path.exists(txt_file):
            with open(txt_file, 'r', encoding='utf-8') as f:
                ocr_text = f.read()
                
        # Add image item
        img_name = f"page_{idx:03d}.jpg"
        with open(p, 'rb') as f:
            img_item = epub.EpubItem(
                uid=f"img_{idx:03d}",
                file_name=f"images/{img_name}",
                media_type="image/jpeg",
                content=f.read()
            )
            book.add_item(img_item)
            
        # Create chapter html
        chap = epub.EpubHtml(title=f'第 {idx} 页', file_name=f'page_{idx:03d}.xhtml', lang='zh')
        
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
          <div class="page-label">页码: {idx}</div>
          <img class="page-image" src="images/{img_name}" alt="第 {idx} 页" />
          <div class="ocr-box">
            <h4>【识别文本】</h4>
            <p>{escaped_text or '<i>无识别文本</i>'}</p>
          </div>
        </body>
        </html>
        """
        book.add_item(chap)
        chapters.append(chap)
        
    book.toc = tuple(chapters)
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    book.spine = ['nav'] + chapters
    
    epub.write_epub(epub_path, book)
    print(f"Generated EPUB: {epub_path} (Size: {os.path.getsize(epub_path)} bytes)")
    return epub_path

def main():
    t0 = time.time()
    extracted = step1_extract_images()
    cleaned = step2_clean_all_pages(extracted)
    meta = step3_ocr_all_pages(cleaned)
    pdf_path = step4_generate_pdf(cleaned)
    epub_path = step5_generate_epub(cleaned, meta)
    
    print("\n=======================================================")
    print(f"Successfully processed all {len(cleaned)} pages in {time.time() - t0:.1f}s!")
    print(f"Cleaned pages: {CLEANED_DIR}")
    print(f"OCR text:      {OCR_DIR}")
    print(f"Cleaned PDF:   {pdf_path}")
    print(f"EPUB Ebook:    {epub_path}")
    print("=======================================================")

if __name__ == '__main__':
    main()
