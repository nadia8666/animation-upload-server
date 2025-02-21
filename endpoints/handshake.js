// /handshake endpoint is for exchanging and rotating csrf tokens to keep the user verified

const { warning, info, error, generateSessionToken, isRequestCSRFVerified, closeSession } = require("../utils");

async function handshake(req, res, args) {
    if(!args.verified) {
        res.status(401)
            .send("Currently unverified");
        console.log(error("E11: Handshake was attempted while unverified!"));
        return;
    }

    if(!isRequestCSRFVerified(req, args)) {
        res.status(401)
            .send("Unable to verify CSRF token");
        console.log(warning("Handshake failed, missing CSRF Token."));
        return;
    }

    if(args.timeoutId) {
        clearTimeout(args.timeoutId);
    }

    const newSessionToken = generateSessionToken(args.userId);
    args.sessionToken = newSessionToken;

    args.timeoutId = setTimeout(closeSession, 60000, args);

    res.set("bau-x-csrf-token", newSessionToken);
    res.status(200)
        .send("OK");
}

exports.handler = handshake;

exports.info = {
    endpoints: ["/handshake"],
    methods: ["POST"],
    parser: "text"
}