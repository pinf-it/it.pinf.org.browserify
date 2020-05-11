#!/usr/bin/env bash.origin.test via github.com/nightwatchjs/nightwatch

const LIB = require('bash.origin.lib').js;

describe("Suite", function () {

    if (LIB.FS_EXTRA.existsSync('dist')) {
        LIB.FS_EXTRA.removeSync('dist');
    }

    const server = LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "/dist/script.browser.js": {
                "@it.pinf.org.browserify # router/v0": {
                    "src": __dirname + "/script.js",
                    "dist": __dirname + "/dist/script.browser.js",
                    "expose": {
                        "window": "script_global"
                    },
                    "prime": true,
                    "files": {
                        "resources": __dirname + "/resources"
                    },
                    "inject": {
                        "dataLoader": function (url, done) {                            
                            fetch(url).then(function(response) {
                                return response.json();
                            }).then(done);
                        }
                    }
                }
            },
            "/": [
                '<script src="/dist/script.browser.js"></script>'
            ].join("\n"),
            "^\/resources\/": __dirname + "/dist/resources"
        }
    });

    it('Test', async function (client) {

        const PORT = (await server).config.port;

        client.url('http://localhost:' + PORT + '/');
        
if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);

        client.waitForElementPresent('BODY', 3000);

        client.executeAsync(function (done) {

            console.log("window.script_global", window.script_global);
            console.log("window.script_global_not_exported", window.script_global_not_exported);

            done([
                window.script_global,
                window.script_global_not_exported
            ]);
        }, [], function (result) {

            LIB.ASSERT.deepEqual(result.value, [ { data: { bar: 'baz' }, foo: 'bar' }, null ]);
        });
    });
});
