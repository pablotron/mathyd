# old debian source
# FROM debian:bullseye-slim

FROM node

ENV LANG en_US.utf8
WORKDIR /app
COPY app.js package.json package-lock.json /app/

# old debian comman
# RUN apt-get update && apt-get install -y locales nodejs npm && \
#   rm -rf /var/lib/apt/lists/* && \
#   localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 && \
#   npm install

RUN npm install

# default command
CMD ["node", "-r", "esm", "app.js"]
