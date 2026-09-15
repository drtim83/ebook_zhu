import os
import zipfile
import json
import xml.etree.ElementTree as ET

DOCX_PATH = '/Users/drtimothytok/Downloads/Zhu Lineage Book - English Edition.docx'
OUT_JSON = '/Users/drtimothytok/VibeCoding/Ebook/ebook_output/english_translation.json'
OUT_MD = '/Users/drtimothytok/VibeCoding/Ebook/ebook_output/Zhu_Family_Lineage_English_Edition.md'

def extract_english():
    with zipfile.ZipFile(DOCX_PATH, 'r') as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = tree.findall('.//w:p', ns)
        
        sections = []
        current_section = {"title": "Introduction", "paragraphs": []}
        
        all_md_lines = ["# Hainan Wenchang Zhu Family Lineage (English Edition)\n"]
        
        for p in paragraphs:
            # Check style or text
            p_text = ''.join(p.itertext()).strip()
            if not p_text:
                continue
                
            # Check if this paragraph is a major heading
            is_heading = False
            if p_text.startswith("Part ") or p_text.startswith("Introduction:") or p_text.startswith("Chapter ") or p_text.startswith("Section "):
                is_heading = True
            elif len(p_text) < 70 and ("Lineage" in p_text or "Ancestor" in p_text or "Generation" in p_text) and not p_text.endswith("."):
                is_heading = True
                
            if is_heading:
                if current_section["paragraphs"]:
                    sections.append(current_section)
                current_section = {"title": p_text, "paragraphs": []}
                all_md_lines.append(f"\n## {p_text}\n")
            else:
                current_section["paragraphs"].append(p_text)
                all_md_lines.append(p_text + "\n")
                
        if current_section["paragraphs"]:
            sections.append(current_section)
            
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)
        
    with open(OUT_MD, 'w', encoding='utf-8') as f:
        f.writelines(all_md_lines)
        
    print(f"Extracted {len(sections)} sections to {OUT_JSON}")
    print(f"Saved complete English markdown to {OUT_MD}")

if __name__ == '__main__':
    extract_english()
