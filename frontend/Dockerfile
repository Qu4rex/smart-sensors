FROM node:26-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Адрес API зашивается в сборку. Через nginx запросы идут на тот же домен, поэтому по умолчанию /api/v1.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build


FROM nginx:1.31.1-alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]