export interface Scene {
    sceneNumber: number;
    block: number;
    ss: number;
}

export function getSceneSelection(avantisData: any): Scene[] {
    const scenes: Scene[] = []

    for (let i = 1; i <= avantisData.config.sceneCount; i++) {
        scenes.push({
            sceneNumber: i,
            block: getSceneBank(i),
            ss: getSceneSSNumber(i),
        })
    }

    return scenes;
}

function getSceneBank(sceneNumber: number): number {
    if (sceneNumber <= 128) {
        return 0x00
    }

    if (sceneNumber <= 256) {
        return 0x01
    }

    if (sceneNumber <= 384) {
        return 0x02
    }

    return 0x03
}

function getSceneSSNumber(sceneNumber: number): number {
    if (sceneNumber > 128) {
        do {
            sceneNumber -= 128
        } while (sceneNumber > 128)
    }
    return sceneNumber - 1
}