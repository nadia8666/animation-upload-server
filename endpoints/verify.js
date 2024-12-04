const { warning, info, error, getCookie, endpoints, generateSessionToken, closeSession } = require("../utils");

async function verify(req, res, args) {
    closeSession(args);

    console.log(info("Received verification request..."));

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

    if(!args.token) {
        let [succeeded, cookie] = await getCookie();
        if(!succeeded) {
            res.status(500)
                .send("Unable to get ROBLOSECURITY");
            console.log(error("E0: Couldn't get ROBLOSECURITY!\nServer Response: 500"));
            return;
        }

        args.token = cookie;
    }

    const authenticatedRequest = await fetch(endpoints.authentication, {
        headers: {
            cookie: `.ROBLOSECURITY=${args.token}`
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
        console.log(error("E6: Client UserId does not match authenticated account! Enter new ROBLOSECURITY and attempt to verify again.\nServer Response: 401"));
        
        let [_, cookie] = await getCookie(true);
        args.token = cookie;
        return;
    }

    console.log(info(`Successfully verified user: ${verificationData.name} (${verificationData.displayName} - ${verificationData.id})`));

    const newSessionToken = generateSessionToken(clientUserId);

    args.sessionToken = newSessionToken;
    args.userId = clientUserId;
    args.verified = true;

    args.timeoutId = setTimeout(closeSession, 60000, args);

    res.set("bau-x-csrf-token", newSessionToken);
    res.status(200)
        .send("Verified!");
}

exports.handler = verify;

exports.info = {
    endpoints: ["/verify"],
    methods: ["POST"],
    parser: "text",
}