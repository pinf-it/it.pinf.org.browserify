
exports['gi0.pinf.it/core/v0/tool'] = async function (workspace, LIB) {

    return async function (instance) {

        if (/\/router\/v0$/.test(instance.kindId)) {
            return async function (invocation) {
                return {
                    routeApp: async function (routeOptions) {

// console.error("[browserify] router/v0 invocation::", invocation, routeOptions);

// console.error('invocation', invocation);

//console.error('routeOptions invocation.dirs.dist, invocation.mount.pat', invocation.dirs.dist, invocation.mount.pat);

                        // routeOptions.basedir = routeOptions.basedir || invocation.pwd;
                        routeOptions.basedir = routeOptions.basedir || invocation.dirs.source;

//console.error('routeOptions invocation.dirs.dist, invocation.mount.path:', invocation.dirs.dist, invocation.mount.path);

                        routeOptions.dist = LIB.PATH.resolve(invocation.dirs.dist, invocation.mount.path);

//console.error('routeOptions 2', routeOptions);

                        const api = await require('../../browserify').forConfig(routeOptions, {
                            LIB: LIB
                        });
                        return api['#io.pinf/middleware~s2']();
                    }
                };
            }
        } else
        if (/\/build\/v0$/.test(instance.kindId)) {

            const BROWSERIFY = require('../../browserify');

            return async function (invocation, HELPERS) {

// console.error("[browserify] build/v0 invocation::", invocation);

                const step = new HELPERS.Step(instance, invocation, async function (_config) {

// console.error("[browserify] build/v0 invocation: _config:", _config);

                    if (
                        !invocation.mount ||
                        !invocation.mount.path
                    )  {
                        throw new Error(`'invocation.mount.path' not set!`);
                    }

                    if (Buffer.isBuffer(_config)) {
                        throw new Error(`Should get incoming config but got Buffer. Should you be using the router/v0 interface instead?`);
                    }

//console.error("[browserify] build/v0 _config::", _config);

                    const config = JSON.parse(JSON.stringify(_config));

                    if (config.dist) {
                        LIB.console.error(`'dist' config property may not be set!`);
                        process.exit(1);
                    }
                    config.basedir = config.basedir || invocation.dirs.source;
//                    config.skipWriteDistScript = true;

// console.log('[broeserify] make dist', invocation.dirs.dist, invocation.mount.path);
                    config.dist = LIB.PATH.join(invocation.dirs.dist, invocation.mount.path);

//console.error("[browserify] build/v0 config::", config);

                    const api = await BROWSERIFY.forConfig(config, {
                        LIB: LIB
                    });

                    const { code, inputPaths, outputPaths } = await api['#io.pinf/process~s3']();

// console.log("[browserify] build/v0 GOT CODE", code);

                    return {
                        body: code,
                        meta: {
                            inputPaths: inputPaths,
                            outputPaths: outputPaths
                        }
                    };
                });

                await step.forValue(invocation.value);

                return {
                    value: step.getValueProvider()
                };
            };
        } else
        if (/\/copy\/v0$/.test(instance.kindId)) {

            return async function (invocation, HELPERS) {

                const step = new HELPERS.Step(instance, invocation, async function (config) {

                    const { content, inputPaths } = await HELPERS.Step.LoadInput(invocation, config, 'source');

                    return {
                        body: content,
                        meta: {
                            inputPaths: inputPaths
                        }
                    };
                });

                await step.forValue(invocation.value);

                return {
                    value: step.getValueProvider()
                };
            };
        } else
        if (/\/download\/v0$/.test(instance.kindId)) {

            return async function (invocation, HELPERS) {

                const step = new HELPERS.Step(instance, invocation, async function (config) {

                    const url = config.url;
                    const expectedHash = config.hash || null;

                    const content = await LIB.BENT('buffer')(url);
                    const actualHash = `sha1:${LIB.CRYPTO.createHash('sha1').update(content).digest('hex')}`;

                    if (!expectedHash) {
                        throw `Downloaded url '${url}' with content hash '${actualHash}'! Add hash to config to proceeed!`;
                    }

                    if (actualHash !== expectedHash) {
                        throw new Error(`Hash '${actualHash}' of downloaded content from '${url}' does not match expected hash '${expectedHash}'!`);
                    }

                    return {
                        body: content,
                        meta: {
                            // TODO: Track URLs as well. The system can HEAD the URLs and check headers to see if content has changed.
                            //       For now it is assumed that content on URLs will not change.
                            inputPaths: []
                        }
                    };
                });

                await step.forValue(invocation.value);

                return {
                    value: step.getValueProvider()
                };
            };
        } else
        if (/\/run\/v0$/.test(instance.kindId)) {

            return async function (invocation, HELPERS) {

                const step = new HELPERS.Step(instance, invocation, async function (content) {

                    if (LIB.CODEBLOCK.isCodeblock(content)) {

                        content = await workspace.runCodeblock(content, {
                            LIB: LIB,
                            invocation: invocation
//                            ___PWD___: invocation.pwd
                        });
                    }

//console.log("RUN", content);                    
                    return {
                        body: content
                    };
                });

                await step.forValue(invocation.value);

                return {
                    value: step.getValueProvider()
                };
            };
        } else
        if (/\/strip-debug\/v0$/.test(instance.kindId)) {

            return async function (invocation, HELPERS) {

                const step = new HELPERS.Step(instance, invocation, async function (config) {

//console.error("config", config);                    

                    function respond (content, inputPaths) {
    
                        const output = content.toString().split("\n").filter(function(line) {
                            return !(/\/\*DEBUG\*\//.test(line));
                        }).join("\n");
    
                        return {
                            body: output,
                            meta: {
                                inputPaths: inputPaths || []
                            }
                        };
                    }

                    if (Buffer.isBuffer(config)) {
                        return respond(config);
                    } else {
                        let { content, inputPaths } = await HELPERS.Step.LoadInput(invocation, config, 'source');
                        return respond(content, inputPaths);
                    }
                });

                await step.forValue(invocation.value);

                return {
                    value: step.getValueProvider()
                };
            };
        } else
        if (/\/closure-compiler\/v0$/.test(instance.kindId)) {

            const closureCompiler = new (require("google-closure-compiler").jsCompiler)({
                compilation_level: 'ADVANCED'
            });

            return async function (invocation, HELPERS) {

                const step = new HELPERS.Step(instance, invocation, async function (config) {

                    return new Promise(async function (resolve, reject) {

                        const { sourcePath, content, inputPaths } = await HELPERS.Step.LoadInput(invocation, config, 'source');
    
// console.log("content", content);
// console.log("sourcePath", sourcePath);

                        const compilerProcess = closureCompiler.run([
                            {
                                path: sourcePath,
                                src: content.toString()
                            }
                        ], function (exitCode, result, stdErr) {
                            if (!result) {
                                console.error(stdErr);
                                reject(new Error(`Closure Compiler failed with exit code: ${exitCode}`));
                                return;
                            }

                            // TODO: Write source map file if configured (minResult.sourceMap)

                            resolve({
                                body: Buffer.from(result[0].src, 'utf8'),
                                meta: {
                                    inputPaths: inputPaths
                                }
                            });
                            return;
                        });    
                    });
                });

                await step.forValue(invocation.value);

                return {
                    value: step.getValueProvider()
                };
            };
        } else
        if (/\/gzip\/v0$/.test(instance.kindId)) {
            const ZLIB = require("zlib");

            return async function (invocation, HELPERS) {

                const step = new HELPERS.Step(instance, invocation, async function (config) {

                    const { sourcePath, content, inputPaths } = await HELPERS.Step.LoadInput(invocation, config, 'source');

                    return new Promise(async function (resolve, reject) {

                        ZLIB.gzip(content, function (err, compressed) {
                            if (err) return reject(err);

                            resolve({
                                body: compressed,
                                meta: {
                                    inputPaths: inputPaths
                                }
                            });
                        });
                    });
                });

                await step.forValue(invocation.value);

                return {
                    value: step.getValueProvider()
                };
            };
        } else
        if (/\/brotli\/v0$/.test(instance.kindId)) {
            const BROTLI = require("brotli");

            return async function (invocation, HELPERS) {

                const step = new HELPERS.Step(instance, invocation, async function (config) {

                    const { sourcePath, content, inputPaths } = await HELPERS.Step.LoadInput(invocation, config, 'source');

                    if (!content.length) {
                        throw new Error(`No data to compress!`);
                    }

                    const compressed = BROTLI.compress(content);

                    return {
                        body: compressed,
                        meta: {
                            inputPaths: inputPaths
                        }
                    };
                });

                await step.forValue(invocation.value);

                return {
                    value: step.getValueProvider()
                };
            };
        }
    };
}
