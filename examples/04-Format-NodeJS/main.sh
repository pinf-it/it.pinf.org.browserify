#!/usr/bin/env bash.origin.script

depend {
    "bundler": "@com.github/pinf-it/it.pinf.org.browserify#s1"
}

CALL_bundler run {
    "src": "$__DIRNAME__/../01-Format-Browser/script.js",
    "dist": "$__DIRNAME__/dist/script.node.js",
    "format": "node"
}

node --eval '
    const ASSERT = require("assert");

    var exports = require("./dist/script.node.js");

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
'

echo "---"

cat dist/script.node.js

echo ""
