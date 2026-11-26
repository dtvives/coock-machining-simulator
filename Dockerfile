FROM node:22-bookworm-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY scenarios/ /build/scenarios/
RUN npm run build

FROM python:3.14-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.lock.txt ./
RUN python -m pip install --no-cache-dir -r requirements.lock.txt

COPY simulator/ ./simulator/
COPY scenarios/ ./scenarios/
COPY --from=frontend-build /build/frontend/dist ./frontend/dist/

USER 10001:10001
EXPOSE 8766
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD ["python", "-c", "from urllib.request import urlopen; urlopen('http://127.0.0.1:8766/api/health', timeout=3).close()"]
CMD ["python", "-m", "uvicorn", "simulator.api:app", "--host", "0.0.0.0", "--port", "8766"]
