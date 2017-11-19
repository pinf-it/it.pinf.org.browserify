

const LIB = require("bash.origin.workspace").forPackage(__dirname).LIB;


const PATH = LIB.PATH;
const FS = LIB.FS_EXTRA;
const BROWSERIFY = LIB.BROWSERIFY;
const ASYNC = LIB.ASYNC;
const CRYPTO = LIB.CRYPTO;
const CODEBLOCK = LIB.CODEBLOCK;


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

    if (CONFIG.code && !CONFIG.src) {

        var code = null;
        if (typeof CONFIG.code === "function") {
            code = CONFIG.code.toString().replace(/^function \(\) \{\n([\s\S]+)\n\s*\}$/, "$1");
        } else
        if (
            typeof CONFIG.code === "object" ||
            (
                typeof CONFIG.code === "string" &&
                /^\{/.test(CONFIG.code)
            )
        ) {
            var thawed = CODEBLOCK.thawFromJSON(CONFIG.code);
            if (typeof thawed.getCode === "function") {
                code = thawed.getCode();
            } else {
                code = ("" + thawed);
            }
        } else {
            code = CONFIG.code;
        }

        var tmpPath = null;
        if (CONFIG.basedir) {
            tmpPath = PATH.join(
                CONFIG.basedir,
                // TODO: Derive ID based on some kind of context ID instead of code which changes.
                "~.rt_it.pinf.org.browserify_src_" + CRYPTO.createHash('sha1').update(code).digest('hex') + ".js"
            );
            FS.readdirSync(PATH.join(tmpPath, "..")).forEach(function (path) {
                if (!/^~\.rt_/.test(path)) {
                    return;
                }
                var stat = FS.statSync(PATH.join(tmpPath, "..", path));
                if ((Date.now() - stat.mtime.getTime()) > (60 * 5 * 1000)) {
                    FS.removeSync(PATH.join(tmpPath, "..", path));
                }
            });
        } else {
            tmpPath = PATH.join(
                process.cwd(),
                ".rt/it.pinf.org.browserify/src",
                // TODO: Derive ID based on some kind of context ID instead of code which changes.
                CRYPTO.createHash('sha1').update(code).digest('hex') + ".js"
            );
        }

        FS.outputFileSync(tmpPath, code, "utf8");
        CONFIG.src = tmpPath;
    }    

    return FS.exists(CONFIG.src, function (exists) {        
        if (!exists) {
            return callback(new Error("No source file found at '" + CONFIG.src + "'!"));
        }
        try {
            var opts = {
                basedir: process.cwd()                
            };

            if (typeof CONFIG.basedir !== "undefined") {
                opts.basedir = CONFIG.basedir;
            }
            opts.paths = [];
            var remaining = opts.basedir;
            while (true) {
                opts.paths.push(PATH.join(remaining, "node_modules"));
                var path = PATH.dirname(remaining);
                if (path === remaining) {
                    break;
                }
                remaining = path;
            }

            if (CONFIG.format === "pinf") {
                opts.standalone = "main-module";
                if (CONFIG.expose) {
                    throw new Error("TODO: Implement 'expose' for PINF bundle format");
                }
            } else
            if (CONFIG.format === "standalone") {
                // TODO: Deprecate in favour of 'CONFIG.expose.window'?
                opts.standalone = "main-module";
            }
            if (
                CONFIG.expose &&
                CONFIG.expose.window
            ) {
                // NOTE: We do not use the browserify standalone feature out of the box
                //       as we want to support exposing multiple exports as well as expose
                //       named exports instead of just `module.exports` of the entry module.
                opts.standalone = "main-module";
                if (
                    CONFIG.expose.window.indexOf(",") !== -1 ||
                    Array.isArray(CONFIG.expose.window)
                ) {
                    throw new Error("TODO: Implement exposure of multiple exports");
                }
            }

            var browserify = BROWSERIFY(CONFIG.src, opts);

            browserify.transform(LIB.resolve('browserify-css'), {
                "minify": false,
                // Include files from 'node_modules'
                "global": true,
                // NOTE: Do NOT enable this as it breaks various bundles. You need to inject the CSS yourself.
                "autoInject": false
            });

            if (process.VERBOSE) {
                browserify.transform(function (file) {
                    console.log("[it.pinf.org.browserify] Transforming file", file);
                    return LIB.THROUGH2(function (buf, enc, next) {
                        //var data = buf.toString('utf8');
                        this.push(buf);
                        next();
                    });
                });
            }

            browserify.transform(LIB.resolve("babelify"), {
                presets: [
                    LIB.resolve("babel-preset-es2015")
                ]
            });

            /*
            // NOTE: Do NOT enable this as it breaks various bundles. You need to inject the CSS yourself.
            browserify.require(LIB.resolve('browserify-css/browser'), {
                //expose: 'browserify-css'
            });
            */

            return browserify.bundle(function (err, bundle) {
                if (err) {
                    console.error("CONFIG.src", CONFIG.src);
                    console.error("BROWSERIFY ERROR:", err);
                    return callback(err);
                }

                bundle = bundle.toString();

                if (CONFIG.format === "pinf") {
                    // Make the bundle consumable by pinf.js.org
                    bundle = [
                        'PINF.bundle("", function(require) {',
                        '	require.memoize("/main.js", function (require, exports, module) {',
                        '       var pmodule = module;',
                                bundle,
                        '	});',
                        '});'
                    ].join("\n");
                } else
                if (
                    opts.standalone === "main-module" &&
                    CONFIG.expose &&
                    CONFIG.expose.window
                ) {
                    // Now that we have the main module exports we expose the requested properties.
                    bundle = [
                        '((function () {',
                            bundle,
                            'var mainModule = window.mainModule;',
                            'delete window.mainModule;',
                            '[' + JSON.stringify(CONFIG.expose.window) + '].forEach(function (name) {',
                                'window[name] = mainModule[name];',
                            '});',
                        '})())'
                    ].join("\n");
                }

                // TODO: Replace these as part of a browserify plugin.
                Object.keys(options.variables).forEach(function (name) {
                    if (typeof options.variables[name] === "object") {
                        bundle = bundle.replace(
                            new RegExp("\"%%%" + name + "%%%\"", "g"),
                            '"' + JSON.stringify(options.variables[name]).replace(/"/g, '\\"') + '"'
                        );
                    }
                    bundle = bundle.replace(
                        new RegExp("%%%" + name + "%%%", "g"),
                        options.variables[name]
                    );
                });

                return writeDist(bundle, function (err) {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, bundle);
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

    var deferred = {};
    deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    if (CONFIG.prime) {
        process({
            variables: CONFIG.variables || {}
        }, function (err, code) {            
            if (err) {
                //console.error(err);
                deferred.reject(err);
                throw err;
            }

            return deferred.resolve(code);
        });
    } else {
        deferred.resolve(null);
    }

    var middleware = function (req, res, next) {

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

    return {
        "#io.pinf/middleware~s2": function (API) {

            return deferred.promise.then(function () {
                
                return middleware;
            });
        },
        "#io.pinf/middleware~s1": function (API) {

            return middleware;
        },
        "#io.pinf/process~s1": process
    }
}
