const noble = require("noble-highsierra");
const async = require("async");

// var receivedMessages = require('./receivedMessages.js')();
var prepareMessages = require('./prepareMessages.js')();
var writeCharacteristic;
var readCharacteristic;

module.exports = class Car {
    constructor(carId, name, startLane, trafficLight) {
        if (!carId) {
            console.log('Define carid in a properties file and pass in the name of the file as argv');
            process.exit(0);
        }
        this.carId = carId;
        this.name = name;
        this.lane = startLane;
        this.discovered = false;
        this.initialized = false;
        this.isTesting = true;
        this.testStarted = false;
        this.trackPieceArray = [];
        this.currTestTrackArray = [];
        this.pieceIndex = 0;
        this.criticalIndices = [];
        this.trafficLight = trafficLight;
        this.inCriticalSection = false;
        this.stopAtIntersection = false;
        this.collisionPath = [];
        this.writeCharacteristic = writeCharacteristic = null;

        noble.startScanning();
        setTimeout(function() {
            noble.stopScanning();
        }, 2000);

        noble.on('discover', this.onDiscovered.bind(this));

    }

    onDiscovered(peripheral) {
        if (peripheral.id === this.carId) {
            noble.stopScanning();
            this.discovered = true;

            var advertisement = peripheral.advertisement;
            var serviceUuids = JSON.stringify(peripheral.advertisement.serviceUuids);
            if (serviceUuids.indexOf("be15beef6186407e83810bd89c4d8df4") > -1) {
                console.log('Car discovered. ID: ' + peripheral.id);
                this.car = peripheral;
                this.setUp();
            }
        }
    }

    setUp() {
        let _this = this;
        let peripheral = _this.car;
        peripheral.on('disconnect', function() {
            console.log(_this.name + ' has been disconnected');
            process.exit(0);
        });

        peripheral.connect(function(error) {
            peripheral.discoverServices([], function(error, services) {
                var service = services[0];

                service.discoverCharacteristics([], function(error, characteristics) {
                    var characteristicIndex = 0;

                    async.whilst(
                        function() {
                            return (characteristicIndex < characteristics.length);
                        },
                        function(callback) {
                            var characteristic = characteristics[characteristicIndex];
                            async.series([
                                function(callback) {
                                    if (characteristic.uuid == 'be15bee06186407e83810bd89c4d8df4') {
                                        readCharacteristic = characteristic;

                                        readCharacteristic.notify(true, function(err) {});

                                        characteristic.on('read', function(data, isNotification) {
                                            _this.handle(data);
                                        });
                                    }

                                    if (characteristic.uuid == 'be15bee16186407e83810bd89c4d8df4') {
                                        _this.writeCharacteristic = characteristic;

                                        _this.init();

                                        // this characterstic doesn't seem to be used for receiving data
                                        characteristic.on('read', function(data, isNotification) {
                                            console.log('Data received - writeCharacteristic', data);
                                        });
                                    }

                                    callback();
                                },
                                function() {
                                    characteristicIndex++;
                                    callback();
                                }
                            ]);
                        },
                        function(error) {}
                    );
                });
            });
        });
    }

    init() {
        let _this = this;
        let startlane = this.lane;
        // turn on sdk and set offset
        var initMessage = new Buffer(4);
        initMessage.writeUInt8(0x03, 0);
        initMessage.writeUInt8(0x90, 1);
        initMessage.writeUInt8(0x01, 2);
        initMessage.writeUInt8(0x01, 3);
        _this.writeCharacteristic.write(initMessage, false, function(err) {
            if (!err) {
                var initialOffset = 0.0;
                if (startlane) {
                    if (startlane == '1') initialOffset = 68.0;
                    if (startlane == '2') initialOffset = 23.0;
                    if (startlane == '3') initialOffset = -23.0;
                    if (startlane == '4') initialOffset = -68.0;
                }

                initMessage = new Buffer(6);
                initMessage.writeUInt8(0x05, 0);
                initMessage.writeUInt8(0x2c, 1);
                initMessage.writeFloatLE(initialOffset, 2);
                _this.writeCharacteristic.write(initMessage, false, function(err) {
                    if (!err) {
                        _this.initialized = true;
                        console.log(_this.name + ': Initialization was successful');
                        // console.log('Enter a command: help, s (speed), c (change lane), e (end/stop), l (lights), lp (lights pattern), o (offset), sdk, ping, bat, ver, q (quit)');
                    } else {
                        console.log(_this.name + ':Initialization error');
                    }
                });
            } else {
                console.log(_this.name + ':Initialization error');
            }
        });
    }

    testTrack(callback) {
        this.onTestCompleteCallback = callback;
        this.isTesting = true;
        this.setSpeed(600, 500);
        console.log("Testing Track");
    }

    addPiece(pieceId) {
        if (this.currTestTrackArray[this.currTestTrackArray.length - 1] === pieceId) {
            return;
        }
        if (pieceId === 10 && !this.testStarted) {
            this.testStarted = true;
            console.log(this.name + ": Track Test Started")
            return;
        }
        if (this.testStarted) {
            if (pieceId === 10 && this.currTestTrackArray.includes(pieceId)) {
                this.completeTest();
            }
            this.currTestTrackArray.push(pieceId);
            // console.log(this.name + ": Adding Piece: " + pieceId);
            if (!this.isTesting) {
                this.determineCriticalIndices();
                // console.log(this.name + ": Test Complete. Critical Indices: " + JSON.stringify(this.criticalIndices));
                if (this.onTestCompleteCallback) {
                    this.onTestCompleteCallback();
                }
            }
        }
    }

    completeTest() {
        this.isTesting = false;

        this.stop();
        console.log(`${this.name} ${JSON.stringify(this.currTestTrackArray)}`);
    }

    determineCriticalIndices() {
        this.criticalIndices = [3, 7];
    }

    setIndex(pieceId) {
        while (pieceId != this.currTestTrackArray[this.pieceIndex]) {
            this.pieceIndex++;
            if (this.pieceIndex >= this.currTestTrackArray.length) {
                this.pieceIndex = 0;
            }
        }
    }

    onProgress(pieceId) {
        let prevPieceIndex = this.pieceIndex;
        this.setIndex(pieceId);

        if (prevPieceIndex != this.pieceIndex) { // We are on a new piece
            if (this.currTestTrackArray[prevPieceIndex] === 10 && this.inCriticalSection) {
                this.inCriticalSection = false;
                this.trafficLight.leftIntersection(this);

            } else if ((this.currTestTrackArray[this.pieceIndex] === 10) && this.trafficLight) { // We are on an intersection
                this.collisionPath[0] = this.previousPiece();
                this.collisionPath[1] = this.nextPiece();

                this.inCriticalSection = true;
                this.trafficLight.enterCriticalSection(this);

                if (this.trafficLight.isRed(this)) {
                    console.log(`${this.name} Traffic Light: is Red`);
                    this.stop();
                } else {
                    // console.log(`${this.name} Traffic Light: is Green`);
                }
            }
        }
    }

    previousPiece() {
        if (this.pieceIndex > 0) {
            return this.currTestTrackArray[this.pieceIndex - 1];
        } else {
            return this.currTestTrackArray[this.currTestTrackArray.length - 1];
        }
    }

    nextPiece() {
        if (this.pieceIndex < (this.currTestTrackArray.length - 1)) {
            // console.log(`${this.name} index: ${this.pieceIndex} returning ${this.pieceIndex + 1}`);
            return this.currTestTrackArray[this.pieceIndex + 1];
        } else {
            // console.log(`${this.name} returning 0`);
            return this.currTestTrackArray[0];
        }
    }

    willCollide(path) {
        // let myPath = this.collisionPath;
        // if ((myPath[0] === path[0] && myPath[1] === path[1]) || (myPath[0] === path[1] && myPath[1] === path[0])) {
        //     return false;
        // }

        let index = this.pieceIndex > 0 ? this.pieceIndex : this.currTestTrackArray.length - 1;
        // console.log(`path[1] = ${JSON.stringify(path)} ${this.name} oldPath = ${JSON.stringify(this.collisionPath)}`);
        if (path[1] === this.currTestTrackArray[index]) {
            // console.log("No Collision");
            return false;
        }
        // console.log("\nWILL COLLIDE!!!\n");
        return true;
    }

    continue () {
        console.log(`${this.name} : CONTINUE called`);
        this.setSpeed(this.speed, this.accel);
    }

    setSpeed(speed, accel) {

        this.speed = speed ? speed : 300;
        this.accel = accel ? accel : 6250;

        let message = new Buffer(7);
        message.writeUInt8(0x06, 0);
        message.writeUInt8(0x24, 1);
        message.writeInt16LE(speed, 2);
        message.writeInt16LE(accel, 4);
        this.invokeCommand(message);
    }

    setLane(lane) {
        let offset = 0.0;

        if (lane) {
            offset = lane;
        }

        let message = new Buffer(12);
        message.writeUInt8(11, 0);
        message.writeUInt8(0x25, 1);
        message.writeInt16LE(250, 2);
        message.writeInt16LE(1000, 4);
        message.writeFloatLE(offset, 6);
        this.invokeCommand(message);
    }

    stop() {
        console.log(`${this.name} : STOP called`);
        let message = new Buffer(7);
        message.writeUInt8(0x06, 0);
        message.writeUInt8(0x24, 1);
        message.writeInt16LE(0x00, 2);
        message.writeInt16LE(12500, 4);
        this.invokeCommand(message);
    }

    setLights() {
        let message = new Buffer(3);
        message.writeUInt8(0x02, 0);
        message.writeUInt8(0x1d, 1);
        message.writeUInt8(140, 2);
        this.invokeCommand(message);
    }

    setLightPattern() {
        let message = new Buffer(8);
        message.writeUInt8(0x07, 0);
        message.writeUInt8(0x33, 1);
        message.writeUInt8(5, 2);
        message.writeUInt8(1, 3);
        message.writeUInt8(1, 4);
        message.writeUInt8(5, 5);
        message.writeUInt16BE(0, 6);
        this.invokeCommand(message);
    }

    setOffset(offset) {
        offset = offset ? offset : -68.0;

        let message = new Buffer(6);
        message.writeUInt8(0x05, 0);
        message.writeUInt8(0x2c, 1);
        message.writeFloatLE(-68.0, 2);
        this.invokeCommand(message);
    }

    sdk(onOff) {
        let value = "on";
        paramValue = onOff;
        if (paramValue == "off") value = "off";

        let message = new Buffer(4);
        message.writeUInt8(0x03, 0);
        message.writeUInt8(0x90, 1);
        if (value == "on") {
            message.writeUInt8(0x01, 2);
        } else {
            message.writeUInt8(0x00, 2);
            console.log('off');
        }
        message.writeUInt8(0x01, 2);
        this.invokeCommand(message);
    }

    ping() {
        let message = new Buffer(2);
        message.writeUInt8(0x01, 0);
        message.writeUInt8(0x16, 1);
        this.invokeCommand(message);
    }

    getBattery() {
        let message = new Buffer(2);
        message.writeUInt8(0x01, 0);
        message.writeUInt8(0x1a, 1);
        this.invokeCommand(message);
    }

    getVersion() {
        let message = new Buffer(2);
        message.writeUInt8(0x01, 0);
        message.writeUInt8(0x18, 1);
        this.invokeCommand(message);
    }

    quit() {
        let message = new Buffer(2);
        message.writeUInt8(0x01, 0);
        message.writeUInt8(0x0d, 1);
        this.invokeCommand(message);
    }

    invokeCommand(message) {
        if (message) {
            // console.log("Command: " + message);

            if (this.writeCharacteristic) {
                this.writeCharacteristic.write(message, false, function(err) {
                    if (!err) {
                        //console.log('Command sent');
                    } else {
                        console.log(this.name + ':Error sending command');
                    }
                });
            } else {
                console.log(this.name + ':Error sending command');
            }
        }
    }


    handle(data) {

        var messageId = data.readUInt8(1);

        var date = new Date();

        if (messageId == '23') {
            // example: <Buffer 01 17>
            var desc = 'Ping Response Received';
            // //console.log(this.name + ': ' + messageId, data, desc);

        } else if (messageId == '25') {
            // example: <Buffer 05 19 6e 26 00 00>
            var desc = 'Version Received';
            var version = data.readUInt16LE(2);
            console.log(this.name + ': ' + messageId, data, desc + ' - version: ' + version);

        } else if (messageId == '27') {
            // example: <Buffer 03 1b 50 0f>
            var desc = 'Battery Level Received';
            var level = data.readUInt16LE(2);
            console.log(this.name + ': ' + messageId, data, desc + ' - level: ' + level);

        } else if (messageId == '39') {
            // example: <Buffer 10 27 21 28 48 e1 86 c2 02 01 47 00 00 00 02 fa 00>
            var desc = 'Localization Position Update Received';
            var pieceLocation = data.readUInt8(2);
            var pieceId = data.readUInt8(3); // in my starter kit: 
            // 1 x straight: 36
            // 1 x straight: 39
            // 1 x straight: 40
            // 1 x curve: 20
            // 1 x curve: 23
            // 2 x curve: 18
            // 2 x curve: 17
            // 1 x start/finish: 34 (long) and 33 (short)
            var offset = data.readFloatLE(4);
            var speed = data.readUInt16LE(8);
            // console.log(this.name + ': ' + messageId, data, desc + ' - offset: ' + offset + ' speed: ' + speed + ' - pieceId: ' + pieceId + ' pieceLocation: ' + pieceLocation);
            // console.log(this.name + ': pieceId: ' + pieceId + ' pieceLocation: ' + pieceLocation);
            if (this.isTesting) {
                this.addPiece(pieceId);
            } else {
                this.onProgress(pieceId);
            }

        } else if (messageId == '41') {
            // example: <Buffer 12 29 00 00 02 2b 55 c2 00 ff 81 46 00 00 00 00 00 25 32>
            var desc = 'Localization Transition Update Received';
            var offset = data.readFloatLE(4);
            // //console.log(this.name + ': ' + messageId, data, desc + ' - offset: '  + offset);

        } else if (messageId == '43') {
            // example: <Buffer 01 2b>
            var desc = 'Vehicle Delocalized Received';
            // //console.log(this.name + ': ' + messageId, data, desc);

        } else if (messageId == '45') {
            // example: <Buffer 06 2d 00 c8 75 3d 03>
            var desc = 'Offset from Road Center Update Received';
            var offset = data.readFloatLE(2);
            //console.log(this.name + ': ' + messageId, data, desc + ' - offset: '  + offset);

        } else if (messageId == '54') {
            // example: <Buffer 03 36 00 00>
            ////console.log(this.name + ': ' + messageId, data, 'Not documented');   
        } else if (messageId == '63') {
            // example: <Buffer 05 3f 01 00 00 01>
            ////console.log(this.name + ': ' + messageId, data, 'Not documented');
        } else if (messageId == '65') {
            // example: <Buffer 0e 41 9a 99 7f 42 9a 99 7f 42 00 00 00 02 81>
            var desc = 'Changed Offset (not documented)';
            var offset = data.readFloatLE(2);
            //console.log(this.name + ': ' + messageId, data, desc + ' - offset: '  + offset);

        } else if (messageId == '67') {
            // example: <Buffer 01 43>
            ////console.log(this.name + ': ' + messageId, data, 'Not documented');
        } else if (messageId == '77') {
            // example: <Buffer 03 4d 00 01>
            ////console.log(this.name + ': ' + messageId, data, 'Not documented');
        } else if (messageId == '134') {
            // example: <Buffer 0b 86 8e 00 27 08 00 00 10 10 00 00>
            ////console.log(this.name + ': ' + messageId, data, 'Not documented');
        } else if (messageId == '201') {
            // example: tbd
            ////console.log(this.name + ': ' + messageId, data, 'Not documented');                       
        } else {
            ////console.log(this.name + ': ' + messageId, data, 'Unknown');
        }

    }
}

function isEqual(value, other) {

    // Get the value type
    var type = Object.prototype.toString.call(value);

    // If the two objects are not the same type, return false
    if (type !== Object.prototype.toString.call(other)) return false;

    // If items are not an object or array, return false
    if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

    // Compare the length of the length of the two items
    var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
    var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
    if (valueLen !== otherLen) return false;

    // Compare two items
    var compare = function(item1, item2) {

        // Get the object type
        var itemType = Object.prototype.toString.call(item1);

        // If an object or array, compare recursively
        if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
            if (!isEqual(item1, item2)) return false;
        }

        // Otherwise, do a simple comparison
        else {

            // If the two items are not the same type, return false
            if (itemType !== Object.prototype.toString.call(item2)) return false;

            // Else if it's a function, convert to a string and compare
            // Otherwise, just compare
            if (itemType === '[object Function]') {
                if (item1.toString() !== item2.toString()) return false;
            } else {
                if (item1 !== item2) return false;
            }

        }
    };

    // Compare properties
    if (type === '[object Array]') {
        for (var i = 0; i < valueLen; i++) {
            if (compare(value[i], other[i]) === false) return false;
        }
    } else {
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                if (compare(value[key], other[key]) === false) return false;
            }
        }
    }

    // If nothing failed, return true
    return true;

};