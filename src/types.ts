export interface Cache {
    mute: MuteCache;
    name: NameOption;
}

export interface MuteCache {
    input: MuteOption;
    main: MuteOption;
    monoGroup: MuteOption;
    stereoGroup: MuteOption;
    monoAux: MuteOption;
    stereoAux: MuteOption;
    monoMatrix: MuteOption;
    stereoMatrix: MuteOption;
    monoFXSend: MuteOption;
    stereoFXSend: MuteOption;
    FXReturn: MuteOption;
    group: MuteOption;
    dca: MuteOption;
}

export interface MuteOption {
    [id: string]: boolean
}
export interface NameOption {
    [id: string]: string
}