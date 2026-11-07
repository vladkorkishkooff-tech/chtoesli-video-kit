# Инструкция к сборке и ограничения — в ОКРУЖЕНИЕ.md. Контейнер не включает API-ключи.
FROM node:24-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends chromium ffmpeg python3 python3-venv ca-certificates fonts-liberation && rm -rf /var/lib/apt/lists/*
WORKDIR /kit
COPY package*.json requirements*.txt ./
RUN npm ci --omit=dev && python3 -m venv /opt/videoenv && /opt/videoenv/bin/pip install --no-cache-dir -r requirements.txt
ENV PATH="/opt/videoenv/bin:${PATH}" PW_CHROMIUM=/usr/bin/chromium
COPY --chown=node:node . /kit/
RUN mkdir -p /kit/output && chown -R node:node /kit
USER node
CMD ["bash"]
