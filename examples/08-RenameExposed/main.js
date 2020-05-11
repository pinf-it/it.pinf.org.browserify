#!/usr/bin/env bash.origin.test via github.com/nightwatchjs/nightwatch
/*
module.config = {
    "browsers": [
        "chrome"
    ],
    "test_runner": "mocha"
}
*/

console.log(">>>TEST_IGNORE_LINE:^[\\d\\.]+\\s<<<");

const LIB = require('bash.origin.lib').js;

describe("Suite", function() {

    const server = LIB.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "/dist/script.browser.js": {
                "gi0.PINF.it/build/v0 # /dist # /script.browser.js": {
                    "@it.pinf.org.browserify # router/v1": {
                        "src": __dirname + "/../01-Format-Browser/script.js",
                        "expose": {
                            "window": {
                                "script_global_renamed": "script_global"
                            }
                        },
                        "files": {
                            "resources": __dirname + "/../01-Format-Browser/resources"
                        },
                        "inject": {
                            "dataLoader": function /* CodeBlock */ () {
                                function dataLoader (url, done) {
                                    fetch(url).then(function(response) {
                                        return response.json();
                                    }).then(done);
                                }
                            }
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

        client.url('http://localhost:' + PORT + '/').pause(500);

if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);

        client.waitForElementPresent('BODY', 3000);

        client.executeAsync(function (done) {

            console.log("window.script_global_renamed", window.script_global_renamed);
            console.log("window.script_global_not_exported_renamed", window.script_global_not_exported_renamed);

            done([
                window.script_global_renamed,
                window.script_global_not_exported_renamed
            ]);
        }, [], function (result) {

            LIB.ASSERT.deepEqual(result.value, [ { data: { bar: 'baz' }, foo: 'bar' }, null ]);
        });

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);

    });
});
