import type { ModuleInstance } from './main.js'
import { CompanionActionDefinitions } from '@companion-module/base'
import { ChannelType, SYSEX } from './types.js'
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
                    choices: Object.entries(CHANNEL_RANGES).map(([id]) => ({
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
                    choices: Object.entries(CHANNEL_RANGES).map(([id]) => ({
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
        },

        dca_assign: {
            name: 'DCA Assignment',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id]) => ({
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
                    label: 'DCA Number',
                    id: 'dca',
                    default: 1,
                    min: 1,
                    max: 16
                },
                {
                    type: 'dropdown',
                    label: 'Action',
                    id: 'assign',
                    default: 'assign',
                    choices: [
                        { id: 'assign', label: 'Assign to DCA' },
                        { id: 'unassign', label: 'Remove from DCA' }
                    ]
                }
            ],
            callback: async (action) => {
                const channelType = action.options.channelType as ChannelType
                const channel = Number(action.options.channel)
                const dcaNumber = Number(action.options.dca)
                const assign = action.options.assign === 'assign'
                
                const range = CHANNEL_RANGES[channelType]
                if (channel < range.min || channel > range.max) {
                    instance.log('error', `Invalid channel number ${channel} for type ${channelType}`)
                    return
                }

                const midiChannel = instance.midiChannelForType(channelType)
                const noteNumber = range.offset + (channel - 1)
                
                // DCA Assignment uses NRPN with parameter ID 40
                // ON value DB for DCA 1 to 16 = 40 to 4F
                // OFF value DA for DCA 1 to 16 = 00 to 0F
                const dcaValue = assign ? 0x40 + (dcaNumber - 1) : 0x00 + (dcaNumber - 1)

                const messages = [
                    Buffer.from([0xB0 + midiChannel, 0x63, noteNumber]), // NRPN MSB
                    Buffer.from([0xB0 + midiChannel, 0x62, 0x40]),      // NRPN LSB (Parameter 40)
                    Buffer.from([0xB0 + midiChannel, 0x06, dcaValue])   // Data Entry
                ]

                for (const message of messages) {
                    instance.sendMIDIMessage(message)
                }
            }
        },

        send_level: {
            name: 'Set Send Level',
            options: [
                {
                    type: 'dropdown',
                    label: 'Source Type',
                    id: 'sourceType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id]) => ({
                        id,
                        label: id.replace(/_/g, ' ').toUpperCase()
                    }))
                },
                {
                    type: 'number',
                    label: 'Source Channel',
                    id: 'sourceChannel',
                    default: 1,
                    min: 1,
                    max: 64
                },
                {
                    type: 'dropdown',
                    label: 'Send To',
                    id: 'destType',
                    default: 'mono_matrix',
                    choices: [
                        { id: 'mono_aux', label: 'Mono Aux' },
                        { id: 'stereo_aux', label: 'Stereo Aux' },
                        { id: 'fx_send', label: 'FX Send' },
                        { id: 'mono_matrix', label: 'Mono Matrix' },
                        { id: 'stereo_matrix', label: 'Stereo Matrix' }
                    ]
                },
                {
                    type: 'number',
                    label: 'Destination Number',
                    id: 'destChannel',
                    default: 1,
                    min: 1,
                    max: 40  // Will be validated based on destination type
                },
                {
                    type: 'number',
                    label: 'Level (dB)',
                    id: 'level',
                    default: 0,
                    min: -Infinity,
                    max: 10,
                    step: 0.1
                }
            ],
            callback: async (action) => {
                const sourceType = action.options.sourceType as ChannelType
                const sourceChannel = Number(action.options.sourceChannel)
                const destType = action.options.destType as ChannelType
                const destChannel = Number(action.options.destChannel)
                const level = Number(action.options.level)

                // Validate channel numbers
                const sourceRange = CHANNEL_RANGES[sourceType]
                const destRange = CHANNEL_RANGES[destType]

                if (sourceChannel < sourceRange.min || sourceChannel > sourceRange.max) {
                    instance.log('error', `Invalid source channel number ${sourceChannel} for type ${sourceType}`)
                    return
                }

                if (destChannel < destRange.min || destChannel > destRange.max) {
                    instance.log('error', `Invalid destination channel number ${destChannel} for type ${destType}`)
                    return
                }

                // Calculate MIDI channels and note numbers
                const sourceMidiChannel = instance.midiChannelForType(sourceType)
                const sourceNote = sourceRange.offset + (sourceChannel - 1)

                const destMidiChannel = instance.midiChannelForType(destType)
                let destNote = destRange.offset + (destChannel - 1)

                // For stereo destinations, use the correct offset from the protocol
                if (destType === 'stereo_matrix') {
                    destNote = 0x40 + (destChannel - 1) // Stereo Matrix starts at offset 0x40
                }

                // Convert level to MIDI value
                const midiValue = dbToMIDI(level)

                // Build the SysEx message according to protocol
                const message = Buffer.from([
                    ...SYSEX.HEADER,           // Standard header: F0, 00, 00, 1A, 50, 10, 01, 00
                    sourceMidiChannel,         // Source MIDI channel (0N)
                    0x0D,                      // Message type for send level
                    sourceNote,                // Source channel note number (CH)
                    destMidiChannel,           // Destination MIDI channel (SndN)
                    destNote,                  // Destination channel note number (SndCH)
                    midiValue,                 // Level value (LV)
                    0xF7                       // End of SysEx
                ])

                instance.sendMIDIMessage(message)
                instance.log('debug', `Sending matrix level: Source ${sourceType}${sourceChannel} to ${destType}${destChannel} Level: ${level}dB`)
            }
        },

        // Channel Assignment to Main Mix
        assign_to_main: {
            name: 'Assign to Main Mix',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id]) => ({
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
                    id: 'assign',
                    default: 'assign',
                    choices: [
                        { id: 'assign', label: 'Assign to Main' },
                        { id: 'unassign', label: 'Remove from Main' }
                    ]
                }
            ],
            callback: async (action) => {
                const channelType = action.options.channelType as ChannelType
                const channel = Number(action.options.channel)
                const assign = action.options.assign === 'assign'

                const range = CHANNEL_RANGES[channelType]
                const midiChannel = instance.midiChannelForType(channelType)
                const noteNumber = range.offset + (channel - 1)

                // NRPN sequence for main mix assignment (parameter 18)
                const messages = [
                    Buffer.from([0xB0 + midiChannel, 0x63, noteNumber]), // NRPN MSB
                    Buffer.from([0xB0 + midiChannel, 0x62, 0x18]),      // NRPN LSB (Parameter 18)
                    Buffer.from([0xB0 + midiChannel, 0x06, assign ? 0x7F : 0x3F]) // Data Entry
                ]

                for (const message of messages) {
                    instance.sendMIDIMessage(message)
                }
            }
        },

        // Channel Name Set
        set_channel_name: {
            name: 'Set Channel Name',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id]) => ({
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
                    type: 'textinput',
                    label: 'Name (max 8 chars)',
                    id: 'name',
                    default: '',
                    useVariables: true
                }
            ],
            callback: async (action, _context) => {
                const channelType = action.options.channelType as ChannelType
                const channel = Number(action.options.channel)
                let name = ''

                // Handle undefined name and ensure string type
                if (action.options.name !== undefined) {
                    name = await instance.parseVariablesInString(String(action.options.name))
                }
                
                // Limit to 8 characters
                name = name.slice(0, 8)

                const range = CHANNEL_RANGES[channelType]
                const midiChannel = instance.midiChannelForType(channelType)
                const noteNumber = range.offset + (channel - 1)

                // Convert name to ASCII bytes
                const nameBytes = Buffer.from(name, 'ascii')

                // SysEx message for name set
                const message = Buffer.from([
                    0xF0, 0x00, 0x00, 0x1A, 0x50, 0x10, 0x01, 0x00, // Header
                    0x03, // Message type for name set
                    midiChannel,
                    noteNumber,
                    ...nameBytes,
                    0xF7
                ])

                instance.sendMIDIMessage(message)
                
                // Update variable
                instance.setVariableValues({
                    [`${channelType}_${channel}_name`]: name
                })
            }
        },

        // Channel Color Set
        set_channel_color: {
            name: 'Set Channel Color',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id]) => ({
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
                    label: 'Color',
                    id: 'color',
                    default: '0',
                    choices: [
                        { id: '0', label: 'Off' },
                        { id: '1', label: 'Red' },
                        { id: '2', label: 'Green' },
                        { id: '3', label: 'Yellow' },
                        { id: '4', label: 'Blue' },
                        { id: '5', label: 'Purple' },
                        { id: '6', label: 'Light Blue' },
                        { id: '7', label: 'White' }
                    ]
                }
            ],
            callback: async (action) => {
                const channelType = action.options.channelType as ChannelType
                const channel = Number(action.options.channel)
                const color = Number(action.options.color)

                const range = CHANNEL_RANGES[channelType]
                const midiChannel = instance.midiChannelForType(channelType)
                const noteNumber = range.offset + (channel - 1)

                // SysEx message for color set
                const message = Buffer.from([
                    0xF0, 0x00, 0x00, 0x1A, 0x50, 0x10, 0x01, 0x00, // Header
                    0x06, // Message type for color set
                    midiChannel,
                    noteNumber,
                    color,
                    0xF7
                ])

                instance.sendMIDIMessage(message)
            }
        },

        transport_control: {
            name: 'Transport Control',
            options: [
                {
                    type: 'dropdown',
                    label: 'Command',
                    id: 'command',
                    default: 'play',
                    choices: [
                        { id: 'stop', label: 'Stop' },
                        { id: 'play', label: 'Play' },
                        { id: 'ff', label: 'Fast Forward' },
                        { id: 'rw', label: 'Rewind' },
                        { id: 'record', label: 'Record' },
                        { id: 'pause', label: 'Pause' }
                    ]
                }
            ],
            callback: async (action) => {
                // MMC commands from documentation
                const MMC_COMMANDS = {
                    stop: 0x01,
                    play: 0x02,
                    ff: 0x04,
                    rw: 0x05,
                    record: 0x06,
                    pause: 0x09
                }

                const command = MMC_COMMANDS[action.options.command as keyof typeof MMC_COMMANDS]
                const message = Buffer.from([
                    0xF0, 0x7F, 0x7F, 0x06, // MMC header
                    command,
                    0xF7 // End of SysEx
                ])

                instance.sendMIDIMessage(message)
            }
        },

        // MIDI Strips Control
        midi_strip_control: {
            name: 'MIDI Strip Control',
            options: [
                {
                    type: 'number',
                    label: 'Strip Number',
                    id: 'strip',
                    default: 1,
                    min: 1,
                    max: 32
                },
                {
                    type: 'dropdown',
                    label: 'Control Type',
                    id: 'controlType',
                    default: 'fader',
                    choices: [
                        { id: 'fader', label: 'Fader Level' },
                        { id: 'gain', label: 'Gain Rotary' },
                        { id: 'pan', label: 'Pan Rotary' },
                        { id: 'sends', label: 'Sends Rotary' },
                        { id: 'custom1', label: 'Custom Rotary 1' },
                        { id: 'custom2', label: 'Custom Rotary 2' },
                        { id: 'custom3', label: 'Custom Rotary 3' },
                        { id: 'mute', label: 'Mute Switch' },
                        { id: 'mix', label: 'Mix Switch' },
                        { id: 'pafl', label: 'PAFL Switch' }
                    ]
                },
                {
                    type: 'number',
                    label: 'Value',
                    id: 'value',
                    default: 0,
                    min: 0,
                    max: 127,
                    isVisible: (options) => !['mute', 'mix', 'pafl'].includes(String(options.controlType))
                },
                {
                    type: 'dropdown',
                    label: 'Switch State',
                    id: 'switchState',
                    default: 'on',
                    choices: [
                        { id: 'on', label: 'On' },
                        { id: 'off', label: 'Off' }
                    ],
                    isVisible: (options) => ['mute', 'mix', 'pafl'].includes(String(options.controlType))
                }
            ],
            callback: async (action) => {
                const strip = Number(action.options.strip) - 1
                let message: Buffer

                // MIDI Strips mapping according to documentation
                switch (action.options.controlType) {
                    case 'fader':
                        message = Buffer.from([0xB1, strip, Number(action.options.value)])
                        break
                    case 'gain':
                        message = Buffer.from([0xB2, strip, Number(action.options.value)])
                        break
                    case 'pan':
                        message = Buffer.from([0xB2, 0x20 + strip, Number(action.options.value)])
                        break
                    case 'sends':
                        message = Buffer.from([0xB2, 0x40 + strip, Number(action.options.value)])
                        break
                    case 'custom1':
                    case 'custom2':
                    case 'custom3':
                        message = Buffer.from([0xB2, 0x60 + strip, Number(action.options.value)])
                        break
                    case 'mute':
                        message = Buffer.from([0x91, strip, action.options.switchState === 'on' ? 127 : 0])
                        break
                    case 'mix':
                        message = Buffer.from([0x91, 0x20 + strip, action.options.switchState === 'on' ? 127 : 0])
                        break
                    case 'pafl':
                        message = Buffer.from([0x91, 0x40 + strip, action.options.switchState === 'on' ? 127 : 0])
                        break
                    default:
                        return
                }

                instance.sendMIDIMessage(message)
            }
        },

        // SoftKeys Control
        softkey: {
            name: 'SoftKey Control',
            options: [
                {
                    type: 'number',
                    label: 'SoftKey Number',
                    id: 'key',
                    default: 1,
                    min: 1,
                    max: 16
                },
                {
                    type: 'dropdown',
                    label: 'Action',
                    id: 'keyState',
                    default: 'press',
                    choices: [
                        { id: 'press', label: 'Press' },
                        { id: 'release', label: 'Release' }
                    ]
                }
            ],
            callback: async (action) => {
                const key = Number(action.options.key) - 1
                const isPress = action.options.keyState === 'press'

                // SoftKey MIDI messages use Note On messages
                const message = Buffer.from([
                    0x90 | (instance.config.baseChannel - 1),
                    0x60 + key, // SoftKeys start at 0x60
                    isPress ? 127 : 0
                ])

                instance.sendMIDIMessage(message)
            }
        },

        fader_level_relative: {
            name: 'Adjust Fader Level (Relative)',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id]) => ({
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
                    label: 'Change Amount (dB)',
                    id: 'change',
                    default: 3,
                    min: -60,
                    max: 60,
                    step: 0.1
                }
            ],
            callback: async (action) => {
                const channelType = action.options.channelType as ChannelType
                const channel = Number(action.options.channel)
                const change = Number(action.options.change)
                
                // Get current level from our stored state
                const currentLevel = instance.getFaderLevel(channelType, channel)
                
                // Calculate new level
                let newLevel = currentLevel + change
                
                // Clamp the value to valid range
                newLevel = Math.min(10, Math.max(-90, newLevel))

                const range = CHANNEL_RANGES[channelType]
                const midiChannel = instance.midiChannelForType(channelType)
                const noteNumber = range.offset + (channel - 1)
                
                // Convert to MIDI value
                const midiValue = dbToMIDI(newLevel)

                // Send NRPN sequence for fader level (parameter 17)
                const messages = [
                    Buffer.from([0xB0 + midiChannel, 0x63, noteNumber]), // NRPN MSB
                    Buffer.from([0xB0 + midiChannel, 0x62, 0x11]),      // NRPN LSB (Parameter 17)
                    Buffer.from([0xB0 + midiChannel, 0x06, midiValue])  // Data Entry
                ]

                for (const message of messages) {
                    instance.sendMIDIMessage(message)
                }
                
                instance.setFaderLevel(channelType, channel, newLevel)
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