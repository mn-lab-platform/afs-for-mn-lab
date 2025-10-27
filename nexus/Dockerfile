FROM python:3.11-bookworm
RUN apt-get update && apt-get install -y \
    wget \
    tar \
    libgl1-mesa-glx \
    libglu1-mesa \
    libxrender1 \
    libxrandr2 \
    libxss1 \
    libxcursor1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxext6 \
    libx11-6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN curl -L -o nexus-linux-x86_64.tar.gz \
    "https://github.com/cnr-isti-vclab/nexus/releases/latest/download/nexus-linux-x86_64.tar.gz" \
    && tar -xzf nexus-linux-x86_64.tar.gz \
    && rm nexus-linux-x86_64.tar.gz \
    && ls -la \
    && find . -name "nxs*" -type f \
    && chmod +x nxs* || echo "No nxs executables found"

RUN mkdir -p /app/data /app/temp

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000", "--reload"]