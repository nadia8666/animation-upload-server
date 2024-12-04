const express = require("express");
const fs = require("node:fs");
const http = require("http");
const { info, warning } = require("./utils");
const { join: joinPath } = require("node:path");
const { raw, text } = require("body-parser");

const app = express();
const httpServer = http.createServer(app);
const port = 25037;

const endpointPath = joinPath(__dirname, "endpoints");

const endpointData = {
    "raw": [],
    "text": []
};

const endpointModules = [];

const arguments = {
    "csrf": null,
    "verified": false,
    "token": null,
    "userId": null,
    "sessionToken": null,
    "timeoutId": null,
};

const files = fs.readdirSync(endpointPath);

files.forEach((fileName) => {
    if(fileName.split(".").pop() !== "js") return;

    const endpointModule = require(joinPath(endpointPath, fileName));
    const endpointInfo = endpointModule.info;

    endpointData[endpointInfo.parser].push(...endpointInfo.endpoints);
    endpointModules.push(endpointModule);
});

app.use(endpointData.raw, raw({
    type: "text/plain"
}));

app.use(endpointData.text, text({
    type: "text/plain"
}));

endpointModules.forEach((endpointModule) => {
    const endpointInfo = endpointModule.info;

    app.all(endpointInfo.endpoints, (req, res) => {
        if(!endpointInfo.methods.includes(req.method)) {
            res.status(404)
                .send(`Cannot ${req.method} ${req.path}`);
            return;
        }

        endpointModule.handler(req, res, arguments);
    })
})

function listenToPort(port) {
    const listener = httpServer
        .listen(port, () => {
            console.log(info("Listening on port %s"), listener.address().port);
        })
        .on("error", (err) => {
            if(err.code === "EADDRINUSE") {
                console.log(warning("Port %s is unavailable, defaulting to unused port"), port);
                httpServer.listen();
            }
        });
};

listenToPort(port);