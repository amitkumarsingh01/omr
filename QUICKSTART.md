# Quick Start Guide

## Prerequisites
- Python 3.8+
- Node.js 16+
- Gemini API Key (get from https://makersuite.google.com/app/apikey)

## Setup Steps

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

Create `.env` file:
```
GEMINI_API_KEY=your_api_key_here
```

Start backend:
```bash
python main.py
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```

Visit: http://localhost:5173

## Usage Flow

1. **Create Answer Key** (Optional):
   - Go to "Answer Keys" → Upload OMR sheet with correct answers

2. **Create Template**:
   - Go to "Templates" → Create template with answer key (JSON format)

3. **Upload OMR Sheet**:
   - Go to "Upload OMR" → Select template → Upload image → Process

4. **View Results**:
   - Go to "Results" → View all processed sheets

