export function createShip() {
  const ship = new THREE.Group();

  // Main body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 12, 12),
    new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 100, specular: 0xffffff })
  );
  body.rotation.x = Math.PI / 2;
  ship.add(body);

  // Nose
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 3.5, 12),
    new THREE.MeshPhongMaterial({ color: 0xdddddd, shininess: 80 })
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -7.75;
  ship.add(nose);

  // Grid fins
  const finGeo = new THREE.BoxGeometry(2.2, 0.15, 2);
  const finMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 60 });
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeo, finMat);
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    fin.rotation.y = angle;
    fin.position.z = 5;
    fin.position.x = Math.cos(angle) * 1.8;
    fin.position.y = Math.sin(angle) * 1.8;
    ship.add(fin);
  }

  // Engines
  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.3, 2, 12),
    new THREE.MeshPhongMaterial({ color: 0x444444 })
  );
  engine.rotation.x = Math.PI / 2;
  engine.position.z = 6;
  ship.add(engine);

  ship.position.set(0, 0, 0);

  return ship;
}