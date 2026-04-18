# 📖 Sentient Eldritch Grimoire

A real-time, alchemical spell-crafting application where users combine mystical ingredients to receive generated spells from an ancient, malevolent book.

## 🌑 Project Description
The **Sentient Eldritch Grimoire** is a web-based playground where users act as acolytes to an ancient entity. By selecting two mystical ingredients (e.g., "Void Salt" and "Obsidian Tongue"), users initiate a ritual that synthesizes these items into a dark spell.

The Grimoire features a dynamic **Sanity System**:
- **High Sanity (100-70%):** The book is a cold, scholarly curator.
- **Medium Sanity (69-31%):** The book becomes mocking and cryptic.
- **Low Sanity (30-0%):** The book turns feral, using a mix of Caps and small lettersand stuttering text as the user's mind decays.

---

## 🏗️ Architecture Overview
The application uses a decoupled architecture to support real-time streaming of AI responses:

* **Frontend:** React (Vite) manages the UI, sanity state, and handles the **Server-Sent Events (SSE)** stream to display the Grimoire's incantations word-by-word.
* **Backend:** FastAPI (Python) acts as a secure proxy, managing rate limits, session history, and the connection to the Google AI SDK.
* **LLM Provider:** Google Gemini API (`gemini-2.5-flash-lite`) generates the narrative content and spell logic.

**Flow:** `React Client` ➔ `FastAPI Proxy` ➔ `Gemini API` (Stream) ➔ `React UI`

---

## 🛠️ Technical Choices
* **FastAPI:** Chosen for its superior handling of asynchronous `StreamingResponse` objects, which is critical for low-latency AI feedback.
* **Pydantic:** Utilized for strict data validation at the API entry point to ensure ingredient payloads match the expected schema.
* **SSE (Server-Sent Events):** Selected over WebSockets for its simplicity and efficiency in one-way server-to-client text streaming.
* **Gemini 2.5 Flash Lite:** Used for its high-speed performance and ability to strictly adhere to complex "Logic Rules" regarding spell synthesis and persona shifts.

---

## 🚀 Setup and Running Instructions

### 1. Prerequisites
* Python 3.10+
* Node.js 18+
* Google AI (Gemini) API Key

### 2. Backend Setup
1.  **Environment Variables:** Create a `.env` file in the root of the `/backend` folder:
    ```env
    GEMINI_API_KEY=your_key_here
    ```
2.  **Navigate and Initialize:**
    ```bash
    cd backend
    python -m venv venv
    ```
3.  **Activate Virtual Environment:**
    - **Windows:** `venv\Scripts\activate`
    - **Linux/Mac:** `source venv/bin/activate`
4.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Run Server:**
    ```bash
    uvicorn main:app --reload
    ```

### 3. Frontend Setup
1.  **Navigate:**
    ```bash
    cd frontend
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Start Development Server:**
    ```bash
    npm run dev
    ```
4.  **Access App:** Open `http://localhost:5173` in your browser.

---

## ⚠️ Known Limitations
* **In-Memory Rate Limiting:** The rate limiter resets on server restart and is specific to local memory; it would need Redis for distributed production use.
* **Hardcoded Assets:** The ingredient list and traits are currently hardcoded in the frontend.
* **Schema Rigidity:** The system currently relies on simple string-based ingredient names to maintain stability across different Gemini API versions. Re-introducing complex ingredient objects (traits/flavors) requires careful Pydantic re-mapping to prevent errors.
* **Prompt Injection:** Highly creative ingredient names could potentially bypass the system prompt's persona constraints.

---

## 🤖 AI Tools Used
* **Gemini 3 Flash:** Served as the lead debugger and architectural consultant.
    * Assisted in synchronizing Pydantic models with React state to resolve `422 Unprocessable Entity` errors.
    * Provided troubleshooting for model-name mismatches (`404 Not Found`) across different API versions.
    * Optimized the SSE stream buffer logic to prevent unexpected connection terminations.