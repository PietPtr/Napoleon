
let seed = 1337
seed = Math.floor(Math.random() * 0xffffffff);
console.log('seed:', seed);

function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
