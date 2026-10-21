# Medical Report Analyser - Flask Application

An AI-powered medical report analysis tool built with Flask that helps elderly patients understand their medical reports in simple, easy-to-understand language using Google's Gemini AI.

## Features

- 📄 **File Upload**: Support for PDF and image files with OCR
- 👁️ **View Report**: Preview uploaded files in a modal window
- 🤖 **Real AI Analysis**: Powered by Google Gemini AI for intelligent analysis
- 👴 **Elderly-Friendly**: Simple, reassuring language designed for older patients
- 💬 **Interactive Chat**: Ask specific questions about your medical report
- 🌙 **Dark Mode**: Automatic dark/light mode switching
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔍 **OCR Technology**: Reads text from images using Tesseract.js

## Project Structure

```
Medical report analyser/
├── app.py                 # Main Flask application with Gemini AI integration
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── styles.css    # Custom CSS styles
│   └── js/
│       └── script.js     # JavaScript with OCR functionality
└── uploads/              # Uploaded files (created automatically)
```

## Installation

1. **Clone or download the project files**

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask application**:
   ```bash
   python app.py
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:5000
   ```

## Usage

1. **Upload a Medical Report**:
   - Click the upload area or drag and drop a PDF/image file
   - Supported formats: PDF, JPG, JPEG, PNG
   - Images are automatically processed with OCR to extract text

2. **Analyze the Report**:
   - Click "Analyze Report" to process your file
   - The Gemini AI will provide:
     - Simple summary in plain language
     - Key findings with explanations
     - Overall health status
     - Recommendations in everyday language

3. **Ask Questions**:
   - Use the chat feature to ask specific questions about your report
   - Get explanations of medical terms and values in simple language
   - Perfect for elderly patients who need clear, reassuring explanations

## AI Features

### Analysis Capabilities
- **Simple Language**: All explanations are written in everyday language
- **Elderly-Friendly**: Designed specifically for older patients
- **Reassuring Tone**: Positive and encouraging explanations
- **Medical Term Translation**: Complex terms explained in simple words
- **Status Indicators**: Clear normal/abnormal/borderline indicators
- **Bold Highlighting**: Important medical terms, values, and key concepts are highlighted in **bold** for easy reading

### Chatbot Features
- **Contextual Responses**: Understands your specific medical report
- **Simple Explanations**: Avoids medical jargon
- **Patient-Focused**: Answers tailored for elderly patients
- **Reassuring Tone**: Kind and encouraging responses
- **Conversation Memory**: Remembers previous questions and provides contextual responses
- **Visual Memory Indicator**: Shows when the AI is remembering conversation history

## API Endpoints

- `GET /` - Main application page
- `POST /upload` - File upload endpoint with image processing
- `POST /analyze` - Medical report analysis using Gemini AI
- `POST /chat` - Chatbot functionality with Gemini AI

## Configuration

The application can be configured by modifying `app.py`:

- **Upload folder**: `app.config['UPLOAD_FOLDER']`
- **Max file size**: `app.config['MAX_CONTENT_LENGTH']`
- **Allowed file types**: `ALLOWED_EXTENSIONS`
- **Gemini API Key**: `GEMINI_API_KEY` (replace with your own)

## Technology Stack

- **Backend**: Flask (Python)
- **AI**: Google Gemini API
- **OCR**: Tesseract.js for image text extraction
- **PDF Processing**: PDF.js
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: Tailwind CSS
- **Image Processing**: Pillow (PIL)

## Development

To run in development mode with auto-reload:
```bash
python app.py
```

The application runs on `http://localhost:5000` by default.

## Security Notes

- Change the `SECRET_KEY` in production
- Replace the Gemini API key with your own
- Implement proper file validation
- Add authentication if needed
- Consider rate limiting for API endpoints
- Ensure HIPAA compliance for medical data

## Future Enhancements

- [ ] User authentication and report history
- [ ] Export functionality (PDF reports)
- [ ] Multi-language support
- [ ] Advanced image preprocessing for better OCR
- [ ] Integration with medical databases
- [ ] Voice input/output for accessibility
- [ ] Family member sharing features

## Medical Disclaimer

This application is designed to help patients understand their medical reports in simple language. It is not a substitute for professional medical advice. Always consult with your healthcare provider for medical decisions and treatment plans.

## License

This project is for educational purposes. Please ensure compliance with medical data privacy regulations (HIPAA, GDPR, etc.) when using in production. 