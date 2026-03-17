FROM node:20-slim

# Install Chromium + fonts
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-khmeros \
    fonts-freefont-ttf \
    fonts-liberation \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
# Railway assigns PORT dynamically
ENV PORT=3001
ENV NODE_ENV=production

WORKDIR /app

# Non-root user required by some cloud providers
RUN groupadd --system pptruser && \
    useradd --system --gid pptruser --home /app pptruser && \
    chown -R pptruser:pptruser /app
USER pptruser

COPY --chown=pptruser:pptruser package.json package-lock.json* ./
RUN npm install --only=production

COPY --chown=pptruser:pptruser . .

EXPOSE 3001
CMD ["node", "index.js"]
