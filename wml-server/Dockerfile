FROM golang:1.26.6-alpine@sha256:af8d6740070b8906d12eae1c3e3ea0957fb63f492051ea05e354c38ef9fe88df AS build

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
