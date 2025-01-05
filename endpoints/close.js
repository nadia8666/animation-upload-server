const { warning, info, error, closeSession, isRequestCSRFVerified } = require("../utils");

function close(req, res, args) {
    if(!isRequestCSRFVerified(req, args)) {
        res.status(400)
            .send("Unable to verify XCSRF token");
        console.log(error("E19: Unable to verify X-CSRF Token!\nServer Response: 400"));
        return;
    }

    closeSession(args);

    res.status(200)
        .send("Closed");
}

exports.handler = close;

exports.info = {
    endpoints: ["/close"],
    methods: ["POST"],
    parser: "raw"
}