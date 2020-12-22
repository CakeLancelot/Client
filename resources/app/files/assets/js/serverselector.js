var remote = require("remote");
var remotefs = remote.require('fs');

var userdir = remote.require('app').getPath('userData');
var versionarray
var serverarray

function enableServerListButtons() {
  $('#of-connect-button').removeClass('disabled');
  $('#of-connect-button').prop('disabled', false);
  $('#of-deleteserver-button').removeClass('disabled');
  $('#of-deleteserver-button').prop('disabled', false);
}

function disableServerListButtons() {
  $('#of-connect-button').addClass('disabled');
  $('#of-connect-button').prop('disabled', true);
  $('#of-deleteserver-button').addClass('disabled');
  $('#of-deleteserver-button').prop('disabled', true);
}

function loadGameVersions() {
  var versionjson = JSON.parse(remotefs.readFileSync(userdir+"\\versions.json"));
  versionarray = versionjson['versions'];
  $.each(versionarray, function( key, value ) {
    $(new Option(value.name, 'val')).appendTo('#addserver-versionselect');
  });
}

function loadConfig() {
    // TODO: actually use these values
    var configjson = JSON.parse(remotefs.readFileSync(userdir+"\\config.json"));
  }

function loadServerList() {
    var serverjson = JSON.parse(remotefs.readFileSync(userdir+"\\servers.json"));
    serverarray = serverjson['servers'];

    $(".server-listing-entry").remove(); // clear out old stuff, if any
    disableServerListButtons();

    if (serverarray.length > 0) {
      $("#server-listing-placeholder").attr("hidden",true);
      $.each(serverarray, function( key, value ) {
        var row = document.createElement('tr');
        row.className = 'server-listing-entry'
        row.setAttribute('id', value.uuid)
        var cellName = document.createElement('td');
        cellName.textContent = value.description
        var cellVersion = document.createElement('td');
        cellVersion.textContent = value.version
        cellVersion.className = 'text-monospace'

        row.appendChild(cellName);
        row.appendChild(cellVersion);
        document.getElementById('server-tablebody').appendChild(row);
      });
    } else {
    // no servers added, make sure placeholder is visible
    $("#server-listing-placeholder").attr("hidden",false);
  }
}

// For writing loginInfo.php, assetInfo.php, etc.
function setGameInfo(serverUUID) {
  var result = serverarray.filter(function(obj) {return (obj.uuid === serverUUID);})[0];
  var gameversion = versionarray.filter(function(obj) {return (obj.name === result.version);})[0];
  window.asseturl = gameversion.url

  remotefs.writeFileSync(__dirname+"\\assetInfo.php", asseturl);
  remotefs.writeFileSync(__dirname+"\\loginInfo.php", result.ip);

  if (result.hasOwnProperty('endpoint')) {
    var rankurl = result.endpoint.replace("https://", "http://") + "getranks"
    console.log("Using rank endpoint " + rankurl)
    remotefs.writeFileSync(__dirname+"\\rankurl.txt", rankurl);
  } else {
    if (remotefs.existsSync(__dirname+"\\rankurl.txt")) {
      // delete the file, this server won't be using it
      remotefs.unlinkSync(__dirname+"\\rankurl.txt");
    }
  }
}

function getSelectedServer() {
  return $("tr.bg-primary").prop("id");
}

function connectToServer() {
  // Get ID of the selected server, which corresponds to its UUID in the json
  var uuid = getSelectedServer();
  console.log("Connecting to server with UUID of " + uuid);

  // prevent the user from clicking anywhere else during the transition
  $('body,html').css('pointer-events','none');
  stopEasterEggs();
  $('#of-serverselector').fadeOut('slow', function() {
    setTimeout(function(){
      $('body,html').css('pointer-events','');
      setGameInfo(uuid);
      launchGame();
    }, 200);
  });
}

$('#server-table').on('click', '.server-listing-entry', function(event) {
  enableServerListButtons();
  $(this).addClass('bg-primary').siblings().removeClass('bg-primary');
});

$('#server-table').on('dblclick', '.server-listing-entry', function(event) {
  $(this).addClass('bg-primary').siblings().removeClass('bg-primary');
  connectToServer();
});