import {
	CompanionActionContext,
	CompanionActionDefinition,
	CompanionActionDefinitions,
	CompanionActionEvent,
} from '@companion-module/base'
import AvantisInstance from './index'
import { Choice, Choices } from "./choices";

/**
 * Returns all implemented actions.
 * @param self reference to the BaseInstance
 * @constructor
 * @returns CompanionActions
 */
export function getActionDefinitions(self: AvantisInstance, choices: Choices): CompanionActionDefinitions {

	const actions: CompanionActionDefinitions = {}

	actions['mute_input'] = muteActionBuilder(
		self,
		'Mute Input',
		choices.inputChannel)

	actions['mute_master'] = muteActionBuilder(
		self,
		'Mute Main',
		choices.mainMix)

	actions['mute_mono_group'] = muteActionBuilder(
		self,
		'Mute Mono Group',
		choices.monoGroup)

	actions['mute_stereo_group'] = muteActionBuilder(
		self,
		'Mute Stereo Group',
		choices.stereoGroup)

	actions['mute_mono_aux'] = muteActionBuilder(
		self,
		'Mute Mono Aux',
		choices.monoAux)

	actions['mute_stereo_aux'] = muteActionBuilder(
		self,
		'Mute Stereo Aux',
		choices.stereoAux)

	actions['mute_mono_matrix'] = muteActionBuilder(
		self,
		'Mute Mono Matrix',
		choices.monoMatrix)

	actions['mute_stereo_matrix'] = muteActionBuilder(
		self,
		'Mute Stereo Matrix',
		choices.stereoMatrix)

	// TODO: Can i mute a Mono FX Send
	actions['mute_mono_fx_send'] = muteActionBuilder(
		self,
		'Mute Mono FX Send',
		choices.monoFXSend)

	// TODO: Can i mute a Mono FX Send
	actions['mute_stereo_fx_send'] = muteActionBuilder(
		self,
		'Mute Stereo FX Send',
		choices.stereoFXSend)

	actions['mute_fx_return'] = muteActionBuilder(
		self,
		'Mute FX Return',
		choices.FXReturn)

	actions['mute_group'] = muteActionBuilder(
		self,
		'Mute Group',
		choices.muteGroup)

	actions['mute_dca'] = muteActionBuilder(
		self,
		'Mute DCA',
		choices.dca)

	actions['fader_input'] = faderActionBuilder(
		self,
		'Set Input Fader to Level',
		choices.inputChannel,
		choices.fader)

	actions['fader_mono_group'] = faderActionBuilder(
		self,
		'Set Mono Group Master Fader to Level',
		choices.monoGroup,
		choices.fader)

	actions['fader_stereo_group'] = faderActionBuilder(
		self,
		'Set Stereo Group Master Fader to Level',
		choices.stereoGroup,
		choices.fader)

	actions['fader_mono_aux'] = faderActionBuilder(
		self,
		'Set Mono Aux Master Fader to Level',
		choices.monoAux,
		choices.fader)

	actions['fader_stereo_aux'] = faderActionBuilder(
		self,
		'Set Stereo Aux Master Fader to Level',
		choices.stereoAux,
		choices.fader)

	actions['fader_mono_matrix'] = faderActionBuilder(
		self,
		'Set Mono Matrix Master Fader to Level',
		choices.monoMatrix,
		choices.fader)

	actions['fader_stereo_matrix'] = faderActionBuilder(
		self,
		'Set Stereo Matrix Master Fader to Level',
		choices.stereoMatrix,
		choices.fader)

	actions['fader_mono_fx_send'] = faderActionBuilder(
		self,
		'Set Mono FX Send Master Fader to Level',
		choices.monoFXSend,
		choices.fader)

	actions['fader_stereo_fx_send'] = faderActionBuilder(
		self,
		'Set Stereo FX Send Master Fader to Level',
		choices.stereoFXSend,
		choices.fader)

	actions['fader_master'] = faderActionBuilder(
		self,
		'Set Main Master Fader to Level',
		choices.mainMix,
		choices.fader)

	actions['fader_fx_return'] = faderActionBuilder(
		self,
		'Set FX Return Fader to Level',
		choices.FXReturn,
		choices.fader)

	actions['fader_DCA'] = faderActionBuilder(
		self,
		'Set DCA Fader to Level',
		choices.dca,
		choices.fader)

	actions['dca_assign'] = assignActionBuilder(
		'Assign DCA Groups for channel',
		choices.inputChannel,
		'dcaGroups',
		choices.dca,
		async (action: CompanionActionEvent) => {
			const { channel, dcaGroups, assign } = action.options as { channel: number, dcaGroups: number[], assign: boolean };
			await self.sendAssignCommands(channel, dcaGroups, assign, true, choices.dca.midiOffset);
		})

	actions['mute_group_assign'] = assignActionBuilder(
		'Assign Mute Groups for channel',
		choices.inputChannel,
		'muteGroups',
		choices.muteGroup,
		async (action: CompanionActionEvent) => {
			const { channel, muteGroups, assign } = action.options as { channel: number, muteGroups: number[], assign: boolean };
			await self.sendAssignCommands(channel, muteGroups, assign, false, choices.muteGroup.midiOffset);
		})

	actions['channel_main_assign'] = assignActionBuilder(
		'Assign Channel to Main Mix',
		choices.inputChannel,
		'mainMix',
		choices.mainMix,
		async (action: CompanionActionEvent) => {
			const { channel, assign } = action.options as { channel: number, assign: boolean };
			await self.sendChannelAssignCommand(channel, assign, choices.mainMix.midiOffset);
		})

	// TODO: Check if names can be set to other channels also
	actions['channel_name'] = {
		name: 'Set Channel Name',
		options: [
			{
				type: 'dropdown',
				label: choices.inputChannel.name,
				id: 'channel',
				choices: choices.inputChannel.values,
				default: choices.inputChannel.values[0].id,
				minChoicesForSearch: 0,
			},
			{
				type: 'textinput',
				label: 'Name of the Channel',
				id: 'channelName',
				tooltip: 'In this option you can enter whatever you want as long as it is the number one',
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { channel, channelName } = action.options as { channel: number, channelName: string };
			await self.sendChannelNameCommand(channel, channelName, choices.inputChannel.midiOffset);
		}
	}

	actions['channel_color'] = {
		name: 'Set Channel Color',
		options: [
			{
				type: 'dropdown',
				label: choices.inputChannel.name,
				id: 'channel',
				choices: choices.inputChannel.values,
				default: choices.inputChannel.values[0].id,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: choices.color.name,
				id: 'color',
				choices: choices.color.values,
				default: choices.color.values[0].id,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { channel, color } = action.options as { channel: number, color: string };
			await self.sendChannelColorCommand(channel, color, choices.inputChannel.midiOffset);
		}
	}

	actions['scene_recall'] = {
		name: 'Scene recall',
		options: [
			{
				type: 'dropdown',
				label: choices.scenes.name,
				id: 'sceneId',
				choices: choices.scenes.values,
				default: choices.scenes.values[0].id,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { sceneId } = action.options as { sceneId: string };
			await self.sendSceneCommand(sceneId, choices.scenes.midiOffset);
		}
	}

	actions['send_input_to_mono_aux'] = sendLevelActionBuilder(
		self,
		'Send Input to Mono Aux',
		choices.inputChannel,
		choices.monoAux,
		choices.fader)

	actions['send_input_to_stereo_aux'] = sendLevelActionBuilder(
		self,
		'Send Input to Stereo Aux',
		choices.inputChannel,
		choices.stereoAux,
		choices.fader)

	actions['send_input_to_fx_return'] = sendLevelActionBuilder(
		self,
		'Send Input to FX Return',
		choices.inputChannel,
		choices.FXReturn,
		choices.fader)

	actions['send_input_to_mono_fx_return'] = sendLevelActionBuilder(
		self,
		'Send Input to Mono FX Return',
		choices.inputChannel,
		choices.monoFXSend,
		choices.fader)

	actions['send_input_to_stereo_fx_return'] = sendLevelActionBuilder(
		self,
		'Send Input to Stereo FX Return',
		choices.inputChannel,
		choices.stereoFXSend,
		choices.fader)

	actions['send_input_to_mono_matrix'] = sendLevelActionBuilder(
		self,
		'Send Input to Mono Matrix',
		choices.inputChannel,
		choices.monoMatrix,
		choices.fader)

	actions['send_input_to_stereo_matrix'] = sendLevelActionBuilder(
		self,
		'Send Input to Stereo Matrix',
		choices.inputChannel,
		choices.stereoMatrix,
		choices.fader)

	actions['send_input_to'] = sendLevelActionBuilder(
		self,
		'Send Input to Main',
		choices.inputChannel,
		choices.mainMix,
		choices.fader)

	return actions
}

function muteActionBuilder(
	self: AvantisInstance,
	name: string,
	choice: Choice
): CompanionActionDefinition {
	return {
		name: name,
		options: [
			{
				type: 'dropdown',
				label: choice.name,
				id: 'channel',
				choices: choice.values,
				default: choice.values[0].id,
				minChoicesForSearch: 0,
			},
			{
				type: 'checkbox',
				label: 'Mute',
				id: 'mute',
				default: true,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { channel, mute } = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(channel, mute, choice.midiOffset);
			self.cache.mute.input[`${channel}}`] = mute;
		},
	}
}

function faderActionBuilder(
	self: AvantisInstance,
	name: string,
	choice: Choice,
	fdrChoice: Choice
): CompanionActionDefinition {
	return {
		name: name,
		options: [
			{
				type: 'dropdown',
				label: choice.name,
				id: 'channel',
				choices: choice.values,
				default: choice.values[0].id,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: fdrChoice.name,
				id: 'level',
				choices: fdrChoice.values,
				default: fdrChoice.values[0].id,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { channel, level } = action.options as { channel: number, level: number };
			await self.sendFaderCommand(channel, level, choice.midiOffset);
		},
	}
}

function sendLevelActionBuilder(
	self: AvantisInstance,
	name: string,
	srcChoice: Choice,
	destChoice: Choice,
	fdrChoice: Choice
): CompanionActionDefinition {
	return {
		name: name,
		options: [
			{
				type: 'multidropdown',
				label: srcChoice.name,
				id: 'srcChannel',
				default: [],
				choices: srcChoice.values,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: destChoice.name,
				id: 'destChannel',
				choices: destChoice.values,
				default: destChoice.values[0].id,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: fdrChoice.name,
				id: 'level',
				choices: fdrChoice.values,
				default: fdrChoice.values[0].id,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { srcChannel, destChannel, level } = action.options as { srcChannel: number, destChannel: number, level: string };
			const src = {
				channel: srcChannel,
				midiOffset: srcChoice.midiOffset
			}
			const dest = {
				channel: destChannel,
				midiOffset: destChoice.midiOffset
			}
			await self.sendLevelSendCommand(src, dest, level);
		},
	}
}

function assignActionBuilder(
	name: string,
	srcChoice: Choice,
	destId: string,
	destChoice: Choice,
	callback: (action: CompanionActionEvent, context: CompanionActionContext) => Promise<void> | void
): CompanionActionDefinition {
	return {
		name: name,
		options: [
			{
				type: 'dropdown',
				label: srcChoice.name,
				id: 'channel',
				choices: srcChoice.values,
				default: srcChoice.values[0].id,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: destChoice.name,
				id: destId,
				default: [],
				choices: destChoice.values,
			},
			{
				type: 'checkbox',
				label: 'Assign',
				id: 'assign',
				default: true,
			},
		],
		callback: callback,
	}
}