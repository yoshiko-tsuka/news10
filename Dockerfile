# Dockerfile (Development)
# This Dockerfile is optimized for development with hot reloading
# It includes Air and mounts your source code as a volume

# Use the official Go image as our base
# Alpine variant is smaller but we use the full image for better compatibility
FROM golang:1.27-alpine

# Set the working directory inside the container
# All subsequent commands will run from this directory
WORKDIR /app

# Install Air for hot reloading
# We install it globally so it's available in the PATH
RUN go install github.com/air-verse/air@latest

# Install additional development tools (optional but useful)
# - delve: Go debugger for debugging inside containers
# - golangci-lint: Linter for code quality checks
RUN go install github.com/go-delve/delve/cmd/dlv@latest && \
    curl -sSfL https://golangci-lint.run/install.sh | sh -s -- -b $(go env GOPATH)/bin v2.11.2

# Copy go.mod and go.sum first for better layer caching
# This layer only rebuilds when dependencies change
COPY go.mod go.sum* ./

# Download all dependencies
# This is cached separately from source code changes
RUN go mod download && go mod verify

# Copy the Air configuration file
# This tells Air how to watch and rebuild our application
COPY .air.toml ./

# Note: We do NOT copy source code here!
# Source code is mounted as a volume in Docker Compose
# This enables hot reloading without rebuilding the image

# Expose the application port
# Make sure this matches your application's listening port
EXPOSE 8080

# Expose delve debugger port (optional, for debugging)
EXPOSE 2345

# Set environment variables for development
ENV GO111MODULE=on

# Default command: run Air for hot reloading
# Air will watch for changes and rebuild automatically
CMD ["air", "-c", ".air.toml"]
