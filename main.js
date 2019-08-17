
//////////////////////////////////////////////////////////////////////////////////
//		Initialisation
//////////////////////////////////////////////////////////////////////////////////

var renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setClearColor(new THREE.Color('#0c0c0c'), 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Array of functions for the rendering loop
var onRenderFcts = [];

// Initialise scene and camera
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100000);
camera.position.x = 0;
camera.position.y = 340;
camera.position.z = 340;
var controls = new THREE.OrbitControls(camera);

//////////////////////////////////////////////////////////////////////////////////
//		Scene setup
//////////////////////////////////////////////////////////////////////////////////

// White directional light at half intensity shining from the top.
var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
scene.add( directionalLight );

const N = 9;
let ds = new DiamondSquare(N);
// ds.level();
ds.smooth();
scene.add(ds.makeMesh());

let router = new Router(
    {x: N * 2, z: N * 2},
    {x: (2**N) - N*2, z: (2**N) - N*2},
    ds.map
);

function iteration() {
    router.applyOnExistingPath();
    router.showProgress();
    setSlopesDisplay();
}

const DELAY = 120;

setTimeout(function update() {
    if (router.path.length < 2**(N)) {
        iteration();
        setTimeout(update, DELAY);
    }
}, DELAY)

var c = document.getElementById("slopes");
var ctx = c.getContext("2d");
function setSlopesDisplay() {
    ctx.clearRect(0, 0, c.width, c.height);
    let straightPath = [];
    let start = router.start;
    let end = router.end;
    let direction = end.clone().sub(start).normalize();
    let cursor = start.clone();

    while (cursor.add(direction).clone().sub(end).length() > 1) {
        straightPath.push(vectorOnMap(cursor, router.map).y);
    }

    let totalDistance = 0;
    let algoPath = router.path.map((node, index) => {
        if (index <= router.path.length - 2) {
            let distance = node.distanceTo(router.path[index+1]);
            totalDistance += distance;
            return ({
                x: totalDistance,
                y: node.y
            })
        }
    })
    algoPath = algoPath.slice(0, algoPath.length - 1);
    let algoPathLength =  algoPath[algoPath.length - 1].x;

    let minHeight = Math.min(...straightPath.concat((algoPath.map(node => node.y))));
    let maxHeight = Math.max(...straightPath.concat((algoPath.map(node => node.y))));
    algoPath = algoPath.map(node => ({ x: node.x, y: node.y - minHeight }));
    straightPath = straightPath.map(y => y - minHeight);
    let heightDiff = Math.abs(maxHeight) + Math.abs(minHeight);

    ctx.beginPath();
    ctx.strokeStyle = "#FF0000";
    ctx.moveTo(0, 0);
    for (let i = 0; i < straightPath.length; i++) {
        let x = i * (400 / algoPathLength)
        let y = 200 - (straightPath[i] / heightDiff) * 200;
        ctx.lineTo(x, y);
    }
    ctx.stroke();


    ctx.strokeStyle = "#00FF00";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let value of algoPath) {
        let x = value.x * (400 / algoPathLength);
        let y = 200 - (value.y / heightDiff) * 200;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

//////////////////////////////////////////////////////////////////////////////////
//		Rendering
//////////////////////////////////////////////////////////////////////////////////

window.addEventListener('resize', function(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}, false);

onRenderFcts.push(function(){
    renderer.render( scene, camera );
});

var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
    requestAnimationFrame(animate);

    lastTimeMsec = lastTimeMsec || nowMsec-1000/60;
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec = nowMsec;

    onRenderFcts.forEach(function(onRenderFct){
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
    });
});
