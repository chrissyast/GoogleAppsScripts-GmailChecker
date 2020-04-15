function removePastInvitesNoArgs() {
  var threads = getFullInbox();
  removePastInvites(threads)
}

function removePastInvites(threads) {
  var labelName = "Past Events";  
  var days = 3;   
  var count = 0;
  var archivedEmails = []
  var email = Session.getActiveUser().getEmail().split("@").join("+analysis@");
  var calendarInvites = getCalendarInvites(threads);
  var label = useOrCreateLabel(labelName)
  
  for (invite in calendarInvites) {
    var message = calendarInvites[invite];
    var now = Date.now();
    var date = getEndDate(message);
    var diff = now - date;
    if (diff > (1000 * 60 * 60 * 24 * days)) { 
      var inviteEmail = message.email;
     
      inviteEmail.addLabel(label)
      inviteEmail.markRead()
      inviteEmail.moveToArchive()
      archivedEmails.push(inviteEmail.getFirstMessageSubject())
      count++;
    }
  }
  var summary = (count + " email" + (count==1 ? " " : "s ") + "archived.")
  var subject = ("Archived invites to past events - " + summary)
  var body = archivedEmails.join("\n")
  if (count > 0) {
    GmailApp.sendEmail(email, subject, archivedEmails.join("\n"))
  }
  
}

function getCalendarInvites(threads) {
var messages, attachments;
var inviteEmails = [];
  for (thread in threads) {
    messages = threads[thread].getMessages()
    var allInvites = [];
    for (message in messages) {
      console.log("This is working")
      console.log(messages[message].getSubject())
    attachments = messages[message].getAttachments()
       for (attachment in attachments) {
         if (attachments[attachment].getContentType() == "application/ics")  {  
           allInvites.push(attachments[attachment])      
         }
       }      
    }
  if (allInvites.length > 0) {
      var emailInv = new EmailAttachment(threads[thread],allInvites);
      var test = threads[thread].getFirstMessageSubject();
      inviteEmails.push(emailInv)
    }
  }
  return inviteEmails;
}

function getEndDate(emailInv){
  var invites = emailInv.attachments;
  var dates = []
  for (invite in invites) {
  var icsString = invites[invite].getDataAsString();
  var endDate = icsString.substring(icsString.indexOf("DTEND")+6);
    endDate = endDate.replace(/\D/g,"")
    endDate = endDate.substring(0,8);
    dates.push(endDate)
  }
  return findLatest(dates);  
}

function matchLocation(emailInv, location){
  var invites = emailInv.attachments;
  var dates = []
  for (invite in invites) {
  var icsString = invites[invite].getDataAsString();
  var invLocation = icsString.substring(icsString.indexOf("LOCATION")+9);
    if (invLocation.indexOf(location) > -1) {
      return true;
    }
  }
  return false;
}

function findLatest(dates) {
  var latestDate;
  for (date in dates) {
    var dateObj = parseDate(dates[date])
    if (latestDate == null) {
      latestDate = dateObj
    }
    else if (dateObj > latestDate) {
    latestDate = dateObj
    } 
  }
  return latestDate
  
}

function parseDate(str) {
    if(!/^(\d){8}$/.test(str)) return "invalid date";
    var y = str.substr(0,4),
        m = str.substr(4,2) - 1,
        d = str.substr(6,2);
    return new Date(y,m,d).getTime();
}


var EmailAttachment = function(email, attachments){
  this.email = email;
  this.attachments = attachments;
};
