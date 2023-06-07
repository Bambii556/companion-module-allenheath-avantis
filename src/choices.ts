export interface Choice {
    name: string
    offset: number
    values: ChoiceValue[]
}

export interface ChoiceValue {
    label: string
    id: number
    offset?: number
}

export interface Choices {
    inputChannel: Choice
    scenes: Choice
    dca: Choice
    muteGroup: Choice
    mainMix: Choice
    monoGroup: Choice
    stereoGroup: Choice
    monoAux: Choice
    stereoAux: Choice
    monoMatrix: Choice
    stereoMatrix: Choice
    monoFXSend: Choice
    stereoFXSend: Choice
    FXReturn: Choice
    fader: Choice
    color: Choice
}

export function getChoices(avantisData: any, faderData: any): Choices {
    const inputChannel = buildChoices(`Input Channel`, `CH`, avantisData.inputCount, -1)
    const scenes = buildChoices(`Scene`, `SCENE`, avantisData.sceneCount, -1)
    const dca = buildChoices(`DCA`, `DCA`, avantisData.dcaCount, 0x35)
    const muteGroup = buildChoices(`Mute Group`, `MUTE`, avantisData.muteGroupCount, 0x45)
    const mainMix = buildChoices(`Main Mix`, `MAIN`, avantisData.mainsCount, 0x2f)
    const monoGroup = buildChoices(`Mono Group`, `Mono Group`, avantisData.mono.groupCount, -1)
    const stereoGroup = buildChoices(`Stereo Group`, `Stereo Group`, avantisData.stereo.groupCount, 0x3f)
    const monoAux = buildChoices(`Mono Aux`, `Mono Aux`, avantisData.mono.auxCount, -1)
    const stereoAux = buildChoices(`Stereo Aux`, `Stereo Aux`, avantisData.stereo.auxCount, 0x3f)
    const monoMatrix = buildChoices(`Mono Matrix`, `Mono Matrix`, avantisData.mono.matrixCount, -1)
    const stereoMatrix = buildChoices(`Stereo Matrix`, `Stereo Matrix`, avantisData.stereo.matrixCount, 0x3f)
    const monoFXSend = buildChoices(`Mono FX Send`, `Mono FX Send`, avantisData.stereo.fxSendCount, -1)
    const stereoFXSend = buildChoices(`Stereo FX Send`, `Stereo FX Send`, avantisData.stereo.fxSendCount, 0x0f)
    const FXReturn = buildChoices(`FX Return`, `FX Return`, avantisData.fxReturnCount, 0x1f)

    const fader: Choice = {
        name: `Fader Level`,
        offset: -1,
        values: [],
    }
    for (let i = 0; i < faderData.level.length; i++) {
        const dbStr = faderData.level[i][0]
        // TODO: Check if the Offset fixes the fader changed value
        fader.values.push({ label: `${dbStr} dB`, id: parseInt(faderData.level[i][1], 16) })
    }

    const color: Choice = {
        name: `Color`,
        offset: -1,
        values: [
            { label: `Off`, id: 0 },
            { label: `Red`, id: 1 },
            { label: `Green`, id: 2 },
            { label: `Yellow`, id: 3 },
            { label: `Blue`, id: 4 },
            { label: `Purple`, id: 5 },
            { label: `Lt Blue`, id: 6 },
            { label: `White`, id: 7 },
        ],
    }

    return {
        inputChannel,
        scenes,
        dca,
        muteGroup,
        mainMix,
        monoGroup,
        stereoGroup,
        monoAux,
        stereoAux,
        monoMatrix,
        stereoMatrix,
        monoFXSend,
        stereoFXSend,
        FXReturn,
        fader,
        color,
    }
}

function buildChoices(name: string, key: string, qty: number, ofs: number) {
    const choice: Choice = {
        name: name,
        offset: ofs,
        values: [],
    }
    for (let i = 1; i <= qty; i++) {
        choice.values.push({ label: `${key} ${i}`, id: i + ofs, offset: ofs })
    }
    return choice
}