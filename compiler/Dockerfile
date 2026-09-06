FROM node:20-alpine
WORKDIR /compiler
RUN apk update && apk add --no-cache g++ python3 openjdk21-jdk
COPY . .
RUN npm install
EXPOSE 5175
ENV BACKEND_URL=http://host.docker.internal:5174
CMD ["node", "index.js"]

