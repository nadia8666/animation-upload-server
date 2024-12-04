// /compress endpoint is used for compressing chunk data in the ROBLOX binary format; there is no native LUA package for LZ4 compression, so we use an endpoint instead

const lz4 = require("lz4");
const { warning, info, error } = require("../utils");

function compress(req, res) {
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
};

exports.handler = compress;

exports.info = {
    endpoints: ["/compress"],
    methods: ["POST"],
    parser: "raw",
}