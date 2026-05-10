FROM node:22.19.0 AS build

WORKDIR /app

COPY package*.json ./
RUN rm -f package-lock.json && npm install

COPY . .

ARG VITE_BASE_PATH=/4AHWII-SJ2526-T2/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]