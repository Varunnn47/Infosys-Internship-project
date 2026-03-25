x# AI Research Paper Summarizer and Insight Extractor

A full-stack application that extracts insights and generates summaries from research papers using AI-powered text processing.

## Features

- 📄 **PDF Upload**: Drag & drop or select PDF research papers
- ✍️ **Text Input**: Paste research paper text directly
- 🤖 **AI-Powered**: Uses Groq Llama-3.3-70b for enhanced summarization
- 🔍 **Vector Search**: FAISS for similarity search
- 📊 **Smart Insights**: Automatically extracts key findings
- 🎨 **Modern Dark UI**: Clean, responsive dark-themed interface
- 🔐 **User Authentication**: Secure login and signup system
- 💾 **User Accounts**: MongoDB database for user management
- 🔑 **JWT Authentication**: Secure token-based authentication
- 📥 **Export Results**: Copy or download analysis results

## Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **Groq Llama-3.3-70b**: Advanced AI summarization
- **PyMuPDF**: PDF text extraction
- **Sentence Transformers**: Text embeddings (all-MiniLM-L6-v2)
- **FAISS**: Vector similarity search
- **MongoDB**: Database for user management and analysis history
- **JWT**: Secure authentication
- **Passlib**: Password hashing
- **NumPy**: Numerical operations

### Frontend
- **HTML5**: Structure
- **CSS3**: Modern styling with gradients
- **Vanilla JavaScript**: No frameworks, pure JS

## Project Structure

```
AI-Research-Summarizer/
│
├── backend/
│   ├── app.py              # FastAPI application
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── index.html         # Main HTML page
│   ├── style.css          # Styling
│   └── script.js          # Frontend logic
│
└── README.md              # This file
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Step 1: Create Virtual Environment

**Windows:**
```bash
cd c:\Users\Kulad\OneDrive\Desktop\varun\ai-s
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
cd /path/to/ai-s
python3 -m venv venv
source venv/bin/activate
```

✅ You should see `(venv)` at the start of your command prompt.

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cd backend
copy .env.example .env
```

Edit `.env` and add your Groq API key:
```
GROQ_API_KEY=your-groq-api-key-here
SECRET_KEY=your-secret-key-here
MONGO_URL=your-mongodb-connection-string
```

**Get Groq API Key:**
1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Create new API key
3. Copy and paste into `.env` file

### Step 3: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

⏳ This will take a few minutes (downloads ~2GB of packages including PyTorch, Transformers, etc.)

### Step 4: Run the FastAPI Server

```bash
uvicorn app:app --reload
```

The backend will start at: `http://127.0.0.1:8000`

### Step 5: Open the Frontend

Open `frontend/login.html` in your web browser to start.

Or use a local server:
```bash
cd ../frontend
python -m http.server 8080
```

Then visit: `http://localhost:8080/login.html`

## Usage

### First Time
1. Open `login.html` in browser
2. Click "Sign up" to create an account
3. Fill in username, email, and password
4. Login with your credentials

### Upload and Analyze

### Option 1: Upload PDF
1. Drag and drop a PDF file onto the upload area
2. Or click "Choose File" to select a PDF
3. Click "Generate Summary"

### Option 2: Paste Text
1. Paste your research paper text into the text area
2. Click "Generate Summary"

### Results
- **Summary**: Condensed overview of the paper
- **Key Insights**: Bullet points of important findings

## API Endpoints

### POST /upload
Upload a PDF file for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: PDF file

**Response:**
```json
{
  "summary": "Summary text...",
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3"
  ]
}
```

### POST /summarize
Process text directly.

**Request:**
```json
{
  "text": "Your research paper text..."
}
```

**Response:**
```json
{
  "summary": "Summary text...",
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3"
  ]
}
```

### GET /
Health check endpoint.

## Example API Request

### Using cURL:

```bash
# Upload PDF
curl -X POST "http://127.0.0.1:8000/upload" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@research_paper.pdf"

# Summarize Text
curl -X POST "http://127.0.0.1:8000/summarize" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your research paper text here..."}'
```

### Using Python:

```python
import requests

# Upload PDF
with open('research_paper.pdf', 'rb') as f:
    response = requests.post(
        'http://127.0.0.1:8000/upload',
        files={'file': f}
    )
    print(response.json())

# Summarize Text
response = requests.post(
    'http://127.0.0.1:8000/summarize',
    json={'text': 'Your research paper text...'}
)
print(response.json())
```

## How It Works

1. **Text Extraction**: PyMuPDF extracts text from PDF files
2. **Text Cleaning**: Removes extra whitespace and special characters
3. **Chunking**: Splits text into manageable chunks (400 words)
4. **Embeddings**: Converts chunks to vector embeddings using Sentence Transformers
5. **Vector Storage**: Stores embeddings in FAISS index for similarity search
6. **AI Summarization**: Uses Groq Llama-3.3-70b for intelligent summary generation
7. **Insight Extraction**: AI-powered extraction of key findings and contributions

## Configuration

### Chunk Size
Modify in `backend/app.py`:
```python
def chunk_text(text: str, chunk_size: int = 400):
```

### Model Selection
Change the embedding model:
```python
model = SentenceTransformer('all-MiniLM-L6-v2')
```

Other options:
- `all-mpnet-base-v2` (better quality, slower)
- `paraphrase-MiniLM-L6-v2` (paraphrase detection)

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure the backend CORS middleware is properly configured in `app.py`.

### Model Download
On first run, Sentence Transformers will download the model (~80MB). This is normal.

### Port Already in Use
If port 8000 is busy, run:
```bash
uvicorn app:app --reload --port 8001
```

Update `API_URL` in `frontend/script.js` accordingly.

## Performance

- **PDF Processing**: ~2-5 seconds for typical papers
- **Text Processing**: ~1-3 seconds
- **Model Loading**: ~2-3 seconds (first time only)

## Limitations

- PDF must contain extractable text (not scanned images)
- Best results with English language papers
- Summary quality depends on paper structure

## Future Enhancements

- [ ] Multi-language support
- [ ] OCR for scanned PDFs
- [ ] Advanced citation network visualization
- [ ] Research timeline and trend analysis
- [ ] Collaborative research features
- [ ] Integration with reference managers
- [ ] Advanced search and filtering

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

For issues or questions, please open an issue on GitHub.
