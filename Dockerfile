FROM debian:bullseye-slim

ENV LANG en_US.utf8
WORKDIR /app
COPY app.js /app

RUN apt-get update && apt-get install -y locales npm && \
  rm -rf /var/lib/apt/lists/* && \
  localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 && \
  npm install 

# default command
CMD ["/usr/bin/node", "-r", "esm", "app.js"]
