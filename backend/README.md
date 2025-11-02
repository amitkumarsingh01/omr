# Backend API

FastAPI backend for OMR Sheet Processor.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Add your Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the server:
   ```bash
   python main.py
   ```

## Database

SQLite database is created automatically at `omr_database.db`.

## Uploads

Uploaded images are stored in the `uploads` directory.

