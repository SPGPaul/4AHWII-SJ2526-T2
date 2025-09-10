# Verwende ein Node.js-Image als Basis
FROM node:22.19.0

# Setze das Arbeitsverzeichnis
WORKDIR /app

# Kopiere die package.json und package-lock.json
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Projekts
COPY . .

# Baue das Projekt
#RUN npm run build

# Exponiere den Port
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "run", "dev", "--", "--host"]