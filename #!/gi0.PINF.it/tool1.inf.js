
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
            } else
            if (home.api === 'copy/v1') {

                const sourcePath = await build.resolve(build.config.source);
                const targetPath = target.path;

                LIB.console.debug(`Copying file from`, sourcePath, `to`, targetPath);

                result.inputPaths[sourcePath] = true;
                result.outputPaths[targetPath] = true;

                await LIB.FS.copy(sourcePath, targetPath);
            } else
            if (home.api === 'download/v1') {
    
                const url = build.config.url;
                const expectedHash = build.config.hash || null;

                LIB.console.debug(`Downloading file from url`, url, `with expected checksum`, expectedHash);

                const content = await LIB.BENT('buffer')(url);
                const actualHash = `sha1:${LIB.CRYPTO.createHash('sha1').update(content).digest('hex')}`;

                if (!expectedHash) {
                    throw `Downloaded url '${url}' with content hash '${actualHash}'! Add hash to config to proceeed!`;
                }

                if (actualHash !== expectedHash) {
                    throw new Error(`Hash '${actualHash}' of downloaded content from '${url}' does not match expected hash '${expectedHash}'!`);
                }

//console.log("TODO: RECORD INPUT PATH:", result, build, target, instance, home, workspace);

                result.outputPaths[target.path] = true;

                await LIB.FS.outputFile(target.path, content);
            }
        }
    }

    return BuildStep;    
}
