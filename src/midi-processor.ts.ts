// midi-processor.ts

import { updateChannelVariables, updateSceneVariables } from './helpers.js';
import { ModuleInstance } from './main.js'
import { ChannelType, MIDIMessage, MIDI_STATUS, NRPN, SYSEX } from './types.js'

export class MIDIProcessor {
    private instance: ModuleInstance
    private nrpnBuffer: { msb: number; lsb: number } | null = null
    // private sysexBuffer: number[] = []

    constructor(instance: ModuleInstance) {
        this.instance = instance
    }

    processMIDIMessage(data: Buffer): void {
        // Handle SysEx messages
        if (data[0] === MIDI_STATUS.SYSEX_START) {
            this.handleSysExMessage(data)
            return
        }

        // Parse standard MIDI message
        const message = this.parseMIDIMessage(data)
        if (!message) return

        switch (message.type) {
            case MIDI_STATUS.NOTE_ON:
                this.handleMuteMessage(message)
                break
            
            case MIDI_STATUS.CONTROL_CHANGE:
                this.handleControlChange(message)
                break
            
            case MIDI_STATUS.PROGRAM_CHANGE:
                this.handleProgramChange(message)
                break

            case 0xB1: // MIDI Strip Fader
                this.handleMIDIStripFader(message)
                break

            case 0xB2: // MIDI Strip Controls
                this.handleMIDIStripControl(message)
                break

            case 0x91: // MIDI Strip Switches
                this.handleMIDIStripSwitch(message)
                break

            case 0x90: // SoftKeys (when channel matches base channel)
                if (message.channel === this.instance.config.baseChannel - 1) {
                    this.handleSoftKey(message)
                }
                break
        }
    }

    private parseMIDIMessage(data: Buffer): MIDIMessage | null {
        if (data.length < 2) return null

        const statusByte = data[0]
        const type = statusByte & 0xF0
        const channel = statusByte & 0x0F

        return {
            type,
            channel,
            data1: data[1],
            data2: data.length > 2 ? data[2] : 0
        }
    }

    private handleMuteMessage(message: MIDIMessage): void {
        const channelInfo = this.calculateChannelInfo(message.channel, message.data1)
        if (!channelInfo) return

        // Mute state is determined by velocity (data2)
        // velocity >= 0x40 (64) = Mute ON
        // velocity < 0x40 (64) = Mute OFF
        const muteState = message.data2 >= 0x40

        // Update module state
        this.instance.setMuteState(channelInfo.type, channelInfo.number, muteState)

        // Update variables
        updateChannelVariables(this.instance, channelInfo.type as ChannelType, channelInfo.number, {
            mute: muteState
        })

        // Trigger feedback check
        this.instance.checkFeedbacks('channelMute')
    }

    private handleControlChange(message: MIDIMessage): void {
        switch (message.data1) {
            case NRPN.MSB:
                this.nrpnBuffer = { msb: message.data2, lsb: 0 }
                break

            case NRPN.LSB:
                if (this.nrpnBuffer) {
                    this.nrpnBuffer.lsb = message.data2
                }
                break

            case NRPN.DATA_ENTRY:
                if (this.nrpnBuffer) {
                    this.handleNRPNValue(message.channel, this.nrpnBuffer.msb, this.nrpnBuffer.lsb, message.data2)
                    this.nrpnBuffer = null
                }
                break
        }
    }

    private handleNRPNValue(channel: number, msb: number, lsb: number, value: number): void {
        const channelInfo = this.calculateChannelInfo(channel, msb)
        if (!channelInfo) return

        switch (lsb) {
            case 0x17: // Fader level
                const dbValue = this.midiToDb(value)
                
                // Update module state
                this.instance.setFaderLevel(channelInfo.type, channelInfo.number, dbValue)

                // Update variables
                updateChannelVariables(this.instance, channelInfo.type as ChannelType, channelInfo.number, {
                    level: dbValue
                })

                // Trigger feedback check
                this.instance.checkFeedbacks('faderLevel')
                break

            case 0x18: // Main mix assignment
                // Implement if needed
                break
        }
    }

    private handleProgramChange(message: MIDIMessage): void {
        const bank = this.instance.getLastBankChange()
        const sceneNumber = (bank * 128) + message.data1 + 1

        updateSceneVariables(this.instance, {
            current: sceneNumber,
            lastRecalled: sceneNumber
        })

        // Request scene name
        const sysexMessage = Buffer.from([
            ...SYSEX.HEADER,
            SYSEX.MESSAGES.SCENE_NAME_REQUEST,
            sceneNumber & 0x7F,
            (sceneNumber >> 7) & 0x7F,
            MIDI_STATUS.SYSEX_END
        ])

        this.instance.sendMIDIMessage(sysexMessage)
        this.instance.checkFeedbacks('currentScene')
    }

    private handleSysExMessage(data: Buffer): void {
        // Verify Allen & Heath SysEx header
        if (!this.verifySysExHeader(data)) return

        const messageType = data[8]
        const midiChannel = data[9]
        const channelNumber = data[10]

        switch (messageType) {
            case SYSEX.MESSAGES.NAME_REPLY:
                const channelInfo = this.calculateChannelInfo(midiChannel, channelNumber)
                if (!channelInfo) return

                const name = this.parseSysExString(data.slice(11, -1))
                updateChannelVariables(this.instance, channelInfo.type as ChannelType, channelInfo.number, {
                    name: name
                })
                break

            // Handle other SysEx message types as needed
        }
    }

    private verifySysExHeader(data: Buffer): boolean {
        if (data.length < SYSEX.HEADER.length) return false
        
        for (let i = 0; i < SYSEX.HEADER.length; i++) {
            if (data[i] !== SYSEX.HEADER[i]) return false
        }
        
        return true
    }

    private calculateChannelInfo(midiChannel: number, noteNumber: number): { type: string; number: number } | null {
        const baseChannel = this.instance.config.baseChannel - 1
        const channelOffset = midiChannel - baseChannel

        switch (channelOffset) {
            case 0: // Inputs
                return { type: 'input', number: noteNumber + 1 }
            case 1: // Groups
                return noteNumber < 0x40 
                    ? { type: 'mono_group', number: noteNumber + 1 }
                    : { type: 'stereo_group', number: (noteNumber - 0x40) + 1 }
            case 2: // Aux
                return noteNumber < 0x40
                    ? { type: 'mono_aux', number: noteNumber + 1 }
                    : { type: 'stereo_aux', number: (noteNumber - 0x40) + 1 }
            case 4: // FX, Mains, DCAs
                if (noteNumber < 0x0C) return { type: 'fx_send', number: noteNumber + 1 }
                if (noteNumber >= 0x20 && noteNumber < 0x2C) return { type: 'fx_return', number: (noteNumber - 0x20) + 1 }
                if (noteNumber >= 0x30 && noteNumber < 0x33) return { type: 'mains', number: (noteNumber - 0x30) + 1 }
                if (noteNumber >= 0x36 && noteNumber < 0x46) return { type: 'dca', number: (noteNumber - 0x36) + 1 }
        }

        return null
    }

    private midiToDb(value: number): number {
        // Key points from Avantis documentation
        const points = [
            { midi: 0x00, db: -90 },
            { midi: 0x1B, db: -40 },
            { midi: 0x2F, db: -30 },
            { midi: 0x43, db: -20 },
            { midi: 0x57, db: -10 },
            { midi: 0x6B, db: 0 },
            { midi: 0x74, db: 5 },
            { midi: 0x7F, db: 10 }
        ]

        // Find points for interpolation
        for (let i = 0; i < points.length - 1; i++) {
            if (value >= points[i].midi && value <= points[i + 1].midi) {
                const ratio = (value - points[i].midi) / (points[i + 1].midi - points[i].midi)
                return points[i].db + ratio * (points[i + 1].db - points[i].db)
            }
        }

        return value <= points[0].midi ? points[0].db : points[points.length - 1].db
    }

    private parseSysExString(data: Buffer): string {
        return data.toString('ascii').replace(/\0/g, '')
    }

    private handleMIDIStripFader(message: MIDIMessage): void {
        const strip = message.data1 + 1  // Strip number (0-based to 1-based)
        const value = message.data2      // Fader value (0-127)

        this.instance.setVariableValues({
            [`midi_strip_${strip}_fader`]: value
        })
        this.instance.checkFeedbacks('midiStrip')
    }

    private handleMIDIStripControl(message: MIDIMessage): void {
        let controlType: string
        let strip: number

        // Determine control type and strip number based on data1
        if (message.data1 < 0x20) {
            // Gain control (0x00-0x1F)
            controlType = 'gain'
            strip = message.data1 + 1
        } else if (message.data1 < 0x40) {
            // Pan control (0x20-0x3F)
            controlType = 'pan'
            strip = (message.data1 - 0x20) + 1
        } else if (message.data1 < 0x60) {
            // Sends control (0x40-0x5F)
            controlType = 'sends'
            strip = (message.data1 - 0x40) + 1
        } else {
            // Custom controls (0x60-0x7F)
            controlType = 'custom'
            strip = (message.data1 - 0x60) + 1
        }

        this.instance.setVariableValues({
            [`midi_strip_${strip}_${controlType}`]: message.data2
        })
    }

    private handleMIDIStripSwitch(message: MIDIMessage): void {
        let controlType: string
        let strip: number

        // Determine switch type and strip number based on data1
        if (message.data1 < 0x20) {
            // Mute switches (0x00-0x1F)
            controlType = 'mute'
            strip = message.data1 + 1
        } else if (message.data1 < 0x40) {
            // Mix switches (0x20-0x3F)
            controlType = 'mix'
            strip = (message.data1 - 0x20) + 1
        } else {
            // PAFL switches (0x40-0x5F)
            controlType = 'pafl'
            strip = (message.data1 - 0x40) + 1
        }

        const state = message.data2 > 64 ? 'on' : 'off'
        this.instance.setVariableValues({
            [`midi_strip_${strip}_${controlType}`]: state
        })
        this.instance.checkFeedbacks('midiStrip')
    }

    private handleSoftKey(message: MIDIMessage): void {
        // SoftKeys use notes starting at 0x60
        if (message.data1 >= 0x60 && message.data1 < 0x70) {
            const keyNumber = message.data1 - 0x60 + 1  // Convert to 1-based key number
            const state = message.data2 > 64 ? 'pressed' : 'released'

            this.instance.setVariableValues({
                [`softkey_${keyNumber}_state`]: state
            })
            this.instance.checkFeedbacks('softkey')
        }
    }
}