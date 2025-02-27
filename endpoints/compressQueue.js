const { isRequestCSRFVerified, error } = require("../utils");

function handler(req, res, args) {
    let body = req.body;
    if(body == null || !Buffer.isBuffer(body)) {
        res.status(400)
            .send("Missing Queue Item");
        console.log(error("E30: Passed Queue Item does not exist!\nServer Response: 400"));
        return;
    }

    let queued = args.compressionQueue;
    if(queued == null || !Buffer.isBuffer(queued)) queued = Buffer.alloc(0);

    const newCompressionQueue = Buffer.concat([queued, body]);

    args.compressionQueue = newCompressionQueue;

    queued = null; // gc in case
    body = null;

    res.status(200)
        .send("Successfully queued");
}

exports.handler = handler;

exports.info = {
    endpoints: ["/compressQueue"],
    methods: ["POST"],
    parser: "raw",
}