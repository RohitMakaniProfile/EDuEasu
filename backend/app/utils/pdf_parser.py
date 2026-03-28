import fitz  # PyMuPDF


def parse_pdf(file_path: str) -> str:
    """Extract all text from a PDF file."""
    text = ""
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            text += f"\n--- Page {page_num + 1} ---\n"
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"Error parsing PDF {file_path}: {e}")
    return text.strip()
