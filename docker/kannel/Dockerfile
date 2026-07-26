FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       kannel \
    && rm -rf /var/lib/apt/lists/*

COPY kannel.conf /etc/kannel/kannel.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 13000 13002 9200/udp 9201/udp

CMD ["/start.sh"]
