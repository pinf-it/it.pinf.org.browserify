
exports.script_global = {
    foo: "bar"
};

exports.script_global_not_exported = {
    foo: "bar",
    not: "exported"
};

dataLoader("./resources/data.json", function (data) {
    exports.script_global.data = data;
    exports.script_global_not_exported.data = data;
});
