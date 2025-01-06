# animation-upload-server

This is the open source server for the Bulk Animation Upload plugin.

## Installation

Head over to the [release page](https://github.com/iiPotatoFlamesii/animation-upload-server/releases) and install the latest version.
You can either choose to use a [installer](#installed-version), or use a [portable version](#portable-version). Both of these version will work, but it is recommended that you use the installer as it will automatically update whenever a new update is released.


If you would like to build this project yourself from the source, head to the [building section](#building). Alternatively, if you would like to run this project locally, head to the [running locally section](#running-locally).

## Usage

### Installed Version

Once you have installed the server, you can start the server and it will start a program in the background. It will create a tray item, which will allow you to access the port that the server is hosted on, and settings for the server.

### Portable Version

Extract the files and run the executable. This acts similarly to the installed version but will not update automatically, and the installation is stored wherever you store the portable version.

### Multiple Logged in Users

This server uses the NodeJS `keytar` package to read your `.ROBLOSECURITY` token, but this might fail if multiple users are logged in, or if one account is logged in on ROBLOX Studio and another on the ROBLOX homepage.

~~In this case, in the verification process, it might ask you to manually enter your `.ROBLOSECURITY` token for the specified account.~~ _Deprecated, will expand upon in the future._

### Running Locally

For users that have NodeJS already installed, or prefer to run locally from source, you may do so by cloning this repository and running `npm install` to run the packages, followed by `npm run start`. This code was written in Node v22.10.0 (LTS), so it is expected that you will have this version or newer in order to properly run this project locally.

## Building

This server was written in Node v22.10.0 (LTS), and as such it is expected that when building users will also be using this version, as packages or building may not properly work. In order to build, clone this repository, run `npm install` and either `npm run package` to make a portable version, or `npm run make` to make both the installer and portable versions.