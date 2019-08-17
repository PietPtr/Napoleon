const DIST_LIMIT = 0.1;
const MAX_SLOPE = 0.5 * Math.PI/180;

function vectorOnMap(vec, map) {
    if (vec.x < 0 || vec.z < 0 || Math.round(vec.x) >= map.length || Math.round(vec.z) >= map.length) {
        throw 'Index out of range';
    }
    return new THREE.Vector3(vec.x, map[Math.round(vec.x)][Math.round(vec.z)], vec.z);
}

function findSlope(start, end) {
    return Math.atan(Math.abs(start.y - end.y) / (Math.sqrt((start.x-end.x)**2 + (start.z-end.z)**2)));
}

class Router {
    constructor(start, end, map) {
        this.start = vectorOnMap(start, map);
        this.end = vectorOnMap(end, map);
        this.map = map;

        this.path = [this.start, this.end];

        this.group = null;
    }

    apply(start, end, map) {
        let distance = start.distanceTo(end);

        // base case
        if (distance < DIST_LIMIT) {// && findSlope(start, end) < MAX_SLOPE) {
            // console.log('basecase', start, end);
            return [start, end];
        }

        let sufficient = false;
        let midpoint = vectorOnMap(start.clone().add(end.clone().sub(start).multiplyScalar(0.5)), map);
        let normal = end.clone().sub(start).cross(new THREE.Vector3(0, 1, 0)).normalize();
        let displacement = 0.5;
        let pathPoint = null;
        let slope = findSlope(start, midpoint) + findSlope(midpoint, end);
        let previousSlope = slope;
        let searchVector = normal;
        let searchPoint = midpoint.clone();
        let minimumSlope = slope;
        let minimumPoint = searchPoint.clone();

        while (slope > 2*MAX_SLOPE) {
            try {
                searchPoint = vectorOnMap(searchPoint.clone().add(normal.clone().multiplyScalar(displacement)), map);
            } catch (e) {
                searchPoint = minimumPoint;
                break;
            }
            slope = findSlope(start, searchPoint) + findSlope(searchPoint, end);
            displacement = Math.sign(displacement) * (Math.abs(displacement) + 0.5);
            displacement = -displacement;
            if (slope < minimumSlope) {
                minimumSlope = slope;
                minimumPoint = searchPoint.clone();
            }
            if (Math.abs(displacement) > distance / 2) {
                break;
            }
        }

        return [start, minimumPoint, end];

        // let startList = this.apply(start, searchPoint, map);
        // let endList = this.apply(searchPoint, end, map);
        //
        // let path = startList.concat(endList.slice(1));
        // console.log(path.length);
        // // let path = startList.concat([end]);
        //
        // return path;
    }

    applyOnExistingPath() {
        let newPath = [];
        for (let i = 0; i < this.path.length - 1; i++) {
            let result = this.apply(this.path[i], this.path[i+1], this.map);
            if (i == this.path.length - 2) {
                newPath = newPath.concat(result);
            } else {
                newPath = newPath.concat(result.slice(0, 2));
            }
        }
        this.path = newPath;
    }

    slopes() {
        let slopes = [];
        for (let i = 0; i < this.path.length - 1; i++) {
            slopes.push(findSlope(this.path[i], this.path[i+1]));
        }
        return slopes;
    }

    showProgress() {
        scene.remove(this.group);
        delete this.group;
        this.group = new THREE.Group();
        let lineGeometry = new THREE.Geometry();
        for (let i = 0; i < this.path.length; i++) {
            let node = this.path[i];
            let next = this.path[i+1] || this.path[0];
            let slope = findSlope(node, next);
            let color =
                (0xff * (Math.min(1, slope / (MAX_SLOPE + 0.6)))) << 16 |
                (0xff * (Math.max(0, 1 - slope / (MAX_SLOPE + 0.6)))) << 8;

            let size = 1;
            let worldPos = node.clone().sub(
                new THREE.Vector3(Math.floor(this.map.length / 2), -0.1, Math.floor(this.map.length / 2)));


            lineGeometry.vertices.push(worldPos);
        }

        let stepsize = lineGeometry.vertices.length < 128 ? 2 : Math.floor(lineGeometry.vertices.length / 64);

        for ( var i = 0; i < lineGeometry.vertices.length; i+=stepsize ) {
            if (stepsize == 2) {
                let next = this.path[i+1] || this.path[0];
                let slope = findSlope(this.path[i], next);
                let color = slopeToColor(slope);

                lineGeometry.colors[ i ] = new THREE.Color(color);
                lineGeometry.colors[ i + 1 ] = lineGeometry.colors[ i ];
            } else {
                let next = this.path[i+stepsize-1] || this.path[0];
                let slope = findSlope(this.path[i], next);
                let color = slopeToColor(slope);
                for (let n = 0; n < stepsize; n++) {
                    lineGeometry.colors[i + n] = new THREE.Color(color);
                }
            }

        }

        var material = new THREE.LineBasicMaterial( {linewidth: 5, vertexColors: THREE.VertexColors} );
        // material.depthTest = false;
        var line = new THREE.Line( lineGeometry, material );
        // line.renderOrder = 9999;
        this.group.add(line);
        scene.add(this.group);
    }
}

function slopeToColor(slope) {
    return (
        (0xff * (Math.min(1, slope / (MAX_SLOPE + 0.1)))) << 16 |
        (0xff * (Math.max(0, 1 - slope / (MAX_SLOPE + 0.1)))) << 8);
}

// for (let x = 0; x < 100; x++) {
//     this.path.push(new THREE.Vector3(x*5, Math.sin(x/10) * 10 + 100, 0));
// }
