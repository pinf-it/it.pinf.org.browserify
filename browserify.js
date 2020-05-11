
const PKG = require("bash.origin.lib").forPackage(__dirname);
const LIB = PKG.js;

const Promise = LIB.BLUEBIRD;
const PATH = LIB.PATH;
let FS = LIB.FS_EXTRA;
const BROWSERIFY = LIB.BROWSERIFY;
const ASYNC = LIB.ASYNC;
const CRYPTO = LIB.CRYPTO;
const CODEBLOCK = LIB.CODEBLOCK;


async function do_process (CONFIG, options) {
    options = options || {};

    if (options.LIB) {
        FS = options.LIB.FS;
        LIB.FS = FS;
        LIB.FS_EXTRA = FS;
    }

//console.error('[browserify] CONFIG...:', CONFIG);

    CONFIG.variables = CONFIG.variables || {};
    CONFIG.basedir = (CONFIG.basedir && LIB.PATH.resolve(process.cwd(), CONFIG.basedir)) || process.cwd();

    const inputPaths = {};
    const outputPaths = {};

    async function getCode () {
        let code = null;

/*
        var ignorePaths = [];
        function finalize (baseDir) {
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
            return callback(null, code);
        }
*/

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

//console.log("BROWSERIFY CODE 111::", code);   

            //return finalize(process.cwd());
            return code;
        } else
        if (CONFIG.src) {

            if (/^\//.test(CONFIG.src)) {

                if ((await FS.stat(CONFIG.src)).isDirectory()) {
                    try {
                        CONFIG.src = LIB.RESOLVE.sync(CONFIG.src, {
                            basedir: CONFIG.src
                        });
                    } catch (err) {
                    }
                }
            } else
            if (/^\./.test(CONFIG.src)) {

                CONFIG.src = PATH.resolve(CONFIG.basedir, CONFIG.src);

            } else {

                var resolvedPath = null;
                var searchPath = CONFIG.src;
                if (/\//.test(searchPath)) {
                    searchPath = CONFIG.src.split("/")[0] + "/package.json";                        
                }

                if (CONFIG.basedir) {
                    try {
                        resolvedPath = await LIB.RESOLVE.sync(searchPath, {
                            basedir: CONFIG.basedir
                        });
                    } catch (err) {}
                }
                if (!resolvedPath) {
                    resolvedPath = await LIB.RESOLVE.sync(searchPath, {
                        basedir: __dirname
                    });
                }
                if (!resolvedPath) {
                    throw new Error(`Could not resolve '${searchPath}' against '${CONFIG.basedir}' nor '${__dirname}'!`);
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

            inputPaths[CONFIG.src] = true;
            if (options.result) options.result.inputPaths[CONFIG.src] = true;


            if (!(await FS.exists(CONFIG.src))) {
                console.error('CONFIG:', CONFIG);
                throw new Error(`No source file found at '${CONFIG.src}'!`);
            }

            try {
                code = await FS.readFile(CONFIG.src, 'utf8');
            } catch (err) {
                console.error("CONFIG.src", CONFIG.src);
                throw err;
            }

            //return finalize(PATH.dirname(CONFIG.src));
            return code;
        }
        console.error('CONFIG:', CONFIG);
        throw new Error("No 'code' nor 'src' property set!");
    }

    const code = await getCode();

    var opts = {
        basedir: CONFIG.basedir,
        fullPaths: false
    };

    var tmpPath = null;
    if (CONFIG.src) {
        tmpPath = PATH.join(
            CONFIG.src,
            "..",
            // TODO: Derive ID based on some kind of context ID instead of code which changes.
            ".~rt_it.pinf.org.browserify_src_" + CRYPTO.createHash('sha1').update(code).digest('hex') + ".js"
        );
    } else {
        tmpPath = PATH.join(
            opts.basedir,
            // TODO: Derive ID based on some kind of context ID instead of code which changes.
            ".~rt_it.pinf.org.browserify_src_" + CRYPTO.createHash('sha1').update(code).digest('hex') + ".js"
        );
    }
    await FS.outputFile(tmpPath, code, "utf8");

/*
    // TODO: Is this still needed?
    Promise.map(await FS.readdir(PATH.join(tmpPath, "..")), async function (path) {
        if (!/^\.~rt_/.test(path)) {
            return;
        }
        var stat = await FS.stat(PATH.join(tmpPath, "..", path));
        if ((Date.now() - stat.mtime.getTime()) > (60 * 5 * 1000)) {
            await FS.remove(PATH.join(tmpPath, "..", path));
        }
    });
*/

    var sourcePath = tmpPath;

    opts.paths = PKG.NODE_PATH;

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

    if (CONFIG.paths) {
        if (typeof CONFIG.paths === 'string') {
            CONFIG.paths = [ CONFIG.paths ];
        }
        opts.paths = opts.paths.concat(CONFIG.paths);
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

// console.error("BROWSERIFY::", sourcePath, opts);

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

    browserify.transform(function (file) {

        inputPaths[file] = true;
        if (options.result) options.result.inputPaths[file] = true;

        return LIB.THROUGH2(function (buf, enc, next) {
            this.push(buf);
            next();
        });
    });

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

    const codeBundle = await new Promise(function (resolve, reject) {

        browserify.bundle(function (err, bundle) {
            if (err) {
                console.error("CONFIG.src", CONFIG.src);
                console.error("BROWSERIFY ERROR:", err);
                return reject(err);
            }

// TODO: Record paths included by browserify in 'inputPaths[sourcePath] = true;'

            bundle = bundle.toString();

            if (CONFIG.strictMode === false) {
                bundle = bundle.replace(/(function\(require,module,exports\)\{)\n"use strict";/g, '$1');
            }
            if (CONFIG.renameRequire) {
                // TODO: Do this more reliably.
                bundle = bundle.replace(/([,;\(:\s])require([\s:\(\);,])/g, '$1_require_$2');
            }


//            browserify

//console.log("CONFIG.inject", CONFIG.inject);

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

//console.log("injectionCode", injectionCode);

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
            Object.keys(CONFIG.variables).forEach(function (name) {
                if (typeof CONFIG.variables[name] === "object") {
                    bundle = bundle.replace(
                        // TODO: Make delimiter configurable.
                        new RegExp("\"%%%" + name + "%%%\"", "g"),
                        '"' + JSON.stringify(CONFIG.variables[name]).replace(/"/g, '\\"') + '"'
                    );
                }
                bundle = bundle.replace(
                    // TODO: Make delimiter configurable.
                    new RegExp("%%%" + name + "%%%", "g"),
                    CONFIG.variables[name]
                );
            });

            resolve(bundle);
        });
    });


// console.error("got codeBundle", codeBundle.length, PATH.resolve(CONFIG.basedir, CONFIG.dist));

    if (
        CONFIG.dist// &&
        // !(CONFIG.skipWriteDistScript === true)
    ) {

        outputPaths[PATH.resolve(CONFIG.basedir, CONFIG.dist)] = true;
        if (options.result) options.result.outputPaths[PATH.resolve(CONFIG.basedir, CONFIG.dist)] = true;

        await FS.outputFile(PATH.resolve(CONFIG.basedir, CONFIG.dist), codeBundle, "utf8");
    }

    if (CONFIG.files) {

        const targetBaseDir = PATH.dirname(PATH.resolve(CONFIG.basedir, CONFIG.dist));

        if (!(await FS.exists(targetBaseDir))) {
            await FS.mkdirs(targetBaseDir);
        }

        await Promise.map(Object.keys(CONFIG.files), async function (filepath) {

            const sourcePath = CONFIG.files[filepath];
            const targetPath = PATH.join(targetBaseDir, filepath);

            inputPaths[sourcePath] = true;
            if (options.result) options.result.inputPaths[sourcePath] = true;

            outputPaths[targetPath] = true
            if (options.result) options.result.outputPaths[targetPath] = true;

            await FS.copy(sourcePath, targetPath);
        });
    }

//console.error('inputPaths:', inputPaths);

    return {
        code: codeBundle,
        inputPaths: Object.keys(inputPaths),
        outputPaths: Object.keys(outputPaths)
    };
}


let queue = Promise.resolve();

function serializedProcess (CONFIG, options) {
    return (queue = queue.then(function () {
        return do_process(CONFIG, options);
    }));
}

exports.forConfig = async function (CONFIG) {

//    await serializedProcess(CONFIG);

    return {
        "#io.pinf/middleware~s2": function () {

            return async function (req, res, next) {
                try {
                    const { code, inputPaths } = await serializedProcess(CONFIG);

//console.error("#io.pinf/middleware~s2 / inputPaths:", inputPaths);

                    res.writeHead(200, {
                        "Content-Type": "application/javascript"
                    });
                    res.end(code);

                } catch (err) {
                    // TODO: Splice in context.
                    next(err);
                }
            };
        },
        "#io.pinf/process~s2": async function () {
            const { code, inputPaths } = await serializedProcess(CONFIG);

//console.error("#io.pinf/process~s2 / inputPaths:", inputPaths);
            return code;
        },
        "#io.pinf/process~s3": async function (options) {

//console.error("#io.pinf/process~s3");
            return await serializedProcess(CONFIG, options);
        }
    }
}

/*
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
*/
