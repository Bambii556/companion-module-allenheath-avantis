import type { ModuleInstance } from './main.js'
import { CompanionActionDefinitions } from '@companion-module/base'
import { ChannelType } from './types.js'
import { CHANNEL_RANGES } from './helpers.js'


export function getActions(instance: ModuleInstance): CompanionActionDefinitions {
    const actions: CompanionActionDefinitions = {
        // Channel Mute Control
        channel_mute: {
            name: 'Channel Mute',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id, _range]) => ({
                        id,
                        label: id.replace(/_/g, ' ').toUpperCase()
                    }))
                },
                {
                    type: 'number',
                    label: 'Channel Number',
                    id: 'channel',
                    default: 1,
                    min: 1,
                    max: 64
                },
                {
                    type: 'dropdown',
                    label: 'Action',
                    id: 'muteState',
                    default: 'toggle',
                    choices: [
                        { id: 'on', label: 'Mute On' },
                        { id: 'off', label: 'Mute Off' },
                        { id: 'toggle', label: 'Toggle Mute' }
                    ]
                }
            ],
            callback: async (action) => {
                const channelType = action.options.channelType as ChannelType
                const channel = Number(action.options.channel)
                const range = CHANNEL_RANGES[channelType]

                if (channel < range.min || channel > range.max) {
                    instance.log('error', `Invalid channel number ${channel} for type ${channelType}`)
                    return
                }

                const midiChannel = instance.midiChannelForType(channelType)
                const noteNumber = range.offset + (channel - 1)

                const currentState = instance.getMuteState(channelType, channel)
                const newState = action.options.muteState === 'toggle' ? !currentState : action.options.muteState === 'on'

                // Mute values: velocity > 40 (0x7F) = Mute ON, velocity < 40 (0x3F) = Mute OFF
                const message = Buffer.from([
                    0x90 + midiChannel, // Note On
                    noteNumber,
                    newState ? 0x7F : 0x3F
                ])

                instance.sendMIDIMessage(message)
                instance.setMuteState(channelType, channel, newState)
            }
        },

        // Fader Level Control
        fader_level: {
            name: 'Set Fader Level',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id, _range]) => ({
                        id,
                        label: id.replace(/_/g, ' ').toUpperCase()
                    }))
                },
                {
                    type: 'number',
                    label: 'Channel Number',
                    id: 'channel',
                    default: 1,
                    min: 1,
                    max: 64
                },
                {
                    type: 'number',
                    label: 'Level (dB)',
                    id: 'level',
                    default: 0,
                    min: -90,
                    max: 10,
                    step: 0.1
                }
            ],
            callback: async (action) => {
                const channelType = action.options.channelType as ChannelType
                const channel = Number(action.options.channel)
                const level = Number(action.options.level)
                const range = CHANNEL_RANGES[channelType]

                if (channel < range.min || channel > range.max) {
                    instance.log('error', `Invalid channel number ${channel} for type ${channelType}`)
                    return
                }

                const midiChannel = instance.midiChannelForType(channelType)
                const noteNumber = range.offset + (channel - 1)
                const midiValue = dbToMIDI(level)

                // NRPN message sequence for fader level (parameter 17/0x11)
                const messages = [
                    Buffer.from([0xB0 + midiChannel, 0x63, noteNumber]), // NRPN MSB
                    Buffer.from([0xB0 + midiChannel, 0x62, 0x11]),      // NRPN LSB
                    Buffer.from([0xB0 + midiChannel, 0x06, midiValue])  // Data Entry
                ]

                for (const message of messages) {
                    instance.sendMIDIMessage(message)
                }
                
                instance.setFaderLevel(channelType, channel, level)
            }
        },

        // Scene Recall
        recall_scene: {
            name: 'Recall Scene',
            options: [
                {
                    type: 'number',
                    label: 'Scene Number',
                    id: 'scene',
                    default: 1,
                    min: 1,
                    max: 500
                }
            ],
            callback: async (action) => {
                const scene = Number(action.options.scene)
                instance.recallScene(scene)
            }
        }
    }

    return actions
}

// Helper function to convert dB to MIDI value
function dbToMIDI(db: number): number {
    if (db <= -Infinity) return 0
    if (db >= 10) return 127
    
    // Linear interpolation between key points
    const points = [
        { db: -Infinity, midi: 0 },
        { db: -40, midi: 0x1B },
        { db: -30, midi: 0x2F },
        { db: -20, midi: 0x43 },
        { db: -10, midi: 0x57 },
        { db: 0, midi: 0x6B },
        { db: 5, midi: 0x74 },
        { db: 10, midi: 0x7F }
    ]
    
    // Find the two points to interpolate between
    for (let i = 0; i < points.length - 1; i++) {
        if (db >= points[i].db && db <= points[i + 1].db) {
            const ratio = (db - points[i].db) / (points[i + 1].db - points[i].db)
            return Math.round(points[i].midi + ratio * (points[i + 1].midi - points[i].midi))
        }
    }
    
    return 0
}