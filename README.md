#  ChatGPT Clone — Django + React

A full-stack AI chat application powered by **OpenAI's API**, built with Django REST Framework on the backend and a sleek React frontend. Runs entirely on your local machine with zero cloud deployment needed.

---

##  Features

-  Real-time AI conversations via OpenAI API
-  Persistent chat history stored in SQLite
-  Start new conversations or resume old ones
-  Delete individual conversations
-  Fast Vite-powered React frontend
-  CORS-configured for local development

---

##  Full Project Structure

```
chatgpt-clone/
│
├── backend/                          # Django project
│   ├── manage.py                     # Django CLI entrypoint
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Copy to .env and fill in keys
│   ├── db.sqlite3                    # Auto-created after migrate
│   │
│   ├── config/                       # Django project config
│   │   ├── __init__.py
│   │   ├── settings.py               # App settings, CORS, OpenAI config
│   │   ├── urls.py                   # Root URL router → /api/
│   │   └── wsgi.py
│   │
│   └── core/                         # Core Django app
│       ├── __init__.py
│       ├── models.py                 # Conversation + Message models
│       ├── serializers.py            # DRF serializers (request/response)
│       ├── views.py                  # ChatView, ConversationListView, DetailView
│       └── urls.py                   # /api/chat/, /api/conversations/
│
└── frontend/                         # React + Vite frontend
    ├── index.html                    # HTML shell — mounts React root
    ├── package.json                  # Dependencies + npm scripts
    ├── vite.config.js                # Vite config + /api proxy to Django
    │
    └── src/
        ├── main.jsx                  # ReactDOM.createRoot entry point
        ├── App.jsx                   # Root layout: sidebar + router
        │
        ├── pages/
        │   ├── ChatPage.jsx          # Active chat interface
        │   └── HistoryPage.jsx       # Browse & resume past conversations
        │
        ├── components/
        │   ├── ChatWindow.jsx        # Renders message bubbles (user + AI)
        │   └── MessageInput.jsx      # Textarea + send button
        │
        ├── utils/
        │   └── api.js                # All Axios calls to Django API
        │
        └── styles/
            └── global.css            # CSS variables, reset, global styles
```

---

##  Backend Setup

### 1. Create & activate virtual environment
```bash
cd backend
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
SECRET_KEY=django-insecure-replace-this-with-a-long-random-string
DEBUG=True
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

### 4. Run database migrations
```bash
python manage.py makemigrations core
python manage.py migrate
```

### 5. Start the Django server
```bash
python manage.py runserver
# → http://127.0.0.1:8000
```

---

##  Frontend Setup

### 1. Install Node dependencies
```bash
cd frontend
npm install
```

### 2. Start the dev server
```bash
npm run dev
# → http://localhost:5173
```

> The Vite proxy forwards `/api/*` requests to `http://127.0.0.1:8000` automatically — no CORS issues during development.

---

##  API Reference

| Method   | Endpoint                        | Description                              |
|----------|---------------------------------|------------------------------------------|
| `POST`   | `/api/chat/`                    | Send message; returns AI reply           |
| `GET`    | `/api/conversations/`           | List all conversations                   |
| `DELETE` | `/api/conversations/`           | Delete all conversations                 |
| `GET`    | `/api/conversations/<uuid>/`    | Get single conversation with messages    |
| `DELETE` | `/api/conversations/<uuid>/`    | Delete a single conversation             |

### POST `/api/chat/` — Request Body
```json
{
  "message": "What is the capital of France?",
  "conversation_id": "optional-uuid-to-continue-existing-chat"
}
```

### POST `/api/chat/` — Response
```json
{
  "reply": "The capital of France is Paris.",
  "conversation_id": "3f1a2b4c-...",
  "message_id": "7d8e9f0a-..."
}
```

---

##  Dependencies

### Backend
| Package                  | Purpose                        |
|--------------------------|--------------------------------|
| `django`                 | Web framework                  |
| `djangorestframework`    | REST API toolkit               |
| `django-cors-headers`    | CORS for local dev             |
| `openai`                 | OpenAI Python SDK              |
| `python-dotenv`          | Load `.env` variables          |

### Frontend
| Package              | Purpose                          |
|----------------------|----------------------------------|
| `react`              | UI library                       |
| `react-dom`          | DOM renderer                     |
| `react-router-dom`   | Client-side routing              |
| `axios`              | HTTP client for API calls        |
| `vite`               | Fast dev server & bundler        |

---

##  Quick Start (Both Servers)

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend && source venv/bin/activate && python manage.py runserver
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.

---

##  Troubleshooting

| Problem | Fix |
|---|---|
| `Invalid API key` error | Check `OPENAI_API_KEY` in `.env` |
| CORS errors in browser | Ensure Django is running on port 8000 |
| `No module named 'openai'` | Run `pip install -r requirements.txt` |
| Blank page on frontend | Run `npm install` then `npm run dev` |
| DB errors | Run `python manage.py migrate` |