from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from groq import Groq
import fitz
from docx import Document as DocxDocument
import re
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import os
import time
import io
import smtplib
from email.mime.text import MIMEText
from datetime import timedelta
from dotenv import load_dotenv

from database import (
    get_user_by_username, get_user_by_email, create_user,
    save_analysis, get_history, get_analysis_by_id,
    update_rating, update_note, delete_analysis,
    update_tags, update_folder, get_user_tags, get_user_folders,
    save_faiss_cache, load_faiss_cache, update_reading_stats, increment_open_count,
    users_collection, history_collection  # Import the collections
)
from auth import (
    get_password_hash, verify_password,
    create_access_token, get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

app = FastAPI(title="AI Research Paper Summarizer API")

# Configure CORS
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "file://",
    "null",
]

# Add production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')
model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer(MODEL_PATH)
    return model

# In-memory FAISS store per user session
faiss_store = {}

# ── Pydantic Models ──
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: Optional[str] = None

class TextInput(BaseModel):
    text: str

class ChatInput(BaseModel):
    question: str
    context: str

class CompareExportInput(BaseModel):
    title1: str
    title2: str
    comparison: str

class CompareInput(BaseModel):
    text1: str
    text2: str
    title1: Optional[str] = "Paper 1"
    title2: Optional[str] = "Paper 2"

class RatingInput(BaseModel):
    analysis_id: str
    rating: int

class NoteInput(BaseModel):
    analysis_id: str
    note: str

class EmailInput(BaseModel):
    analysis_id: str
    email: str

class ReadingStatsInput(BaseModel):
    analysis_id: str
    reading_time: int
    open_count: int

class UserResponse(BaseModel):
    id: str
    username: str
    email: str

# ── Helpers ──
def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return "".join(page.get_text() for page in doc)

def extract_text_from_docx(docx_bytes: bytes) -> str:
    doc = DocxDocument(io.BytesIO(docx_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    if filename.endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    elif filename.endswith('.docx'):
        return extract_text_from_docx(file_bytes)
    raise ValueError("Unsupported file type")

def clean_text(text: str) -> str:
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove page numbers and headers/footers
    text = re.sub(r'\b(?:Page|p\.|pp\.)\s*\d+\b', '', text, flags=re.IGNORECASE)
    
    # Remove URLs and DOIs
    text = re.sub(r'https?://\S+|doi:\S+', '', text)
    
    # Remove excessive punctuation but keep important ones
    text = re.sub(r'[^\w\s.,!?;:()\-\[\]"\']', ' ', text)
    
    # Remove standalone numbers and short fragments
    text = re.sub(r'\b\d+\b(?!\s*[a-zA-Z])', '', text)
    
    # Clean up multiple spaces again
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

def chunk_text(text: str, chunk_size: int = 400) -> List[str]:
    # Split by sentences first for better semantic chunks
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        sentence_length = len(sentence.split())
        
        # If adding this sentence would exceed chunk size, save current chunk
        if current_length + sentence_length > chunk_size and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentence]
            current_length = sentence_length
        else:
            current_chunk.append(sentence)
            current_length += sentence_length
    
    # Add the last chunk
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    # Filter out very short chunks
    chunks = [chunk for chunk in chunks if len(chunk.split()) >= 20]
    
    return chunks

def generate_embeddings(chunks: List[str]) -> np.ndarray:
    return np.array(get_model().encode(chunks)).astype('float32')

def build_faiss_index(embeddings: np.ndarray) -> faiss.IndexFlatL2:
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    return index

def groq_chat(system: str, user: str, max_tokens: int = 400) -> Optional[str]:
    key = os.getenv("GROQ_API_KEY", "")
    print(f"Groq key found: {bool(key)}, key starts with: {key[:10] if key else 'NONE'}")
    if not key or key == "your_groq_api_key_here":
        print("Groq key missing or placeholder")
        return None
    try:
        client = Groq(api_key=key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq error: {e}")
        return None

def generate_summary(chunks: List[str]) -> str:
    if not chunks:
        return "No content to summarize."
    
    # Combine first few chunks for context
    text_sample = " ".join(chunks[:5])[:3000]  # Use more chunks, limit to 3000 chars
    
    # Try Groq AI first for better summarization
    ai_summary = groq_chat(
        "You are an expert research paper summarizer. Create a concise, well-structured summary in exactly 3-4 sentences. Focus on: 1) What the research is about, 2) How it was conducted, 3) Key findings, 4) Main conclusion. Write in clear, simple language without repetition.",
        f"Create a concise 3-4 sentence summary of this research paper:\n\n{text_sample}",
        max_tokens=200
    )
    
    if ai_summary:
        # Clean the AI response
        clean_summary = ai_summary.strip()
        # Remove any remaining markdown
        clean_summary = clean_summary.replace('**', '').replace('*', '')
        # Remove excessive line breaks and normalize spaces
        clean_summary = ' '.join(clean_summary.split())
        
        # Ensure it's not too long (max 4 sentences)
        sentences = [s.strip() + '.' for s in clean_summary.split('.') if s.strip()]
        if len(sentences) > 4:
            sentences = sentences[:4]
        
        return ' '.join(sentences)
    
    # Fallback: Extract key sentences
    sentences = [s.strip() for s in text_sample.split('.') if len(s.strip()) > 50]
    key_sentences = []
    
    # Look for important sentences
    important_words = ['abstract', 'introduction', 'conclusion', 'result', 'finding', 'propose', 'demonstrate', 'show', 'significant']
    
    for sentence in sentences:
        if any(word in sentence.lower() for word in important_words):
            key_sentences.append(sentence + '.')
            if len(key_sentences) >= 3:
                break
    
    if key_sentences:
        return ' '.join(key_sentences)
    
    # Final fallback - just first 2 sentences
    return '. '.join(sentences[:2]) + '.' if len(sentences) >= 2 else (sentences[0] + '.' if sentences else "Summary not available.")

def extract_insights(chunks: List[str]) -> List[str]:
    if not chunks:
        return ["No insights available."]
    
    # Combine chunks for analysis
    full_text = " ".join(chunks[:8])[:4000]  # Use more chunks for better insights
    
    # Try Groq AI for intelligent insight extraction
    ai_insights = groq_chat(
        "You are an expert at extracting key insights from research papers. Extract 5 specific, actionable insights that highlight the most important findings, contributions, and implications.",
        f"Extract key insights from this research paper:\n\n{full_text}",
        max_tokens=400
    )
    
    if ai_insights:
        # Parse AI response into list
        insights_list = []
        for line in ai_insights.split('\n'):
            line = line.strip()
            # Remove numbering and bullet points
            line = re.sub(r'^[\d\-\*\•]+[\.)\s]*', '', line)
            if len(line) > 20 and not line.startswith('Key insights') and not line.startswith('Insights'):
                insights_list.append(line)
                if len(insights_list) >= 5:
                    break
        
        if insights_list:
            return insights_list
    
    # Fallback: Rule-based extraction
    keywords = ['result', 'conclusion', 'finding', 'significant', 'important', 'novel', 'propose', 'demonstrate', 'show', 'achieve', 'discover', 'reveal', 'indicate', 'suggest']
    insights = []
    
    for chunk in chunks:
        sentences = [s.strip() for s in chunk.split('.') if len(s.strip()) > 30]
        for sentence in sentences:
            if any(k in sentence.lower() for k in keywords):
                # Clean up the sentence
                clean_sentence = sentence.strip()
                if len(clean_sentence) > 50 and clean_sentence not in insights:
                    insights.append(clean_sentence + '.' if not clean_sentence.endswith('.') else clean_sentence)
                    if len(insights) >= 5:
                        return insights
    
    return insights[:5] if insights else ["Key research findings and contributions identified from the paper."]

def extract_citations(text: str) -> List[str]:
    citations = []
    
    # Pattern 1: [1], [2,3], [1-5] style citations
    bracket_citations = re.findall(r'\[[\d,\s\-]+\][^.]*\.', text)
    citations.extend(bracket_citations[:5])
    
    # Pattern 2: (Author, Year) style citations
    author_year = re.findall(r'\([A-Z][a-z]+(?:\s+et\s+al\.)?[,\s]+\d{4}[a-z]?\)[^.]*\.', text)
    citations.extend(author_year[:3])
    
    # Pattern 3: Author (Year) style
    author_year2 = re.findall(r'[A-Z][a-z]+(?:\s+et\s+al\.)?\s+\(\d{4}[a-z]?\)[^.]*\.', text)
    citations.extend(author_year2[:3])
    
    # Pattern 4: References section
    ref_patterns = re.findall(r'(?:References?|Bibliography)([\s\S]*?)(?:\n\n|$)', text, re.IGNORECASE)
    if ref_patterns:
        ref_text = ref_patterns[0][:1000]  # Limit reference text
        ref_lines = [line.strip() for line in ref_text.split('\n') if len(line.strip()) > 30]
        citations.extend(ref_lines[:5])
    
    # Clean and deduplicate
    clean_citations = []
    for cite in citations:
        cite = cite.strip()
        if len(cite) > 20 and cite not in clean_citations:
            clean_citations.append(cite)
            if len(clean_citations) >= 8:
                break
    
    return clean_citations

def detect_abstract(text: str) -> bool:
    return len(text.split()) < 300

def process_text(text: str, title: str, username: str, tags: list = None, folder: str = "") -> dict:
    start = time.time()
    cleaned = clean_text(text)
    chunks = chunk_text(cleaned)
    embeddings = generate_embeddings(chunks)
    index = build_faiss_index(embeddings)
    faiss_store[username] = {"index": index, "chunks": chunks}

    summary = generate_summary(chunks)
    insights = extract_insights(chunks)
    citations = extract_citations(cleaned)
    word_count = len(cleaned.split())
    processing_time = round(time.time() - start, 2)
    is_abstract = detect_abstract(text)

    analysis_id = save_analysis(username, title, summary, insights, word_count, citations, processing_time, tags, folder)
    
    # Save FAISS cache to MongoDB
    save_faiss_cache(analysis_id, chunks, embeddings)

    return {
        "analysis_id": analysis_id,
        "summary": summary,
        "insights": insights,
        "citations": citations,
        "word_count": word_count,
        "processing_time": processing_time,
        "is_abstract_only": is_abstract,
        "warning": "This looks like only an abstract. Upload the full paper for better results." if is_abstract else None
    }

# ── Auth Endpoints ──
@app.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate):
    try:
        # Check if database is available
        if users_collection is None:
            raise HTTPException(status_code=503, detail="Database not available. Please check MongoDB connection.")
            
        if get_user_by_email(user.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if get_user_by_username(user.username):
            raise HTTPException(status_code=400, detail="Username already taken")
        hashed = get_password_hash(user.password)
        new_user = create_user(user.username, user.email, hashed)
        return {"id": new_user["id"], "username": new_user["username"], "email": new_user["email"]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        # Check if database is available
        if users_collection is None:
            raise HTTPException(status_code=503, detail="Database not available. Please check MongoDB connection.")
            
        print(f"Login attempt for: {form_data.username}")
        
        # Try to find user by email first, then username
        user = get_user_by_email(form_data.username)
        if not user:
            user = get_user_by_username(form_data.username)
            
        if not user:
            print(f"User not found: {form_data.username}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
            
        if not verify_password(form_data.password, user["hashed_password"]):
            print(f"Invalid password for user: {form_data.username}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
            
        token = create_access_token({"sub": user["username"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        print(f"Login successful for: {user['username']}")
        return {"access_token": token, "token_type": "bearer", "username": user["username"]}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"id": str(current_user["_id"]), "username": current_user["username"], "email": current_user["email"]}

# ── Analysis Endpoints ──
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not (file.filename.endswith('.pdf') or file.filename.endswith('.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
    file_bytes = await file.read()
    text = extract_text_from_file(file_bytes, file.filename)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text found in file")
    return process_text(text, file.filename, current_user["username"])

@app.post("/summarize")
async def summarize_text(input_data: TextInput, current_user: dict = Depends(get_current_user)):
    if not input_data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return process_text(input_data.text, "Pasted Text", current_user["username"])

# ── Feature 1: Chat with Paper ──
@app.post("/chat")
async def chat_with_paper(data: ChatInput, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    rag_context = data.context
    
    # Try to load from in-memory cache first
    if username in faiss_store:
        store = faiss_store[username]
        query_embedding = np.array(get_model().encode([data.question])).astype('float32')
        _, indices = store["index"].search(query_embedding, k=5)
        relevant_chunks = [store["chunks"][i] for i in indices[0] if i < len(store["chunks"])]
        rag_context = " ".join(relevant_chunks)
    else:
        # Try to load from MongoDB cache (for persistent storage)
        # This would require analysis_id - for now use fallback context
        pass

    answer = groq_chat(
        "You are a research paper assistant. Answer questions based only on the provided paper context. Be concise and accurate.",
        f"Paper context:\n{rag_context[:4000]}\n\nQuestion: {data.question}",
        max_tokens=300
    )
    if answer:
        return {"answer": answer}
    sentences = [s.strip() for s in rag_context.split('.') if len(s.strip()) > 30]
    matches = [s for s in sentences if any(w in s.lower() for w in data.question.lower().split() if len(w) > 3)]
    if matches:
        return {"answer": ' '.join(matches[:3]) + '.'}
    return {"answer": "I couldn't find a specific answer in the paper. Try rephrasing your question."}

# ── Feature 2: History ──
@app.get("/history")
async def get_user_history(current_user: dict = Depends(get_current_user)):
    return get_history(current_user["username"])

@app.get("/history/{analysis_id}")
async def get_single_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    doc = get_analysis_by_id(analysis_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return doc

@app.delete("/history/{analysis_id}")
async def delete_history_item(analysis_id: str, current_user: dict = Depends(get_current_user)):
    delete_analysis(analysis_id)
    return {"message": "Deleted"}

# ── Feature 4: Rating & Notes ──
@app.post("/rate")
async def rate_analysis(data: RatingInput, current_user: dict = Depends(get_current_user)):
    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    update_rating(data.analysis_id, data.rating)
    return {"message": "Rating saved"}

@app.post("/note")
async def save_note(data: NoteInput, current_user: dict = Depends(get_current_user)):
    update_note(data.analysis_id, data.note)
    return {"message": "Note saved"}

# ── Extract text from PDF for compare ──
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not (file.filename.endswith('.pdf') or file.filename.endswith('.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
    file_bytes = await file.read()
    text = extract_text_from_file(file_bytes, file.filename)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text found in file")
    return {"text": clean_text(text), "filename": file.filename}

# ── Feature 5: Compare Papers ──
@app.post("/compare")
async def compare_papers(data: CompareInput, current_user: dict = Depends(get_current_user)):
    result = groq_chat(
        "You are a research paper comparison expert.",
        f"Compare these two research papers:\n\n{data.title1}:\n{data.text1[:2000]}\n\n{data.title2}:\n{data.text2[:2000]}\n\nProvide: similarities, differences, and which is more comprehensive.",
        max_tokens=500
    )
    if result:
        return {"comparison": result, "title1": data.title1, "title2": data.title2}
    words1 = set(data.text1.lower().split())
    words2 = set(data.text2.lower().split())
    overlap = round(len(words1 & words2) / max(len(words1 | words2), 1) * 100, 1)
    return {
        "comparison": f"Basic Comparison:\n\n{data.title1}: {len(words1)} words\n{data.title2}: {len(words2)} words\n\nWord overlap: {overlap}%",
        "title1": data.title1,
        "title2": data.title2
    }

@app.post("/export-compare")
async def export_compare(data: CompareExportInput, current_user: dict = Depends(get_current_user)):
    pdf_doc = fitz.open()
    page = pdf_doc.new_page()
    y = 50
    page.insert_text((50, y), "ResearchAI - Paper Comparison Report", fontsize=18, color=(0.54, 0.36, 0.96))
    y += 30
    page.insert_text((50, y), f"{data.title1}  vs  {data.title2}", fontsize=11, color=(0.5, 0.5, 0.5))
    y += 30
    page.insert_text((50, y), "COMPARISON", fontsize=14, color=(0.54, 0.36, 0.96))
    y += 20

    # Word wrap comparison text
    for para in data.comparison.split('\n'):
        words = para.split()
        if not words:
            y += 10
            continue
        line = []
        for word in words:
            line.append(word)
            if len(' '.join(line)) > 85:
                page.insert_text((50, y), ' '.join(line[:-1]), fontsize=10)
                y += 15
                line = [word]
                if y > 780:
                    page = pdf_doc.new_page()
                    y = 50
        if line:
            page.insert_text((50, y), ' '.join(line), fontsize=10)
            y += 15
            if y > 780:
                page = pdf_doc.new_page()
                y = 50

    buf = io.BytesIO()
    try:
        pdf_doc.save(buf)
        buf.seek(0)
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": "attachment; filename=comparison.pdf"})
    except Exception:
        buf.close()
        raise

@app.post("/reading-stats")
async def update_reading_stats_endpoint(data: ReadingStatsInput, current_user: dict = Depends(get_current_user)):
    update_reading_stats(data.analysis_id, data.reading_time, data.open_count)
    return {"message": "Reading stats updated"}

@app.post("/increment-open/{analysis_id}")
async def increment_open_endpoint(analysis_id: str, current_user: dict = Depends(get_current_user)):
    increment_open_count(analysis_id)
    return {"message": "Open count incremented"}

# ── Feature 6: Email Summary ──
@app.post("/email-summary")
async def email_summary(data: EmailInput, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    doc = get_analysis_by_id(data.analysis_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    background_tasks.add_task(send_email, data.email, doc)
    return {"message": f"Summary sent to {data.email}"}

def send_email(to_email: str, doc: dict):
    try:
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")
        if not smtp_user or not smtp_pass:
            print("SMTP not configured")
            return
        body = f"ResearchAI Analysis: {doc['title']}\n\nSUMMARY:\n{doc['summary']}\n\nKEY INSIGHTS:\n" + \
               "\n".join(f"{i+1}. {ins}" for i, ins in enumerate(doc['insights']))
        msg = MIMEText(body)
        msg['Subject'] = f"ResearchAI: {doc['title']}"
        msg['From'] = smtp_user
        msg['To'] = to_email
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except Exception as e:
        print(f"Email error: {e}")

# ── Feature 3: Export PDF ──
@app.get("/export/{analysis_id}")
async def export_pdf(analysis_id: str, current_user: dict = Depends(get_current_user)):
    doc = get_analysis_by_id(analysis_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")

    pdf_doc = fitz.open()
    page = pdf_doc.new_page()
    y = 50
    page.insert_text((50, y), "ResearchAI Analysis Report", fontsize=18, color=(0.54, 0.36, 0.96))
    y += 30
    page.insert_text((50, y), f"Title: {doc['title']}", fontsize=12)
    y += 20
    page.insert_text((50, y), f"Words: {doc.get('word_count', 0)}  |  Time: {doc.get('processing_time', 0)}s", fontsize=10, color=(0.5, 0.5, 0.5))
    y += 30
    page.insert_text((50, y), "SUMMARY", fontsize=14, color=(0.54, 0.36, 0.96))
    y += 20

    words = doc['summary'].split()
    line, lines = [], []
    for word in words:
        line.append(word)
        if len(' '.join(line)) > 80:
            lines.append(' '.join(line[:-1]))
            line = [word]
    if line:
        lines.append(' '.join(line))
    for l in lines:
        page.insert_text((50, y), l, fontsize=10)
        y += 15

    y += 15
    page.insert_text((50, y), "KEY INSIGHTS", fontsize=14, color=(0.54, 0.36, 0.96))
    y += 20
    for i, insight in enumerate(doc['insights']):
        page.insert_text((50, y), f"{i+1}. {insight[:100]}", fontsize=10)
        y += 18

    if doc.get('citations'):
        y += 15
        page.insert_text((50, y), "CITATIONS", fontsize=14, color=(0.54, 0.36, 0.96))
        y += 20
        for cite in doc['citations'][:5]:
            page.insert_text((50, y), f"• {cite[:100]}", fontsize=9)
            y += 15

    buf = io.BytesIO()
    try:
        pdf_doc.save(buf)
        buf.seek(0)
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": f"attachment; filename=analysis-{analysis_id}.pdf"})
    except Exception:
        buf.close()
        raise

@app.get("/")
async def root():
    return {"message": "AI Research Paper Summarizer API"}
