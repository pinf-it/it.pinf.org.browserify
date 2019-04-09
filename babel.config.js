
module.exports = function (api) {

    api.cache(true);

    const presets = [
        [
            require("@babel/preset-env")
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
        ignore: []        
    };
}