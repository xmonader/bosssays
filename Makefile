.PHONY: test build lint start clean

build:
	@node -e "require('./js/physics'); require('./js/map'); require('./js/notifications'); require('./js/fx'); require('./js/meta'); require('./js/game'); require('./js/render'); require('./js/audio'); console.log('build ok')"

test:
	npm test

lint:
	@node --check js/physics.js && node --check js/map.js && node --check js/notifications.js && node --check js/fx.js && node --check js/meta.js && node --check js/game.js && node --check js/render.js && node --check js/audio.js && node --check js/main.js && echo "lint ok"

start:
	npx --yes serve -l 4173 .

clean:
	@rm -rf node_modules
