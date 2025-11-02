# OMR Sheet Processor

A full-stack application for converting OMR (Optical Mark Recognition) sheet responses to JSON using Google Gemini AI.

## Features

- 📤 Upload OMR sheet images and extract responses automatically
- 📋 Manage templates with answer keys
- 🔑 Create answer keys from uploaded sheets
- 👤 Extract student details (name, roll number, exam date)
- 💾 SQLite database for persistent storage
- 🎨 Modern UI with dark blue and orange theme

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI + Python
- **Database**: SQLite
- **AI**: Google Gemini (Gemini 1.5 Flash)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the backend directory:
   ```bash
   cp .env.example .env
   ```

6. Add your Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   
   Get your API key from: https://makersuite.google.com/app/apikey

7. Run the backend server:
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the root directory (if not already there):
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (optional, defaults to localhost:8000):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Create an Answer Key** (optional):
   - Go to "Answer Keys" page
   - Upload an OMR sheet image with correct answers marked
   - Gemini AI will extract the answer key automatically

2. **Create a Template**:
   - Go to "Templates" page
   - Click "Create Template"
   - Enter template details and answer key (JSON format)

3. **Upload OMR Sheet**:
   - Go to "Upload OMR" page
   - Select a template
   - Upload an OMR sheet image
   - Click "Process OMR Sheet"
   - View extracted results

4. **View Results**:
   - Go to "Results" page
   - View all processed OMR sheets
   - Click on any result to see detailed information

## API Endpoints

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/{id}` - Get template by ID
- `POST /api/templates` - Create template
- `DELETE /api/templates/{id}` - Delete template

### OMR Sheets
- `GET /api/omr-sheets` - Get all OMR sheets
- `GET /api/omr-sheets/{id}` - Get OMR sheet by ID
- `POST /api/omr-sheets/upload` - Upload and process OMR sheet
- `DELETE /api/omr-sheets/{id}` - Delete OMR sheet

### Answer Keys
- `GET /api/answer-keys` - Get all answer keys
- `GET /api/answer-keys/{id}` - Get answer key by ID
- `POST /api/answer-keys/create` - Create answer key from image
- `DELETE /api/answer-keys/{id}` - Delete answer key

## Database

The SQLite database (`omr_database.db`) will be created automatically in the backend directory when you first run the application.

## Notes

- Make sure OMR sheet images are clear and well-lit for best results
- The application uses Gemini 1.5 Flash model for processing
- All uploaded images are stored in the `uploads` directory
- Student details extraction depends on the clarity of the sheet

## License

MIT
