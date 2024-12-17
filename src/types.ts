
// Channel type definitions
export type ChannelType = 'input' | 'mono_group' | 'stereo_group' | 'mono_aux' | 'stereo_aux' | 'mono_matrix' | 'stereo_matrix' | 'fx_send' | 'fx_return' | 'mains' | 'dca'

export interface ChannelRange {
    min: number
    max: number
    offset: number
}

export interface ModuleConfig {
    host: string
    port: number
    baseChannel: number  // Base MIDI channel (default 12)
}

export interface MIDIMessage {
    type: number
    channel: number
    data1: number
    data2: number
}

export interface SceneInfo {
    number: number
    name: string
    bank: number
}

export interface ChannelInfo {
    type: string
    number: number
    name?: string
    mute: boolean
    level: number
}

export type MIDICommandType = 
    | 'note_on'
    | 'note_off'
    | 'control_change'
    | 'program_change'
    | 'sysex'

export const MIDI_STATUS = {
    NOTE_ON: 0x90,
    NOTE_OFF: 0x80,
    CONTROL_CHANGE: 0xB0,
    PROGRAM_CHANGE: 0xC0,
    SYSEX_START: 0xF0,
    SYSEX_END: 0xF7
} as const

export const NRPN = {
    MSB: 0x63,
    LSB: 0x62,
    DATA_ENTRY: 0x06
} as const

export const SYSEX = {
    HEADER: [0xF0, 0x00, 0x00, 0x1A, 0x50, 0x10, 0x01, 0x00],
    MESSAGES: {
        NAME_REQUEST: 0x01,
        NAME_REPLY: 0x02,
        NAME_SET: 0x03,
        SCENE_NAME_REQUEST: 0x07
    }
} as const