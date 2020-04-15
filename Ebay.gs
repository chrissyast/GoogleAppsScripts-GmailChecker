var LABEL_NEW = useOrCreateLabel("Ebay/Orders/New");
var LABEL_COMPLETE = useOrCreateLabel("Ebay/Orders/Complete");
var EBAY_ORDERS_SHEET = ebayOrdersSheet();

function processNewEbayOrders() {
 var outstandingOrders = EBAY_ORDERS_SHEET.getSheetByName("Outstanding Orders")
 findNewOrders(outstandingOrders)
 archiveCompletedOrders()
}

// can make findNewOrders return an array of new orders. is this necessary?
function findNewOrders(ordersSheet) {
 var label = GmailApp.getUserLabelByName("Ebay/Orders");
 var threads = LABEL_NEW.getThreads();
  for (thread in threads) {
    var messages = threads[thread].getMessages();
    for (message in messages) {
      var body = messages[message].getPlainBody()
      if (body.indexOf("Item number") != -1) {
      var data = []
      var orderNumber = body.substring(body.indexOf("Item number") + 12)
      orderNumber = orderNumber.replace(/^\D*(\d*)\D[\D\d]*/,"$1")
      var itemDesc = body.substring(body.indexOf("Order summary"))
      var index = itemDesc.indexOf("[image")+6
      itemDesc = itemDesc.substring(itemDesc.indexOf("[image")+8)
      itemDesc = itemDesc.substring(0,itemDesc.indexOf("]"))
      data.push(orderNumber,itemDesc,"Outstanding")
      writeHorizontallyToSheet(ordersSheet, data, false)
      }
      threads[thread].removeLabel(LABEL_NEW)
    }  
  }
}

function archiveCompletedOrders() {
  var ordersSheet = EBAY_ORDERS_SHEET.getSheetByName("Outstanding Orders")
  var max = ordersSheet.getLastRow() - 1;
  var range = ordersSheet.getRange(2, 1, max, 3)
  var data = range.getValues()
  var completedSheet = EBAY_ORDERS_SHEET.getSheetByName("Completed Orders")
  var deleted = 0
  for (var i=0;i<max-i;i++) {
    if (data[i][0]=="") {break;}
    if (data[i][2]=="Completed")
    {
    Logger.log(data[i][0])
    var threads = GmailApp.search(data[i][0])
    for (var j=0;j<threads.length;j++) {
      threads[j].moveToArchive() 
      replaceLabel(threads[j],LABEL_NEW,LABEL_COMPLETE)
    }
    moveLineToAnotherSheet(ordersSheet.getRange(i+2-deleted,1,1,3),completedSheet)
    deleted++;
    }
  }
}
