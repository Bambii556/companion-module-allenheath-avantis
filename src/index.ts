import { InstanceBase, runEntrypoint, SomeCompanionConfigField } from '@companion-module/base'
import { getActionDefinitions } from './actions'
import { getFeedbackDefinitions } from './feedback'
import { Config, getConfigDefinitions } from './config'
import { Choice, Choices, getChoices } from './choices'
import { getSceneSelection, Scene } from './scenes'
import { AvantisConfig, getAvantisConfig, getColorByNumber, getNameByHex, getNameHexByName } from './avantisConfig'
import { TCP } from './tcp'
import { MainCache } from './types'
import { ChannelType, determineChannelType } from './utils'

const SysExHeader = [0xf0, 0x00, 0x00, 0x1a, 0x50, 0x10, 0x01, 0x00]

/**
 * @extends instance_skel
 * @since 1.0.0
 * @author Shaun Brown
 */

class AvantisInstance extends InstanceBase<Config> {
	config!: Config
	tcpSocket!: TCP
	baseMidiChannel!: number
	scenes!: Scene[]
	choices!: Choices
	avantisConfig!: AvantisConfig
	cache!: MainCache

	/**
	 * Create an instance.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 * @since 1.2.0
	 */
	constructor(internal: unknown) {
		super(internal)
		this.cache = {
			mute: {
				dca: {},
				FXReturn: {},
				group: {},
				input: {},
				main: {},
				monoAux: {},
				monoFXSend: {},
				monoGroup: {},
				monoMatrix: {},
				stereoAux: {},
				stereoFXSend: {},
				stereoGroup: {},
				stereoMatrix: {},
			},
			name: {
				dca: {},
				FXReturn: {},
				group: {},
				input: {},
				main: {},
				monoAux: {},
				monoFXSend: {},
				monoGroup: {},
				monoMatrix: {},
				stereoAux: {},
				stereoFXSend: {},
				stereoGroup: {},
				stereoMatrix: {},
			},
			color: {
				dca: {},
				FXReturn: {},
				group: {},
				input: {},
				main: {},
				monoAux: {},
				monoFXSend: {},
				monoGroup: {},
				monoMatrix: {},
				stereoAux: {},
				stereoFXSend: {},
				stereoGroup: {},
				stereoMatrix: {},
			},
		}
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	async init(config: Config, _isFirstInit: boolean): Promise<void> {
		await this.configUpdated(config)

		this.log('debug', `Loading Config files`)
		this.avantisConfig = getAvantisConfig()

		this.scenes = getSceneSelection(this.avantisConfig)
		this.choices = getChoices(this.avantisConfig)

		this.log('debug', `Loading Config files`)
		this.setActionDefinitions(getActionDefinitions(this, this.choices))
		this.setFeedbackDefinitions(getFeedbackDefinitions(this, this.choices))

		this.log('debug', `Init Done`)
	}

	/**
	 * Clean up the instance before it is destroyed.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	async destroy(): Promise<void> {
		if (this.tcpSocket !== undefined) {
			this.tcpSocket.destroy()
		}

		this.log('debug', `destroyed ${this.id}`)
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigDefinitions()
	}

	async configUpdated(config: Config): Promise<void> {
		this.log('debug', `Loading Config Updated`)
		this.config = config

		// TODO: Not sure why i have to minus 1 from base midi
		this.baseMidiChannel = this.config.midiBase - 1

		if (!this.config.host) {
			return
		}

		// await new Promise(f => setTimeout(f, 1000));
		this.init_tcp()
	}

	/**
	 * INTERNAL: use setup data to initalize the tcp tcpSocket object.
	 *
	 * @access protected
	 * @since 1.0.0
	 */
	private init_tcp() {
		if (!this.tcpSocket) {
			this.tcpSocket = new TCP(this, this.config)
		}

		this.log('debug', `Initializing TCP Socket`)
		this.tcpSocket.init(this.getRemoteStates, this.validateTCPFeedback)
	}

	/**
	 * Sets up a Constant Scenes selection.
	 *
	 * @since 1.0.0
	 */

	private getMidiValue(offset?: number) {
		let midi = this.baseMidiChannel
		if (offset) {
			midi += offset
		}
		return midi
	}

	public async sendMuteCommand(channel: number, mute: boolean, midiOffset: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset)

		// 9N, CH, 7F(3F), 9N, CH, 00
		const data = [0x90 + midi, channel, mute ? 0x7f : 0x3f, 0x90 + midi, channel, 0x00]
		this.log('warn', `Sending Mute: ${JSON.stringify({ data, hex: data.map((x) => x.toString(16)) })}`)
		const command = Buffer.from(data)

		await this.tcpSocket.sendCommand(command)
	}

	public async sendFaderCommand(channel: number, level: number, midiOffset: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset)

		// BN, 63, CH, BN, 62, 17, BN, 06, LV
		const command = Buffer.from([0xb0 + midi, 0x63, channel, 0xb0 + midi, 0x62, 0x17, 0xb0 + midi, 0x06, level])

		await this.tcpSocket.sendCommand(command)
	}

	public async sendAssignCommands(
		channel: number,
		groups: number[],
		assign: boolean,
		isDca: boolean,
		midiOffset: number
	): Promise<void> {
		let midi = this.getMidiValue(midiOffset)
		let offset = 0

		//TODO: Not sure how the selection looks like so logging it out
		if (groups) {
			this.log('warn', `Assign Command: ${JSON.stringify(groups)}`)
		}

		if (isDca) {
			// DCA
			if (assign) {
				// Assign ON
				offset = 0x40
			}
		} else {
			// Group Mute
			if (assign) {
				// Assign ON
				offset = 0x50
			} else {
				// Assign OFF
				offset = 0x10
			}
		}

		const routingCmds: Buffer[] = []

		for (const group of groups) {
			// BN, 63, CH, BN, 62, 40, BN, 06, DB(DA)
			routingCmds.push(
				Buffer.from([0xb0 + midi, 0x63, channel, 0xb0 + midi, 0x62, 0x40, 0xb0 + midi, 0x06, group + offset])
			)
		}

		await this.tcpSocket.sendCommands(routingCmds)
	}

	public async sendSceneCommand(sceneId: string, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset)

		// SceneId is the actual scene Number, To get from array we have to -1 to get index of scene
		const scene = this.scenes[parseInt(sceneId) - 1]

		// TODO: check if SS and Bank gets converted to correct hex value
		// BN, 00, Bank, CN, SS
		const command = Buffer.from([0xb0 + midi, 0x00, scene.bank, 0xc0 + midi, scene.ss])

		await this.tcpSocket.sendCommand(command)
	}

	public async sendChannelAssignCommand(channel: number, assign: boolean, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset)

		// BN, 63, CH, BN, 62, 18, BN, 06, 7F(3F)
		const command = Buffer.from([
			0xb0 + midi,
			0x63,
			channel,
			0xb0 + midi,
			0x62,
			0x18,
			0xb0 + midi,
			0x06,
			assign ? 0x7f : 0x3f,
		])

		await this.tcpSocket.sendCommand(command)
	}

	public async sendChannelNameCommand(channel: number, channelName: string, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset)

		// SysEx Header, 0N, 03, CH, Name, F7
		let commandArray = [...SysExHeader, 0x00 + midi, 0x03, channel]

		// Add Name from opt.channelName
		commandArray = [...commandArray, ...getNameHexByName(this.avantisConfig.name, channelName)]

		commandArray.push(0xf7)
		const command = Buffer.from(commandArray)

		await this.tcpSocket.sendCommand(command)
	}

	public async sendChannelColorCommand(channel: number, color: string, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset)

		// SysEx Header, 0N, 06, CH, Col, F7
		const command = Buffer.from([...SysExHeader, 0x00 + midi, 0x06, channel, parseInt(color), 0xf7])

		await this.tcpSocket.sendCommand(command)
	}

	public async sendLevelSendCommand(
		src: { channel: number; midiOffset: number },
		dest: { channel: number; midiOffset: number },
		level: string
	): Promise<void> {
		// TODO: Check if the Channels comes back as Number or String
		// SysEx Header, 0N, 0D, CH, SndN, SndCH, LV, F7
		const command = Buffer.from([
			...SysExHeader,
			0x00 + this.getMidiValue(src.midiOffset),
			0x0d,
			src.channel,
			0x00 + this.getMidiValue(dest.midiOffset),
			dest.channel,
			parseInt(level),
			0xf7,
		])

		await this.tcpSocket.sendCommand(command)
	}

	public validateTCPFeedback = (data: number[]) => {
		this.log('debug', `TCP Data: ${JSON.stringify(data)}`)
		if (!data || data.length <= 0) {
			return
		}

		let firstValue = data[0]

		// Mute Feedback
		if (firstValue >= 144 && firstValue <= 166) {
			this.updateMuteStateInCache(data)
			return
		}

		if (firstValue >= 176 && firstValue <= 198) {
			this.updateOtherChanges(data)
			return
		}

		if (data.length >= SysExHeader.length) {
			this.updateSystemChanges(data)
		}
	}

	private updateMuteStateInCache(data: number[]) {
		// Mutes On(Off)	 	=> 9N, CH, 7F(3F), 9N, CH, 00
		// Hex Str	=> ["90","32","7f","32","0"]
		let startIndex = 1
		const midiOffset = data[0] - 0x90 - this.baseMidiChannel

		do {
			let values = data.slice(startIndex)
			const mute = values[1] === 127 ? true : false
			const channel = values[0]

			const channelType = determineChannelType(channel, midiOffset)
			this.setMuteValue(channelType, channel, mute)

			startIndex += 4

			console.log(
				`Mute Details: ${JSON.stringify({
					data,
					baseMidiChannel: this.baseMidiChannel,
					midiOffset,
					channel,
					mute,
					startIndex,
				})}`
			)
		} while (startIndex < data.length)
	}

	public setMuteValue(type: ChannelType, channel: number, mute: boolean) {
		this.log('debug', `Setting channel in cache '${type}:${channel}' => ${mute}`)
		this.cache.mute[type][channel] = mute
		this.checkFeedbacks(`mute_${type}`)
	}

	private updateOtherChanges(data: number[]) {
		// Fader Levels 		=> BN, 63, CH, BN, 62, 17, BN, 06, LV
		// Ch>Main Assign 		=> BN, 63, CH, BN, 62, 18, BN, 06, 7F(3F)
		// DCA Assign On(Off) 	=> BN, 63, CH, BN, 62, 40, BN, 06, DB(DA)
		// Mute Grp Assign 		=> BN, 63, CH, BN, 62, 40, BN, 06, DB(DA)
		// Scene Recall 		=> BN, 00, Bank, CN, SS

		// const midiOffset = firstHex - this.baseMidiChannel;
		this.log('debug', `Other Changes: ${JSON.stringify({ data })}`)
	}

	private updateSystemChanges(data: number[]) {
		const type = data[SysExHeader.length + 1] // SysExHeader + 2

		this.log('debug', `Sys Type: ${type}`)
		if (type === 2) {
			this.loopRunningChanges(data, (values, channel, channelType) => {
				// Ch Name Reply… 	=> SysEx Header, 0N, 02, CH, Name, F7
				const name = getNameByHex(this.avantisConfig.name, values.slice(3))
				this.cache.name[channelType][`${channel}`] = name
				this.log('debug', `${channelType}:${channel} => ${name}`)
			})
		} else if (type === 5) {
			this.loopRunningChanges(data, (values, channel, channelType) => {
				// Ch Colour Reply… 	=> SysEx Header, 0N, 05, CH, Col, F7
				const color = getColorByNumber(this.avantisConfig, values[3])
				this.cache.color[channelType][`${channel}`] = color as string
			})
		} else if (type === 13) {
			// Aux/FX/Mtx Sends 	=> SysEx Header, 0N , 0D, CH, SndN, SndCH, LV, F7
		}
	}

	private loopRunningChanges(
		data: number[],
		action: (values: number[], channel: number, channelType: ChannelType) => void
	) {
		// Ch Name Reply… 	=> SysEx Header, 0N, 02, CH, Name, F7
		let endFlagIndx = data.indexOf(247) // '0xf7'
		let startIndex = 0
		do {
			// Includes all data except for the ending flag
			const values = data.slice(startIndex + SysExHeader.length, endFlagIndx)
			const channel = values[2]

			const midiOffset = values[0] - this.baseMidiChannel
			const channelType = determineChannelType(channel, midiOffset)

			// Add name to cache
			action(values, channel, channelType)

			startIndex = endFlagIndx + 1
			endFlagIndx = data.indexOf(247, endFlagIndx + 1) // '0xf7'
		} while (endFlagIndx != -1)
	}

	public getRemoteStates = async () => {
		this.log('debug', 'Getting Device States on Connected Status')
		// TODO: Check when setting state does it trigger a response message to update cache also

		await this.getRemoteChannelNames()
		await this.getRemoteChannelColors()

		//TODO: find out how to get the active Mute channels
	}

	private async getRemoteChannelNames() {
		// - Name Send		SysEx Header, 0N, 01, CH, F7
		// const nameCommands: Buffer[] = []
		// for (const val of this.choices.inputChannel.values) {
		// 	const command = Buffer.from([...SysExHeader, 0x00, 0x01, val.id, 0xf7])
		// 	nameCommands.push(command)
		// }
		// await this.tcpSocket.sendCommands(nameCommands)

		await this.sendDetailsCommand(0x01, this.choices.inputChannel)
		await this.sendDetailsCommand(0x01, this.choices.monoAux)
		await this.sendDetailsCommand(0x01, this.choices.stereoAux)

		// let command: number[] = []
		// for (const val of this.choices.inputChannel.values) {
		// 	command.push(...[...SysExHeader, 0x00, 0x01, val.id, 0xf7])
		// }
		// await this.tcpSocket.sendCommand(Buffer.from(command))
	}

	private async getRemoteChannelColors() {
		// Color Send		SysEx Header, 0N, 04, CH, F7
		const colorCommands: Buffer[] = []
		for (const val of this.choices.inputChannel.values) {
			const command = Buffer.from([...SysExHeader, 0x00, 0x04, val.id, 0xf7])
			colorCommands.push(command)
		}
		await this.tcpSocket.sendCommands(colorCommands)

		// await this.sendDetailsCommand(0x04, this.choices.inputChannel)
	}

	private async sendDetailsCommand(commandCode: number, choice: Choice) {
		let command: number[] = []
		for (const val of choice.values) {
			command.push(...[...SysExHeader, 0x00 + choice.midiOffset, commandCode, val.id, 0xf7])
		}
		await this.tcpSocket.sendCommand(Buffer.from(command))
	}
}

export = AvantisInstance

runEntrypoint(AvantisInstance, [])
