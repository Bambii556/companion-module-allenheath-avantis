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
import { AvantisConfig, getAvantisConfig, getNameByHex, getNameHexByName } from "./avantisConfig";
import { TCP } from "./tcp";
import { MainCache } from './types';
import { ChannelType, determineChannelType } from './utils';

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
				stereoMatrix: {}
			},
			name: {
			}
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

		this.log('debug', `Loading Config files`);
		this.avantisConfig = getAvantisConfig();

		this.scenes = getSceneSelection(this.avantisConfig)
		this.choices = getChoices(this.avantisConfig);

		this.log('debug', `Loading Config files`);
		this.setActionDefinitions(getActionDefinitions(this, this.choices))
		this.setFeedbackDefinitions(getFeedbackDefinitions(this, this.choices))

		this.log('debug', `Init Done`);
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
		this.log('debug', `Loading Config Updated`);
		this.config = config

		// TODO: Not sure why i have to minus 1 from base midi
		this.baseMidiChannel = this.config.midiBase - 1

		if (!this.config.host) {
			return;
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
			this.tcpSocket = new TCP(this, this.config);
		}

		this.log('debug', `Initializing TCP Socket`);
		this.tcpSocket.init(this.getRemoteStates, this.validateTCPFeedback);
	}

	/**
	 * Sets up a Constant Scenes selection.
	 *
	 * @since 1.0.0
	 */


	private getMidiValue(offset?: number) {
		let midi = this.baseMidiChannel;
		if (offset) {
			midi += offset
		}
		return midi
	}

	public async sendMuteCommand(channel: number, mute: boolean, midiOffset: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

		// 9N, CH, 7F(3F), 9N, CH, 00
		const data = [0x90 + midi, channel, mute ? 0x7f : 0x3f, 0x90 + midi, channel, 0x00];
		this.log('warn', `Sending Mute: ${JSON.stringify({ data, hex: data.map(x => x.toString(16)) })}`)
		const command = Buffer.from(data)

		await this.tcpSocket.sendCommand(command);
	}

	public async sendFaderCommand(channel: number, level: number, midiOffset: number): Promise<void> {
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

	public async sendAssignCommands(channel: number, groups: number[], assign: boolean, isDca: boolean, midiOffset: number): Promise<void> {
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

		const routingCmds: Buffer[] = []

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

	public async sendSceneCommand(sceneId: string, midiOffset?: number): Promise<void> {
		let midi = this.getMidiValue(midiOffset);

		// SceneId is the actual scene Number, To get from array we have to -1 to get index of scene
		const scene = this.scenes[parseInt(sceneId) - 1]

		// TODO: check if SS and Bank gets converted to correct hex value
		// BN, 00, Bank, CN, SS
		const command = Buffer.from([0xb0 + midi, 0x00, scene.bank, 0xc0 + midi, scene.ss]);

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
		let commandArray = [...SysExHeader, 0x00 + midi, 0x03, channel]

		// Add Name from opt.channelName
		commandArray = [
			...commandArray,
			...getNameHexByName(this.avantisConfig, channelName)
		]


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

	public async sendLevelSendCommand(src: { channel: number, midiOffset: number }, dest: { channel: number, midiOffset: number }, level: string): Promise<void> {

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
		]);

		await this.tcpSocket.sendCommand(command);
	}

	public validateTCPFeedback = (data: number[]) => {

		this.log('debug', `TCP Data: ${JSON.stringify(data)}`)
		if (!data || data.length <= 0) {
			return
		}

		let firstValue = data[0];

		// Mute Feedback
		if (firstValue >= 144 && firstValue <= 166) {
			this.updateMuteStateInCach(data);
			return;
		}

		if (firstValue >= 176 && firstValue <= 198) {
			this.updateOtherChanges(data);
			return;
		}

		this.updateSystemChanges(data);
	}

	private updateMuteStateInCach(data: number[]) {
		// TODO: Check what happens if there are multiple mutes enabled at the same time, does it use running status codes

		// Mutes On(Off)	 	=> 9N, CH, 7F(3F), 9N, CH, 00
		// Hex Str	=> ["90","32","7f","32","0"]

		const midiOffset = data[0] - 0x90 - this.baseMidiChannel;
		const mute = data[2] === 127 ? true : false;
		const channel = data[1];

		console.log(`Mute Details: ${JSON.stringify({
			data,
			baseMidiChannel: this.baseMidiChannel,
			midiOffset,
			channel,
			mute
		})}`);

		const channelType = determineChannelType(data[1], midiOffset);

		this.setMuteValue(channelType, channel, mute);
	}

	public setMuteValue(type: ChannelType, channel: number, mute: boolean) {
		this.log('debug', `Setting channel in cache '${type}:${channel}' => ${mute}`)
		this.cache.mute[type][channel] = mute;
		this.checkFeedbacks(`mute_${type}`);
	}

	private updateOtherChanges(data: number[]) {
		// Fader Levels 		=> BN, 63, CH, BN, 62, 17, BN, 06, LV
		// Ch>Main Assign 		=> BN, 63, CH, BN, 62, 18, BN, 06, 7F(3F)
		// DCA Assign On(Off) 	=> BN, 63, CH, BN, 62, 40, BN, 06, DB(DA)
		// Mute Grp Assign 		=> BN, 63, CH, BN, 62, 40, BN, 06, DB(DA)
		// Scene Recall 		=> BN, 00, Bank, CN, SS

		// const midiOffset = firstHex - this.baseMidiChannel;
		console.log(JSON.stringify({ data }))
	}

	private updateSystemChanges(data: number[]) {
		// Aux/FX/Mtx Sends 	=> SysEx Header, 0N , 0D, CH, SndN, SndCH, LV, F7
		// Ch Name Reply… 		=> SysEx Header, 0N, 02, CH, Name, F7
		// Ch Colour Reply… 	=> SysEx Header, 0N, 05, CH, Col, F7

		const values = data.slice(SysExHeader.length, data.length - 1);
		this.log('info', `Sys Data: ${JSON.stringify({
			hex: data.map(x => x.toString(16)),
			result: values.map(x => x.toString(16))
		})}`)

		// TODO: this should get the 0N field
		// const midiOffset = parseInt(values[0], 16) - this.baseMidiChannel;
		const type = values[1];
		const channel = values[2];

		this.log('debug', `Sys Type: ${type}`)
		if (type === 2) {	// Ch Name Reply…
			let endFlagIndx = values.indexOf(247); // '0xf7'
			// Add name to cache
			this.cache.name[`${channel}`] = getNameByHex(this.avantisConfig, values.slice(0, endFlagIndx));
			this.log('info', `Name Cache: ${JSON.stringify(this.cache.name)}`)

		} else if (type === 0x05) {	// Ch Colour Reply… 

		}
	}

	public getRemoteStates = async () => {
		this.log('debug', 'Getting Device States on Connected Status')
		// TODO: Check when setting state does it trigger a response message to update cache also

		// - Name Send		SysEx Header, 0N, 01, CH, F7
		// - Color Send		SysEx Header, 0N, 04, CH, F7
		// const commands: Buffer[] = []
		// for (const input of this.choices.inputChannel.values) {
		// 	const nameBuffer = Buffer.from([...SysExHeader, 0x00 + 0, 0x01, input.id, 0xf7]);
		// 	const colorBuffer = Buffer.from([...SysExHeader, 0x00 + 0, 0x04, input.id, 0xf7]);

		// 	commands.push(nameBuffer);
		// 	commands.push(colorBuffer);
		// }
		// await this.tcpSocket.sendCommands(commands);

		// Test Mute Send for Channel 00 with NOTE OFF flag to check if we can get a response back??
		// SysEx Header, 0N, 01, CH, F7
		const nameCommands: Buffer[] = []
		for (const val of this.choices.inputChannel.values) {
			const command = Buffer.from([...SysExHeader, 0x00, val.id, 0x00, 0xf7]);
			nameCommands.push(command)
		}
		await this.tcpSocket.sendCommands(nameCommands);
		// const command1 = Buffer.from([...SysExHeader, 0x00, 0x01, 0x00, 0xf7]);
		// await this.tcpSocket.sendCommand(command1);
		// this.checkFeedbacks('mute_input');
		// this.checkFeedbacks('mute_input');

		//TODO: find out how to get the active Mute channels
	}
}

export = AvantisInstance

runEntrypoint(AvantisInstance, [])
