FROM golang:1.25.13-alpine@sha256:844b27705f54e73773e0f9bc3c780633b9d7f4b4831bf35cdad02a81a4c80bd0 AS build

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
