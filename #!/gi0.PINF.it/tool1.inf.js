
exports['gi0.PINF.it/build/v0'] = async function (LIB, CLASSES) {

    const BROWSERIFY = require('../../browserify');

    class BuildStep extends CLASSES.BuildStep {

        async onBuild (result, build, target, instance, home, workspace) {

//console.log(result, build, target, instance, home, workspace);

            if (home.api === 'run/v1') {

                if (LIB.CODEBLOCK.isCodeblock(build.config)) {

                    const content = await workspace.runCodeblock(build.config, {
                        LIB: LIB,
                        result: result,
                        build: build,
                        target: target,
                        instance: instance,
                        home: home,
                        workspace: workspace
//                            ___PWD___: invocation.pwd
                    });

                    await LIB.FS.outputFile(target.path, content, 'utf8');
                }

            } else
            if (
                home.api === 'router/v1' ||
                home.api === 'build/v1'
            ) {

                const config = JSON.parse(JSON.stringify(build.config));

                if (config.dist) throw new Error(`'dist' config property may not be set!`);

                config.basedir = config.basedir || build.path;
                config.dist = target.path;

                const api = await BROWSERIFY.forConfig(config, {
                    LIB: LIB
                });
    
                await api['#io.pinf/process~s3']({
                    result: result
                });
            }
        }
    }

    return BuildStep;    
}
