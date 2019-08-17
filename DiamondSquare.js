

class DiamondSquare {
    static apply(n) {
        var size = Math.pow(2, n) + 1

        const BASEMOD = size / 2;
		const TAPER = (modifier) => { return modifier / 1.44; };

		var modifier = BASEMOD;

		var map = new Array(size);
		for (var i = 0; i < size; i++) {
			map[i] = new Array(size);
		}

		for (var x = 0; x < size; x++) {
			for (var y = 0; y < size; y++) {
				map[x][y] = 0;
			}
		}

		for (var step = 0; step < n; step++) {
			var squareSize = Math.pow(2, n - step);

			for (var square = 0; square < Math.pow(4, step); square++) {
				var topleft = [
					Math.floor(square / Math.pow(2, step)) * squareSize,
					square % Math.pow(2, step) * squareSize
				];

				var center = [topleft[0] + squareSize / 2, topleft[1] + squareSize / 2];
				var average =
					(map[topleft[0]][topleft[1]] +
					map[topleft[0] + squareSize][topleft[1]] +
					map[topleft[0]][topleft[1] + squareSize] +
					map[topleft[0] + squareSize][topleft[1] + squareSize]) / 4;

				map[center[0]][center[1]] = average + (random() - 0.5) * modifier;
			}

			modifier = TAPER(modifier);


			var point = 0;
			var gridWidth = Math.pow(2, step+1) + 1;
			var diamondSize = squareSize / 2;
			for (var x = 0; x < gridWidth; x++) {
				for (var y = 0; y < gridWidth; y++) {
					if (point % 2 == 1) {
						let mapx = x * diamondSize;
						let mapy = y * diamondSize;

						let sum = 0;
						let summedDirections = 0

						for (let direction of [[-1, 0], [0, -1], [1, 0], [0, 1]]) {
							let neighbourx = mapx + direction[0] * diamondSize;
							let neighboury = mapy + direction[1] * diamondSize;

							if (neighbourx >= 0 && neighboury >= 0 && neighbourx < size && neighboury < size) {
								sum += map[neighbourx][neighboury];
								summedDirections++;
							}
						}

						let average = sum / summedDirections;
						map[mapx][mapy] = average + (random() - 0.5) * modifier;
					}
					point += 1
				}
			}

			modifier = TAPER(modifier);
		}

		return map
    }

    static getNormal(p1, p2, p3) {
		let vx = p2.x - p1.x;
		let vy = p2.y - p1.y;
		let vz = p2.z - p1.z;
		let wx = p3.x - p1.x;
		let wy = p3.y - p1.y;
		let wz = p3.z - p1.z;

		let nx = (vy * wz) - (vz * wy);
		let ny = (vz * wx) - (vx * wz);
		let nz = (vx * wy) - (vy * wx);

		let length = Math.abs(nx) + Math.abs(ny) + Math.abs(nz);
		let ax = nx / length;
		let ay = ny / length;
		let az = nz / length;

		return new THREE.Vector3(ax, ay, az);
	}

    constructor(n) {
        this.n = n;
        this.map = DiamondSquare.apply(n);
        this.size = n ** 2 + 1;
    }

    smooth() {
        for (var y = 0; y < this.map.length; y++) {
			for (var x = 0; x < this.map.length; x++) {
				let sum = 0;
				let summed = 0;
				for (var nx = -1; nx <= 1; nx++) {
					for (var ny = -1; ny <= 1; ny++) {
						let neighbourx = x + nx;
						let neighboury = y + ny;

						if (neighbourx >= 0 && neighboury >= 0 &&
							neighbourx < this.map.length && neighboury < this.map.length) {
								summed += 1;
								sum += this.map[neighbourx][neighboury];
							}
						}
					}

					this.map[x][y] = sum / summed;
			}
		}
		return this.map;
    }

    level() {
		let totalHeight = 0;
		for (var y = 0; y < this.map.length; y++) {
			for (var x = 0; x < this.map.length; x++) {
				totalHeight += this.map[x][y];
			}
		}
		let averageHeight = totalHeight / (this.map.length ** 2);

		for (var y = 0; y < this.map.length; y++) {
			for (var x = 0; x < this.map.length; x++) {
				if (this.map[x][y] < 0) {
					this.map[x][y] /= 5;
					// map[x][y] += averageHeight;
				}
			}
		}

		return this.map
    }

    makeMesh() {
        if (!this.geometry) {
            this.makeGeometry();
        }

        let material = new THREE.MeshLambertMaterial({
            color: 0x979777
        });
        this.mesh = new THREE.Mesh(this.geometry, material);
        this.mesh.geometry.computeVertexNormals();
        return this.mesh;
    }


    makeGeometry() {
        var geometry = new THREE.Geometry();
        let gsize = Math.pow(2, this.n-1);

        for (var x = -gsize; x <= gsize; x++) {
            for (var z = -gsize; z <= gsize; z++) {
                geometry.vertices.push(new THREE.Vector3(x, this.map[x+gsize][z+gsize], z));
            }
        }

        for (var z = 0; z < gsize*2; z++) {
            for (var x = 0; x < gsize*2; x++) {
                let base = x + z * (gsize * 2 + 1)

                let right = base + 1
                let under = base + gsize * 2 + 1;
                let rightUnder = base + gsize * 2 + 2;

                geometry.faces.push( new THREE.Face3(
                    rightUnder,
                    under,
                    base,
                    DiamondSquare.getNormal(geometry.vertices[under], geometry.vertices[base], geometry.vertices[rightUnder]),
                    new THREE.Color(0xffffff)
                ));

                geometry.faces.push( new THREE.Face3(
                    base,
                    right,
                    rightUnder,
                    DiamondSquare.getNormal(geometry.vertices[base], geometry.vertices[right], geometry.vertices[rightUnder]),
                    new THREE.Color(0xffffff)
                ))
            }
        }

        geometry.computeBoundingSphere();

        this.geometry = geometry;
        return this.geometry;
    }
}
