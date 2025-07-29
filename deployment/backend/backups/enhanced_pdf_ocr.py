"""
Enhanced PDF processing with OCR fallback
This approach converts PDF pages to images and uses OCR for text extraction
"""
import base64
import io
import fitz  # PyMuPDF
from PIL import Image
import logging

logger = logging.getLogger(__name__)

async def _extract_from_pdf_with_ocr(self, base64_data: str) -> str:
    """Extract text from PDF using OCR (handles both text-based and image-based PDFs)"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decode base64 PDF
        pdf_data = base64.b64decode(base64_data)
        
        # First, try traditional text extraction
        text_extracted = ""
        try:
            pdf_file = io.BytesIO(pdf_data)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            for page in pdf_reader.pages:
                text_extracted += page.extract_text() + "\n"
                
            # If we got substantial text, use it
            if text_extracted and len(text_extracted.strip()) > 100:
                logger.info("Successfully extracted text from PDF using PyPDF2")
                return text_extracted
                
        except Exception as e:
            logger.warning(f"PyPDF2 text extraction failed: {e}")
        
        # If text extraction failed or gave minimal results, use OCR
        logger.info("Falling back to OCR for PDF processing")
        
        # Convert PDF pages to images and use OCR
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        all_text = ""
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Convert page to image
            mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR quality
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to base64 for OCR service
            img_base64 = base64.b64encode(img_data).decode('utf-8')
            
            # Use OCR service
            try:
                page_text = await self._extract_from_image(f"data:image/png;base64,{img_base64}")
                all_text += f"--- PAGE {page_num + 1} ---\n{page_text}\n\n"
            except Exception as e:
                logger.warning(f"OCR failed for page {page_num + 1}: {e}")
                continue
        
        doc.close()
        
        if not all_text or len(all_text.strip()) < 20:
            raise ValueError("Could not extract text from PDF using either PyPDF2 or OCR")
        
        logger.info(f"Successfully extracted text from PDF using OCR ({len(all_text)} characters)")
        return all_text
        
    except Exception as e:
        logger.error(f"Error extracting from PDF with OCR: {e}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


async def _extract_from_pdf_ocr_only(self, base64_data: str) -> str:
    """Extract text from PDF using OCR only (more consistent approach)"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decode base64 PDF
        pdf_data = base64.b64decode(base64_data)
        
        # Convert PDF pages to images and use OCR
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        all_text = ""
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Convert page to image with high quality
            mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR quality
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Convert to base64 for OCR service
            img_base64 = base64.b64encode(img_data).decode('utf-8')
            
            # Use OCR service
            try:
                page_text = await self._extract_from_image(f"data:image/png;base64,{img_base64}")
                all_text += f"--- PAGE {page_num + 1} ---\n{page_text}\n\n"
                logger.info(f"Successfully processed page {page_num + 1} with OCR")
            except Exception as e:
                logger.warning(f"OCR failed for page {page_num + 1}: {e}")
                continue
        
        doc.close()
        
        if not all_text or len(all_text.strip()) < 20:
            raise ValueError("Could not extract text from PDF using OCR")
        
        logger.info(f"Successfully extracted text from PDF using OCR only ({len(all_text)} characters)")
        return all_text
        
    except Exception as e:
        logger.error(f"Error extracting from PDF with OCR: {e}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")
