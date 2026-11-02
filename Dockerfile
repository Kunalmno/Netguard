# Use the official Bun image
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json bun.lock ./

# Install dependencies
bun install --frozen-lockfile

# Copy the rest of the project files
COPY . .

# Build the Vite frontend
RUN bun run build

# Expose port (Cloud Run dynamically assigns PORT, but defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Start the Express server
CMD ["bun", "server.ts"]