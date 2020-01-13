#!/usr/bin/env bash.origin.script

echo ">>>TEST_IGNORE_LINE:Waiting until program 'server' is alive<<<"

depend {
    "process": "@com.github/bash-origin/bash.origin.process#s1"
}

CALL_process run "bash.origin.express~07-Express-Codeblock" {
    "server": {
        "env": {
            # TODO: Use dynamic port
            "PORT": "3000"
        },
        "run": (bash () >>>
            #!/usr/bin/env bash.origin.script

            depend {
                "server": "@com.github/bash-origin/bash.origin.express#s1"
            }

            CALL_server run {
                "routes": {
                    "/code.js": {
                        "@it.pinf.org.browserify#s1": {
                            "code": function /* CodeBlock */ (options) {

                                window.hello = "world";

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
