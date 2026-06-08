FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_DEFAULT_TIMEOUT=100
ENV PIP_NO_CACHE_DIR=1
ENV HF_HOME=/app/huggingface_cache

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/huggingface_cache && \
    chown -R appuser:appuser /app

COPY --chown=appuser:appuser requirements.txt .

USER appuser

RUN pip install --upgrade pip \
    && pip install --user -r requirements.txt \
    && python -m spacy download es_core_news_sm

COPY --chown=appuser:appuser . .

ENV PATH="/home/appuser/.local/bin:${PATH}"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]