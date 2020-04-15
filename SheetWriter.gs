function writeToSpecificSheet(spreadSheet,sheetName,data) {
  var sheet = spreadSheet.getSheetByName(sheetName)
  writeHorizontallyToSheet(sheet,data);
}

function writeHorizontallyToSheet(sheet, data, timestamp){ 
      findFirstFreeCell(sheet)
      for (var i=0; i<data.length; i++) {
      sheet.getCurrentCell().setValue(data[i])
      sheet.setCurrentCell(sheet.getCurrentCell().offset(0,1))
      }
  if (timestamp != false)
      sheet.getCurrentCell().setValue(getFormattedTimeNow())
}

function moveLineToAnotherSheet(range,newSheet) {
  var newSheetRange = findFirstFreeCell(newSheet,true)
  range.copyTo(newSheetRange)
  range.getSheet().deleteRows(range.getRow(),range.getNumRows())
}

function findFirstFreeCell(sheet, returnCell) {
  var initRow = 2;
  var found = false;
  while (true) {
  var orderNumberRange = sheet.getRange(initRow,1,100,1)
  var orderNumberValues = orderNumberRange.getValues()
  var valueFound = false;
  for (var i = 0; i < orderNumberValues.length; i++) {
    if (orderNumberValues[i] == "") {
      sheet.setCurrentCell(sheet.getRange(i+initRow,1))
      if (returnCell) {
      return sheet.getRange(i+initRow,1)
      }
      found = true
      break;
    }
  }
    if (found) {
    break;
    }
    else {
    initRow += 100;
    }
    
  }
}