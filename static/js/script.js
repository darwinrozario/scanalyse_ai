// Helper function to convert markdown-style bold formatting to HTML
function formatBoldText(text) {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Dark mode detection
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});

let reportContent = '';
let analysisResults = null;
let chatHistory = []; // Store conversation history

// File upload handling
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const viewReportBtn = document.getElementById('viewReportBtn');

// Modal elements
const reportModal = document.getElementById('reportModal');
const closeModal = document.getElementById('closeModal');
const reportContentElement = document.getElementById('reportContent');

let currentFile = null; // Store the current uploaded file

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-primary');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-primary');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-primary');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

async function handleFile(file) {
    currentFile = file; // Store the file for viewing
    fileName.textContent = file.name;
    fileInfo.classList.remove('hidden');
    analyzeBtn.disabled = false;
    viewReportBtn.disabled = false; // Enable view report button

    // Clear chat history when a new file is uploaded
    chatHistory = [];
    clearChatMessages();

    try {
        if (file.type === 'application/pdf') {
            reportContent = await extractTextFromPDF(file);
        } else if (file.type.startsWith('image/')) {
            // Extract text from image using OCR
            reportContent = await extractTextFromImage(file);
        }
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file. Please try again.');
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    
    return text;
}

async function extractTextFromImage(file) {
    try {
        // Show loading message
        const fileInfo = document.getElementById('fileInfo');
        fileInfo.innerHTML = `
            <p class="text-blue-700 dark:text-blue-300 text-lg font-medium">🔄 Reading image content...</p>
            <p class="text-gray-600 dark:text-gray-400">This may take a few moments for large images</p>
        `;

        // Use Tesseract.js to extract text from image
        const result = await Tesseract.recognize(
            file,
            'eng', // English language
            {
                logger: m => {
                    // Optional: Log progress
                    if (m.status === 'recognizing text') {
                        fileInfo.innerHTML = `
                            <p class="text-blue-700 dark:text-blue-300 text-lg font-medium">🔄 Reading image content... ${Math.round(m.progress * 100)}%</p>
                            <p class="text-gray-600 dark:text-gray-400">This may take a few moments for large images</p>
                        `;
                    }
                }
            }
        );

        // Update success message
        fileInfo.innerHTML = `
            <p class="text-green-700 dark:text-green-300 text-lg font-medium">✅ Image processed successfully!</p>
            <p class="text-gray-600 dark:text-gray-400">Found ${result.data.text.split(' ').length} words</p>
        `;

        return result.data.text;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to read text from image. Please ensure the image is clear and contains readable text.');
    }
}

// Analysis functionality
analyzeBtn.addEventListener('click', analyzeReport);

// View Report functionality
viewReportBtn.addEventListener('click', viewReport);

// Modal functionality
closeModal.addEventListener('click', closeReportModal);
reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) {
        closeReportModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !reportModal.classList.contains('hidden')) {
        closeReportModal();
    }
});

async function analyzeReport() {
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: reportContent
            })
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status}`);
        }

        analysisResults = await response.json();
        displayResults();
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Error analyzing report. Please check your internet connection and try again.');
    } finally {
        loadingSection.classList.add('hidden');
    }
}

function displayResults() {
    const summaryContent = document.getElementById('summaryContent');
    const findingsContent = document.getElementById('findingsContent');
    const resultsSection = document.getElementById('resultsSection');

    // Display summary with overall status and recommendations
    let summaryHTML = `<p class="text-lg leading-relaxed">${formatBoldText(analysisResults.summary)}</p>`;
    
    if (analysisResults.overallStatus) {
        summaryHTML += `
            <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 class="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">📋 Overall Health Status</h3>
                <p class="text-lg text-blue-700 dark:text-blue-300">${formatBoldText(analysisResults.overallStatus)}</p>
            </div>
        `;
    }
    
    if (analysisResults.recommendations) {
        summaryHTML += `
            <div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 class="text-xl font-semibold mb-2 text-green-800 dark:text-green-200">💡 Recommendations</h3>
                <p class="text-lg text-green-700 dark:text-green-300">${formatBoldText(analysisResults.recommendations)}</p>
            </div>
        `;
    }
    
    summaryContent.innerHTML = summaryHTML;

    // Display key findings
    if (analysisResults.keyFindings && analysisResults.keyFindings.length > 0) {
        findingsContent.innerHTML = analysisResults.keyFindings.map(finding => `
            <div class="medical-term p-4 rounded-lg status-${finding.status}">
                <h3 class="text-xl font-semibold mb-2">${formatBoldText(finding.term)}</h3>
                <p class="text-lg mb-2"><strong>Value:</strong> ${formatBoldText(finding.value)}</p>
                <p class="text-lg mb-2">${formatBoldText(finding.explanation)}</p>
                ${finding.simpleExplanation ? `<p class="text-lg mb-2 text-gray-700 dark:text-gray-300"><em>💡 Simple explanation:</em> ${formatBoldText(finding.simpleExplanation)}</p>` : ''}
                <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    finding.status === 'normal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    finding.status === 'abnormal' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }">
                    ${finding.status === 'normal' ? '✅ Normal' : 
                      finding.status === 'abnormal' ? '⚠️ Abnormal' : '📋 Borderline'}
                </span>
            </div>
        `).join('');
    } else {
        findingsContent.innerHTML = '<p class="text-lg text-gray-600 dark:text-gray-400">No specific findings to highlight. Please use the chat below to ask about specific values or terms.</p>';
    }

    resultsSection.classList.remove('hidden');
}

// Chatbot functionality
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';

    // Add typing indicator
    const typingDiv = addMessage('Thinking...', 'bot', true);

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                reportContent: reportContent,
                analysisResults: analysisResults,
                chatHistory: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error(`Chat failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Remove typing indicator and add real response
        typingDiv.remove();
        addMessage(data.response, 'bot');

        // Update chat history
        chatHistory.push({ user: message, bot: data.response });
        
        // Show memory indicator if there's conversation history
        updateMemoryIndicator();

    } catch (error) {
        typingDiv.remove();
        addMessage('Sorry, I encountered an error. Please try asking your question again.', 'bot');
        console.error('Chat error:', error);
    }
}

function addMessage(text, sender, isTyping = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-4 rounded-lg ${
        sender === 'user' 
            ? 'bg-primary text-white ml-8' 
            : 'bg-gray-50 dark:bg-gray-700 mr-8'
    }`;
    
    if (isTyping) {
        messageDiv.classList.add('typing-animation');
    }
    
    // Apply bold formatting to bot messages (AI responses)
    const formattedText = sender === 'bot' ? formatBoldText(text) : text;
    messageDiv.innerHTML = `<p class="text-lg">${formattedText}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// Function to update memory indicator visibility
function updateMemoryIndicator() {
    const memoryIndicator = document.getElementById('memoryIndicator');
    if (chatHistory.length > 0) {
        memoryIndicator.classList.remove('hidden');
    } else {
        memoryIndicator.classList.add('hidden');
    }
}

// Function to clear chat messages
function clearChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p class="text-blue-800 dark:text-blue-200 text-lg">👋 Hello! I'm here to help you understand your medical report. Feel free to ask me about any medical terms or values you don't understand.</p>
        </div>
    `;
    updateMemoryIndicator();
}

async function viewReport() {
    console.log('View Report clicked');
    console.log('Current file:', currentFile);
    
    if (!currentFile) {
        console.error('No file available to view');
        alert('No file available to view. Please upload a file first.');
        return;
    }
    
    try {
        console.log('File type:', currentFile.type);
        
        if (currentFile.type === 'application/pdf') {
            console.log('Displaying PDF...');
            await displayPDF(currentFile);
        } else if (currentFile.type.startsWith('image/')) {
            console.log('Displaying image...');
            displayImage(currentFile);
        } else {
            console.error('Unsupported file type:', currentFile.type);
            alert('Unsupported file type. Please upload a PDF or image file.');
            return;
        }
        
        console.log('Opening modal...');
        reportModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing report:', error);
        alert('Error displaying report: ' + error.message);
    }
}

function closeReportModal() {
    reportModal.classList.add('hidden');
    reportContentElement.innerHTML = '';
}

async function displayPDF(file) {
    console.log('Starting PDF display...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    console.log('PDF loaded, pages:', pdf.numPages);
    let pdfHTML = '<div class="space-y-4">';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        console.log('Rendering page', i);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        pdfHTML += `
            <div class="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h4 class="text-lg font-semibold mb-2">Page ${i}</h4>
                <div class="flex justify-center">
                    <img src="${canvas.toDataURL()}" alt="Page ${i}" class="max-w-full h-auto shadow-lg">
                </div>
            </div>
        `;
    }
    
    pdfHTML += '</div>';
    console.log('Setting PDF HTML content...');
    reportContentElement.innerHTML = pdfHTML;
    console.log('PDF display complete');
}

function displayImage(file) {
    console.log('Starting image display...');
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('Image loaded, setting content...');
        reportContentElement.innerHTML = `
            <div class="flex justify-center">
                <img src="${e.target.result}" alt="Medical Report" class="max-w-full h-auto shadow-lg rounded-lg">
            </div>
        `;
        console.log('Image display complete');
    };
    reader.onerror = function(error) {
        console.error('Error reading image file:', error);
        alert('Error reading image file. Please try again.');
    };
    reader.readAsDataURL(file);
} 