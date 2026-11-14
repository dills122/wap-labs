FROM golang:1.26.11-alpine@sha256:ae52b5bc6ed045a9ed26ab03dc19327a802a9cc9aa8b27ed57f5c6b60579b0bb AS build

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
