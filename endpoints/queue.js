const { isRequestCSRFVerified, warning, error, info } = require("../utils");

function handler(req, res, args) {
    const isVerified = args.verified;
    let body = req.body;

    if(!isVerified) {
        res.status(401)
            .send("Not verified");
        console.log(error("E22: Attempted to upload while unverified!\nServer Response: 401"));
        return;
    }

    if(!isRequestCSRFVerified(req, args)) {
        res.status(401)
            .send("Unable to verify CSRF token");
        console.log(error("E23: BAU-CSRF Token is invalid!\nServer Response: 401"));
        return;
    }

    if(body == null || !Buffer.isBuffer(body)) {
        res.status(400)
            .send("Missing Queue Item");
        console.log(error("E24: Passed Queue Item does not exist!\nServer Response: 400"));
        return;
    }

    let queued = args.animationQueue;
    if(queued == null || !Buffer.isBuffer(queued)) queued = Buffer.alloc(0);

    const inputSize = body.length;

    // reallocate to fit input in

    const newAnimationQueue = Buffer.alloc(queued.length + inputSize);
    queued.copy(newAnimationQueue);
    body.copy(newAnimationQueue, queued.length);

    args.animationQueue = newAnimationQueue;

    queued = null; // gc in case
    body = null;

    res.status(200)
        .send("Successfully queued");
}

exports.handler = handler;

exports.info = {
    endpoints: ["/queue"],
    methods: ["POST"],
    parser: "raw",
}