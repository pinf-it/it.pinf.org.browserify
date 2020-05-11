#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:Browserslist: caniuse-lite is outdated.<<<"

depend {
    "bundler": "it.pinf.org.browserify # bundler/v0"
}

[ ! -e "dist" ] || rm -Rf dist

CALL_bundler run "dist/script.cjs.js" {
    "src": "$__DIRNAME__/script.js",
    "expose": {
        "exports": "foo"
    },
    "babel": {
        "presets": {
            "@babel/preset-env": {
                # @see https://github.com/browserslist/browserslist
                "targets": "last 1 Firefox versions"
            }
        }
    }
}

node --eval '
    const ASSERT = require("assert");
    const script = require("./dist/script.cjs.js");

    ASSERT.equal(typeof script.foo, "function");

    async function main () {
        const result = await script.foo();

        console.log("RESULT:", result);

        ASSERT.equal(result, "bar");
    }
    main();
'

echo "---"

cat dist/script.cjs.js

echo ""
