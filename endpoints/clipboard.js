// /clipboard endpoint is used for retrieving clipboard data for uploading blender animations

const { Clipboard } = require("@napi-rs/clipboard");
const { warning, info, error, isRequestCSRFVerified } = require("../utils");

const clipboard = new Clipboard();

function getClipboard(req, res, args) {
    if(!args.verified) {
        console.log(error("E10: Clipboard is inaccessible while unverified!\nServer Response: 401"));
        res.status(401)
            .send("Clipboard inaccessible");
        return;
    }

    if(!isRequestCSRFVerified(req, args)) {
        res.status(401)
            .send("Unable to verify CSRF token");
        console.log(error("E13: BAU-CSRF Token is invalid!\nServer Response: 401"));
        return;
    }

    const clipboardContent = clipboard.getText();
    if(Buffer.from(clipboardContent, "base64").toString("base64") !== clipboardContent) {
        res.status(500)
            .send("Clipboard does not contain pure base64; data will not be returned");
        console.log(warning("Clipboard request was received, but stored clipboard data is not base64.\nData cannot be valid blender animation data without encoding to base64."));
        return;
    }

    res.status(200)
        .send(clipboard.getText());
}

exports.handler = getClipboard;

exports.info = {
    endpoints: ["/clipboard"],
    methods: ["GET"],
    parser: "text"
}