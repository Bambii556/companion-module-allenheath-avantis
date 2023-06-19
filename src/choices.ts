import { AvantisConfig, Color, Fader } from "./avantisConfig"

export interface Choice {
    name: string
    midiOffset: number
    values: ChoiceValue[]
}

export interface ChoiceValue {
    label: string
    id: number
    hexOffset?: number
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

export function getChoices(avantisData: AvantisConfig): Choices {
    /*
        - Scenes
        - Inputs
        - Mono Group
        - Mono Aux
        - Mono Matrix
        - FX Return
        - Mono FX Send
        - Stereo FX Send
        - DCA
        DCA Assign ON/Off
        Name
        - Mute Group
        Mute Group Assing ON/Off
        - Fader Level
        - Color
        Midi Channel
        - Stereo Group
        - Stereo Aux
        - Stereo Matrix
        - Mains
    */

    const inputChannel = buildChoices(`Input Channel`, `CH`, avantisData.config.inputCount, { hexOffset: -1, midiOffset: 0 });
    const scenes = buildChoices(`Scene`, `Scene`, avantisData.config.sceneCount, { hexOffset: 0, midiOffset: 0 });
    const dca = buildChoices(`DCA`, `DCA`, avantisData.config.dcaCount, { hexOffset: 0x35, midiOffset: 4 });
    const muteGroup = buildChoices(`Mute Group`, `Group`, avantisData.config.muteGroupCount, { hexOffset: 0x45, midiOffset: 4 });
    const mainMix = buildChoices(`Main Mix`, `Main`, avantisData.config.mainsCount, { hexOffset: 0x2f, midiOffset: 4 });
    const monoGroup = buildChoices(`Mono Group`, `Mono Group`, avantisData.config.mono.groupCount, { hexOffset: -1, midiOffset: 1 });
    const stereoGroup = buildChoices(`Stereo Group`, `Stereo Group`, avantisData.config.stereo.groupCount, { hexOffset: 0x3f, midiOffset: 1 });
    const monoAux = buildChoices(`Mono Aux`, `Mono Aux`, avantisData.config.mono.auxCount, { hexOffset: -1, midiOffset: 2 });
    const stereoAux = buildChoices(`Stereo Aux`, `Stereo Aux`, avantisData.config.stereo.auxCount, { hexOffset: 0x3f, midiOffset: 2 });
    const monoMatrix = buildChoices(`Mono Matrix`, `Mono Matrix`, avantisData.config.mono.matrixCount, { hexOffset: -1, midiOffset: 3 });
    const stereoMatrix = buildChoices(`Stereo Matrix`, `Stereo Matrix`, avantisData.config.stereo.matrixCount, { hexOffset: 0x3f, midiOffset: 3 });
    const monoFXSend = buildChoices(`Mono FX Send`, `Mono FX Send`, avantisData.config.stereo.fxSendCount, { hexOffset: -1, midiOffset: 4 });
    const stereoFXSend = buildChoices(`Stereo FX Send`, `Stereo FX Send`, avantisData.config.stereo.fxSendCount, { hexOffset: 0x0f, midiOffset: 4 });
    const FXReturn = buildChoices(`FX Return`, `FX Return`, avantisData.config.fxReturnCount, { hexOffset: 0x1f, midiOffset: 4 });

    const color = buildColorChoices(avantisData.colors);
    const fader = buildFaderChoices(avantisData.faders);

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
        color
    }
}

function buildChoices(name: string, key: string, qty: number, { hexOffset, midiOffset }: { hexOffset: number, midiOffset: number }): Choice {
    const choice: Choice = {
        name: name,
        midiOffset: midiOffset,
        values: [],
    }
    for (let i = 1; i <= qty; i++) {
        choice.values.push({
            id: i + hexOffset,
            label: `${key} ${i}`,
            hexOffset
        })
    }
    return choice
}

function buildColorChoices(colorOptions: Color[]): Choice {
    return {
        name: `Color`,
        midiOffset: 0,
        values: colorOptions.map(c => ({
            label: c.key,
            id: c.value,
            hexOffset: 0
        })),
    }
}

function buildFaderChoices(faderOptions: Fader[]): Choice {
    return {
        name: `Fader Level`,
        midiOffset: 0,
        values: faderOptions.map(fdr => ({
            label: `${fdr.db} dB`,
            id: fdr.hex,
            hexOffset: 0
        })),
    }
}