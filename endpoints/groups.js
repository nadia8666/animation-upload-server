const { info, error, endpoints, isRequestCSRFVerified } = require("../utils");

function getValidGroups(cookie, groupData) {
    return new Promise((resolve) => {
        const groups = {

        }
        let processed = 0;
        let totalNumberOfGroups = groupData.length;

        groupData.forEach(groupElement => {
            let groupId = groupElement.group.id;
            let roleId = groupElement.role.id;

            fetch(endpoints.getGroupPermissions(groupId, roleId), {
                method: "GET",
                headers: {
                    cookie: `.ROBLOSECURITY=${cookie}`,
                    "User-Agent": "RobloxStudio/WinInet",
                },
            }).then((response) => {
                if(response.status !== 200) {
                    processed++;
                    return;
                };

                response.json().then((data) => {
                    if(data.permissions.groupEconomyPermissions.createItems == true) {
                        groups[groupId] = groupElement.group.name;
                    }
    
                    processed++;
                    if(processed >= totalNumberOfGroups) {
                        resolve(groups);
                    }
                })
            })
        });
    })
}

async function getGroups(req, res, args) {
    const isVerified = args.verified;
    const RBX_Cookie = args.token;

    if(!isVerified) {
        res.status(401)
            .send("Not verified");
        console.log(error("E16: Attempted to upload while unverified!\nServer Response: 401"));
        return;
    }

    if(!isRequestCSRFVerified(req, args)) {
        res.status(401)
            .send("Unable to verify CSRF token");
        console.log(error("E17: BAU-CSRF Token is invalid!\nServer Response: 401"));
        return;
    }
    
    const groupURL = endpoints.getAllGroups(args.userId);

    const groupResults = await fetch(groupURL, {
        method: "GET",
        headers: {
            "User-Agent": "RobloxStudio/WinInet"
        }
    });

    if(groupResults.status !== 200) {
        res.status(500)
            .send("Failed to get user groups: " + groupResults.body);
        console.log(error("E18: Failed to get groups!\nServer Response: 500"));
        return;
    }

    let response = await groupResults.json();

    let groups = await getValidGroups(RBX_Cookie, response.data);

    res.status(200)
        .json(groups);
}

exports.handler = getGroups;

exports.info = {
    endpoints: ["/groups"],
    methods: ["GET"],
    parser: "text"
}