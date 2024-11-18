const chalk = require("chalk");
const express = require("express");
const lz4 = require("lz4");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("node:process")
const { raw, text } = require("body-parser");
const { findPassword } = require("keytar");

const app = express();
const port = 25037;

const warning = chalk.bgYellow.black;
const info = chalk.blue;
const error = chalk.bold.bgBlack.red;

const ROBLOSECURITY_warning = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_"

const endpoints = {
    authentication: "https://users.roblox.com/v1/users/authenticated",
    logout: "https://auth.roblox.com/v2/logout",
    uploadAnimation: (title, description, groupId) => "https://www.roblox.com/ide/publish/uploadnewanimation?assetTypeName=Animation" +
    `&name=${encodeURIComponent(title)}` +
    `&description=${encodeURIComponent(description)}` +
    "&AllID=1&ispublic=False&allowComments=True&isGamesAsset=False" +
    (groupId != null ? `&groupId=${groupId}` : ""),
}

const STD = readline.createInterface({ input, output });

var csrfToken;
var RBX_Cookie;
var isVerified = false;

async function getCookie(forceAsk) {
    return new Promise(async (resolve) => {
        var cookie = await findPassword("https://www.roblox.com:RobloxStudioAuth.ROBLOSECURITY");

        if(!cookie || forceAsk === true) {
            answer = await STD.question(info("Unable to find a ROBLOSECURITY. Please enter your ROBLOSECURITY token below (or q to quit):\n"));
            
            if(answer.substring(0, ROBLOSECURITY_warning.length) == ROBLOSECURITY_warning) {
                cookie = answer;
            } else if(answer == "q") {
                resolve(false);
                process.exit(1);
            } else {
                console.log(warning(`Provided ROBLOSECURITY did not include warning. Please retry with the ${ROBLOSECURITY_warning} included.`));
                return await getCookie();
            }
        }

        RBX_Cookie = cookie;
        resolve(true)
    });
}

app.use(["/compress", "/upload"], raw({
    type: "text/plain"
}));

app.use("/verify", text({
    type: "text/plain"
}));

app.post("/compress", (req, res) => {
    const body = req.body;
    if(body == undefined || !Buffer.isBuffer(body)) {
        res.status(400)
            .send("Missing chunk data");
        console.log(error("E2: Passed chunk data does not exist!\nServer Response: 400"));
        return;
    }

    const outputSize = lz4.encodeBound(body.length);
    if(outputSize == 0) {
        res.status(500)
            .send("Input data is too large");
        console.log(error("E1: Passed chunk data is too large!\nServer Response: 500"));
        return;
    }

    let lz4Output = Buffer.alloc(outputSize);
    let compressedSize = lz4.encodeBlock(body, lz4Output);

    lz4Output = lz4Output.subarray(0, compressedSize);

    res.status(200)
        .send(lz4Output);
});

app.post("/upload", async (req, res) => {
    if(!isVerified) {
        res.status(401)
            .send("Not verified");
        console.log(error("E8: Attempted to upload while unverified!\nServer Response: 401"));
        return;
    }

    if(!csrfToken) {
        const csrfRequest = await fetch(endpoints.logout, {
            method: "POST",
            headers: {
                cookie: `.ROBLOSECURITY=${RBX_Cookie}`
            }
        });

        csrfToken = csrfRequest.headers.get("x-csrf-token");
        if(!csrfToken) {
            res.status(500)
                .send("Unable to retrieve X-CSRF-Token");
            console.log(error("E9: Unable to retrieve X-CSRF-TOKEN!\nServer Response: 500"));
            return;
        }
    }

    const body = req.body;
    if(body == undefined || !Buffer.isBuffer(body)) {
        res.status(400)
            .send("Missing Animation Buffer");
        console.log(error("E7: Passed Animation Buffer does not exist!\nServer Response: 400"));
        return;
    }

    let uploadParameters = {
        groupId: null,
        title: null,
        description: ""
    }

    let byteOffset = 0;
    let isGroupUpload = body.readUintLE(byteOffset, 1);
    byteOffset++;

    if(isGroupUpload >= 1) {
        let groupId = body.readBigUint64LE(byteOffset);
        byteOffset += 8;

        uploadParameters.groupId = groupId;
    }

    let nameLength = body.readUintLE(byteOffset, 1);
    byteOffset++;

    let name = body.toString("utf8", byteOffset, byteOffset + nameLength);
    byteOffset += nameLength;

    uploadParameters.title = name;

    const uploadURL = endpoints.uploadAnimation(uploadParameters.title, uploadParameters.description, uploadParameters.groupId);
    const animationData = body.subarray(byteOffset, body.length);

    const uploadRequest = await fetch(uploadURL, {
        method: "POST",
        headers: {
            cookie: `.ROBLOSECURITY=${RBX_Cookie}`,
            "User-Agent": "RobloxStudio/WinInet",
            "Content-Type": "application/octet-stream",
            "X-CSRF-Token": csrfToken
        },
        body: animationData
    });

    if(uploadRequest.status !== 200) {
        let serverError = await uploadRequest.text();
        res.status(500)
            .send(`RAPI ERROR: ${serverError}`);
        console.log(error(`RAPI ERROR: ${serverError}\nServer Response: 500`));
        return;
    }

    const id = await uploadRequest.text();
    res.status(200)
        .send(id);
});

app.post("/verify", async (req, res) => {
    isVerified = false;

    const body = req.body;
    if(body.length == 0) {
        res.status(400)
            .send("No UserId specified");
        console.log(error("E3: No UserId passed!\nServer Response: 400"));
        return;
    }

    const clientUserId = Number(body);
    if(clientUserId != clientUserId) {
        res.status(400)
            .send("UserId unable to be parsed");
        console.log(error("E4: Cannot parse '%s'!\nServer Response: 400"), body);
        return;
    }

    if(!RBX_Cookie) {
        let succeeded = await getCookie();
        if(!succeeded) {
            res.status(500)
                .send("Unable to get ROBLOSECURITY");
            console.log(error("E0: Couldn't get ROBLOSECURITY!\nServer Response: 500"));
            return;
        }
    }

    const authenticatedRequest = await fetch(endpoints.authentication, {
        headers: {
            cookie: `.ROBLOSECURITY=${RBX_Cookie}`
        }
    });
    if(authenticatedRequest.status !== 200) {
        res.status(500)
            .send("Unable to authorize with cookie");
        console.log(error("E5: Unable to authorize account with ROBLOSECURITY\nServer Response: 500"));
        return;
    }

    const verificationData = await authenticatedRequest.json();
    if(verificationData.id != clientUserId) {
        res.status(401)
            .send("Received Client UserId does not match ROBLOSECURITY");
        console.log(error("E6: Client UserId does not match authenticated account!\nServer Response: 401"));
        return;
    }

    isVerified = true;
    res.status(200)
        .send("Verified!");
});

app.listen(port, () => {
    console.log(info("Listening on port %s"), port);
});