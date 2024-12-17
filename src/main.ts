import { 
    InstanceBase, 
    InstanceStatus, 
    SomeCompanionConfigField
} from '@companion-module/base'
import { GetConfigFields } from './config.js'
import { getActions } from './actions.js'
import { getFeedbacks } from './feedback.js'
import { getVariables } from './variables.js'
import { MIDIProcessor } from './midi-processor.ts.js'
import {getPresets} from './presets.js'
import * as net from 'net'
import { ModuleConfig } from './types.js'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
    private socket: net.Socket | null = null
    private reconnectTimer: NodeJS.Timeout | null = null
    private midiProcessor: MIDIProcessor
    private midiQueue: Buffer[] = []
    private processingQueue = false
    private lastMessageTime = 0
    private readonly MIDI_MESSAGE_DELAY = 20
    private readonly RECONNECT_INTERVAL = 5000
    private lastBankChange = 0
    
    // State tracking
    private channelStates: Map<string, boolean> = new Map()
    private faderLevels: Map<string, number> = new Map()

	config!: ModuleConfig // Setup in init()

    constructor(internal: unknown) {
        super(internal)
        this.midiProcessor = new MIDIProcessor(this)
    }

    /**
     * Main initialization function called once the module is OK to start doing things
     */
    async init(config: ModuleConfig, isFirstInit: boolean): Promise<void> {
        this.config = config
        this.updateStatus(InstanceStatus.Connecting)
        
        this.setupSocket()

        // Set up actions, feedbacks, and variables
        this.setActionDefinitions(getActions(this))
        this.setFeedbackDefinitions(getFeedbacks(this))
        this.setVariableDefinitions(getVariables(this))
        this.setPresetDefinitions(getPresets())

        if (isFirstInit) {
            this.log('info', 'First time initialization')
        }
    }

    /**
     * Clean up the instance before it is destroyed
     */
    async destroy(): Promise<void> {
        if (this.socket) {
            this.socket.destroy()
            this.socket = null
        }
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }

    /**
     * Process updated configuration
     */
    async configUpdated(config: ModuleConfig): Promise<void> {
        this.config = config
        this.setupSocket()
    }

    /**
     * Creates the configuration fields for web config
     */
    getConfigFields(): SomeCompanionConfigField[] {
        return GetConfigFields()
    }

    /**
     * Socket setup and management
     */
    private setupSocket(): void {
        if (this.socket) {
            this.socket.destroy()
            this.socket = null
        }

        this.socket = new net.Socket()
        
        this.socket.on('connect', () => {
            this.updateStatus(InstanceStatus.Ok)
            this.log('info', `Connected to Avantis at ${this.config.host}:${this.config.port}`)
            if (this.reconnectTimer) {
                clearInterval(this.reconnectTimer)
                this.reconnectTimer = null
            }
        })

        this.socket.on('error', (error) => {
            this.log('error', `Socket error: ${error.message}`)
            this.updateStatus(InstanceStatus.ConnectionFailure)
        })

        this.socket.on('close', () => {
            this.updateStatus(InstanceStatus.Disconnected)
            this.log('warn', 'Connection closed')
            this.scheduleReconnect()
        })

        this.socket.on('data', (data) => {
            this.midiProcessor.processMIDIMessage(data)
        })

        this.connectSocket()
    }

    private connectSocket(): void {
        if (!this.socket || !this.config) return

        this.socket.connect({
            host: this.config.host,
            port: this.config.port
        })
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return

        this.reconnectTimer = setInterval(() => {
            this.log('info', 'Attempting to reconnect...')
            this.connectSocket()
        }, this.RECONNECT_INTERVAL)
    }

    /**
     * Scene management
     */
    public recallScene(sceneNumber: number): void {
        if (sceneNumber < 1 || sceneNumber > 500) {
            this.log('error', `Invalid scene number: ${sceneNumber}`)
            return
        }

        const bank = Math.floor((sceneNumber - 1) / 128)
        const program = (sceneNumber - 1) % 128

        if (bank !== this.lastBankChange) {
            const bankMessage = Buffer.from([0xB0 | (this.config.baseChannel - 1), 0x00, bank])
            this.sendMIDIMessage(bankMessage)
            this.lastBankChange = bank
        }

        const programMessage = Buffer.from([0xC0 | (this.config.baseChannel - 1), program])
        this.sendMIDIMessage(programMessage)
    }

    /**
     * MIDI message handling
     */
    public sendMIDIMessage(message: Buffer): void {
        this.midiQueue.push(message)
        if (!this.processingQueue) {
            this.processQueue()
        }
    }

    private async processQueue(): Promise<void> {
        if (this.processingQueue || this.midiQueue.length === 0) return
        this.processingQueue = true

        while (this.midiQueue.length > 0) {
            const now = Date.now()
            const timeSinceLastMessage = now - this.lastMessageTime

            if (timeSinceLastMessage < this.MIDI_MESSAGE_DELAY) {
                await new Promise(resolve => setTimeout(resolve, this.MIDI_MESSAGE_DELAY - timeSinceLastMessage))
            }

            const message = this.midiQueue.shift()
            if (!message) continue

            try {
                if (this.socket?.writable) {
                    this.socket.write(message)
                    this.lastMessageTime = Date.now()
                } else {
                    this.log('error', 'Socket not writable, message dropped')
                    this.updateStatus(InstanceStatus.ConnectionFailure)
                }
            } catch (error) {
                this.log('error', `Failed to send MIDI message: ${error}`)
                this.updateStatus(InstanceStatus.ConnectionFailure)
            }
        }

        this.processingQueue = false
    }

    // State management methods
    public getMuteState(type: string, channel: number): boolean {
        return this.channelStates.get(`${type}_${channel}`) || false
    }

    public setMuteState(type: string, channel: number, state: boolean): void {
        this.channelStates.set(`${type}_${channel}`, state)
        this.checkFeedbacks('channelMute')
    }

    public getFaderLevel(type: string, channel: number): number {
        return this.faderLevels.get(`${type}_${channel}`) || 0
    }

    public setFaderLevel(type: string, channel: number, level: number): void {
        this.faderLevels.set(`${type}_${channel}`, level)
        this.checkFeedbacks('faderLevel')
    }

    public getLastBankChange(): number {
        return this.lastBankChange
    }

    /**
     * Calculate MIDI channel based on channel type
     * @param type Channel type (input, mono_group, etc)
     * @returns MIDI channel number (0-based)
     */
    public midiChannelForType(type: string): number {
        const baseChannel = this.config.baseChannel - 1 // Convert to 0-based
        const channelOffsets: { [key: string]: number } = {
            'input': 0,
            'mono_group': 1,
            'stereo_group': 1,
            'mono_aux': 2,
            'stereo_aux': 2,
            'mono_matrix': 3,
            'stereo_matrix': 3,
            'fx_send': 4,
            'fx_return': 4,
            'mains': 4,
            'dca': 4
        }

        return baseChannel + (channelOffsets[type] || 0)
    }
}