# animation-upload-server

This is the open source server for the Bulk Animation Upload plugin.

## Installation

Head over to the [release page](https://github.com/iiPotatoFlamesii/animation-upload-server/releases) and install the latest version. If you would like to build this project yourself from the source, head to the [building section](#building). Alternatively, if you would like to run this project locally, head to the [running locally section](#running-locally).

## Usage

Run `server.exe` in the background, and then open the Bulk Animation Upload plugin. Verification will occur to ensure that the user logged into studio is the authenticated user.

### Multiple Logged in Users

This server uses the Node.js `keytar` package to read your `.ROBLOSECURITY` token, but this might fail if multiple users are logged in, or if one account is logged in on ROBLOX Studio and another on the ROBLOX homepage.
In this case, in the verification process, it might ask you to manually enter your `.ROBLOSECURITY` token for the specified account.

### Running Locally

For users that have NodeJS already installed, or prefer to run locally from source, you may do so by cloning this repository and running `npm install` to run the packages, followed by `npm run start`.
It is expected that users have at least Node v18.20.5, as the backend may fail in these scenarios, though any higher versions should function correctly.

## Building

This server was written in Node v18.20.5 (LTS), and as such it is expected that when building users will also be using this version, as packages or building may not properly work.
This project uses the NodeJS `pkg` package to build, which has been deprecated and so it might be more suitable for users to [run the server locally](#running-locally).

If you still wish to build, ensure that your node version is correct, and run `npm run build`. The file will be distributed into the `dist` folder of the root project directory.
