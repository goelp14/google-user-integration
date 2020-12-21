# thrust-google-user-integration
## Description
This is intended to auto add people as members to a gsuite through a google form and perhaps a website in the future.

## Prequisites
- Node.js and NPM
- Google Developer Account (For Your GSuite)
    - Make sure you are an admin
- Enable API via [Quickstart](https://developers.google.com/admin-sdk/directory/v1/quickstart/nodejs)
    -   store credentials.json in this directory
- Also enable the Gmail API
- Create a Firebase Project connected to the project you made in the previous step
- Create a Google Forms Survey and Generate the Google Sheet

## Create Survey
Make the survey via google forms. Create the linked spreadsheet. The headers on the spreadsheet should look something like this:

| Timestamp           | First Name | Last Name | Email                      | Primary Project |
|---------------------|------------|-----------|----------------------------|-----------------|
| 12/20/2020 21:46:38 | New        | User      | someemail@gmail.com        | Project         |  
| 12/20/2020 22:45:38 | Another    | User      | someotheremail@gmail.com   | Project         |
| 12/20/2020 22:52:53 | One        | More      | justanotheremail@gmail.com | Project         |

I have the following Regex to make sure that the names are in the form `First Last`: `^[A-Z].*`. Make sure you choose matches as your condition. The Email field, I have another form validation to make sure an email is given. The Primary Project is whatever groups made.

Thats it! It's not much, but don't forget to make the questions required XD.

## Attach Script
Go to your google forms spreadsheet and go to `tools > Script Editor`. Copy and paste the code from `Code.gs` in. Remember to change the firebase URL to correct one. Next, add a trigger to sheet. Choose the corresponding function to run. The Event Source should be `From spreadsheet` and the Event Type should be `On form submit`.
## Run
- `npm install`
- `node .`

This all should now work! If you fill out the form it will create a new user in your GSuite and email you the corresponding information!