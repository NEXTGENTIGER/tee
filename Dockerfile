FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gnupg2 \
    curl \
    && echo "deb http://http.kali.org/kali kali-rolling main contrib non-free" > /etc/apt/sources.list.d/kali.list \
    && curl -fsSL https://archive.kali.org/archive-key.asc | apt-key add - \
    && apt-get update && apt-get install -y \
    nmap \
    nikto \
    hydra \
    sqlmap \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@10.2.4

# Set working directory
WORKDIR /app

# Copy backend files
COPY app/ /app/app/
COPY app/requirements.txt /app/app/requirements.txt

# Install backend dependencies
RUN pip install --no-cache-dir -r /app/app/requirements.txt

# Copy frontend files
COPY frontend/ /app/frontend/

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install || true
RUN npm run build || true

# Return to app directory
WORKDIR /app/app

# Expose ports
EXPOSE 8000

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 