"""
core/ai_service.py
──────────────────
Provider-agnostic AI service.

Switch via .env:
    AI_PROVIDER=local      → your own trained model (HuggingFace / llama-cpp / Ollama)
    AI_PROVIDER=openai     → OpenAI API (gpt-3.5-turbo, gpt-4, etc.)

In views.py, just call:
    from core.ai_service import get_ai_reply
    reply = get_ai_reply(messages)
"""

import logging
from django.conf import settings

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
#  Public interface — the only function views.py ever calls
# ─────────────────────────────────────────────────────────────

def get_ai_reply(messages: list[dict]) -> str:
    """
    Route to the correct provider based on settings.AI_PROVIDER.

    Args:
        messages: OpenAI-style list of dicts:
                  [{"role": "system"|"user"|"assistant", "content": "..."}]

    Returns:
        str — the AI's reply text

    Raises:
        AIServiceError — unified error so views.py doesn't need
                         to handle provider-specific exceptions
    """
    provider = getattr(settings, "AI_PROVIDER", "openai").lower()

    if provider == "local":
        return _local_reply(messages)
    elif provider == "openai":
        return _openai_reply(messages)
    else:
        raise AIServiceError(
            f"Unknown AI_PROVIDER '{provider}'. "
            "Set AI_PROVIDER=local or AI_PROVIDER=openai in your .env"
        )


class AIServiceError(Exception):
    """Raised by any provider so views.py catches one exception type."""
    pass


# ─────────────────────────────────────────────────────────────
#  Provider: OpenAI
# ─────────────────────────────────────────────────────────────

def _openai_reply(messages: list[dict]) -> str:
    """Call the OpenAI Chat Completions API."""
    try:
        import openai
    except ImportError:
        raise AIServiceError("openai package not installed. Run: pip install openai")

    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        raise AIServiceError(
            "OPENAI_API_KEY is not set. Add it to your .env file."
        )

    client = openai.OpenAI(api_key=api_key)
    model  = getattr(settings, "OPENAI_MODEL", "gpt-3.5-turbo")

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    except openai.AuthenticationError:
        raise AIServiceError("Invalid OpenAI API key. Check OPENAI_API_KEY in .env")
    except openai.RateLimitError:
        raise AIServiceError("OpenAI rate limit exceeded. Try again shortly.")
    except openai.OpenAIError as e:
        raise AIServiceError(f"OpenAI error: {e}")


# ─────────────────────────────────────────────────────────────
#  Provider: Local / Your Trained Model
#  ── Pick ONE of the three backends below and uncomment it ──
# ─────────────────────────────────────────────────────────────

def _local_reply(messages: list[dict]) -> str:
    """
    Dispatch to whichever local backend is configured.
    Set LOCAL_AI_BACKEND in .env:
        LOCAL_AI_BACKEND=huggingface   (default)
        LOCAL_AI_BACKEND=llamacpp
        LOCAL_AI_BACKEND=ollama
    """
    backend = getattr(settings, "LOCAL_AI_BACKEND", "huggingface").lower()

    if backend == "huggingface":
        return _local_huggingface(messages)
    elif backend == "llamacpp":
        return _local_llamacpp(messages)
    elif backend == "ollama":
        return _local_ollama(messages)
    else:
        raise AIServiceError(
            f"Unknown LOCAL_AI_BACKEND '{backend}'. "
            "Choose: huggingface | llamacpp | ollama"
        )


# ── Backend A: HuggingFace Transformers ──────────────────────
# Install: pip install transformers torch
# Set in .env:
#   LOCAL_MODEL_PATH=./models/my-finetuned-model
#   (or a HuggingFace hub ID like "mistralai/Mistral-7B-Instruct-v0.2")

def _local_huggingface(messages: list[dict]) -> str:
    try:
        from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
        import torch
    except ImportError:
        raise AIServiceError(
            "transformers/torch not installed. "
            "Run: pip install transformers torch"
        )

    model_path = getattr(settings, "LOCAL_MODEL_PATH", None)
    if not model_path:
        raise AIServiceError(
            "LOCAL_MODEL_PATH is not set. "
            "Point it to your model directory or a HuggingFace hub ID."
        )

    # Build a single prompt string from message history
    prompt = _messages_to_prompt(messages)

    try:
        device = 0 if torch.cuda.is_available() else -1
        generator = pipeline(
            "text-generation",
            model=model_path,
            device=device,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        )
        result = generator(
            prompt,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            pad_token_id=generator.tokenizer.eos_token_id,
        )
        # Strip the original prompt from the output
        output = result[0]["generated_text"]
        reply  = output[len(prompt):].strip()
        return reply or "I'm not sure how to respond to that."

    except Exception as e:
        logger.exception("HuggingFace inference error")
        raise AIServiceError(f"Local model error: {e}")


# ── Backend B: llama-cpp-python (GGUF quantized models) ──────
# Install: pip install llama-cpp-python
# Set in .env:
#   LOCAL_MODEL_PATH=./models/my-model.gguf

def _local_llamacpp(messages: list[dict]) -> str:
    try:
        from llama_cpp import Llama
    except ImportError:
        raise AIServiceError(
            "llama-cpp-python not installed. "
            "Run: pip install llama-cpp-python"
        )

    model_path = getattr(settings, "LOCAL_MODEL_PATH", None)
    if not model_path:
        raise AIServiceError("LOCAL_MODEL_PATH must point to a .gguf model file.")

    try:
        llm = Llama(
            model_path=model_path,
            n_ctx=4096,
            n_threads=4,
            verbose=False,
        )
        response = llm.create_chat_completion(
            messages=messages,
            max_tokens=512,
            temperature=0.7,
        )
        return response["choices"][0]["message"]["content"].strip()

    except Exception as e:
        logger.exception("llama-cpp inference error")
        raise AIServiceError(f"llama-cpp error: {e}")


# ── Backend C: Ollama (local HTTP server) ────────────────────
# Install Ollama: https://ollama.ai
# Run:  ollama pull mistral   (or whatever model you trained/pulled)
# Set in .env:
#   LOCAL_MODEL_PATH=mistral   (the ollama model name)
#   OLLAMA_BASE_URL=http://localhost:11434  (default)

def _local_ollama(messages: list[dict]) -> str:
    try:
        import requests
    except ImportError:
        raise AIServiceError("requests not installed. Run: pip install requests")

    model_name   = getattr(settings, "LOCAL_MODEL_PATH", "mistral")
    ollama_url   = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
    endpoint     = f"{ollama_url}/api/chat"

    try:
        resp = requests.post(
            endpoint,
            json={
                "model":    model_name,
                "messages": messages,
                "stream":   False,
                "options":  {"temperature": 0.7, "num_predict": 512},
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"].strip()

    except requests.ConnectionError:
        raise AIServiceError(
            f"Cannot connect to Ollama at {ollama_url}. "
            "Is `ollama serve` running?"
        )
    except requests.HTTPError as e:
        raise AIServiceError(f"Ollama HTTP error: {e}")
    except Exception as e:
        logger.exception("Ollama inference error")
        raise AIServiceError(f"Ollama error: {e}")


# ─────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────

def _messages_to_prompt(messages: list[dict]) -> str:
    """
    Convert OpenAI-style message list to a plain text prompt
    for models that don't support chat format natively.
    """
    lines = []
    for m in messages:
        role    = m.get("role", "user").capitalize()
        content = m.get("content", "")
        if role == "System":
            lines.append(f"[System]: {content}")
        elif role == "User":
            lines.append(f"Human: {content}")
        elif role == "Assistant":
            lines.append(f"Assistant: {content}")
    lines.append("Assistant:")  # prime the model to continue
    return "\n".join(lines)