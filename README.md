# animation-upload-server

This is the open source server for the Bulk Animation Upload plugin.

## Usage

Run `server.exe` in the background, and then open the Bulk Animation Upload plugin. Verification will occur to ensure that the user logged into studio is the authenticated user.

### Multiple Logged in Users

This server uses the Node.js `keytar` package to read your `.ROBLOSECURITY` token, but this might fail if multiple users are logged in, or if one account is logged in on ROBLOX Studio and another on the ROBLOX homepage.
In this case, in the verification process, it might ask you to manually enter your `.ROBLOSECURITY` token for the specified account.

## Building

TBD, Node.js `pkg` package fails when binding to the `lz4` node package.
