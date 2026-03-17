import fitz

doc = fitz.open("PRD_Finalpdf.pdf")
text = ""
for page in doc:
    text += page.get_text()

with open("PRD_Finalpdf_extracted.txt", "w", encoding="utf-8") as f:
    f.write(text)
