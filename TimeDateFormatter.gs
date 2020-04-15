function getFormattedTimeNow() {
 var now = new Date()
 var yyyy = now.getFullYear()
 var mm = now.getMonth() + 1
 var dd = now.getDate()
 var hh = now.getHours()
 var min = now.getMinutes()
 
 return (dd+ "/" + mm + "/" + yyyy + " " + hh + ":" + min)
}

function dateOnly(date) {
  var dd = date.getDate()
  var mm = date.getMonth() + 1
  var yyyy = date.getFullYear()
  return (dd+ "/" + mm + "/" + yyyy)
}
