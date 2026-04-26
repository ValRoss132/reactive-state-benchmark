export const seedRandom = (seed: number) => {
	const x = Math.sin(seed) * 1000
	return x - Math.floor(x)
}
