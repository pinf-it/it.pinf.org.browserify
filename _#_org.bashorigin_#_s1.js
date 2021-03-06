

// TODO: Do this as part of a first-run hook.
const PATH = require("path");
const NFS = require("fs");
const CHILD_PROCESS = require("child_process");
if (!NFS.existsSync(PATH.join(__dirname, '.~lib.json'))) {
    if (NFS.existsSync(PATH.join(__dirname, 'node_modules/.bin/lib.json'))) {
        CHILD_PROCESS.execSync('lib.json from node_modules > .~lib.json', {
            cwd: __dirname
        });
    } else {
        CHILD_PROCESS.execSync('lib.json from node_modules > .~lib.json', {
            cwd: __dirname
        });
    }
}


const LIB = require("bash.origin.lib").forPackage(__dirname).js;


const FS = LIB.FS_EXTRA;
const BROWSERIFY = LIB.BROWSERIFY;
const ASYNC = LIB.ASYNC;
const CRYPTO = LIB.crypto;
const CODEBLOCK = LIB.CODEBLOCK;


function do_process (options, callback) {
    var CONFIG = options.CONFIG;

    options = options || {};
    options.variables = options.variables || {};

    function writeDist (code, callback) {
        if (!CONFIG.dist) {
            return callback(null);
        }
        return FS.outputFile(CONFIG.dist, code, "utf8", function (err) {
            if (err) return callback(err);

            if (!CONFIG.files) {
                return callback(null);
            }

            // Copy files
            Object.keys(CONFIG.files).forEach(function (filepath) {

                var sourceBasePath = CONFIG.files[filepath];
                var targetBasePath = PATH.join(CONFIG.dist, "..", filepath);

                FS.copySync(sourceBasePath, targetBasePath);
            });

            return callback(null);
        });
    }

    function getCode (callback) {
        try {
            var ignorePaths = [];
            var code = null;

            function finalize (baseDir) {
/*
                // TODO: Do this via a browserify plugin
                var re = /require\.inline\(['"]([^"']+)["']\)/g;
                var m;
                while ( (m = re.exec(code)) ) {
                    var path = null;
                    if (/^\./.test(m[1])) {
                        path = PATH.join(baseDir, m[1]);
                    } else {
                        path = PATH.join(
                            LIB.RESOLVE.sync(m[1].split("/")[0] + "/package.json", {
                                basedir: baseDir
                            }),
                            '..',
                            m[1].replace(/^[^\/]+\//, '')
                        );
                    }
                    ignorePaths.push(path);
                    code = code.replace(new RegExp(LIB.ESCAPE_REGEXP(m[0]), 'g'), `require("${path}")`);
                }
                CONFIG.noParsePaths = CONFIG.noParsePaths || [];
                CONFIG.noParsePaths = CONFIG.noParsePaths.concat(ignorePaths);
*/
                return callback(null, code);
            }

            if (CONFIG.code && !CONFIG.src) {
                if (typeof CONFIG.code === "function") {
                    code = CONFIG.code.toString().replace(/^function[^\()]*\(\) \{\n([\s\S]+)\n\s*\}$/, "$1");
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
                return finalize(process.cwd());
            } else
            if (CONFIG.src) {
                
                if (/^\//.test(CONFIG.src)) {

                    if (FS.statSync(CONFIG.src).isDirectory()) {
                        try {
                            CONFIG.src = LIB.RESOLVE.sync(CONFIG.src, {
                                basedir: CONFIG.src
                            });
                        } catch (err) {
                        }
                    }
                } else
                if (/^\./.test(CONFIG.src)) {
                    CONFIG.src = PATH.join((CONFIG.basedir) ? CONFIG.basedir : process.cwd(), CONFIG.src);
                } else {

                    var resolvedPath = null;
                    var searchPath = CONFIG.src;
                    if (/\//.test(searchPath)) {
                        searchPath = CONFIG.src.split("/")[0] + "/package.json";                        
                    }

                    if (CONFIG.baseDir) {
                        try {
                            resolvedPath = LIB.RESOLVE.sync(searchPath, {
                                basedir: CONFIG.baseDir
                            });
                        } catch (err) {
                        }
                    }
                    if (!resolvedPath) {
                        resolvedPath = LIB.RESOLVE.sync(searchPath, {
                            basedir: __dirname
                        });
                    }

                    if (searchPath !== CONFIG.src) {
                        CONFIG.src = PATH.join(
                            resolvedPath,
                            "..",
                            CONFIG.src.replace(/^[^\/]+\/?/, '')
                        );
                    } else {
                        CONFIG.src = resolvedPath;
                    }
                }

                return FS.exists(CONFIG.src, function (exists) {        
                    if (!exists) {
                        return callback(new Error("No source file found at '" + CONFIG.src + "'!"));
                    }

                    return FS.readFile(CONFIG.src, 'utf8', function (err, data) {
                        if (err) {
                            console.error("CONFIG.src", CONFIG.src);
                            return callback(err);
                        }

                        code = data;
                        return finalize(PATH.dirname(CONFIG.src));
                    });
                });
            }
            throw new Error("No 'code' nor 'src' found!");
        } catch (err) {
            return callback(err);
        }
    }

    return getCode(function (err, code) {
        if (err) return callback(err);


        var tmpPath = null;
        if (CONFIG.src) {
            tmpPath = PATH.join(
                CONFIG.src,
                "..",
                // TODO: Derive ID based on some kind of context ID instead of code which changes.
                ".~rt_it.pinf.org.browserify_src_" + CRYPTO.createHash('sha1').update(code).digest('hex') + ".js"
            );
        } else
        if (CONFIG.basedir) {
            tmpPath = PATH.join(
                CONFIG.basedir,
                // TODO: Derive ID based on some kind of context ID instead of code which changes.
                ".~rt_it.pinf.org.browserify_src_" + CRYPTO.createHash('sha1').update(code).digest('hex') + ".js"
            );
        } else {
            tmpPath = PATH.join(
                process.cwd(),
                // TODO: Derive ID based on some kind of context ID instead of code which changes.
                ".~rt_it.pinf.org.browserify_src_" + CRYPTO.createHash('sha1').update(code).digest('hex') + ".js"
            );
        }
        FS.outputFileSync(tmpPath, code, "utf8");


        FS.readdirSync(PATH.join(tmpPath, "..")).forEach(function (path) {
            if (!/^\.~rt_/.test(path)) {
                return;
            }
            var stat = FS.statSync(PATH.join(tmpPath, "..", path));
            if ((Date.now() - stat.mtime.getTime()) > (60 * 5 * 1000)) {
                FS.removeSync(PATH.join(tmpPath, "..", path));
            }
        });
        var sourcePath = tmpPath;


        try {
            var opts = {
                basedir: process.cwd(),
                fullPaths: false
            };

            if (typeof CONFIG.basedir !== "undefined") {
                opts.basedir = CONFIG.basedir;
            }
            opts.paths = require("bash.origin.lib").forPackage(opts.basedir).NODE_PATH;

            opts.noParse = CONFIG.noParsePaths;

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
            if (CONFIG.format === "node") {
                opts.node = true;
                opts.standalone = "main-module";
            } else
            if (CONFIG.format === "standalone") {
                console.error("DEPRECATED: 'format = \"standalone\"' should no longer be used. Use 'expose.window' or 'expose.exports' instead.");
                opts.standalone = "main-module";
            }

            if (CONFIG.expose) {
                if (opts.node) {
                    throw new Error("'format=node' and 'expose' are mutually exclusive");
                }
                if (Object.keys(CONFIG.expose).length > 1) {
                    throw new Error("More than once 'expose' key!");
                }
                if (CONFIG.expose.window) {
                    // NOTE: We do not use the browserify standalone feature out of the box
                    //       as we want to support exposing multiple exports as well as expose
                    //       named exports instead of just `module.exports` of the entry module.
                    if (opts.standalone && opts.standalone !== "main-module") {
                        console.error("WARNING: Setting 'standalone = \"main-module\"' due to 'expose.window' (previous value '" + opts.standalone + "').");
                    }
                    opts.standalone = "main-module";
                    if (
                        (
                            typeof CONFIG.expose.window === "string" &&
                            CONFIG.expose.window.indexOf(",") !== -1
                        ) ||
                        Array.isArray(CONFIG.expose.window)
                    ) {
                        throw new Error("TODO: Implement exposure of multiple exports");
                    }
                } else
                if (CONFIG.expose.exports) {
                    if (opts.standalone && opts.standalone !== "main-module") {
                        console.error("WARNING: Setting 'standalone = \"main-module\"' due to 'expose.exports' (previous value '" + opts.standalone + "').");
                    }
                    opts.standalone = "main-module";
                } else {
                    throw new Error("'CONFIG.expose' contains unknown key!");
                }
            }

            var browserify = BROWSERIFY(sourcePath, opts);

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



            function makeBabelConfig () {

                const presets = [
                    [
                        require("@babel/preset-env"),
                        LIB.LODASH.merge(
                            {
                                ignoreBrowserslistConfig: true
                            },
                            LIB.LODASH.get(CONFIG, ['babel', 'presets', '@babel/preset-env'], {})
                        )
                    ]
                ];

                const plugins = [
                    require("@babel/plugin-transform-arrow-functions"),
                    require("@babel/plugin-transform-block-scoping"),
                    require("@babel/plugin-transform-template-literals")
                ];
            
                return {
                    presets,
                    plugins,
                    comments: false,
                    minified: false,
                    sourceMaps: false,
                    compact: false,
                    ignore: [
                        // TODO: Make this configurable
                        "explicit-unsafe-eval.js"
                    ]
                };                
            }

            browserify.transform(LIB.resolve("babelify"), makeBabelConfig());
            
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

                if (CONFIG.strictMode === false) {
                    bundle = bundle.replace(/(function\(require,module,exports\)\{)\n"use strict";/g, '$1');
                }
                if (CONFIG.renameRequire) {
                    // TODO: Do this more reliably.
                    bundle = bundle.replace(/([,;\(:\s])require([\s:\(\);,])/g, '$1_require_$2');
                }

                var injectionCode = [];
                if (CONFIG.inject) {
                    Object.keys(CONFIG.inject).forEach(function (name) {

                        var val = CONFIG.inject[name];
                        if (
                            typeof val === "object" &&
                            val['.@'] === 'github.com~0ink~codeblock/codeblock:Codeblock'
                        ) {
                            val = CODEBLOCK.thawFromJSON(val).getCode();
                        } else {
                            val = val.toString();
                        }

                        injectionCode.push("var " + name + " = " + val + ";");
                    });
                }
                injectionCode = injectionCode.join("\n");

                if (CONFIG.format === "pinf") {
                    // Make the bundle consumable by pinf.js.org
                    bundle = [
                        // TODO: Move this wrapper into a browserify plugin.
                        'PINF.bundle("", function(__require) {',
                        '	__require.memoize("/main.js", function (_require, _exports, _module) {',
                                'var bundle = { require: _require, exports: _exports, module: _module };',
                                'var exports = undefined;',
                                'var module = undefined;',
                                'var define = function (deps, init) {',
                                    // TODO: Only export what is in 'CONFIG.expose.exports'.
                                    '_module.exports = init();',
                                '}; define.amd = true;',

                                // DEPRECATED: 'pmodule' should no longer be used. Use 'bundle.module' instead.
                                '       var pmodule = bundle.module;',

                                injectionCode,
                                bundle,
                        '	});',
                        '});'
                    ].join("\n");
                } else
                if (CONFIG.format === "node") {

                    // TODO: Only export what is in 'CONFIG.expose.exports'.
                    bundle = [
                        injectionCode,
                        bundle,
                    ].join("\n");

                } else
                if (
                    opts.standalone === "main-module" &&
                    CONFIG.expose
                ) {
                    // Now that we have the main module exports we expose the requested properties.

                    function normalizeExposed (exposed) {
                        if (typeof exposed === 'string') {
                            var name = exposed;
                            exposed = {};
                            exposed[name] = name;
                        }
                        return Object.keys(exposed).map(function (name) {
                            return [name, exposed[name]];
                        });
                    }

                    if (CONFIG.expose.window) {
                        bundle = [
                            // TODO: Move this wrapper into a browserify plugin.
                            '((function (_require, _exports, _module) {',
                                'var bundle = { require: _require, exports: _exports, module: _module };',
                                'var exports = undefined;',
                                'var module = undefined;',
                                'var define = function (deps, init) {',
                                    'var exports = init();',
                                    JSON.stringify(normalizeExposed(CONFIG.expose.window)) + '.forEach(function (expose) {',
                                        'if (typeof window !== "undefined") {',
                                            'window[expose[0]] = exports[expose[1]];',
                                        '} else if (typeof self !== "undefined") {',
                                            'self[expose[0]] = exports[expose[1]];',
                                        '}',
                                    '});',
                                '}; define.amd = true;',
                                injectionCode,
                                bundle,
                            '})((typeof require !== "undefined" && require) || undefined, (typeof exports !== "undefined" && exports) || undefined, (typeof module !== "undefined" && module) || undefined))'
                        ].join("\n");
                    } else
                    if (CONFIG.expose.exports) {
                        bundle = [
                            // TODO: Move this wrapper into a browserify plugin.
                            '((function (_require, _exports, _module) {',
                                'var bundle = { require: _require, exports: _exports, module: _module };',
                                'if (typeof bundle.exports !== "object") throw new Error("The \'exports\' variable must be set!");',
                                'var exports = undefined;',
                                'var module = undefined;',
                                'var define = function (deps, init) {',
                                    'var exports = init();',
                                    JSON.stringify(normalizeExposed(CONFIG.expose.exports)) + '.forEach(function (expose) {',
                                        'bundle.exports[expose[0]] = exports[expose[1]];',
                                    '});',
                                '}; define.amd = true;',
                                injectionCode,
                                bundle,
                            '})((typeof require !== "undefined" && require) || undefined, (typeof exports !== "undefined" && exports) || undefined, (typeof module !== "undefined" && module) || undefined))'
                        ].join("\n");
                    }
                } else {
                    bundle = [
                        // TODO: Move this wrapper into a browserify plugin.
                        '((function (require, exports, module) {',
                            'var bundle = { require: require, exports: exports, module: module };',

                            // DEPRECATED: 'sandbox' being set to 'exports'. Use 'bundle.exports' instead.
                            //'if (typeof exports !== "undefined") var sandbox = bundle.exports;',

                            injectionCode,
                            bundle,
                        '})((typeof require !== "undefined" && require) || undefined, (typeof exports !== "undefined" && exports) || undefined, (typeof module !== "undefined" && module) || undefined))'
                    ].join("\n");
                }

                // TODO: Replace these as part of a browserify plugin.
                Object.keys(options.variables).forEach(function (name) {
                    if (typeof options.variables[name] === "object") {
                        bundle = bundle.replace(
                            // TODO: Make delimiter configurable.
                            new RegExp("\"%%%" + name + "%%%\"", "g"),
                            '"' + JSON.stringify(options.variables[name]).replace(/"/g, '\\"') + '"'
                        );
                    }
                    bundle = bundle.replace(
                        // TODO: Make delimiter configurable.
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


if (require.main === module) {

    var config = JSON.parse(process.argv[2]);
    var api = exports.forConfig(config);

    if (!config.prime) {
        api['#io.pinf/process~s1']({
            variables: config.variables || {}
        }, function (err, code) {            
            if (err) {
                console.error(err);
                process.exit(1);
            }
            process.exit(0);
        });
    }
}
