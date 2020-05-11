#!/usr/bin/env bash.origin.script

depend {
    "bundler": "it.pinf.org.browserify # bundler/v0"
}

[ ! -e "dist" ] || rm -Rf dist

CALL_bundler run "/dist/script.js" {
    "src": "$__DIRNAME__/../01-Format-Browser/script.js",
    "files": {
        "resources": "$__DIRNAME__/../01-Format-Browser/resources"
    },
    "inject": {
        "dataLoader": (javascript () >>>
            function (url, done) {
                done(JSON.parse(require("fs").readFileSync(require("path").join("./dist", url), "utf8")));
            }
        <<<)
    }
}

node --eval '
    const FS = require("fs");
    const ASSERT = require("assert");

    var window = {};
    var global = {};
    var exports = {};
    var module = {
        exports: {}
    };

    var code = FS.readFileSync("./dist/script.js", "utf8");
    eval(code);

    process.stdout.write(JSON.stringify(window, null, 4) + "\n");
    process.stdout.write(JSON.stringify(global, null, 4) + "\n");
    process.stdout.write(JSON.stringify(exports, null, 4) + "\n");
    process.stdout.write(JSON.stringify(module, null, 4) + "\n");

    ASSERT.deepEqual(window, {});
    ASSERT.deepEqual(global, {});
    ASSERT.deepEqual(exports, {});
    ASSERT.deepEqual(module, {
        exports: {}
    });
'

echo "---"

cat dist/script.js

echo ""
