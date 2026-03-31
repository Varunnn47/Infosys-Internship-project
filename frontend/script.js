// Detect environment and set API URL
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://iip-e723.onrender.com';

// ── Auth guard ──
const token = localStorage.getItem('access_token');
if (!token) {
    window.location.href = 'login.html';
    // Stop execution if redirecting
    throw new Error('No token, redirecting to login');
}

document.getElementById('usernameDisplay').textContent = localStorage.getItem('username') || '';

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
});

// ── Toast ──
function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Tab switching ──
function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navEl = document.getElementById(`nav-${name}`);
    if (navEl) navEl.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'history') loadHistory();
}

// Click brand to go to analyze
document.querySelector('.brand').addEventListener('click', () => showTab('analyze'));

// ── State ──
let selectedFile = null;
let resultsData  = null;
let currentAnalysisId = null;
let currentContext = '';
let startTime = null;
let readingStartTime = null;
let totalReadingTime = 0;

// ── Elements ──
const dropZone   = document.getElementById('dropZone');
const fileInput  = document.getElementById('fileInput');
const textInput  = document.getElementById('textInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn   = document.getElementById('clearBtn');
const results    = document.getElementById('results');
const dropText   = document.getElementById('dropText');
const charCount  = document.getElementById('charCount');

// ── Char counter ──
textInput.addEventListener('input', () => {
    charCount.textContent = textInput.value.length.toLocaleString();
    toggleClear();
});

function toggleClear() {
    clearBtn.style.display = (selectedFile || textInput.value.trim()) ? 'block' : 'none';
}

// ── Drag & Drop ──
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('over');
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf' || file?.name?.endsWith('.docx')) setFile(file);
    else toast('Please drop a PDF or DOCX file', 'error');
});

dropZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL' && e.target !== fileInput) fileInput.click();
});
fileInput.addEventListener('change', (e) => { if (e.target.files[0]) setFile(e.target.files[0]); });

function setFile(file) {
    selectedFile = file;
    dropText.innerHTML = `<strong style="color:#10b981">✓ ${file.name}</strong>`;
    toggleClear();
}

// ── Clear ──
clearBtn.addEventListener('click', () => {
    selectedFile = null;
    textInput.value = '';
    fileInput.value = '';
    charCount.textContent = '0';
    dropText.textContent = 'Drag & Drop PDF here';
    results.style.display = 'none';
    clearBtn.style.display = 'none';
    document.getElementById('abstractWarning').style.display = 'none';
    document.getElementById('chatToggle').style.display = 'none';
    document.getElementById('chatWidget').style.display = 'none';
    document.getElementById('chatWidgetMessages').innerHTML = '';
    clearQAMessages();
    resetProgress();
});

// ── Progress Bar ──
const steps = ['ps1','ps2','ps3','ps4','ps5'];
const stepPct = [10, 30, 55, 75, 95];

function setProgress(stepIdx) {
    steps.forEach((id, i) => {
        const el = document.getElementById(id);
        if (i < stepIdx) el.className = 'p-step done';
        else if (i === stepIdx) el.className = 'p-step active';
        else el.className = 'p-step';
    });
    document.getElementById('progressFill').style.width = stepPct[stepIdx] + '%';
}

function resetProgress() {
    document.getElementById('progressWrap').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
    steps.forEach(id => document.getElementById(id).className = 'p-step');
}

function completeProgress() {
    steps.forEach(id => document.getElementById(id).className = 'p-step done');
    document.getElementById('progressFill').style.width = '100%';
    setTimeout(resetProgress, 1500);
}

// ── Analyze ──
analyzeBtn.addEventListener('click', async () => {
    const text = textInput.value.trim();
    if (!selectedFile && !text) { toast('Please upload a PDF or paste text', 'error'); return; }
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) { toast('File must be under 10MB', 'error'); return; }

    analyzeBtn.disabled = true;
    document.getElementById('progressWrap').style.display = 'block';
    results.style.display = 'none';
    document.getElementById('abstractWarning').style.display = 'none';
    startTime = Date.now();

    // Simulate progress steps
    setProgress(0);
    const progressInterval = setInterval(() => {}, 500);

    try {
        setProgress(0);
        await sleep(300);
        setProgress(1);
        await sleep(300);
        setProgress(2);

        const data = selectedFile ? await uploadPDF(selectedFile) : await summarizeText(text);

        setProgress(3);
        await sleep(300);
        setProgress(4);
        await sleep(300);
        completeProgress();

        resultsData = data;
        currentAnalysisId = data.analysis_id;
        totalReadingTime = data.reading_time || 0;
        currentContext = text || '';
        showResults(data);
    } catch (err) {
        toast(err.message, 'error');
        resetProgress();
    } finally {
        clearInterval(progressInterval);
        analyzeBtn.disabled = false;
    }
});

// ── Enhanced Loading States ──
function showLoadingState(element, message = 'Loading...') {
    const originalContent = element.innerHTML;
    element.dataset.originalContent = originalContent;
    element.innerHTML = `<div class="loading-content"><div class="spinner-small"></div><span>${message}</span></div>`;
    element.disabled = true;
}

function hideLoadingState(element) {
    if (element.dataset.originalContent) {
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
    }
    element.disabled = false;
}

// ── Enhanced Error Handling ──
function handleApiError(error, context = '') {
    console.error(`API Error ${context}:`, error);
    
    if (error.status === 401) {
        toast('Session expired. Please login again.', 'error');
        logout();
        return;
    }
    
    if (error.status === 429) {
        toast('Too many requests. Please wait a moment.', 'warning');
        return;
    }
    
    const message = error.detail || error.message || 'An unexpected error occurred';
    toast(message, 'error');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function uploadPDF(file) {
    const form = new FormData();
    form.append('file', file);
    try {
        const res = await fetch(`${API}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) { 
            const e = await res.json().catch(() => ({detail: 'Upload failed'})); 
            throw new Error(e.detail || 'Upload failed'); 
        }
        return res.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please make sure the backend is running.');
        }
        throw error;
    }
}

async function summarizeText(text) {
    try {
        const res = await fetch(`${API}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text })
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) { 
            const e = await res.json().catch(() => ({detail: 'Processing failed'})); 
            throw new Error(e.detail || 'Processing failed'); 
        }
        return res.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Please make sure the backend is running.');
        }
        throw error;
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function showResults(data) {
    // Abstract warning
    if (data.is_abstract_only) {
        document.getElementById('abstractWarning').style.display = 'block';
    }

    // Clean and display summary
    const summaryElement = document.getElementById('summaryText');
    if (summaryElement) {
        let cleanSummary = data.summary || 'No summary available.';
        
        // Decode HTML entities
        cleanSummary = cleanSummary.replace(/&#39;/g, "'");
        cleanSummary = cleanSummary.replace(/&quot;/g, '"');
        cleanSummary = cleanSummary.replace(/&amp;/g, '&');
        cleanSummary = cleanSummary.replace(/&lt;/g, '<');
        cleanSummary = cleanSummary.replace(/&gt;/g, '>');
        
        // Remove excessive markdown formatting
        cleanSummary = cleanSummary.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove **bold**
        cleanSummary = cleanSummary.replace(/\*(.*?)\*/g, '$1'); // Remove *italic*
        
        // Clean up multiple spaces and line breaks
        cleanSummary = cleanSummary.replace(/\s+/g, ' ').trim();
        
        // Format for better readability
        cleanSummary = cleanSummary.replace(/\. ([A-Z])/g, '.\n\n$1'); // Add line breaks after sentences
        
        summaryElement.textContent = cleanSummary;
    }

    // Update insights as bullet points
    const list = document.getElementById('insightsList');
    if (list) {
        list.innerHTML = '';
        (data.insights || []).forEach(insight => {
            const li = document.createElement('li');
            li.textContent = insight;
            list.appendChild(li);
        });
    }

    document.getElementById('wordCount').textContent = (data.word_count || 0).toLocaleString();
    document.getElementById('procTime').textContent = `${data.processing_time || ((Date.now() - startTime)/1000).toFixed(2)}s`;
    document.getElementById('insightCount').textContent = (data.insights || []).length;
    document.getElementById('openCount').textContent = data.open_count || 1;
    document.getElementById('readingTime').textContent = formatTime(data.reading_time || 0);

    // Enable chat widget
    document.getElementById('chatToggle').style.display = 'flex';
    
    // Initialize Q&A section
    initializeQA();
    
    // Start reading timer
    startReadingTimer();

    // Reset rating & notes
    document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    const noteInput = document.getElementById('noteInput');
    if (noteInput) noteInput.value = '';
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';

    results.style.display = 'block';
    setTimeout(() => results.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    toast('Analysis complete!', 'success');
}

// ── Copy ──
document.getElementById('copyBtn').addEventListener('click', () => {
    if (!resultsData) return;
    const text = `SUMMARY:\n${resultsData.summary}\n\nKEY INSIGHTS:\n${(resultsData.insights||[]).map((s,i)=>`${i+1}. ${s}`).join('\n')}`;
    navigator.clipboard.writeText(text)
        .then(() => toast('Copied!', 'success'))
        .catch(() => toast('Copy failed', 'error'));
});

// ── Download TXT ──
document.getElementById('downloadTxtBtn').addEventListener('click', () => {
    if (!resultsData) return;
    const text = `AI RESEARCH PAPER ANALYSIS\n${'='.repeat(40)}\n\nSUMMARY:\n${resultsData.summary}\n\nKEY INSIGHTS:\n${(resultsData.insights||[]).map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\nCITATIONS:\n${(resultsData.citations||[]).join('\n')}\n\nGenerated by ResearchAI`;
    const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
        download: `analysis-${Date.now()}.txt`
    });
    document.body.appendChild(a); a.click(); a.remove();
    toast('Downloaded!', 'success');
});

// ── Download PDF ──
document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
    if (!currentAnalysisId) return;
    try {
        const res = await fetch(`${API}/export/${currentAnalysisId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(blob),
            download: `analysis-${currentAnalysisId}.pdf`
        });
        document.body.appendChild(a); a.click(); a.remove();
        toast('PDF Downloaded!', 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
});

// ── Email ──
document.getElementById('emailBtn').addEventListener('click', () => {
    if (!currentAnalysisId) return;
    document.getElementById('emailModal').style.display = 'flex';
});

function closeModal() {
    document.getElementById('emailModal').style.display = 'none';
}

document.getElementById('sendEmailBtn').addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value.trim();
    if (!email) { toast('Enter an email address', 'error'); return; }
    try {
        const res = await fetch(`${API}/email-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ analysis_id: currentAnalysisId, email })
        });
        if (!res.ok) throw new Error('Failed to send email');
        toast(`Summary sent to ${email}`, 'success');
        closeModal();
    } catch (e) {
        toast(e.message, 'error');
    }
});

// ── New Analysis ──
document.getElementById('newBtn').addEventListener('click', () => {
    clearBtn.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Rating ──
document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', async () => {
        if (!currentAnalysisId) return;
        const val = parseInt(star.dataset.val);
        document.querySelectorAll('.star').forEach((s, i) => {
            s.classList.toggle('active', i < val);
        });
        try {
            await fetch(`${API}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ analysis_id: currentAnalysisId, rating: val })
            });
            toast(`Rated ${val} star${val > 1 ? 's' : ''}!`, 'success');
        } catch (e) {
            toast('Failed to save rating', 'error');
        }
    });
});

// ── Notes ──
document.getElementById('saveNoteBtn').addEventListener('click', async () => {
    if (!currentAnalysisId) return;
    const note = document.getElementById('noteInput').value.trim();
    try {
        await fetch(`${API}/note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ analysis_id: currentAnalysisId, note })
        });
        toast('Note saved!', 'success');
    } catch (e) {
        toast('Failed to save note', 'error');
    }
});

// ── Q&A Section ──
const qaInput = document.getElementById('qaInput');
const qaSendBtn = document.getElementById('qaSendBtn');
const qaMessages = document.getElementById('qaMessages');

if (qaSendBtn) qaSendBtn.addEventListener('click', sendQAQuestion);
if (qaInput) {
    qaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQAQuestion();
        }
    });
}

async function sendQAQuestion() {
    if (!qaInput || !qaMessages || !resultsData) return;
    
    const question = qaInput.value.trim();
    if (!question) return;
    
    // Add question to chat
    addQAMessage(question, 'question');
    qaInput.value = '';
    
    // Show typing indicator
    showQATyping();
    
    // Prepare context from the paper
    const context = resultsData.summary + ' ' + (resultsData.insights || []).join(' ');
    
    try {
        const res = await fetch(`${API}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ question, context })
        });
        
        const data = await res.json();
        
        // Remove typing indicator
        hideQATyping();
        
        if (!res.ok) throw new Error(data.detail || 'Failed to get answer');
        
        // Add answer to chat
        addQAMessage(data.answer, 'answer');
        
    } catch (e) {
        hideQATyping();
        addQAMessage('Sorry, I couldn\'t process your question. Please try again.', 'answer');
        toast('Failed to get answer', 'error');
    }
}

function addQAMessage(message, type) {
    if (!qaMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `qa-message ${type}`;
    messageDiv.textContent = message;
    
    qaMessages.appendChild(messageDiv);
    qaMessages.scrollTop = qaMessages.scrollHeight;
}

function showQATyping() {
    if (!qaMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'qa-typing';
    typingDiv.id = 'qaTyping';
    typingDiv.innerHTML = `
        <span>AI is thinking</span>
        <div class="qa-typing-dots">
            <div class="qa-typing-dot"></div>
            <div class="qa-typing-dot"></div>
            <div class="qa-typing-dot"></div>
        </div>
    `;
    
    qaMessages.appendChild(typingDiv);
    qaMessages.scrollTop = qaMessages.scrollHeight;
}

function hideQATyping() {
    const typingDiv = document.getElementById('qaTyping');
    if (typingDiv) typingDiv.remove();
}

function clearQAMessages() {
    if (qaMessages) {
        qaMessages.innerHTML = '<div class="qa-empty">Ask questions about this paper to get instant AI-powered answers!</div>';
    }
}

// Initialize Q&A section
function initializeQA() {
    clearQAMessages();
}

// ── Chat with Paper ──
const chatSendBtn = document.getElementById('chatSendBtn');
const chatInput = document.getElementById('chatInput');

if (chatSendBtn) chatSendBtn.addEventListener('click', sendChat);
if (chatInput) chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
});

async function sendChat() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    
    if (!input || !messages) return;
    
    const question = input.value.trim();
    if (!question || !resultsData) return;

    messages.innerHTML += `<div class="chat-msg user">${question}</div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    const context = resultsData.summary + ' ' + (resultsData.insights || []).join(' ');

    try {
        const res = await fetch(`${API}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ question, context })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Chat failed');
        messages.innerHTML += `<div class="chat-msg ai">🤖 ${data.answer}</div>`;
        messages.scrollTop = messages.scrollHeight;
    } catch (e) {
        messages.innerHTML += `<div class="chat-msg ai">❌ ${e.message}</div>`;
    }
}

// ── History ──
async function loadHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = '<div class="spinner"></div>';
    try {
        const res = await fetch(`${API}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.length) {
            container.innerHTML = '<div class="history-empty"><div style="font-size:3rem">📭</div><p>No analyses yet. Start by uploading a paper!</p></div>';
            return;
        }
        container.innerHTML = data.map(item => `
            <div class="history-card">
                <div class="history-card-top">
                    <span class="history-title">📄 ${item.title}</span>
                    <span class="history-date">${new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <p class="history-summary">${item.summary}</p>
                <div class="history-meta">
                    <span class="history-badge">📝 ${item.word_count || 0} words</span>
                    <span class="history-badge">💡 ${(item.insights||[]).length} insights</span>
                    ${item.rating ? `<span class="history-badge">⭐ ${item.rating}/5</span>` : ''}
                    ${item.note ? `<span class="history-badge">📌 Has note</span>` : ''}
                    <div class="history-actions">
                        <button class="history-btn" onclick="loadAnalysis('${item.id}')">View</button>
                        <button class="history-btn" onclick="exportAnalysis('${item.id}')">PDF</button>
                        <button class="history-btn danger" onclick="deleteAnalysis('${item.id}', this)">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<div class="history-empty"><p>Failed to load history</p></div>';
    }
}

async function loadAnalysis(id) {
    try {
        const res = await fetch(`${API}/history/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        resultsData = data;
        currentAnalysisId = id;
        totalReadingTime = data.reading_time || 0;
        showTab('analyze');
        showResults(data);

        // Restore rating
        if (data.rating) {
            document.querySelectorAll('.star').forEach((s, i) => {
                s.classList.toggle('active', i < data.rating);
            });
        }
        // Restore note
        if (data.note) document.getElementById('noteInput').value = data.note;
    } catch (e) {
        toast('Failed to load analysis', 'error');
    }
}

async function exportAnalysis(id) {
    try {
        const res = await fetch(`${API}/export/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(blob),
            download: `analysis-${id}.pdf`
        });
        document.body.appendChild(a); a.click(); a.remove();
        toast('PDF Downloaded!', 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteAnalysis(id, btn) {
    if (!await confirmDialog('Delete this analysis?')) return;
    try {
        await fetch(`${API}/history/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        btn.closest('.history-card').remove();
        toast('Deleted', 'info');
    } catch (e) {
        toast('Failed to delete', 'error');
    }
}

// ── Compare PDF upload handlers ──
document.getElementById('comparePdf1').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('compareDropText1').textContent = '⏳ Extracting...';
    const text = await extractPdfText(file);
    if (text) {
        document.getElementById('compareText1').value = text;
        document.getElementById('compareDropText1').textContent = '✓ ' + file.name;
        if (!document.getElementById('title1').value) document.getElementById('title1').value = file.name.replace('.pdf','');
    }
});

document.getElementById('comparePdf2').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('compareDropText2').textContent = '⏳ Extracting...';
    const text = await extractPdfText(file);
    if (text) {
        document.getElementById('compareText2').value = text;
        document.getElementById('compareDropText2').textContent = '✓ ' + file.name;
        if (!document.getElementById('title2').value) document.getElementById('title2').value = file.name.replace('.pdf','');
    }
});

async function extractPdfText(file) {
    try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${API}/extract-text`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });
        if (!res.ok) throw new Error('Extraction failed');
        const data = await res.json();
        toast('PDF extracted!', 'success');
        return data.text;
    } catch (e) {
        toast(e.message, 'error');
        return null;
    }
}

// ── Reading Progress Tracking ──
function formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

function startReadingTimer() {
    readingStartTime = Date.now();
}

function updateReadingTime() {
    if (readingStartTime && currentAnalysisId) {
        const elapsed = Date.now() - readingStartTime;
        totalReadingTime += elapsed;
        document.getElementById('readingTime').textContent = formatTime(totalReadingTime);
        readingStartTime = Date.now();
        
        // Sync with backend every 30 seconds
        if (Math.floor(totalReadingTime / 30000) > Math.floor((totalReadingTime - elapsed) / 30000)) {
            syncReadingStats();
        }
    }
}

async function syncReadingStats() {
    if (!currentAnalysisId) return;
    try {
        await fetch(`${API}/reading-stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                analysis_id: currentAnalysisId,
                reading_time: totalReadingTime,
                open_count: parseInt(document.getElementById('openCount').textContent) || 1
            })
        });
    } catch (e) {
        console.log('Reading stats sync failed:', e);
    }
}

setInterval(updateReadingTime, 1000);

// ── Floating Chat Widget ──
const chatToggle = document.getElementById('chatToggle');
const chatWidget = document.getElementById('chatWidget');
const closeChatWidget = document.getElementById('closeChatWidget');
const chatWidgetSend = document.getElementById('chatWidgetSend');
const chatWidgetInput = document.getElementById('chatWidgetInput');

if (chatToggle) {
    chatToggle.addEventListener('click', () => {
        if (chatWidget) chatWidget.style.display = 'flex';
        chatToggle.style.display = 'none';
    });
}

if (closeChatWidget) {
    closeChatWidget.addEventListener('click', () => {
        if (chatWidget) chatWidget.style.display = 'none';
        if (chatToggle) chatToggle.style.display = 'flex';
    });
}

if (chatWidgetSend) {
    chatWidgetSend.addEventListener('click', sendWidgetChat);
}

if (chatWidgetInput) {
    chatWidgetInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendWidgetChat();
    });
}

async function sendWidgetChat() {
    const input = document.getElementById('chatWidgetInput');
    const question = input.value.trim();
    if (!question || !resultsData) return;

    const messages = document.getElementById('chatWidgetMessages');
    messages.innerHTML += `<div class="chat-msg user">${question}</div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    const context = resultsData.summary + ' ' + (resultsData.insights || []).join(' ');

    try {
        const res = await fetch(`${API}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ question, context })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Chat failed');
        messages.innerHTML += `<div class="chat-msg ai">🤖 ${data.answer}</div>`;
        messages.scrollTop = messages.scrollHeight;
    } catch (e) {
        messages.innerHTML += `<div class="chat-msg ai">❌ ${e.message}</div>`;
    }
}

// ── Timeline View ──
function showTimeline() {
    const modal = document.getElementById('timelineModal');
    if (modal) {
        modal.style.display = 'flex';
        generateTimeline();
    }
}

function closeTimelineModal() {
    const modal = document.getElementById('timelineModal');
    if (modal) modal.style.display = 'none';
}

function generateTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="spinner"></div>';
    
    // Fetch user's analysis history for timeline
    fetch(`${API}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);flex-direction:column;gap:1rem">
                    <div style="font-size:3rem">📭</div>
                    <div>No Analysis History</div>
                    <div style="font-size:0.9rem;text-align:center;max-width:300px">
                        Upload and analyze papers to see your research timeline.
                    </div>
                </div>
            `;
            return;
        }
        
        // Sort by date (newest first) and limit to recent items
        const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
        
        container.innerHTML = sortedData.map((item, i) => {
            const date = new Date(item.created_at);
            const isRecent = (Date.now() - date.getTime()) < 24 * 60 * 60 * 1000; // Within 24 hours
            const isCurrent = item.id === currentAnalysisId;
            
            return `
                <div class="timeline-item">
                    <div class="timeline-dot ${isCurrent ? 'current' : isRecent ? 'recent' : ''}">${i + 1}</div>
                    <div class="timeline-content">
                        <div class="timeline-date">${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div class="timeline-title">${item.title}</div>
                        <div class="timeline-summary">${item.summary.substring(0, 100)}${item.summary.length > 100 ? '...' : ''}</div>
                        <div class="timeline-meta">
                            <span class="timeline-badge">📝 ${item.word_count || 0} words</span>
                            <span class="timeline-badge">💡 ${(item.insights||[]).length} insights</span>
                            ${item.rating ? `<span class="timeline-badge">⭐ ${item.rating}/5</span>` : ''}
                            ${isCurrent ? '<span class="timeline-badge current-badge">🔴 Current</span>' : ''}
                            ${isRecent && !isCurrent ? '<span class="timeline-badge recent-badge">🟢 Recent</span>' : ''}
                        </div>
                        <div class="timeline-actions">
                            <button class="timeline-btn" onclick="loadAnalysisFromTimeline('${item.id}')">View</button>
                            <button class="timeline-btn" onclick="exportAnalysis('${item.id}')">Export</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    })
    .catch(error => {
        console.error('Timeline error:', error);
        container.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--error);flex-direction:column;gap:1rem">
                <div style="font-size:3rem">❌</div>
                <div>Failed to Load Timeline</div>
                <div style="font-size:0.9rem;text-align:center;max-width:300px">
                    Unable to fetch your analysis history. Please try again.
                </div>
            </div>
        `;
    });
}

// ── Citation Network ──
function showNetwork() {
    const modal = document.getElementById('networkModal');
    if (modal) {
        modal.style.display = 'flex';
        generateNetwork();
    }
}

function closeNetworkModal() {
    const modal = document.getElementById('networkModal');
    if (modal) modal.style.display = 'none';
}

function generateNetwork() {
    const container = document.getElementById('networkContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);flex-direction:column;gap:1rem">
            <div style="font-size:3rem">🔗</div>
            <div>Citation Network Visualization</div>
            <div style="font-size:0.9rem;text-align:center;max-width:300px">
                Interactive network showing how this paper connects to other research.
                <br><br>
                <em>Feature coming soon with D3.js integration</em>
            </div>
        </div>
    `;
}

// ── Visual Explorer ──
function showExplorer() {
    const modal = document.getElementById('explorerModal');
    if (modal) {
        modal.style.display = 'flex';
        generateExplorer();
    }
}

function closeExplorerModal() {
    const modal = document.getElementById('explorerModal');
    if (modal) modal.style.display = 'none';
}

function generateExplorer() {
    const container = document.getElementById('explorerContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);flex-direction:column;gap:1rem">
            <div style="font-size:3rem">🗺️</div>
            <div>Research Landscape Explorer</div>
            <div style="font-size:0.9rem;text-align:center;max-width:300px">
                Interactive map showing research topics, trends, and connections in your field.
                <br><br>
                <em>Feature coming soon with advanced visualization</em>
            </div>
        </div>
    `;
}

async function loadAnalysisFromTimeline(id) {
    try {
        // Close the timeline modal first
        closeTimelineModal();
        
        const res = await fetch(`${API}/history/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        resultsData = data;
        currentAnalysisId = id;
        totalReadingTime = data.reading_time || 0;
        
        // Switch to analyze tab and show results
        showTab('analyze');
        showResults(data);

        // Restore rating
        if (data.rating) {
            document.querySelectorAll('.star').forEach((s, i) => {
                s.classList.toggle('active', i < data.rating);
            });
        }
        // Restore note
        const noteInput = document.getElementById('noteInput');
        if (data.note && noteInput) noteInput.value = data.note;
        
        toast('Analysis loaded from timeline', 'success');
    } catch (e) {
        toast('Failed to load analysis', 'error');
    }
}

// ── Event Listeners (with null checks) ──
const timelineBtn = document.getElementById('timelineBtn');
if (timelineBtn) timelineBtn.addEventListener('click', showTimeline);

const networkBtn = document.getElementById('networkBtn');
if (networkBtn) networkBtn.addEventListener('click', showNetwork);

const explorerBtn = document.getElementById('explorerBtn');
if (explorerBtn) explorerBtn.addEventListener('click', showExplorer);

// ── Compare Papers ──
const compareBtn = document.getElementById('compareBtn');
if (compareBtn) {
    compareBtn.addEventListener('click', async () => {
    const text1 = document.getElementById('compareText1').value.trim();
    const text2 = document.getElementById('compareText2').value.trim();
    const title1 = document.getElementById('title1').value.trim() || 'Paper 1';
    const title2 = document.getElementById('title2').value.trim() || 'Paper 2';

    if (!text1 || !text2) { toast('Please paste both papers', 'error'); return; }

    const btn = document.getElementById('compareBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Comparing...';

    try {
        const res = await fetch(`${API}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text1, text2, title1, title2 })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Comparison failed');

        const resultDiv = document.getElementById('compareResult');
        const resultContent = resultDiv.querySelector('.result-content');
        if (resultContent) {
            resultContent.innerHTML = `<h3 style="margin-bottom:1rem;color:var(--purple)">⚖️ ${title1} vs ${title2}</h3><p style="white-space:pre-wrap;color:var(--sub);line-height:1.8">${data.comparison}</p>`;
        }
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });

        document.getElementById('compareDownloadTxt').onclick = () => {
            const content = `COMPARISON: ${title1} vs ${title2}\n${'='.repeat(50)}\n\n${data.comparison}\n\nGenerated by ResearchAI`;
            const a = Object.assign(document.createElement('a'), {
                href: URL.createObjectURL(new Blob([content], { type: 'text/plain' })),
                download: `compare-${Date.now()}.txt`
            });
            document.body.appendChild(a); a.click(); a.remove();
            toast('Downloaded!', 'success');
        };

        document.getElementById('compareDownloadPdf').onclick = async () => {
            try {
                const res = await fetch(`${API}/export-compare`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ title1, title2, comparison: data.comparison })
                });
                if (!res.ok) throw new Error('Export failed');
                const blob = await res.blob();
                const a = Object.assign(document.createElement('a'), {
                    href: URL.createObjectURL(blob),
                    download: `compare-${Date.now()}.pdf`
                });
                document.body.appendChild(a); a.click(); a.remove();
                toast('PDF Downloaded!', 'success');
            } catch (e) {
                toast(e.message, 'error');
            }
        };

        toast('Comparison complete!', 'success');
    } catch (e) {
        toast(e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '⚖️ Compare Papers';
    }
    });
}

function confirmDialog(msg) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2000;display:flex;align-items:center;justify-content:center';
        overlay.innerHTML = `<div style="background:#1e293b;border:1px solid #334155;border-radius:14px;padding:2rem;max-width:360px;width:90%;text-align:center">
            <p style="margin-bottom:1.5rem;font-size:1rem;color:#f1f5f9">${msg}</p>
            <div style="display:flex;gap:1rem;justify-content:center">
                <button id="confirmYes" style="padding:0.7rem 1.5rem;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600">Yes</button>
                <button id="confirmNo" style="padding:0.7rem 1.5rem;background:transparent;border:2px solid #334155;color:#cbd5e1;border-radius:10px;cursor:pointer;font-weight:600">Cancel</button>
            </div></div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#confirmYes').onclick = () => { overlay.remove(); resolve(true); };
        overlay.querySelector('#confirmNo').onclick  = () => { overlay.remove(); resolve(false); };
    });
}

// ── Smooth nav scroll ──
document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
});
