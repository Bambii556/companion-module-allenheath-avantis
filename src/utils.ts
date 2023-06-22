
export enum ChannelType {
    Input = 'input',
    MonoGroup = 'monoGroup',
    StereoGroup = 'stereoGroup',
    MonoAux = 'monoAux',
    StereoAux = 'stereoAux',
    MonoMatrix = 'monoMatrix',
    StereoMatrix = 'stereoMatrix',
    MonoFXSend = 'monoFXSend',
    StereoFXSend = 'stereoFXSend',
    FXReturn = 'FXReturn',
    Main = 'main',
    DCA = 'dca',
    Group = 'group'
}

export function determineChannelType(channelNumber: number, midiOffset: number): ChannelType {
    switch (midiOffset) {
        case 0:
            return ChannelType.Input;
        case 1:
            if (channelNumber <= 39) {
                return ChannelType.MonoGroup;
            }
            return ChannelType.StereoGroup;
        case 2:
            if (channelNumber <= 39) {
                return ChannelType.MonoAux;
            }
            return ChannelType.StereoAux;
        case 3:
            if (channelNumber <= 39) {
                return ChannelType.MonoMatrix;
            }
            return ChannelType.StereoMatrix;
        case 4:
            if (channelNumber <= 11) {
                return ChannelType.MonoFXSend;
            } else if (channelNumber <= 27) {
                return ChannelType.StereoFXSend;
            } else if (channelNumber <= 43) {
                return ChannelType.FXReturn;
            } else if (channelNumber <= 50) {
                return ChannelType.Main;
            } else if (channelNumber <= 69) {
                return ChannelType.DCA;
            }
            return ChannelType.Group;
    }

    return ChannelType.Main;
}