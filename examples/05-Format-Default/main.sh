#!/usr/bin/env bash.origin.script

depend {
    "bundler": "@com.github/pinf-it/it.pinf.org.browserify#s1"
}

CALL_bundler run {
    "src": "$__DIRNAME__/../01-Format-Browser/script.js",
    "dist": "$__DIRNAME__/dist/script.js"
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
