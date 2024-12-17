import { ModuleInstance } from "./main.js"
import { ChannelRange, ChannelType } from "./types.js"


// Helper functions for MIDI channel calculations
export function getMIDIChannel(baseChannel: number, type: 'input' | 'group' | 'aux' | 'matrix' | 'fx'): number {
    const offsets = {
        'input': 0,
        'group': 1,
        'aux': 2,
        'matrix': 3,
        'fx': 4
    }
    return baseChannel + offsets[type] - 1 // Subtract 1 since MIDI channels are 0-based
}

// Helper to format MIDI messages with running status
export function formatMIDIMessage(status: number, data1: number, data2: number): Buffer {
    return Buffer.from([status, data1, data2])
}

// Constants for MIDI message types
export const MIDI_CONSTANTS = {
    NOTE_ON: 0x90,
    CONTROL_CHANGE: 0xB0,
    NRPN_MSB: 0x63,
    NRPN_LSB: 0x62,
    DATA_ENTRY: 0x06,
    PROGRAM_CHANGE: 0xC0
} as const



// Channel ranges based on documentation
export const CHANNEL_RANGES: Record<ChannelType, ChannelRange> = {
    input: { min: 1, max: 64, offset: 0x00 },
    mono_group: { min: 1, max: 40, offset: 0x00 },
    stereo_group: { min: 1, max: 20, offset: 0x40 },
    mono_aux: { min: 1, max: 40, offset: 0x00 },
    stereo_aux: { min: 1, max: 20, offset: 0x40 },
    mono_matrix: { min: 1, max: 40, offset: 0x00 },
    stereo_matrix: { min: 1, max: 20, offset: 0x40 },
    fx_send: { min: 1, max: 12, offset: 0x00 },
    fx_return: { min: 1, max: 12, offset: 0x20 },
    mains: { min: 1, max: 3, offset: 0x30 },
    dca: { min: 1, max: 16, offset: 0x36 }
}

export function updateChannelVariables(
    instance: ModuleInstance,
    type: ChannelType,
    channel: number,
    updates: {
        mute?: boolean
        level?: number
        name?: string
    }
): void {
    const values: { [key: string]: string | number | boolean } = {}

    if (updates.mute !== undefined) {
        values[`${type}_${channel}_mute`] = updates.mute ? 'Muted' : 'Unmuted'
    }

    if (updates.level !== undefined) {
        values[`${type}_${channel}_level`] = `${updates.level.toFixed(1)} dB`
    }

    if (updates.name !== undefined) {
        values[`${type}_${channel}_name`] = updates.name
    }

    if (Object.keys(values).length > 0) {
        instance.setVariableValues(values)
    }
}

export function updateSceneVariables(
    instance: ModuleInstance,
    data: {
        current?: number,
        lastRecalled?: number,
        name?: string
    }
): void {
    const values: { [key: string]: string | number } = {}

    if (typeof data.current === 'number') {
        values['current_scene'] = data.current
    }

    if (typeof data.lastRecalled === 'number') {
        values['last_recalled_scene'] = data.lastRecalled
    }

    if (data.name !== undefined) {
        values['current_scene_name'] = data.name
    }

    if (Object.keys(values).length > 0) {
        instance.setVariableValues(values)
    }
}