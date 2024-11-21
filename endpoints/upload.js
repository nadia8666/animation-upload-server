const { warning, info, error, endpoints } = require("../utils");

async function upload(req, res, args) {
    const isVerified = args.verified;
    const RBX_Cookie = args.token;
    var csrfToken = args.csrf;

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

        args.csrf = csrfToken
    }

    console.log(info("Received animation upload request..."));

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

    console.log(info(`Uploading animation ${name}...`));

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

    console.log(info(`Successfully uploaded ${name} @ https://create.roblox.com/store/asset/${id} !`));

    res.status(200)
        .send(id);
}

exports.handler = (req, res, args) => upload(req, res, args);

exports.info = {
    endpoints: ["/upload"],
    methods: ["POST"],
    parser: "raw",
}