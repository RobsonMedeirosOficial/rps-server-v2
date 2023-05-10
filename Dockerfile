# Use the official Node.js v14 runtime as a base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the project files to the container
COPY . .

# Expose the port that the app will listen on
EXPOSE 3000

# Build
RUN npm run build

# Start the Node.js app
CMD [ "node", "src/index.js" ]
