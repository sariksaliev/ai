FROM node:20-alpine

WORKDIR /app

# Copy package files (none needed, zero-dependency)
# Copy all source files
COPY . .

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run the server
CMD ["node", "server.js"]