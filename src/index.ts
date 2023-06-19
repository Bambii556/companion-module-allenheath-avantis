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
import { AvantisConfig, getAvantisConfig, getNameByHex, getNameHexByName, NameChars } from "./avantisConfig";
import { TCP } from "./tcp";
import { Cache } from './types';

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
	cache!: Cache

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

		this.log('debug', `Loading Config files`);
		this.avantisConfig = getAvantisConfig();

		this.scenes = getSceneSelection(this.avantisConfig)
		this.choices = getChoices(this.avantisConfig);

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
		this.log('debug', `Loading Config Updated`);
		this.config = config

		// TODO: Not sure why i have to minus 1 from base midi
		this.baseMidiChannel = this.config.midiBase - 1

		if (!this.config.host) {
			return;
		}

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
		this.tcpSocket.init(this.getRemoteStates);
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
		const command = Buffer.from([0x90 + midi, channel, mute ? 0x7f : 0x3f, 0x90 + midi, channel, 0x00])

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

	public validateTCPFeedback(result: { data: number[], hex: string[] }) {
		if (!result || !result.data || result.data.length <= 0) {
			return
		}

		// Mute Feedback
		let firstHex = parseInt(result.hex[0], 16);

		if (firstHex >= 0x90 && firstHex <= 0xa6) {
			this.updateMuteStateInCach(result.hex);
			return;
		}

		if (firstHex >= 0xb0 && firstHex <= 0xc6) {
			this.updateOtherChanges(result.hex, firstHex);
			return;
		}

		this.updateSystemChanges(result.hex);
	}

	private updateMuteStateInCach(hex: string[]) {
		// TODO: Check if feedback is returned when we set a channel to mute, else remove set cache from action callback
		// TODO: Check what happens if there are multiple mutes enabled at the same time, does it use running status codes

		// Mutes On(Off)	 	=> 9N, CH, 7F(3F), 9N, CH, 00
		// Hex Str	=> ["90","32","7f","32","0"]

		const midiOffset = parseInt(hex[0], 16) - 0x90 - this.baseMidiChannel;
		const mute = hex[2] === '7f' ? true : false;
		const channel = hex[1];

		console.log(`Mute Details: ${JSON.stringify({
			hex,
			baseMidiChannel: this.baseMidiChannel,
			midiOffset,
			channel
		})}`)

		const channelType = this.determineChannelType(midiOffset, parseInt(hex[1], 16));

		switch (channelType) {
			case 'input':
				this.cache.mute.input[channel] = mute;
				this.checkFeedbacks('mute_input');
				break;

			case 'monoGroup':
				this.cache.mute.monoGroup[channel] = mute;
				this.checkFeedbacks('mute_monoGroup');
				break;

			case 'stereoGroup':
				this.cache.mute.stereoGroup[channel] = mute;
				this.checkFeedbacks('mute_stereoGroup');
				break;

			case 'monoAux':
				this.cache.mute.monoAux[channel] = mute;
				this.checkFeedbacks('mute_monoAux');
				break;

			case 'stereoAux':
				this.cache.mute.stereoAux[channel] = mute;
				this.checkFeedbacks('mute_stereoAux');
				break;

			case 'monoMatrix':
				this.cache.mute.monoMatrix[channel] = mute;
				this.checkFeedbacks('mute_monoMatrix');
				break;

			case 'stereoMatrix':
				this.cache.mute.stereoMatrix[channel] = mute;
				this.checkFeedbacks('mute_stereoMatrix');
				break;

			case 'monoFXSend':
				this.cache.mute.monoFXSend[channel] = mute;
				this.checkFeedbacks('mute_monoFXSend');
				break;

			case 'stereoFXSend':
				this.cache.mute.stereoFXSend[channel] = mute;
				this.checkFeedbacks('mute_stereoFXSend');
				break;

			case 'FXReturn':
				this.cache.mute.FXReturn[channel] = mute;
				this.checkFeedbacks('mute_FXReturn');
				break;

			case 'main':
				this.cache.mute.main[channel] = mute;
				this.checkFeedbacks('mute_main');
				break;

			case 'dca':
				this.cache.mute.dca[channel] = mute;
				this.checkFeedbacks('mute_dca');
				break;

			case 'group':
				this.cache.mute.group[channel] = mute;
				this.checkFeedbacks('mute_group');
				break;
		}
	}

	private updateOtherChanges(hex: string[], firstHex: number) {
		// Fader Levels 		=> BN, 63, CH, BN, 62, 17, BN, 06, LV
		// Ch>Main Assign 		=> BN, 63, CH, BN, 62, 18, BN, 06, 7F(3F)
		// DCA Assign On(Off) 	=> BN, 63, CH, BN, 62, 40, BN, 06, DB(DA)
		// Mute Grp Assign 		=> BN, 63, CH, BN, 62, 40, BN, 06, DB(DA)
		// Scene Recall 		=> BN, 00, Bank, CN, SS

		const midiOffset = firstHex - this.baseMidiChannel;
	}

	private updateSystemChanges(hex: string[]) {
		// Aux/FX/Mtx Sends 	=> SysEx Header, 0N , 0D, CH, SndN, SndCH, LV, F7
		// Ch Name Reply… 		=> SysEx Header, 0N, 02, CH, Name, F7
		// Ch Colour Reply… 	=> SysEx Header, 0N, 05, CH, Col, F7

		const values = hex.slice(SysExHeader.length - 1, hex.length - 1);

		// TODO: this should get the 0N field
		const midiOffset = parseInt(values[0], 16) - this.baseMidiChannel;
		const type = parseInt(values[1], 16);
		const channel = parseInt(values[2], 16);


		if (type === 0x02) {	// Ch Name Reply…
			let endFlagIndx = values.indexOf('0xf7');
			// Add name to cache
			this.cache.name[`${channel}`] = getNameByHex(this.avantisConfig, values.slice(0, endFlagIndx));

		} else if (type === 0x05) {	// Ch Colour Reply… 

		}
	}

	private determineChannelType(midiOffset: number, channelHex: number): string {
		switch (midiOffset) {
			case 0:
				return 'input';
			case 1:
				if (channelHex <= 0x27) {
					return 'monoGroup';
				}
				return 'stereoGroup';
			case 2:
				if (channelHex <= 0x27) {
					return 'monoAux';
				}
				return 'stereoAux';
			case 3:
				if (channelHex <= 0x27) {
					return 'monoMatrix';
				}
				return 'stereoMatrix';
			case 4:
				if (channelHex <= 0x0B) {
					return 'monoFXSend';
				} else if (channelHex <= 0x1b) {
					return 'stereoFXSend';
				} else if (channelHex <= 0x2b) {
					return 'FXReturn';
				} else if (channelHex <= 0x32) {
					return 'main';
				} else if (channelHex <= 0x45) {
					return 'dca';
				}
				return 'group';
		}

		return '';
	}

	public async getRemoteStates() {
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
		const command = Buffer.from([0x90, 0x00, 0x00, 0x90, 0x00, 0x00])
		await this.tcpSocket.sendCommand(Buffer.from(command));

		//TODO: find out how to get the active Mute channels
	}
}

export = AvantisInstance

runEntrypoint(AvantisInstance, [])
