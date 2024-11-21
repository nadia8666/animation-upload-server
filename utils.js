const chalk = require("chalk");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const { findPassword } = require("keytar");

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

exports.getCookie = getCookie;

exports.endpoints = endpoints;

exports.warning = warning;
exports.info = info;
exports.error = error;