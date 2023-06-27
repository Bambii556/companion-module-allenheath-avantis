import { AvantisConfig } from './avantisConfig'

export interface Scene {
	sceneId: number
	bank: number
	ss: number
}

export function getSceneSelection(avantisConfig: AvantisConfig): Scene[] {
	const scenes: Scene[] = []

	for (let i = 1; i <= avantisConfig.channel.scene.count; i++) {
		const scene = {
			sceneId: i,
			bank: getSceneBank(i),
			ss: getSceneSSNumber(i),
		}

		// TODO: Remove once tested
		if (
			i === 1 ||
			i === 129 ||
			i === 257 ||
			i === 385 ||
			i === 65 ||
			i === 193 ||
			i === 321 ||
			i === 449 ||
			i === 500
		) {
			console.log(JSON.stringify(scene))
		}

		scenes.push(scene)
	}

	return scenes
}

function getSceneBank(sceneId: number): number {
	if (sceneId <= 128) {
		return 0x00
	}

	if (sceneId <= 256) {
		return 0x01
	}

	if (sceneId <= 384) {
		return 0x02
	}

	return 0x03
}

function getSceneSSNumber(sceneId: number): number {
	if (sceneId > 128) {
		do {
			sceneId -= 128
		} while (sceneId > 128)
	}
	return sceneId - 1
}
