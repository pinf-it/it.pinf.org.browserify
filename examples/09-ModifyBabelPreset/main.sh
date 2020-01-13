#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:Browserslist: caniuse-lite is outdated.<<<"

depend {
    "bundler": "@com.github/pinf-it/it.pinf.org.browserify#s1"
}

CALL_bundler run {
    "src": "$__DIRNAME__/script.js",
    "dist": "$__DIRNAME__/dist/script.cjs.js",
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
