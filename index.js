var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mqtt = require('mqtt');
var mqtt_client = mqtt.connect('mqtt://165.227.66.242:1883');

var port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));
/*
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
*/


io.on("connection", (socket) => {
  socket.on("subscribe", (data) => {
    console.log("Subscribe > topic: " + data.topic);
    // MQTT subscribe topic from broker
    mqtt_client.subscribe(data.topic);
  });

  socket.on("publish", (data) => {
    console.log("Publish > topic: " + data.topic + ", message: " + data.message);
    // mqtt_client publish to broker
    mqtt_client.publish(data.topic, data.message, { qos: 1, retain: true });
  });

  // Listen message from MQTT broker
  mqtt_client.on("message", (topic, message, packet) => {
    let light1_state = undefined;
    console.log('received message %s %s', topic, message)
    switch (topic) {
      case "home-yavuz/working-room/light-1/state":
        if (light1_state !== "ON" && message.toString().toLowerCase() === "on") {
          light1_state = "ON";
        }
        else if (light1_state !== "OFF" && message.toString().toLowerCase() === "off") {
          light1_state = "OFF";
        }

        // MQTT publish to broker
        //mqtt_client.publish("home-yavuz/working-room/light-1/state", light1_state, { qos: 1, retain: true });
        // Send to WebSocket
        socket.emit("mqtt-message", { topic: "home-yavuz/working-room/light-1/state", message: light1_state });
        break;
      case "home-yavuz/working-room/camera/photo":

        // Send to WebSocket
        socket.emit("mqtt-message", { topic: "home-yavuz/working-room/camera/photo", message: message });
        break;        
    }

  });
});


http.listen(port, function () {
  console.log('listening on *:' + port);
});
