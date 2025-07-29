// script.js 
// For security desk data
function getGarages(){
  // Get the names of garages to be displayed
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.has('garages') ? console.log(urlParams.get('garages').split(",")) : null 
  return urlParams.has('garages') ? urlParams.get('garages').split(",") : [ "Lot 1", "PG3", "PG5" ];
}
function getData(garages){
  // Open the occupancy file and pass it into parseData
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      parseData(this, garages);
    }
  };
  xhttp.open("GET", "http://localhost:8080/occupancy.xml", true);
  xhttp.send();
}

function formatName(zoneName){
  // Convert raw name to pretty name
  let nameFilter = new RegExp("PG[0-9]+|Lot [0-9]+|Parkview|MMC", "i")
  return zoneName.match(nameFilter)[0];
}

function resizeCards(numCards){
  //Given a number of garages, resize text accordingly 
  if (numCards == 1) {
    document.getElementsByClassName("title")[0].style = "font-size: 25cqb;";
    document.getElementsByClassName("parking-type")[0].style = "font-size: 15cqb;";
    document.getElementsByClassName("parking-value")[0].style = "font-size: 20cqb;";
  }
}

function formatCountType(zoneName, available){
  // Create an object pairing count type with count value
  if (available <= 0){
    available = "Full"
  }
  if (zoneName.match("Lvls 1")) {
    return { "Other": available };
  } else if (zoneName.match("Lvls 3")) {
    return { "Student": available };
  } else {
    return {"Available Spaces": available};
  }
}

function getCountType(zoneName){
  if (zoneName.match("Lvls 1")) {
    return "lower";
  } else if (zoneName.match("Lvls 3")) {
    return "upper";
  } else {
    return "single";
  }
}

function garageIndex(occupancyList, displayName){
  // Find the index of the garage in the list, if none return -1
  for (var i = 0; i < occupancyList.length; i++){
    if (occupancyList[i].displayName == displayName){
      return i;
    }
  }
  return -1;
}

function parseData(xml, garages){
  // Parse occupancy file
  const occupancyList = []; // All garages to be displayed
  const xmlDoc = xml.responseXML;
  const items = xmlDoc.getElementsByTagName("Occupancy");

  for (var item of items) { // Loop through all xml elements
    const zoneName = item.getElementsByTagName("ParkingZoneName")[0].textContent; //take off format name!
    const displayName = formatName(zoneName);
    const capacity = parseInt(item.getElementsByTagName("Capacity")[0].textContent, 10);
    const vehicles = parseInt(item.getElementsByTagName("Vehicles")[0].textContent, 10);
    const available = capacity - vehicles;
    const occupancyIndex = garageIndex(occupancyList, displayName);

    garages.forEach(garageID => { 
      // Find if garage in xml file is located in `garages`.
      // If so, add to occupancyList
      if (displayName.match(garageID + "$") && !zoneName.includes("Total")){
        if (zoneName.match("Lvls")) {
          if (occupancyIndex >= 0){
            const curr = occupancyList[occupancyIndex]["available"];
            //Upper floors should show up at the top
            if (getCountType(zoneName) == "upper")
              occupancyList[occupancyIndex]["available"] = {...formatCountType(zoneName, available), ...curr};
            else
              occupancyList[occupancyIndex]["available"] = {...curr, ...formatCountType(zoneName, available)};

          } else {
            occupancyList.push({ zoneName, displayName, capacity, vehicles, available: formatCountType(zoneName, available)});
          }
        } else {
          occupancyList.push({ zoneName, displayName, capacity, vehicles, available: formatCountType(zoneName, available) });
        }
      }
    });
  }
  setCounts(occupancyList);
  resizeCards(occupancyList.length);
}

function setCounts(occupancyList) {
  // Add counts to UI
  for (var i = 0; i < occupancyList.length; i++){
    insertCard("card-" + i, occupancyList[i].displayName, occupancyList[i].available);
  }
}

function insertCard(uniqueId, title, data) {
  // Add a card, where each card is a unique garage
  const template = document.getElementById("card-template");
  const clone = document.importNode(template.content, true);
  const card = clone.querySelector(".card");
  card.id = uniqueId;
  clone.querySelector(".title").textContent = title;

  for (const [key, value] of Object.entries(data)) {
    // Create count type element (Student, Other)
    const parkingType = document.createElement("h3");
    parkingType.className = "parking-type";
    parkingType.textContent = key;
    // Create count number element (# of spaces)
    const parkingValue = document.createElement("p");
    parkingValue.className = "parking-value";
    parkingValue.textContent = value;

    clone.querySelector(".data").append(parkingType);
    clone.querySelector(".data").append(parkingValue);
  }

  document.getElementById("card-grid").appendChild(clone);
}
getData(getGarages());
