#!/usr/bin/env bash.origin.script

depend {
    "bundler": "@com.github/pinf-it/it.pinf.org.browserify#s1"
}

CALL_bundler run {
    "src": "$__DIRNAME__/../01-Format-Browser/script.js",
    "dist": "$__DIRNAME__/dist/script.pinf.js",
    "format": "pinf"
}

node --eval '
    const PINF = require("pinf-loader-js");
    const FS = require("fs");
    const ASSERT = require("assert");

    PINF.sandbox("", {
        load: function (uri, loadedCallback) {
            var code = FS.readFileSync("./dist/script.pinf.js", "utf8");
            eval(code);
            loadedCallback();
        }
    }, function (sandbox) {

        var exports = sandbox.main();

        process.stdout.write(JSON.stringify(exports, null, 4) + "\n");

        ASSERT.deepEqual(exports, {
            script_global: {
                foo: "bar"
            },
            script_global_not_exported: {
                foo: "bar",
                not: "exported"
            }
        });

    }, function (err) {
        console.error(err);
        process.exit(1);
    });
'

echo "---"

cat dist/script.pinf.js

echo ""
