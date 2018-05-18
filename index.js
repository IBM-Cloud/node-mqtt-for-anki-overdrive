const Car = require("./car");
const TrafficLight = require("./TrafficLight");
let trafficLight = new TrafficLight();
let gs;
let skull;

const carPair1 = [
    "fde9c0febc9148fa915e584c85af62eb",
    "0a1b4a62b7854e6ab44bf2e1e1d03fdf"
];
const carPair2 = [
    "472e62bf7ac44086ba52f231e12a6815",
    "900b8431b7724279a7ebeb02832e415d"
]

let cars = carPair1;

// GroundShock ID: fde9c0febc9148fa915e584c85af62eb 
// Skull ID: 0a1b4a62b7854e6ab44bf2e1e1d03fdf
// Other 1 ID: 472e62bf7ac44086ba52f231e12a6815
// Other 2 ID: 900b8431b7724279a7ebeb02832e415d

gs = new Car(cars[0], "GroundShock", 1, trafficLight);
let speed = 500;

let interval = setInterval(() => {
    if (gs.discovered) {
        clearInterval(interval);
        skull = new Car(cars[1], "Skull", 4, trafficLight);
        let skullInterval = setInterval(() => {
            if (skull.initialized && gs.initialized) {
                // if (gs.initialized) {
                clearInterval(skullInterval);
                skull.testTrack(() => {
                    setTimeout(() => {
                        goForAwhile(skull);
                    }, 5000);
                });
                setTimeout(() => {
                    gs.testTrack(() => {
                        setTimeout(() => {
                            goForAwhile(gs);
                        }, 5000);
                    });
                }, 1000);
            }
        }, 500);
    }
}, 500);

function goForAwhile(car) {
    car.setSpeed(speed, 100);
    speed += 100;
    setTimeout(() => {
        car.stop();
    }, 60000);
}