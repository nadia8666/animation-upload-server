const chalk = require("chalk");
const readline = require("readline/promises");
const { randomBytes, createHash } = require("node:crypto");
const { stdin: input, stdout: output } = require("node:process");
const { findPassword } = require("keytar");

const hashSalt = randomBytes(8);

const token_warning = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";

const input_output = readline.createInterface({ input, output });

const endpoints = {
    "authentication": "https://users.roblox.com/v1/users/authenticated",
    "logout": "https://auth.roblox.com/v2/logout",
    "uploadAnimation": (title, description, groupId) => "https://www.roblox.com/ide/publish/uploadnewanimation?assetTypeName=Animation" +
    `&name=${encodeURIComponent(title)}` +
    `&description=${encodeURIComponent(description)}` +
    "&AllID=1&ispublic=False&allowComments=True&isGamesAsset=False" +
    (groupId != null ? `&groupId=${groupId}` : ""),
};

const warning = chalk.bgYellow.black;
const info = chalk.blue;
const error = chalk.bold.bgBlack.red;

async function getCookie(forceAsk) {
    return new Promise(async (resolve) => {
        var cookie = await findPassword("https://www.roblox.com:RobloxStudioAuth.ROBLOSECURITY");

        if(!cookie || forceAsk === true) {
            answer = await input_output.question(info(`${forceAsk !== true ? "Unable to find a ROBLOSECURITY. " : ""}Please enter your ROBLOSECURITY token below (or q to quit):\n`));
            
            if(answer.substring(0, token_warning.length) == token_warning) {
                cookie = answer;
            } else if(answer == "q") {
                resolve([false]);
                process.exit(1);
            } else {
                console.log(warning(`Provided ROBLOSECURITY did not include warning. Please retry with the ${token_warning} included.`));
                resolve(await getCookie(true));
                return;
            }
        }

        resolve([true, cookie]);
    });
};

function generateSessionToken(userId) {
    const timeGeneration = Date.now();
    timeGeneration.valueOf();

    userId = String(userId);
    let bufferSize = userId.length + 14
    let content = Buffer.alloc(bufferSize);
    content.write(userId);
    hashSalt.copy(content, bufferSize - 12);
    content.writeUIntLE(timeGeneration.valueOf(), bufferSize - 8, 6);

    return createHash("md5").update(content).digest("hex");
}

function secureCompare(str1, str2) {
    if(typeof str1 != "string" || typeof str2 != "string") return false;

    if (str1.length !== str2.length) {
      return false;
    }
  
    let result = 0;
    for (let i = 0; i < str1.length; i++) {
      result |= str1.charCodeAt(i) ^ str2.charCodeAt(i);
    }
  
    return result === 0;
}

function isRequestCSRFVerified(req, args) {
    return secureCompare(req.get("bau-x-csrf-token"), args.sessionToken);
}

function closeSession(args) {
    if(args.verified) console.log(info("Closed Session"));
    if(args.timeoutId) {
        clearTimeout(args.timeoutId);
    }

    args.verified = false;
    args.csrf = null;
    args.sessionToken = null;
    args.token = null;
    args.userId = null;
    args.timeoutId = null;
}

exports.closeSession = closeSession;
exports.isRequestCSRFVerified = isRequestCSRFVerified;
exports.generateSessionToken = generateSessionToken;
exports.getCookie = getCookie;

exports.endpoints = endpoints;

exports.warning = warning;
exports.info = info;
exports.error = error;