
const FS = require("fs");
const BROWSERIFY = require("browserify");


exports.forConfig = function (CONFIG) {

    return {
        "#io.pinf/process~s1": function (callback) {

            return FS.exists(CONFIG.src, function (exists) {
                if (!exists) {
                    return callback(new Error("No source file found at '" + CONFIG.src + "'!"));
                }
                try {
                    var browserify = BROWSERIFY({});
                    browserify.add(CONFIG.src);
                    return browserify.bundle(function (err, bundle) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, bundle.toString());
                    });
                } catch (err) {
                    return callback(err);
                }
            });
        }
    }
}
