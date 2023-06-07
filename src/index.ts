import {
	InstanceBase,
	runEntrypoint,
	SomeCompanionConfigField
} from '@companion-module/base'
import { getActionDefinitions } from "./actions";
import { getFeedbackDefinitions } from "./feedback";
import { Config, getConfigDefinitions } from './config'
import { Choices, getChoices } from "./choices";
import { getSceneSelection, Scene } from "./scenes";
import { TCP } from "./tcp";
import fs from 'fs'

const SysExHeader = [0xf0, 0x00, 0x00, 0x1a, 0x50, 0x10, 0x01, 0x00]


/**
 * @extends instance_skel
 * @since 1.0.0
 * @author Shaun Brown
 */

class AvantisInstance extends InstanceBase<Config> {
	config!: Config
	tcpSocket!: TCP
	midiOffset!: number
	avantisData!: any
	faderData!: any
	scenes!: Scene[]
	choices!: Choices

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

		this.avantisData = JSON.parse(fs.readFileSync('avantisconfig.json', 'utf-8'))
		this.faderData = JSON.parse(fs.readFileSync('fader.json', 'utf-8'))

		this.scenes = getSceneSelection(this.avantisData)
		this.choices = getChoices(this.avantisData, this.faderData);

		this.setActionDefinitions(getActionDefinitions(this, this.choices))
		this.setFeedbackDefinitions(getFeedbackDefinitions(this, this.choices))
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
		return getConfigDefinitions();
	}

	async configUpdated(config: Config): Promise<void> {
		this.config = config

		this.midiOffset = this.config.midiBase - 1

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
			this.tcpSocket = new TCP(this);
		}

		this.tcpSocket.init();
	}

	/**
	 * Sets up a Constant Scenes selection.
	 *
	 * @since 1.0.0
	 */


	private getMidiValue(offset?: number) {
		let midi = this.midiOffset;
		if (offset) {
			midi += offset
		}
		return midi
	}

	public async sendMuteCommand(channel: number, mute: boolean, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

		// 9N, CH, 7F(3F), 9N, CH, 00
		const command = Buffer.from([0x90 + midi, channel, mute ? 0x7f : 0x3f, 0x90 + midi, channel, 0x00])

		await this.tcpSocket.sendCommand(command);
	}

	public async sendFaderCommand(channel: number, level: number, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

		// BN, 63, CH, BN, 62, 17, BN, 06, LV
		const command = Buffer.from([
			0xb0 + midi,
			0x63,
			channel,
			0xb0 + midi,
			0x62,
			0x17,
			0xb0 + midi,
			0x06,
			level,
		]);

		await this.tcpSocket.sendCommand(command);
	}

	public async sendAssignCommands(channel: number, groups: number[], assign: boolean, isDca: boolean, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);
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

		const routingCmds = []

		for (const group of groups) {
			// BN, 63, CH, BN, 62, 40, BN, 06, DB(DA)
			routingCmds.push(
				Buffer.from([
					0xb0 + midi,
					0x63,
					channel,
					0xb0 + midi,
					0x62,
					0x40,
					0xb0 + midi,
					0x06,
					group + offset,
				])
			)
		}

		await this.tcpSocket.sendCommands(routingCmds);
	}

	public async sendSceneCommand(block: number, sceneNumber: string, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

		const scene = this.scenes[parseInt(sceneNumber)]

		// BN, 00, Bank, CN, SS
		const command = Buffer.from([0xb0 + midi, 0x00, block, 0xc0 + midi, scene.ss]);

		await this.tcpSocket.sendCommand(command);
	}

	public async sendChannelAssignCommand(channel: number, assign: boolean, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

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
		]);

		await this.tcpSocket.sendCommand(command);
	}

	public async sendChannelNameCommand(channel: number, channelName: string, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

		// SysEx Header, 0N, 03, CH, Name, F7
		const commandArray = [...SysExHeader, 0x00 + midi, 0x03, channel]

		// Add Name from opt.channelName
		for (let i = 0; i < channelName.length; i++) {
			const char = channelName[i]
			const value = this.avantisData.name[char]
			if (value) {
				commandArray.push(parseInt(value, 16))
			}
		}

		commandArray.push(0xf7)
		const command = Buffer.from(commandArray)

		await this.tcpSocket.sendCommand(command);
	}

	public async sendChannelColorCommand(channel: number, color: string, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

		// SysEx Header, 0N, 06, CH, Col, F7
		const command = Buffer.from([...SysExHeader, 0x00 + midi, 0x06, channel, parseInt(color), 0xf7]);

		await this.tcpSocket.sendCommand(command);
	}

	public async sendLevelSendCommand(srcChannel: string, destChannel: number, level: string, srcMidiChnl: number, destMidiChnl: number, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

		// SysEx Header, 0N, 0D, CH, SndN, SndCH, LV, F7
		const command = Buffer.from([
			...SysExHeader,
			0x00 + midi + srcMidiChnl,
			0x0d,
			parseInt(srcChannel),
			midi + destMidiChnl,
			destChannel,
			parseInt(level),
			0xf7,
		]);

		await this.tcpSocket.sendCommand(command);
	}

	public validateTCPFeedback(data: Buffer) {
		if (!data) {
			return
		}

		const val = JSON.parse(JSON.stringify(data))['data']

		if (!val) {
			return
		}

		console.log(`Response DATA:  ${JSON.stringify(val, null, 2)}`)
		// TODO: Validate response data from TCP Connection
	}
}

export = AvantisInstance

runEntrypoint(AvantisInstance, [])
