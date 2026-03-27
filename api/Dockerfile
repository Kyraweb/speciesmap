# speciesmap.org — API Dockerfile
# FastAPI backend, exposes port 3000 via nginx

FROM python:3.13-slim

RUN apt-get update && apt-get install -y \
    nginx \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY nginx.conf /etc/nginx/nginx.conf

RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting speciesmap API..."\n\
uvicorn app.main:app --host 0.0.0.0 --port 8000 &\n\
echo "Starting nginx..."\n\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

EXPOSE 3000

CMD ["/start.sh"]
