#!/usr/bin/env bash

[ ! -e "dist" ] || rm -Rf dist

pinf.it .

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
