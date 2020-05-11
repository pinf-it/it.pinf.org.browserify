#!/usr/bin/env bash.origin.script

function EXPORTS_run {

#    # TODO: Use a helper module to do this kind of stuff easily.
#    vars=$(node --eval '
#        const config = JSON.parse(process.argv[1]);
#        const vars = {};
#        vars.dist = config.dist; delete config.dist;
#        vars.config = config;
#        Object.keys(vars).forEach(function (name) {
#            process.stdout.write(`var_${name}=\'${JSON.stringify(vars[name])}\'\n`);
#        });
#    ' "$@")
#    eval "${vars}"

    doc={
        "# +1": "gi0.PINF.it/core/v0",
        "# +2": {
            "browserify": "${__DIRNAME__}/../gi0.PINF.it/#!inf.json"
        },
        ":build:": "browserify @ build/v0",

        "gi0.PINF.it/core/v0 @ # :build: write() ${1}": ${2}
    }

    echo "${doc}" | pinf.it ---
}
