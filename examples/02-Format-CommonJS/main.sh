#!/usr/bin/env bash.origin.script

depend {
    "bundler": "@com.github/pinf-it/it.pinf.org.browserify#s1"
}

CALL_bundler run {
    "src": "$__DIRNAME__/../01-Format-Browser/script.js",
    "dist": "$__DIRNAME__/dist/script.cjs.js",
    "expose": {
        "exports": "script_global"
    },
    "files": {
        "resources": "$__DIRNAME__/../01-Format-Browser/resources"
    },
    "inject": {
        "dataLoader": (javascript () >>>
            function (url, done) {
                done(JSON.parse(require("fs").readFileSync(require("path").join(__dirname, url), "utf8")));
            }
        <<<)
    }
}

node --eval '
    const ASSERT = require("assert");
    const script = require("./dist/script.cjs.js");

    process.stdout.write(JSON.stringify(script, null, 4) + "\n");

    ASSERT.deepEqual(script, {
        script_global: {
            foo: "bar",
            "data": {
                "bar": "baz"
            }
        }
    });
'

echo "---"

cat dist/script.cjs.js

echo ""
