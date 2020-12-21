function writeDataToFirebase(event) {
  var formValues = event.namedValues;
  Logger.log(event);
  Logger.log(event.namedValues);
  var dataToImport = {};
    var firstName = formValues['First Name'][0];
    var lastName = formValues['Last Name'][0];
    var email = formValues['Email'][0];
    dataToImport[firstName + '-' + lastName] = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      gender: formValues['Gender'][0],
      primaryProject: formValues['Primary Project'][0],
    };
  var firebaseUrl = "<Your-Firbase-URL>";
  var base = FirebaseApp.getDatabaseByUrl(firebaseUrl);
  var path = firstName + '-' + lastName;
  var checkData = base.getData(path);
  if (checkData == null) {
    base.setData("", dataToImport);
  } else {
    var name = firstName + ' ' + lastName + ' ';
    var subject = 'ERROR: ' + name + 'Account Already Exists';
    var message = 'Hi ' + name + ',\n\nOur database indicates that this account has already been created. To resolve this, please contact: it@thrustcorp.space\nCheers,\nThrust IT';
    MailApp.sendEmail(email, subject, message);
  }
}