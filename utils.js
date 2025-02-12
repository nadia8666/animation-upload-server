const chalk = require("chalk");
const readline = require("readline/promises");
const fs = require("node:fs");
const { appendFile: promiseAppend } = require("node:fs/promises");
const { app: electronApp } = require("electron");
const { randomBytes, createHash } = require("node:crypto");
const { stdin: input, stdout: output } = require("node:process");
const { findPassword } = require("keytar");
const { join: joinPath } = require("node:path");

const hashSalt = randomBytes(8);

const appSettings = {
    saveLocally: false,
    runAtStartup: true,
    localFilesLocation: ""
}

const electronUserDataPath = electronApp.getPath("userData");
const electronLogFileName = (new Date().toISOString()).replace(/[/\\?%*:|"<>]/g, "-") + ".log";
const electronLogFilePath = joinPath(electronUserDataPath, "logs", electronLogFileName);

if(!fs.existsSync(joinPath(electronUserDataPath, "logs"))) {
    fs.mkdirSync(joinPath(electronUserDataPath, "logs"));
}

const token_warning = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_";

const input_output = readline.createInterface({ input, output });

const endpoints = {
    "getAllGroups": (userId) => `https://groups.roblox.com/v1/users/${userId}/groups/roles`,
    "getGroupPermissions": (groupId, roleId) => `https://groups.roblox.com/v1/groups/${groupId}/roles/${roleId}/permissions`,
    "authentication": "https://users.roblox.com/v1/users/authenticated",
    "logout": "https://auth.roblox.com/v2/logout",
    "uploadAnimation": (title, description, groupId) => "https://www.roblox.com/ide/publish/uploadnewanimation?assetTypeName=Animation" +
    `&name=${encodeURIComponent(title)}` +
    `&description=${encodeURIComponent(description)}` +
    "&AllID=1&ispublic=False&allowComments=True&isGamesAsset=False" +
    (groupId != null ? `&groupId=${groupId}` : ""),
};

const warning = (...a) => {writeToLogFile("[WARNING]: " + a.join(" ")); return chalk.bgYellow.black(a)};
const info = (...a) => {writeToLogFile("[INFO]: " + a.join(" ")); return chalk.blue(a)};
const error = (...a) => {writeToLogFile("[ERROR]: " + a.join(" ")); return chalk.bold.bgBlack.red(a)};

function writeToLogFile(message) {
    const date = new Date(); // theres gotta be a better way to record timestamps
    return promiseAppend(electronLogFilePath, `[${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}] ${message}\n`);
}

async function getCookie(forceAsk) {
    // return new Promise(async (resolve) => {
    //     var cookie = await findPassword("https://www.roblox.com:RobloxStudioAuth.ROBLOSECURITY");

    //     if(!cookie || forceAsk === true) {
    //         answer = await input_output.question(info(`${forceAsk !== true ? "Unable to find a ROBLOSECURITY. " : ""}Please enter your ROBLOSECURITY token below (or q to quit):\n`));
            
    //         if(answer.substring(0, token_warning.length) == token_warning) {
    //             cookie = answer;
    //         } else if(answer == "q") {
    //             resolve([false]);
    //             process.exit(1);
    //         } else {
    //             console.log(warning(`Provided ROBLOSECURITY did not include warning. Please retry with the ${token_warning} included.`));
    //             resolve(await getCookie(true));
    //             return;
    //         }
    //     }

    //     resolve([true, cookie]);
    // });

    return findPassword("https://www.roblox.com:RobloxStudioAuth.ROBLOSECURITY");
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

function getSetting(setting) {
    return appSettings[setting];
}

function setSetting(setting, value) {
    appSettings[setting] = value;
}

function toggleSetting(setting) {
    appSettings[setting] = !appSettings[setting];
}

function getSettings() {
    return Object.freeze({ ...appSettings });
}

exports.closeSession = closeSession;
exports.isRequestCSRFVerified = isRequestCSRFVerified;
exports.generateSessionToken = generateSessionToken;
exports.getCookie = getCookie;

exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.toggleSetting = toggleSetting;
exports.getSettings = getSettings;

exports.logFilePath = electronLogFilePath;

exports.endpoints = endpoints;

exports.warning = warning;
exports.info = info;
exports.error = error;