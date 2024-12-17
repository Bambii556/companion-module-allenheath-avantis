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
}