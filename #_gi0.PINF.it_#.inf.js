
exports.inf = async function (INF, NS) {

    return {

        id: function () {
            return {
                canonical: NS,
                aliases: [
                    "it.pinf.org.browserify"
                ]
            };
        },

        // @see https://github.com/pinf-it/inf/blob/master/tests/34-Interfaces/stream.inf.js
        interface: function (alias, node) {

            return async function (value) {

                const config = INF.LIB.LODASH.clone(value.value);
                config.src = INF.LIB.PATH.resolve(value.baseDir, config.src);

                const stream = new INF.LIB.MEMORYSTREAM();

                value.value = stream;

                // TODO: Instead of getting a string from process(), get a stream directly.

                setImmediate(function () {

                    const api = require('./_#_org.bashorigin_#_s1').forConfig(config);
                    api['#io.pinf/process~s1']({}, function (err, bundle) {
                        if (err) {
                            stream.emit('error', err);
                            return;
                        }

                        stream.write(bundle);
                        stream.end();
                    });
                });

                return value;
            }
        }        
    };
}
