//------------------------------------------------------------------------------
// Copyright IBM Corp. 2016
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------

module.exports = function() {
  return {
    "handle" : function(data, mqttClient) {    

	    var messageId = data.readUInt8(1);
	    var date = new Date();

	    if (messageId == '23') {
	      // example: <Buffer 01 17>
	      var desc = 'Ping Response Received';
	      console.log('Message: ' + messageId, data, desc);
	      
	      if (mqttClient) {
	      	mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
	          "d" : {
	            "description" : desc,
	            "date": date
	          }
	        }), function () {
	        }); 
		  }
	    }

	    else if (messageId == '25') {
	      // example: tbd
	      var desc = 'Version Received';
	      var version = data.readUInt16LE(2);
	      console.log('Message: ' + messageId, data, desc + ' - version: ' + version);

	      if (mqttClient) {
	      	mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
	          "d" : {
	            "description" : desc,
	            "date": date,
	            "version": version
	          }
	        }), function () {
	        }); 
		  }
	    }

	    else if (messageId == '27') {
	      // example: tbd
	      var desc = 'Battery Level Received';
	      var level = data.readUInt16LE(2);
	      console.log('Message: ' + messageId, data, desc + ' - level: ' + level);

	      if (mqttClient) {
	      	mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
	          "d" : {
	            "description" : desc,
	            "date": date,
	            "level": level
	          }
	        }), function () {
	        }); 
		  }
	    }

	    else if (messageId == '39') { 
	      // example: <Buffer 10 27 21 28 48 e1 86 c2 02 01 47 00 00 00 02 fa 00>
	      var desc = 'Localization Position Update Received';
	      var offset = data.readFloatLE(4);
	      var speed = data.readUInt16LE(8);
	      console.log('Message: ' + messageId, data, desc + ' - offset: '  + offset + ' speed: ' + speed);

	      if (mqttClient) {
	      	mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
	          "d" : {
	            "description" : desc,
	            "date": date,
	            "offset": offset,
	            "speed": speed
	          }
	        }), function () {
	        }); 
		  }
	    }

	    else if (messageId == '41') { 
	      // example: <Buffer 12 29 00 00 02 2b 55 c2 00 ff 81 46 00 00 00 00 00 25 32>
	      var desc = 'Localization Transition Update Received';
		  var offset = data.readFloatLE(4);
		  console.log('Message: ' + messageId, data, desc + ' - offset: '  + offset);

		  if (mqttClient) {
	      	mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
	          "d" : {
	            "description" : desc,
	            "date": date,
	            "offset": offset
	          }
	        }), function () {
	        }); 
		  }
	    }

	    else if (messageId == '43') { 
		  // example: <Buffer 01 2b>
	      var desc = 'Vehicle Delocalized Received';
	      console.log('Message: ' + messageId, data, desc);

	      if (mqttClient) {
	      	mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
	          "d" : {
	            "description" : desc,
	            "date": date
	          }
	        }), function () {
	        }); 
		  }
	    }

	    else if (messageId == '45') { 
	      // example: <Buffer 06 2d 00 c8 75 3d 03>
		  var desc = 'Offset from Road Center Update Received';
		  var offset = data.readFloatLE(2);
	      console.log('Message: ' + messageId, data, desc + ' - offset: '  + offset);

	      if (mqttClient) {
	      	mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
	          "d" : {
	            "description" : desc,
	            "date": date,
	            "offset": offset
	          }
	        }), function () {
	        }); 
		  }
	    }

	    else if (messageId == '54') {
	      // example: <Buffer 03 36 00 00>
	      //console.log('Message: ' + messageId, data, 'Not documented');   
	    }

	    else if (messageId == '63') {
	      // example: <Buffer 05 3f 01 00 00 01>
	      //console.log('Message: ' + messageId, data, 'Not documented');
	    }

	    else if (messageId == '65') {
	      // example: <Buffer 0e 41 9a 99 7f 42 9a 99 7f 42 00 00 00 02 81>
	      var desc = 'Changed Offset (not documented)';
		  var offset = data.readFloatLE(2);
		  console.log('Message: ' + messageId, data, desc + ' - offset: '  + offset);

		  if (mqttClient) {
	      	mqttClient.publish('iot-2/evt/' + messageId + '/fmt/json', JSON.stringify({
	          "d" : {
	            "description" : desc,
	            "date": date,
	            "offset": offset
	          }
	        }), function () {
	        }); 
		  }
	    }

	    else if (messageId == '67') {
	      // example: <Buffer 01 43>
	      //console.log('Message: ' + messageId, data, 'Not documented');
	    }

	    else if (messageId == '77') {
	      // example: <Buffer 03 4d 00 01>
	      //console.log('Message: ' + messageId, data, 'Not documented');
	    }

	    else if (messageId == '134') {
	      // example: <Buffer 0b 86 8e 00 27 08 00 00 10 10 00 00>
	      //console.log('Message: ' + messageId, data, 'Not documented');
	    }

	    else if (messageId == '201') {
	      // example: tbd
	      //console.log('Message: ' + messageId, data, 'Not documented');                       
	    }

	    else {
	      //console.log('Message: ' + messageId, data, 'Unknown');
	    }
  	
	}
  };
};