export function createStars() {
  const starsCount = 12000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starsCount * 3);

  for (let i = 0; i < starsCount * 3; i += 3) {
    positions[i]     = (Math.random() - 0.5) * 2000;
    positions[i + 1] = (Math.random() - 0.5) * 2000;
    positions[i + 2] = (Math.random() - 0.5) * 2000;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 1.2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
  });

  const stars = new THREE.Points(geometry, material);
  stars.position.z = 0;

  // Ahora la velocidad será controlada desde main.js (la pasamos como parámetro)
  return { stars, update: (delta, forwardSpeed) => {
    stars.position.z -= forwardSpeed * delta * 5; // subtle parallax
    if (stars.position.z <= -1000) stars.position.z += 2000;
  }};
}