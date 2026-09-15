import os
import shutil
import json

WORKSPACE = '/Users/drtimothytok/VibeCoding/Ebook'
ANDROID_DIR = os.path.join(WORKSPACE, 'android_app')
APP_DIR = os.path.join(ANDROID_DIR, 'app')
SRC_DIR = os.path.join(APP_DIR, 'src', 'main')
ASSETS_DIR = os.path.join(SRC_DIR, 'assets')
PAGES_DIR = os.path.join(ASSETS_DIR, 'pages')
DATA_DIR = os.path.join(ASSETS_DIR, 'data')

os.makedirs(PAGES_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(SRC_DIR, 'java', 'com', 'zhulineage', 'reader'), exist_ok=True)
os.makedirs(os.path.join(SRC_DIR, 'res', 'values'), exist_ok=True)
os.makedirs(os.path.join(SRC_DIR, 'res', 'layout'), exist_ok=True)

# 1. Copy 95 cleaned pages
CLEANED_SRC = os.path.join(WORKSPACE, 'ebook_output', 'cleaned_pages')
image_files = sorted([f for f in os.listdir(CLEANED_SRC) if f.startswith('page_') and f.endswith('.jpg')])
total_pages = len(image_files)

for f in image_files:
    shutil.copy2(os.path.join(CLEANED_SRC, f), os.path.join(PAGES_DIR, f))
print(f"Copied {total_pages} cleaned pages to {PAGES_DIR}")

# 2. Build consolidated book_data.js
OCR_DIR = os.path.join(WORKSPACE, 'ebook_output', 'ocr_text')
pages_data = []
for i in range(1, total_pages + 1):
    txt_file = os.path.join(OCR_DIR, f"page_{i:03d}.txt")
    text = ""
    if os.path.exists(txt_file):
        with open(txt_file, 'r', encoding='utf-8') as tf:
            text = tf.read().strip()
    pages_data.append({
        "pageNum": i,
        "image": f"pages/page_{i:03d}.jpg",
        "chineseText": text
    })

ENG_JSON = os.path.join(WORKSPACE, 'ebook_output', 'english_translation.json')
with open(ENG_JSON, 'r', encoding='utf-8') as ef:
    english_sections = json.load(ef)

bundle = {
    "title": "海南省文昌市 祝氏族谱",
    "englishTitle": "Hainan Wenchang Zhu Family Lineage",
    "totalPages": total_pages,
    "pages": pages_data,
    "englishSections": english_sections
}

with open(os.path.join(DATA_DIR, 'book_data.js'), 'w', encoding='utf-8') as f:
    f.write("window.BOOK_DATA = " + json.dumps(bundle, ensure_ascii=False) + ";\n")
print("Wrote book_data.js to assets/data/")

