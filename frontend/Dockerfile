FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build


FROM node:18-alpine

RUN npm install -g serve

# Use serve to host the built files
CMD ["serve", "-s", "dist", "-l", ${FRONTEND_PORT}, "--cors", "--no-clipboard", "--no-port-switching"]
