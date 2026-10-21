from flask import Flask, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename
import json
import base64
from PIL import Image
import io
import requests

app = Flask(__name__)   
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Gemini API configuration
GEMINI_API_KEY = "your_api_key"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def call_gemini_api(prompt):
    """Call Gemini API with the given prompt"""
    try:
        response = requests.post(
            GEMINI_API_URL,
            headers={'Content-Type': 'application/json'},
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.4,
                    "topK": 32,
                    "topP": 0.95,
                    "maxOutputTokens": 8192
                }
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['candidates'][0]['content']['parts'][0]['text']
        else:
            raise Exception(f"API request failed: {response.status_code}")
            
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise e

def process_image_file(file_path):
    """Process image file to improve OCR accuracy"""
    try:
        with Image.open(file_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too large (helps with OCR performance)
            max_size = (2000, 2000)
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save processed image
            processed_path = file_path.replace('.', '_processed.')
            img.save(processed_path, 'JPEG', quality=85)
            return processed_path
    except Exception as e:
        print(f"Image processing error: {e}")
        return file_path

@app.route('/')
def index():
    """Main page route"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Process image files for better OCR
            if file.content_type.startswith('image/'):
                processed_path = process_image_file(filepath)
                return jsonify({
                    'success': True,
                    'filename': filename,
                    'message': 'Image uploaded and processed for OCR',
                    'processed': True
                })
            else:
                return jsonify({
                    'success': True,
                    'filename': filename,
                    'message': 'File uploaded successfully'
                })
        else:
            return jsonify({'error': 'Invalid file type'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze_report():
    """Analyze medical report using Gemini AI"""
    try:
        data = request.get_json()
        report_content = data.get('content', '')
        
        # Check if content is meaningful
        if not report_content or len(report_content.strip()) < 10:
            return jsonify({
                'error': 'No readable text found in the uploaded file. Please ensure the image is clear and contains readable text.'
            }), 400
        
        # Create a comprehensive prompt for elderly-friendly analysis
        analysis_prompt = f"""
        You are a compassionate medical expert helping elderly patients understand their medical reports. 
        Your role is to explain complex medical information in simple, reassuring language that anyone can understand.
        
        Please analyze the following medical report and provide:

        1. A simple, easy-to-understand summary in plain language (avoid medical jargon)
        2. Key findings with clear explanations of what each medical term means
        3. Normal vs abnormal values explained in simple terms
        4. Any recommendations in everyday language
        5. Overall health status in reassuring terms

        IMPORTANT GUIDELINES:
        - Write as if speaking to a grandparent
        - Use simple, everyday language
        - Be reassuring and positive
        - Explain medical terms in simple terms
        - Focus on what the patient needs to know
        - Avoid overwhelming technical details
        - Use **bold text** to highlight important medical terms, values, and key concepts
        - Make numbers, measurements, and medical terms stand out with **bold formatting**

        Please format your response as JSON with the following structure:
        {{
            "summary": "Simple summary in plain language for elderly patients with **bold** important terms",
            "keyFindings": [
                {{
                    "term": "Medical term",
                    "value": "Value from report",
                    "explanation": "What this means in simple terms for elderly patients with **bold** key concepts",
                    "status": "normal/abnormal/borderline",
                    "simpleExplanation": "Very simple explanation in everyday language with **bold** important points"
                }}
            ],
            "overallStatus": "Overall health status in simple terms with **bold** key status indicators",
            "recommendations": "Any recommendations in simple language with **bold** important actions"
        }}

        Medical Report Content:
        {report_content}
        """
        
        # Call Gemini API for analysis
        ai_response = call_gemini_api(analysis_prompt)
        
        try:
            # Try to parse as JSON first
            import re
            json_match = re.search(r'\{[\s\S]*\}', ai_response)
            if json_match:
                analysis_result = json.loads(json_match.group())
            else:
                # Fallback to plain text parsing
                analysis_result = {
                    "summary": ai_response,
                    "keyFindings": [],
                    "overallStatus": "Analysis completed",
                    "recommendations": "Please consult with your doctor for specific advice."
                }
        except json.JSONDecodeError:
            # If JSON parsing fails, use the response as summary
            analysis_result = {
                "summary": ai_response,
                "keyFindings": [],
                "overallStatus": "Analysis completed",
                "recommendations": "Please consult with your doctor for specific advice."
            }
        
        return jsonify(analysis_result)
        
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({'error': f'Error analyzing report: {str(e)}'}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages with Gemini AI"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        report_content = data.get('reportContent', '')
        analysis_results = data.get('analysisResults', {})
        chat_history = data.get('chatHistory', [])
        
        # Create a chat prompt for elderly-friendly responses with conversation history
        chat_prompt = f"""
        You are a helpful, compassionate medical assistant speaking to an elderly patient. 
        Your goal is to help them understand their medical report in simple, reassuring language.
        
        IMPORTANT GUIDELINES:
        - Speak as if talking to a grandparent
        - Use simple, everyday language
        - Be patient, kind, and reassuring
        - Avoid medical jargon - explain everything in simple terms
        - Focus on what they need to know
        - Be encouraging and positive
        - Keep explanations brief but clear
        - Use **bold text** to highlight important medical terms, values, and key concepts
        - Make numbers, measurements, and medical terms stand out with **bold formatting**
        - Remember previous questions and provide contextual responses
        - Don't repeat information already discussed unless asked
        
        Report content: {report_content}
        Previous analysis: {json.dumps(analysis_results, indent=2)}
        
        Previous conversation history:
        """
        
        # Add conversation history to the prompt
        if chat_history:
            for i, exchange in enumerate(chat_history):
                chat_prompt += f"""
        Patient: {exchange.get('user', '')}
        Assistant: {exchange.get('bot', '')}
        """
        else:
            chat_prompt += "This is the first question in our conversation."
        
        chat_prompt += f"""
        
        Current patient question: {message}
        
        Please provide a helpful, easy-to-understand answer that an elderly person would appreciate, using **bold** formatting for important terms. 
        Consider the conversation history and provide contextual responses without repeating information unless specifically asked.
        """
        
        # Call Gemini API for chat response
        ai_response = call_gemini_api(chat_prompt)
        
        return jsonify({'response': ai_response})
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': f'Error processing chat: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 
