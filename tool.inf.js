
exports['gi0.pinf.it/core/v0/tool'] = async function (workspace, LIB) {

    return async function (instance) {

        if (/\/build\/v0$/.test(instance.kindId)) {
            return async function (invocation) {
                const stream = new LIB.MEMORYSTREAM();
                setImmediate(function () {
                    invocation.value.basedir = invocation.value.basedir || invocation.cwd;
                    const api = require('./_#_org.bashorigin_#_s1').forConfig(invocation.value);
                    api['#io.pinf/process~s1']({}, function (err, bundle) {
                        if (err) {
                            stream.emit('error', err);
                            return;
                        }
                        stream.write(bundle);
                        stream.end();
                    });
                });
                return {
                    value: stream
                };
            };            
        } else
        if (/\/copy\/v0$/.test(instance.kindId)) {
            return async function (invocation) {
                return {
                    value: LIB.FS.createReadStream(
                        LIB.PATH.join(invocation.cwd, invocation.value.source),
                        {
                            encoding: 'utf8'
                        }
                    )
                };
            };
        } else
        if (/\/strip-debug\/v0$/.test(instance.kindId)) {
            class StripDebugTransform extends LIB.STREAM.Transform {
                _transform (chunk, enc, cb) {
                    chunk = chunk.toString().split("\n").filter(function(line) {
                        return !(/\/\*DEBUG\*\//.test(line));
                    }).join("\n");
                    cb(null, chunk);
                }
            }
            return async function (invocation) {
                if (invocation.value.readable === true) {
                    const transform = new StripDebugTransform();
                    const sourceStream = invocation.value;
                    setImmediate(function () {
                        sourceStream.pipe(transform);
                    });
                    return {
                        value: transform
                    };
                } else {
                    const transform = new StripDebugTransform();
                    const sourcePath = LIB.PATH.join(invocation.cwd, invocation.value.source);
                    setImmediate(function () {
                        LIB.FS.createReadStream(
                            sourcePath,
                            {
                                encoding: 'utf8'
                            }
                        ).pipe(transform);
                    });
                    return {
                        value: transform
                    };
                }
            };
        } else
        if (/\/closure-compiler\/v0$/.test(instance.kindId)) {
            class ClosureCompilerTransform extends LIB.STREAM.Transform {
                constructor () {
                    super();
                    this.buffer = [];
                }
                _flush (_cb) {
                    const self = this;
                    const tmpPath = require("os").tmpdir();
        
                    //INF.LIB.FS.mkdtemp(INF.LIB.PATH.join(require("os").tmpdir(), 'closure-compiler-'), function (err, tmpDir) {
                    //    if (err) return _cb(err);
        
                    //    const tmpPath = `${tmpDir}/source.js`;
        
                        function cb (err) {
                    //        INF.LIB.FS.remove(tmpDir);
                            delete self.buffer;
                            _cb(err);
                        }
        
                    //    INF.LIB.FS.writeFile(tmpPath, Buffer.concat(self.buffer), 'utf8', function (err) {
                    //        if (err) return cb(err);
        
                            const closureCompiler = new (require("google-closure-compiler").jsCompiler)({
                                compilation_level: 'ADVANCED'
                            });
        
                            const compilerProcess = closureCompiler.run([
                                {
                                    src: Buffer.concat(self.buffer).toString()
                                }
                            ], function (exitCode, result, stdErr) {
                                if (!result) {
                                    console.error(stdErr);
                                    return cb(new Error(`Closure Compiler failed with exit code: ${exitCode}`));
                                }
        
                                // TODO: Write source map file if configured (minResult.sourceMap)
        
                                self.push(Buffer.from(result[0].src, 'utf8'), 'utf8');
        
                                cb();
                            });
                    //    });
                    //});
                }
                _transform (chunk, enc, cb) {
                    if (chunk) {
                        this.buffer.push(chunk);
                    }
                    cb();
                }
            }
            return async function (invocation) {
                if (invocation.value.readable === true) {
                    const transform = new ClosureCompilerTransform();
                    const sourceStream = invocation.value;
                    setImmediate(function () {
                        sourceStream.pipe(transform);
                    });
                    return {
                        value: transform
                    };                    
                } else {
                    const transform = new ClosureCompilerTransform();
                    const sourcePath = LIB.PATH.join(invocation.cwd, invocation.value.source);
                    setImmediate(function () {
                        LIB.FS.createReadStream(
                            sourcePath
                        ).pipe(transform);    
                    });
                    return {
                        value: transform
                    };                    
                }
            };
        } else
        if (/\/gzip\/v0$/.test(instance.kindId)) {
            const ZLIB = require("zlib");
            class GZipCompressionTransform extends LIB.STREAM.Transform {
                _transform (chunk, enc, cb) {
                    if (chunk) {
                        ZLIB.gzip(chunk, cb);
                        return;
                    }
                    cb();
                }
            }
            return async function (invocation) {
                const transform = new GZipCompressionTransform();
                const sourcePath = LIB.PATH.join(invocation.cwd, invocation.value.source);
                setImmediate(function () {
                    LIB.FS.createReadStream(
                        sourcePath
                    ).pipe(transform);    
                });
                return {
                    value: transform
                };
            };
        } else
        if (/\/brotli\/v0$/.test(instance.kindId)) {
            const BROTLI = require("brotli");
            class BrotliCompressionTransform extends LIB.STREAM.Transform {
                _transform (chunk, enc, cb) {
                    if (chunk) {
                        try {
                            chunk = BROTLI.compress(chunk);
                        } catch (err) {
                            cb(err);
                            return;
                        }
                        cb(null, chunk);
                        return;
                    }
                    cb();
                }
            }
            return async function (invocation) {
                const transform = new BrotliCompressionTransform();
                const sourcePath = LIB.PATH.join(invocation.cwd, invocation.value.source);
                setImmediate(function () {
                    LIB.FS.createReadStream(
                        sourcePath
                    ).pipe(transform);    
                });
                return {
                    value: transform
                };
            };
        }
    };
}
