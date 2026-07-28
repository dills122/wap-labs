FROM ubuntu:22.04@sha256:0e0a0fc6d18feda9db1590da249ac93e8d5abfea8f4c3c0c849ce512b5ef8982 AS kannel-build

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

FROM ubuntu:22.04@sha256:0e0a0fc6d18feda9db1590da249ac93e8d5abfea8f4c3c0c849ce512b5ef8982 AS runtime-base

ENV DEBIAN_FRONTEND=noninteractive

COPY --from=kannel-build /usr/src/kannel-build/kannel_*.deb /tmp/kannel-patched.deb

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       /tmp/kannel-patched.deb \
    && rm -f /tmp/kannel-patched.deb \
    && rm -rf /var/lib/apt/lists/*

FROM runtime-base AS development

COPY kannel.conf /etc/kannel/kannel.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 13000 13002 9200/udp 9201/udp

CMD ["/start.sh"]

FROM runtime-base AS production

RUN groupadd --gid 10001 waves-kannel \
    && useradd --uid 10001 --gid 10001 --no-create-home --home-dir /nonexistent \
       --shell /usr/sbin/nologin waves-kannel \
    && install -d -m 0750 -o 10001 -g 10001 /run/kannel /var/log/kannel

COPY --chown=10001:10001 production/kannel.conf.tmpl /etc/kannel/kannel.conf.tmpl
COPY --chown=10001:10001 production/entrypoint.sh /usr/local/bin/waves-kannel-entrypoint
COPY --chown=10001:10001 production/healthcheck.sh /usr/local/bin/waves-kannel-healthcheck

RUN chmod 0555 /usr/local/bin/waves-kannel-entrypoint /usr/local/bin/waves-kannel-healthcheck \
    && chmod 0444 /etc/kannel/kannel.conf.tmpl

USER 10001:10001
EXPOSE 9200/udp
ENTRYPOINT ["/usr/local/bin/waves-kannel-entrypoint"]
