/*global $, window, goinstant, document, getOrSetRoomCookie, jQuery */
'use strict';
var console=console||{"error":function(){}};

function connect(options) {
  var connectUrl = 'https://goinstant.net/goinstant-services/docs';
  var connection = new goinstant.Connection(connectUrl, options);

  connection.connect(function(err, connection) {
    if (err) {
      return console.error('could not connect:', err);
    }

    var roomName = getOrSetRoomCookie("form");
    var currentRoom = connection.room(roomName);

    var Form = goinstant.widgets.Form;

    currentRoom.join(function(err) {
      if (err) {
        return console.error('Error joining room:', err);
      }

      var color = options.guestId == "1" ? "#f00" : "#0f0";
      var userKey = currentRoom.self();
      userKey.key('displayName').set('Guest ' + options.guestId, function(err) {
        if (err) {
          return console.error("Error setting userId", err);
        }
      });
      userKey.key('avatarColor').set(color, function(err) {
        if (err) {
          return console.error("error setting avatarColor", err);
        }
        // The user now appears red in the user-list, etc.
      });

      var formKey = currentRoom.key('example-form-key');

      var form = new Form({
        key: formKey,
        el: document.getElementById('form-id'),
        room: currentRoom
      });

      form.initialize(function(err) {
        if (err) {
          return console.error('Could not initialize widget:', err);
        }
        // Your form should now be initialized!
      });
    });
  });
}

$(window).ready(function() {
  // window.options comes from an inline script tag in each iframe.
  connect(window.options);
});
