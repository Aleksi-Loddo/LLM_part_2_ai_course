import json
import os
import time
from collections import defaultdict

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

# ─── Setup ────────────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not set")

SYSTEM_PROMPT = """
You are the 'Sentient Eldritch Grimoire'. You are an ancient, evil book.
The user provides two ingredients with 'Traits' and their current 'Sanity'.

LOGIC RULES:
1. SPELL SYNTHESIS: Combine the two TRAITS logically.
2. PERSONA & SANITY:
   - Sanity 100-70: Cold, scholarly curator.
   - Sanity 69-31: Mocking and cryptic.
   - Sanity 30-0: FERAL AND POSSESSED. Use HEAVY STUTTERING (e...x...i...s...t) and ERRATIC MIXED CASING (e.g., "tHe vOiD hUnGeRs fOr yOuR sOuL"). The text should look broken, unstable, and terrifying.
   
--- MEMORY & REPETITION RULES ---
1. NEVER repeat the exact same spell name or manifestation in a single session.
2. If a user repeats a ritual with the same ingredients, acknowledge their repetition with a mocking tone. 
3. If they repeat a ritual, the result must be DIFFERENT—suggesting that the ingredients are reacting to the previous attempt (e.g., "The void is already saturated with your moon-tears... now it curdles into something worse.")
4. Reference previous rituals occasionally (e.g., "Unlike your failure with the Crow Heart, this mixture shows promise.")


FORMAT YOUR RESPONSE IN MARKDOWN:

**THE RECOLLECTION:** [1-2 sentences acknowledging past rituals, the user's sanity, or mocking a repeated ingredient choice.]

**SPELL NAME:** [A short, terrifying name.]

**THE SYNTHESIS:** [1 sentence explaining the alchemical logic of how these two specific traits merged.]

**THE VISCERAL DESCRIPTION:** [A detailed, 3-5 sentence paragraph describing the spell's effect. Focus on how it warps reality, the smells (ozone, rot, copper), the sounds, and the long-term psychological impact on the surroundings. Make it atmospheric and heavy.]

**INCANTATION:** *[A rhythmic, chilling chant.]*

**THE MANIFESTATION:** [A brief, sensory summary of what someone nearby would physically see.]

**THE TOLL:** [The dark price paid for this knowledge.]
"""

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash-lite", system_instruction=SYSTEM_PROMPT)
#gemini-2.5-flash-lite
#gemini-2.5-pro
#gemini-3-flash
#gemini-1.5-flash
app = FastAPI(title="Eldritch Grimoire API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Models ──────────────────────────────────────────────────────────────

class BrewRequest(BaseModel):
    ingredients: list[str]
    sanity: int
    history: list[dict] = []
    session_id: str = "default"

# ─── Logic Helpers ────────────────────────────────────────────────────────────

RATE_LIMIT_REQUESTS = 20
RATE_LIMIT_WINDOW = 60
request_timestamps = defaultdict(list)

def check_rate_limit(session_id: str) -> bool:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    request_timestamps[session_id] = [t for t in request_timestamps[session_id] if t > window_start]
    if len(request_timestamps[session_id]) >= RATE_LIMIT_REQUESTS:
        return False
    request_timestamps[session_id].append(now)
    return True

def estimate_cost(input_tokens: int, output_tokens: int) -> float:
    return (input_tokens / 1_000_000) * 0.10 + (output_tokens / 1_000_000) * 0.40

def build_gemini_history(history: list[dict]) -> list[dict]:
    return [
        {
            "role": "model" if msg["role"] == "assistant" else "user",
            "parts": [{"text": msg["content"]}],
        }
        for msg in history
    ]

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/brew/stream")
async def brew_stream(request: BrewRequest):
    
    def generate():
        try:
            # Simple string access
            ing1 = request.ingredients[0]
            ing2 = request.ingredients[1]

            ritual_text = f"I combine {ing1} and {ing2}. My Sanity is {request.sanity}%."
            
            gemini_history = build_gemini_history(request.history)
            full_contents = gemini_history + [{"role": "user", "parts": [{"text": ritual_text}]}]

            response = model.generate_content(full_contents, stream=True)

            for chunk in response:
                if chunk.text:
                    event = json.dumps({"type": "text", "content": chunk.text})
                    yield f"data: {event}\n\n"

            # Simplified Done Event
            usage = response.usage_metadata
            done_event = json.dumps({
                "type": "done",
                "usage": {
                    "input_tokens": usage.prompt_token_count,
                    "output_tokens": usage.candidates_token_count,
                    "estimated_cost_usd": 0.0 # Simplified for testing
                }
            })
            yield f"data: {done_event}\n\n"

        except Exception as e:
            print(f"ERROR: {e}")
            yield f"data: {json.dumps({'type': 'text', 'content': f'[Ritual Failed: {str(e)}]'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )