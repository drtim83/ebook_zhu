import os
import shutil
import json

WORKSPACE = '/Users/drtimothytok/VibeCoding/Ebook'
OUTPUT_DIR = os.path.join(WORKSPACE, 'ebook_output')
CLEANED_DIR = os.path.join(OUTPUT_DIR, 'cleaned_pages')
RAW_DIR = os.path.join(OUTPUT_DIR, 'raw_pages')
OCR_DIR = os.path.join(OUTPUT_DIR, 'ocr_text')
NEW_SPREAD_SRC = os.path.join(CLEANED_DIR, 'temp_spread_82_83_clean.jpg')

# Shift pages from 95 down to 62 up by +1 to make room at 62
print("Shifting existing pages 62..95 to 63..96...")
for idx in range(95, 61, -1):
    old_c = os.path.join(CLEANED_DIR, f"page_{idx:03d}.jpg")
    new_c = os.path.join(CLEANED_DIR, f"page_{idx+1:03d}.jpg")
    if os.path.exists(old_c):
        os.rename(old_c, new_c)
        
    old_r = os.path.join(RAW_DIR, f"page_{idx:03d}.jpg")
    new_r = os.path.join(RAW_DIR, f"page_{idx+1:03d}.jpg")
    if os.path.exists(old_r):
        os.rename(old_r, new_r)
        
    old_t = os.path.join(OCR_DIR, f"page_{idx:03d}.txt")
    new_t = os.path.join(OCR_DIR, f"page_{idx+1:03d}.txt")
    if os.path.exists(old_t):
        os.rename(old_t, new_t)

# Install new page 62 (printed pages 82-83)
dest_clean = os.path.join(CLEANED_DIR, "page_062.jpg")
dest_raw = os.path.join(RAW_DIR, "page_062.jpg")
shutil.copy2(NEW_SPREAD_SRC, dest_clean)
shutil.copy2('/Users/drtimothytok/.gemini/antigravity-ide/brain/ddedff30-5f03-404c-a27c-e68f5bdab060/.user_uploaded/media_1789096436887.jpg', dest_raw)

page_62_text = """【祝氏族谱世系图 · 82-83页世系分支】
图系世谱族氏祝 | 籍昌文省南海 | 邰原太 | 82-83

【第82页世系】：
· 上承祖系：廷质子 ➔ 文旺 ➔ 天为
· 分支一：
  天为 ➔ 必起
  - 必起 ➔ 求仕 ➔ 66 有严
  - 必起 ➔ 求礼（出）
  - 必起 ➔ 求善 ➔ 67 有瑁（止）
  - 必起 ➔ 求礼（嗣） ➔ 68 有翼
· 分支二：
  天为 ➔ 必寿
  - 必寿 ➔ 求三（嗣） ➔ 69 有敏（嗣）
· 分支三：
  天为 ➔ 必龄
  - 必龄 ➔ 求三（出）
  - 必龄 ➔ 求福 ➔ 有敏（出）、70 有隆（殇）、71 有纪
  - 必龄 ➔ 求奇 ➔ 72 有惠
  - 必龄 ➔ 求彪 ➔ 73 有焕（殇）

【第83页世系】：
· 接天为公同辈分支：天华 ➔ 必恩
  - 必恩 ➔ 求爵 ➔ 74 有朋、75 有信（殇）、76 有觉
  - 必恩 ➔ 求仁（出）
  - 必恩 ➔ 求高 ➔ 77 有琰
  - 必恩 ➔ 求攀 ➔ 78 有恭、79 有简（出）、有登
· 第83页上方文弘公大支：
  廷质子同辈 ➔ 文弘 ➔ 天忠
  - 天忠 ➔ 必慧 ➔ 求仁（嗣） ➔ 80 有简（嗣）
  - 天忠 ➔ 必传（天宰次子，嗣） ➔ 求愈 ➔ 81 有璟（殇）、82 有能"""

with open(os.path.join(OCR_DIR, "page_062.txt"), "w", encoding="utf-8") as f:
    f.write(page_62_text)

print(f"Successfully inserted Page 62 (Printed Pages 82-83). Total pages now: 96.")
