const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { group } = require('console');

// If modifying these scopes, delete token.json.
const SCOPES = [
	'https://www.googleapis.com/auth/admin.directory.user',
	'https://www.googleapis.com/auth/admin.directory.group.member',
	'https://www.googleapis.com/auth/gmail.send'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
	if (err) return console.error('Error loading client secret file', err);

	// Authorize a client with the loaded credentials, then call the
	// Directory API.
	authorize(JSON.parse(content), insertUsers);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getNewToken(oauth2Client, callback);
		oauth2Client.credentials = JSON.parse(token);
		callback(oauth2Client);
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	console.log('Authorize this app by visiting this url:', authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question('Enter the code from that page here: ', (code) => {
		rl.close();
		oauth2Client.getToken(code, (err, token) => {
			if (err) return console.error('Error retrieving access token', err);
			oauth2Client.credentials = token;
			storeToken(token);
			callback(oauth2Client);
		});
	});
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
	fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
		if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
		console.log(`Token stored to ${TOKEN_PATH}`);
	});
}

function insertUsers(auth) {
    // Initialize firebase
	var admin = require('firebase-admin');
    var serviceAccount = require('./service-account-credentials.json');
    
	// Initialize the app with a service account, granting admin privileges
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: 'https://new-member-integ-1608506978874-default-rtdb.firebaseio.com/'
    });
    
    // create database reference 
    var db = admin.database();
    var ref = db.ref('/');

    // When a new user is added via google survey add it to Gsuite.
	ref.on('child_added', function(snapshot, prevChildKey) {
        // Initialize Email
		var Mail = require('./createMail.js');
        var newPost = snapshot.val();
        
        // Initialize Data
		first = newPost.firstName;
		last = newPost.lastName;
		recoveryEmail = newPost.email;
		thrustEmail = first + '.' + last + '@thrustcorp.space';
        thrustEmail = thrustEmail.toLowerCase();
        
        // Initialize Admin SDK Service
		const service = google.admin({ version: 'directory_v1', auth });
        console.log('Adding New User...');
        
        // Create new user
		service.users.insert(
			{
				resource: {
					primaryEmail: first + '.' + last + '@thrustcorp.space',
					password: 'password',
					isAdmin: false,
					isDelegatedAdmin: false,
					agreedToTerms: true,
					changePasswordAtNextLogin: true,
					kind: 'admin#directory#user',
					recoveryEmail: recoveryEmail,
					name: {
						givenName: first,
						familyName: last
					}
				}
			},
			(err, res) => {
                // If the account is already made send out error email
				if (err) {
					var mail = new Mail(
						auth,
						recoveryEmail,
						'ERROR: User Account Already Created',
						'Hello ' +
							first +
							' ' +
							last +
							",\n\nOur database is indicating that your account has already been made. You will still receive a welcome mail so first try logging in. If you are lucky, you will be able to access your account! If this doesn't work or you still have more questions/issues please contact it@thrustcorp.space and we will help you as soon as possible.\n\nCheers,\nPranav Goel - Internal Director",
						'mail'
					);
					return mail.makeBody();
					return console.error('The API returned an error:', err.message);
                }
				const user = res.data;
				if (user.length) {
					console.log('\nNew User added:');
					console.log('Given Name: ' + first);
					console.log('Family Name: ' + last);
					console.log('Primary Email: ' + thrustEmail);
					console.log('Recovery Email: ' + recoveryEmail);
					console.log('Primary Project: ' + newPost.primaryProject);
					console.log('Gender: ' + newPost.gender);
				}
			}
		);
        
        // Initialize Group Info
		groupName = newPost.primaryProject;
		switch (groupName) {
			case 'Structures Thrust Vector Control':
				groupkey = 'structures.tvc@thrustcorp.space';
				break;
			case 'Executive Board':
				groupkey = 'executive@thrustcorp.space';
				break;
			default:
				groupName = groupName.split(' ');
				groupName[0] == 'R&D'
					? (groupkey = 'rd.' + groupName.slice(1).join('.').toLowerCase() + '@thrustcorp.space')
					: (groupkey = groupName.join('.').toLowerCase() + '@thrustcorp.space');
        }
        let user = {
			email: thrustEmail,
			role: 'MEMBER'
		};
		key = {
			groupKey: groupkey
		};

		input = {
			groupKey: groupkey,
			resource: user
        };
        
        console.log('\nAssigning Group...\n');
        
        // Add New Member to Corresponding Group
		service.members.insert(input, (err, res) => {
			if (err) return console.error('The API returned an error:', err.message);
			// console.log(res);
			console.log('Group Key: ' + groupkey);
			console.log('Group Member Email: ' + user['email']);
			console.log('Group Member Role: ' + user['role']);
        });
        
		// Send email with password and info
		var obj = new Mail(
			auth,
			recoveryEmail,
			'Welcome!',
			'Welcome ' +
				first +
				' ' +
				last +
				'!\n\nYour new email: ' + thrustEmail +'\nYour temporary password: password\n\nFollow the next steps and be on your way!\n\n1) Login to your Thrust account at groups.google.com with your temporary password (you will be prompted to change it after signing in the first time)\n2) If you want to join more projects, navigate to "All Groups" and click the ask to join button (We will accept your request when we see it)\n3) Use your newly made gsuite account as you wish!\n\nYou can find relevant files at drive.google.com. You should also have access to shared drives depending on what group you are in. Things like gmail, photos, etc. can all be accessed via your new account (just login!).\n\n If you have any questions or issues please reach out to internal@thrustcorp.space or it@thrustcorp.space. We look forward to working with you!\n\nCheers,\nPranav Goel - Internal Director',
			'mail'
		);
		obj.makeBody();
	});
}
