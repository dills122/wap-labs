FROM ubuntu:22.04 AS kannel-build

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && sed -i 's/^# deb-src/deb-src/' /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends build-essential ca-certificates devscripts \
    && apt-get build-dep -y kannel \
    && mkdir -p /usr/src/kannel-build \
    && cd /usr/src/kannel-build \
    && apt-get source kannel \
    && rm -rf /var/lib/apt/lists/*

COPY connectionless-wbxml-version.patch /tmp/connectionless-wbxml-version.patch

RUN kannel_source_dir="$(find /usr/src/kannel-build -mindepth 1 -maxdepth 1 -type d -name 'kannel-*' -print -quit)" \
    && test -n "${kannel_source_dir}" \
    && cd "${kannel_source_dir}" \
    && patch -p1 < /tmp/connectionless-wbxml-version.patch \
    && dpkg-buildpackage -b -uc -us

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

COPY --from=kannel-build /usr/src/kannel-build/kannel_*.deb /tmp/kannel-patched.deb

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       /tmp/kannel-patched.deb \
    && rm -f /tmp/kannel-patched.deb \
    && rm -rf /var/lib/apt/lists/*

COPY kannel.conf /etc/kannel/kannel.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 13000 13002 9200/udp 9201/udp

CMD ["/start.sh"]
