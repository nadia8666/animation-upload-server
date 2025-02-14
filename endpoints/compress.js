// /compress endpoint is used for compressing chunk data in the ROBLOX binary format; there is no native LUA package for LZ4 compression, so we use an endpoint instead

const { compressSync } = require("lz4-napi");
const { error } = require("../utils");

function compress(req, res) {
    const body = req.body;
    if(body == undefined || !Buffer.isBuffer(body)) {
        res.status(400)
            .send("Missing chunk data");
        console.log(error("E2: Passed chunk data does not exist!\nServer Response: 400"));
        return;
    }

    let numOfChunks = body.readUIntLE(0, 1);
    let currentOffset = 1;

    let compressedChunks = [];

    for(var i = 0; i < numOfChunks; i++) {
        let chunkSize = body.readUInt32LE(currentOffset);
        currentOffset += 4;

        let toCompress = body.subarray(currentOffset, currentOffset + chunkSize);

        let lz4Output = compressSync(toCompress).subarray(4); // lz4-napi prepends the compressed buffer with the size of the original input, which is unneeded in our case

        let sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32LE(lz4Output.length);

        compressedChunks.push(sizeBuffer, lz4Output);

        currentOffset += chunkSize;
    }

    const finalOutput = Buffer.concat(compressedChunks);

    res.status(200)
        .send(finalOutput);
};

exports.handler = compress;

exports.info = {
    endpoints: ["/compress"],
    methods: ["POST"],
    parser: "raw",
}