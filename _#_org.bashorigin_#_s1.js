
const FS = require("fs-extra");
const BROWSERIFY = require("browserify");
const ASYNC = require("async");


function do_process (options, callback) {
    var CONFIG = options.CONFIG;

    options = options || {};
    options.variables = options.variables || {};

    function writeDist (code, callback) {
        if (!CONFIG.dist) {
            return callback(null);
        }
        
        return FS.outputFile(CONFIG.dist, code, "utf8", callback);
    }

    return FS.exists(CONFIG.src, function (exists) {
        if (!exists) {
            return callback(new Error("No source file found at '" + CONFIG.src + "'!"));
        }
        try {
            var opts = {};
            if (
                CONFIG.format === "pinf" ||
                CONFIG.format === "standalone"
            ) {
                opts.standalone = "main-module";
            };
            
            var browserify = BROWSERIFY(CONFIG.src, opts);

            browserify.transform(require.resolve('browserify-css'), {
                "minify": false,
                // Include files from 'node_modules'
                "global": true,
                // NOTE: Do NOT enable this as it breaks various bundles. You need to inject the CSS yourself.
                "autoInject": false
            });

            browserify.transform(require.resolve("babelify"), {
                presets: [
                    require.resolve("babel-preset-es2015")
                ]
            });

            /*
            // NOTE: Do NOT enable this as it breaks various bundles. You need to inject the CSS yourself.
            browserify.require(require.resolve('browserify-css/browser'), {
                //expose: 'browserify-css'
            });
            */

            return browserify.bundle(function (err, bundle) {
                if (err) {
                    console.error("BROWSERIFY ERROR:", err);
                    return callback(err);
                }

                bundle = bundle.toString();

                if (CONFIG.format === "pinf") {

                    // Make the bundle consumable by pinf.js.org

                    bundle = [
                        'PINF.bundle("", function(require) {',
                        '	require.memoize("/main.js", function(require, exports, module) {',
                                bundle,
                        '	});',
                        '});'
                    ].join("\n");
                }

                Object.keys(options.variables).forEach(function (name) {
                    bundle = bundle.replace(
                        new RegExp("%%%" + name + "%%%", "g"),
                        options.variables[name]
                    );
                });

                return writeDist(bundle, function (err) {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, bundle.toString());
                });
            });
        } catch (err) {
            return callback(err);
        }
    });
}

var q = ASYNC.queue(do_process, 3);

exports.forConfig = function (CONFIG) {

    function process (options, callback) {
        options.CONFIG = CONFIG;
        q.push(options, callback);
    }

    if (CONFIG.prime) {
        process({
            variables: CONFIG.variables || {}
        }, function (err, code) {
            if (err) {
                console.error(err);
            }
        });
    }


    return {
        "#io.pinf/middleware~s1": function (API) {

            return function (req, res, next) {

                return process({
                    variables: CONFIG.variables || {}
                }, function (err, code) {
                    if (err) {
                        return next(err);
                    }

                    res.writeHead(200, {
                        "Content-Type": "application/javascript"
                    });

                    res.end(code);
                });
            };
        },
        "#io.pinf/process~s1": process
    }
}
