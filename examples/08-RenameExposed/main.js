#!/usr/bin/env bash.origin.test via github.com/nightwatchjs/nightwatch
/*
module.config = {
    "browsers": [
        "chrome"
    ],
    "test_runner": "mocha"
}
*/

//console.log(">>>TEST_IGNORE_LINE:GET /dist/resources/insight.renderers.default/images/<<<");

const ASSERT = require("assert");

console.log(">>>TEST_IGNORE_LINE:^[\\d\\.]+\\s<<<");

describe("Suite", function() {

    require('bash.origin.lib').js.BASH_ORIGIN_EXPRESS.runForTestHooks(before, after, {
        "routes": {
            "/dist/script.browser.js": {
                "@it.pinf.org.browserify#s1": {
                    "src": __dirname + "/../01-Format-Browser/script.js",
                    "dist": __dirname + "/dist/script.browser.js",
                    "expose": {
                        "window": {
                            "script_global_renamed": "script_global"
                        }
                    },
                    "prime": true,
                    "files": {
                        "resources": __dirname + "/../01-Format-Browser/resources"
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

    it('Test', function (client) {

        client.url('http://localhost:' + process.env.PORT + '/').pause(500);
        
        client.waitForElementPresent('BODY', 3000);

        client.executeAsync(function (done) {

            console.log("window.script_global_renamed", window.script_global_renamed);
            console.log("window.script_global_not_exported_renamed", window.script_global_not_exported_renamed);

            done([
                window.script_global_renamed,
                window.script_global_not_exported_renamed
            ]);
        }, [], function (result) {

            ASSERT.deepEqual(result.value, [ { data: { bar: 'baz' }, foo: 'bar' }, null ]);
        });

        if (process.env.BO_TEST_FLAG_DEV) client.pause(60 * 60 * 24 * 1000);

    });
});
