PLUGIN_ID ?= com.mattermost.ladder-game
VERSION ?= 0.1.0
BUNDLE_NAME ?= $(PLUGIN_ID)-$(VERSION).tar.gz

.PHONY: all build build-all dist clean test webapp

all: dist

test:
	go test -v ./server/...

server:
	@mkdir -p server/dist
	go build -o server/dist/plugin-$(shell go env GOOS)-$(shell go env GOARCH) ./server

server-all:
	@mkdir -p server/dist
	GOOS=linux GOARCH=amd64 go build -o server/dist/plugin-linux-amd64 ./server
	GOOS=darwin GOARCH=amd64 go build -o server/dist/plugin-darwin-amd64 ./server
	GOOS=darwin GOARCH=arm64 go build -o server/dist/plugin-darwin-arm64 ./server
	GOOS=windows GOARCH=amd64 go build -o server/dist/plugin-windows-amd64.exe ./server

webapp:
	@cd webapp && npm install && npm run build

build: server webapp

build-all: server-all webapp

dist: build-all
	@rm -rf dist/bundle
	@mkdir -p dist/bundle/server/dist
	@mkdir -p dist/bundle/webapp/dist
	@mkdir -p dist/bundle/assets
	@cp plugin.json dist/bundle/
	@cp assets/* dist/bundle/assets/
	@cp server/dist/plugin-* dist/bundle/server/dist/
	@cp webapp/dist/main.js dist/bundle/webapp/dist/
	@cd dist/bundle && COPYFILE_DISABLE=1 tar --no-xattrs -czf ../$(BUNDLE_NAME) plugin.json assets server webapp
	@rm -rf dist/bundle
	@echo "배포 파일 생성 완료: dist/$(BUNDLE_NAME)"

clean:
	rm -rf dist/
	rm -rf server/dist/
	rm -rf webapp/dist/
