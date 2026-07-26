FROM golang:1.25-alpine@sha256:56961d79ea8129efddcc0b8643fd8a5416b4e6228cfd477e3fd61deb2672c587 AS build

WORKDIR /src
COPY go.mod ./
COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -buildvcs=false \
    -ldflags="-s -w -buildid=" \
    -o /out/wml-server \
    ./cmd/wml-server

FROM scratch

COPY --from=build --chown=65532:65532 /out/wml-server /wml-server

USER 65532:65532
EXPOSE 3000 3001
ENTRYPOINT ["/wml-server"]
