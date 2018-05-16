const Car = require("./car");
let gs;
let skull;

gs = new Car("fde9c0febc9148fa915e584c85af62eb", 1);

let interval = setInterval(() => {
    if (gs.discovered) {
        clearInterval(interval);
        skull = new Car("0a1b4a62b7854e6ab44bf2e1e1d03fdf", 4);
        let skullInterval = setInterval(() => {
            if (skull.initialized) {
                clearInterval(skullInterval);
                goForAwhile();
            }
        }, 500);
    }
}, 500);

function goForAwhile() {
    skull.setSpeed();
    setTimeout(() => {
        skull.stop();
    }, 15000);
}