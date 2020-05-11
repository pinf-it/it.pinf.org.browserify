#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:Waiting until program 'server' is alive<<<"

depend {
    "process": "bash.origin.process # runner/v0"
}

CALL_process run {
    "server": {
        "env": {
            # TODO: Use dynamic port
            "PORT": "3000"
        },
        "run": (bash () >>>
            #!/usr/bin/env bash.origin.script

            depend {
                "server": "bash.origin.express # server/v0"
            }

            CALL_server run {
                "routes": {
                    "/code.js": {
                        "gi0.PINF.it/build/v0 # /.dist # /code.js": {
                            "@it.pinf.org.browserify # router/v1": {
                                "code": function /* CodeBlock */ (options) {

                                    window.hello = "world";

                                }
                            }
                        }
                    }
                }
            }

        <<<),
        "routes": {
            "alive": {
                "uri": "/code.js",
                "expect": "/window.hello = \"world\";/",
                "exit": true
            }
        }
    }
}

echo "OK"
