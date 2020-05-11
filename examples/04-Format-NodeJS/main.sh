#!/usr/bin/env bash.origin.script

depend {
    "bundler": "it.pinf.org.browserify # bundler/v0"
}

[ ! -e "dist" ] || rm -Rf dist

CALL_bundler run "/dist/script.node.js" {
    "src": "$__DIRNAME__/../01-Format-Browser/script.js",
    "format": "node",
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
    const ASSERT = require("assert");

    var exports = require("./dist/script.node.js");

    process.stdout.write(JSON.stringify(exports, null, 4) + "\n");

    ASSERT.deepEqual(exports, {
        script_global: {
            foo: "bar",
            data: {
                "bar": "baz"
            }
        },
        script_global_not_exported: {
            foo: "bar",
            not: "exported",
            data: {
                "bar": "baz"
            }
        }
    });
'

echo "---"

cat dist/script.node.js

echo ""
