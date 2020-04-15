var SUMMARY_SHEET = summarySheet() // this is a getter on a UserSettings class which the user will keep private. returns ID a google sheet.
var UNWANTED_LABELS = ["toProcess","short lived"]
var LOCATIONS = ["Liverpool", "Lisbon"]
var CURRENT_LOCATION = "Lisbon"
var USER_EMAIL = Session.getActiveUser().getEmail()
var ANALYSIS_EMAIL = appendTag(USER_EMAIL, "analysis")


function cleanup() {
  var threads = getFullInbox();
 
  removePastInvites(threads); // finds emails which are invitations to events in the past and archives them.
  
  // TODO populate these from a sheet
  //arguments : removeOldTags(label,days,showSubject,delet (false will archive)) 
  var label = GmailApp.getUserLabelByName("short lived")
  removeOldTags(label,14,true,true)
  
  label = GmailApp.getUserLabelByName("Travel/Buses and Taxis")
  removeOldTags(label,14,false,false)
  
  label = GmailApp.getUserLabelByName("Sales")
  removeOldTags(label,60,true,true)
  
  label = GmailApp.getUserLabelByName("Jobs/New Jobs");
  removeOldTags(label,21,false,true);
  
  label = GmailApp.getUserLabelByName("Jobs/Applications");
  removeOldTags(label,45,false,false);
  
  label = GmailApp.getUserLabelByName("Financial/Paypal/Recent transactions");
  removeOldTags(label,30,false,false);
  
  label = GmailApp.getUserLabelByName("analysis");
  removeOldTags(label,3,false,true);
   
  analyseInbox(threads)  // analyses number of messages in inbox, and how many are tagged/untagged, also writes this info to SUMMARY_SHEET
}

function analyseNewEmails() {
  var label = GmailApp.getUserLabelByName("toProcess");
  var toProcess = label.getThreads();
  var sheet = SUMMARY_SHEET.getSheetByName("NewEmailsRawData")
  
  for (var i=0;i<toProcess.length;i++) {
    var data = [];
    var labels = filterUnwantedLabels(toProcess[i]);
    if (labels.length == 0) {
    data.push("N")
    }
    else data.push("Y")
    checkForAnalysisEmail(toProcess[i])
    var messages = toProcess[i].getMessages();
    var mostRecent = messages[messages.length - 1];
    data.push(dateOnly(mostRecent.getDate()));
    writeHorizontallyToSheet(sheet, data, false)
    toProcess[i].removeLabel(label); 
  }
  
  var meetupEmails = toProcess.filter(function(thread) {
    return containsLabel(thread, "Meetup");
  })
  
  tagMeetupLocations(meetupEmails)
  // processNewEbayOrders()
}

function checkForAnalysisEmail(thread) {
  if (thread.getFirstMessageSubject() == "Inbox analysis") {
    thread.markUnread()
    thread.moveToInbox()
  }
}

function analyseInbox() {
  var threads = getFullInbox();
  var totalThreads = threads.length;
  var labelledCount = 0
  var unlabelledCount = 0
  var sendersCount = {}
  for (var i=0; i<threads.length; i++) {

    var labels = threads[i].getLabels();
    var firstMessageSender = email(threads[i].getMessages()[0].getFrom())  // TODO change this to cover when I sent a message and received a reply
    if (firstMessageSender.equals(USER_EMAIL)) {
    }
    if (firstMessageSender in sendersCount) {
      sendersCount[firstMessageSender]++
    }
    else {
      sendersCount[firstMessageSender] = 1
      }
      
    labels = labels.filter(function(label){
      return (label.getName() != "test" && label.getName() != "toProcess")
    })
    
    if (labels.length == 0) {
      unlabelledCount++;
    }
    else {
    labelledCount++;
    }
  }
  var orderedSenders = orderHash(sendersCount)
  var topFiveSenders = createTopX(orderedSenders, 5)
  var summary = (
                 "Total messages: " + totalThreads + "<br>" +
                 " Labelled: " + labelledCount + "<br>" +
                 ". Unlabelled: " + unlabelledCount + "<br>" + 
                 roundToTwo(labelledCount * 100 /totalThreads) + "% labelled." + "\n" +
    "Top five senders in inbox: " + topFiveSenders
                 );
  var data = []
  data.push(totalThreads)
  data.push(labelledCount)
  data.push(unlabelledCount)
  data.push(topFiveSenders)
  writeToSpecificSheet(SUMMARY_SHEET,"Inbox Analysis",data)
 
  MailApp.sendEmail({to: ANALYSIS_EMAIL, subject: "Inbox analysis", htmlBody: summary})
}

function createTopX(hash, limit) {
  allResults = []
  keys = Object.keys(hash)
  keys.forEach(function(k) {

    allResults.push("Sender: " + k + ", Count: " + hash[k] + "<a href='https://mail.google.com/mail/u/0/#search/from%3A" + encodeURI(k) + "+in%3Ainbox" + "'>Search</a>")
  })
  return allResults.slice(0, limit).join("<br>")
}

function email(string) {
  Logger.log(string)
  if ((string.indexOf("<") && string.indexOf(">")) == -1){
    Logger.log(string)
    return string
  }
  else {
    Logger.log(string.substring(string.indexOf("<"),string.indexOf(">")))
    return string.substring(string.indexOf("<")+1,string.indexOf(">"))
  }
}

function replaceTags(string) {
  return string.replace(/</g,'&lt;')
}

function getFullInbox() {
var max = 500;
var offset = 0;
var searchThreads = [];

while (true) {
   var threads = GmailApp.getInboxThreads(offset, max);
  searchThreads = searchThreads.concat(threads);
  if (threads.length < max) {
    break;
  }

  offset += max;
}
  return searchThreads;
}

function orderHash(obj) {
  var keys = Object.keys(obj);
  keys.sort(function(a, b) {
    return obj[b] - obj[a]
  });
  var sortedHash = {}
  keys.forEach(function(k) {
    sortedHash[k] = obj[k]
  });
  return sortedHash
}

function tagMeetupLocations(threads) {
  var events = getCalendarInvites(threads)  
  for (var i=0;i<events.length;i++) {
    var message = events[i].email
    for (var j=0;j<LOCATIONS.length;j++) {
      if (matchLocation(events[i],LOCATIONS[j])) {
       var label = useOrCreateLabel("Events/" + LOCATIONS[j])
       message.addLabel(label)
         if (!matchLocation(events[i],CURRENT_LOCATION)) {
        message.moveToArchive()
         }
      }
    }
  }
}

function appendTag(email,tag){
var atSymbol = email.indexOf("@")
return [email.slice(0, atSymbol), ("+" + tag), email.slice(atSymbol)].join('');
}


function removeOldTags(label,days,showSubject,delet) {  
var threads = label.getThreads();
var email = appendTag(Session.getActiveUser().getEmail(), "analysis");
var count = 0;
var subjects = [];
for (var i = 0; i < threads.length; i++) {
  if (((Date.now() - (threads[i].getLastMessageDate())) > (1000 * 60 * 60 * 24 * days)) && !threads[i].hasStarredMessages()) {
    if (threads[i].isInInbox() || delet) {
        count++;    
      }
    if (showSubject) {
    subjects.push(threads[i].getFirstMessageSubject())
    }
    if(delet) {
    threads[i].moveToTrash();
    }
    else {
    threads[i].moveToArchive();
    }
  
  }
  }
  var summary = (count + " threads " + (delet ? "deleted" : "archived"))
  var subject = ((delet ? "Deleted" : "Archived") + ' old ' + label.getName() + ' emails: ' + summary)
  var body = (summary + subjects.join("\n"))
  if (count > 0) { 
    if (showSubject) {
      GmailApp.sendEmail(email, subject, body)
    }
    else {
      GmailApp.sendEmail(email, subject, summary)
    }
  }
}
