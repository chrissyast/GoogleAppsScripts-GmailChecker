function useOrCreateLabel(labelName) {
  if (GmailApp.getUserLabelByName(labelName) == null) {
       GmailApp.createLabel(labelName)
       }
  return GmailApp.getUserLabelByName(labelName)
}
  
function filterUnwantedLabels(thread) {
    var labels = thread.getLabels()
    var wantedLabels = []
    for (var i=0;i<labels.length;i++) {
      if (UNWANTED_LABELS.indexOf(labels[i].getName()) == -1) {
      wantedLabels.push(labels[i])
      }
    }
    return wantedLabels;
  }

function containsLabel(thread, labelString) {
  var labels = thread.getLabels()
  for (var i=0;i<labels.length;i++) {
    if (labels[i].getName().equals(labelString)) {
      return true;
    }
  }
  return false;
}

function replaceLabel(thread,oldLabel,newLabel) {
  var labels = thread.getLabels()
  
  for (var i=0;i<labels.length;i++) {
    if (labels[i].getName() == oldLabel.getName()) {
      thread.removeLabel(oldLabel)
      thread.addLabel(newLabel)
      break;
    }
  }
}