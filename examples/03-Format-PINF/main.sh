#!/usr/bin/env bash.origin.script

depend {
    "bundler": "it.pinf.org.browserify # bundler/v0"
}

[ ! -e "dist" ] || rm -Rf dist

CALL_bundler run "/dist/script.pinf.js" {
    "src": "$__DIRNAME__/../01-Format-Browser/script.js",
    "format": "pinf",
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
    const PINF = require("pinf-loader-js");
    const FS = require("fs");
    const ASSERT = require("assert");

    const pinfInstance = PINF.Loader();

    pinfInstance.sandbox("", {
        load: function (uri, loadedCallback) {
            const PINF = pinfInstance;
            var code = FS.readFileSync("./dist/script.pinf.js", "utf8");
            eval(code);
            loadedCallback();
        }
    }, function (sandbox) {

        var exports = sandbox.main();

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

    }, function (err) {
        console.error(err);
        process.exit(1);
    });
'

echo "---"

cat dist/script.pinf.js

echo ""
