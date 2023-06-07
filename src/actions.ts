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
		'Mute Input',
		choices.inputChannel,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute);
		})

	actions['mute_master'] = muteActionBuilder(
		'Mute Main',
		choices.mainMix,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 4);
		})

	actions['mute_mono_group'] = muteActionBuilder(
		'Mute Mono Group',
		choices.monoGroup,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 1);
		})

	actions['mute_stereo_group'] = muteActionBuilder(
		'Mute Stereo Group',
		choices.stereoGroup,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 1);
		})

	actions['mute_mono_aux'] = muteActionBuilder(
		'Mute Mono Aux',
		choices.monoAux,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 2);
		})

	actions['mute_stereo_aux'] = muteActionBuilder(
		'Mute Stereo Aux',
		choices.stereoAux,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 2);
		})

	actions['mute_mono_matrix'] = muteActionBuilder(
		'Mute Mono Matrix',
		choices.monoMatrix,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 3);
		})

	actions['mute_stereo_matrix'] = muteActionBuilder(
		'Mute Stereo Matrix',
		choices.stereoMatrix,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 3);
		})

	actions['mute_mono_fx_send'] = muteActionBuilder(
		'Mute Mono FX Send',
		choices.monoFXSend,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 4);
		})

	actions['mute_stereo_fx_send'] = muteActionBuilder(
		'Mute Stereo FX Send',
		choices.stereoFXSend,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 4);
		})

	actions['mute_fx_return'] = muteActionBuilder(
		'Mute FX Return',
		choices.FXReturn,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 4);
		})

	actions['mute_group'] = muteActionBuilder(
		'Mute Group',
		choices.muteGroup,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 4);
		})

	actions['mute_dca'] = muteActionBuilder(
		'Mute DCA',
		choices.dca,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, mute: boolean };
			await self.sendMuteCommand(opt.channel, opt.mute, 4);
		})

	actions['fader_input'] = faderActionBuilder(
		'Set Input Fader to Level',
		choices.inputChannel,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level);
		})

	actions['fader_mono_group'] = faderActionBuilder(
		'Set Mono Group Master Fader to Level',
		choices.monoGroup,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 1);
		})

	actions['fader_stereo_group'] = faderActionBuilder(
		'Set Stereo Group Master Fader to Level',
		choices.stereoGroup,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 1);
		})

	actions['fader_mono_aux'] = faderActionBuilder(
		'Set Mono Aux Master Fader to Level',
		choices.monoAux,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 2);
		})

	actions['fader_stereo_aux'] = faderActionBuilder(
		'Set Stereo Aux Master Fader to Level',
		choices.stereoAux,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 2);
		})

	actions['fader_mono_matrix'] = faderActionBuilder(
		'Set Mono Matrix Master Fader to Level',
		choices.monoMatrix,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 3);
		})

	actions['fader_stereo_matrix'] = faderActionBuilder(
		'Set Stereo Matrix Master Fader to Level',
		choices.stereoMatrix,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 3);
		})

	actions['fader_mono_fx_send'] = faderActionBuilder(
		'Set Mono FX Send Master Fader to Level',
		choices.monoFXSend,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 4);
		})

	actions['fader_stereo_fx_send'] = faderActionBuilder(
		'Set Stereo FX Send Master Fader to Level',
		choices.stereoFXSend,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 4);
		})

	actions['fader_master'] = faderActionBuilder(
		'Set Main Master Fader to Level',
		choices.mainMix,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 4);
		})

	actions['fader_fx_return'] = faderActionBuilder(
		'Set FX Return Fader to Level',
		choices.FXReturn,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 4);
		})

	actions['fader_DCA'] = faderActionBuilder(
		'Set DCA Fader to Level',
		choices.dca,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, level: number };
			await self.sendFaderCommand(opt.channel, opt.level, 4);
		})

	actions['dca_assign'] = assignActionBuilder(
		'Assign DCA Groups for channel',
		choices.inputChannel,
		'dcaGroups',
		choices.dca,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, dcaGroups: number[], assign: boolean };
			await self.sendAssignCommands(opt.channel, opt.dcaGroups, opt.assign, true, 4);
		})

	actions['mute_group_assign'] = assignActionBuilder(
		'Assign Mute Groups for channel',
		choices.inputChannel,
		'muteGroups',
		choices.muteGroup,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, muteGroups: number[], assign: boolean };
			await self.sendAssignCommands(opt.channel, opt.muteGroups, opt.assign, false, 4);
		})

	actions['channel_main_assign'] = assignActionBuilder(
		'Assign Channel to Main Mix',
		choices.inputChannel,
		'mainMix',
		choices.mainMix,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, assign: boolean };
			await self.sendChannelAssignCommand(opt.channel, opt.assign);
		})

	actions['channel_name'] = {
		name: 'Set Channel Name',
		options: [
			{
				type: 'dropdown',
				label: choices.inputChannel.name,
				id: 'channel',
				default: 1 + choices.inputChannel.offset,
				choices: choices.inputChannel.values,
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
			const opt = action.options as { channel: number, channelName: string };
			await self.sendChannelNameCommand(opt.channel, opt.channelName);
		}
	}

	actions['channel_color'] = {
		name: 'Set Channel Color',
		options: [
			{
				type: 'dropdown',
				label: choices.inputChannel.name,
				id: 'channel',
				default: 1 + choices.inputChannel.offset,
				choices: choices.inputChannel.values,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: choices.color.name,
				id: 'color',
				default: 1 + choices.color.offset,
				choices: choices.color.values,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const opt = action.options as { channel: number, color: string };
			await self.sendChannelColorCommand(opt.channel, opt.color);
		}
	}

	actions['scene_recall'] = {
		name: 'Scene recall',
		options: [
			{
				type: 'dropdown',
				label: choices.scenes.name,
				id: 'sceneNumber',
				default: 1 + choices.scenes.offset,
				choices: choices.scenes.values,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const opt = action.options as { block: number, sceneNumber: string };
			await self.sendSceneCommand(opt.block, opt.sceneNumber);
		}
	}

	actions['send_input_to_mono_aux'] = sendLevelActionBuilder(
		'Send Input to Mono Aux',
		choices.inputChannel,
		choices.monoAux,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { srcChannel: string, destChannel: number, level: string };
			await self.sendLevelSendCommand(opt.srcChannel, opt.destChannel, opt.level, 0, 2);
		})

	actions['send_input_to_stereo_aux'] = sendLevelActionBuilder(
		'Send Input to Stereo Aux',
		choices.inputChannel,
		choices.stereoAux,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { srcChannel: string, destChannel: number, level: string };
			await self.sendLevelSendCommand(opt.srcChannel, opt.destChannel, opt.level, 0, 2);
		})

	actions['send_input_to_fx_return'] = sendLevelActionBuilder(
		'Send Input to FX Return',
		choices.inputChannel,
		choices.FXReturn,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { srcChannel: string, destChannel: number, level: string };
			await self.sendLevelSendCommand(opt.srcChannel, opt.destChannel, opt.level, 0, 4);
		})

	actions['send_input_to_mono_fx_return'] = sendLevelActionBuilder(
		'Send Input to Mono FX Return',
		choices.inputChannel,
		choices.monoFXSend,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { srcChannel: string, destChannel: number, level: string };
			await self.sendLevelSendCommand(opt.srcChannel, opt.destChannel, opt.level, 0, 4);
		})

	actions['send_input_to_stereo_fx_return'] = sendLevelActionBuilder(
		'Send Input to Stereo FX Return',
		choices.inputChannel,
		choices.stereoFXSend,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { srcChannel: string, destChannel: number, level: string };
			await self.sendLevelSendCommand(opt.srcChannel, opt.destChannel, opt.level, 0, 4);
		})

	actions['send_input_to_mono_matrix'] = sendLevelActionBuilder(
		'Send Input to Mono Matrix',
		choices.inputChannel,
		choices.monoMatrix,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { srcChannel: string, destChannel: number, level: string };
			await self.sendLevelSendCommand(opt.srcChannel, opt.destChannel, opt.level, 0, 3);
		})

	actions['send_input_to_stereo_matrix'] = sendLevelActionBuilder(
		'Send Input to Stereo Matrix',
		choices.inputChannel,
		choices.stereoMatrix,
		choices.fader,
		async (action: CompanionActionEvent) => {
			const opt = action.options as { srcChannel: string, destChannel: number, level: string };
			await self.sendLevelSendCommand(opt.srcChannel, opt.destChannel, opt.level, 0, 4);
		})

	actions['send_input_to'] = {
		name: 'Send Input to',
		options: [
			{
				type: 'dropdown',
				label: choices.inputChannel.name,
				id: 'srcChannel',
				default: 1 + choices.inputChannel.offset,
				choices: choices.inputChannel.values,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: choices.mainMix.name,
				id: 'destChannel',
				default: 1 + choices.mainMix.offset,
				choices: choices.mainMix.values,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: choices.fader.name,
				id: 'level',
				default: 1 + choices.fader.offset,
				choices: choices.fader.values,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const opt = action.options as { srcChannel: string, destChannel: number, level: string };
			await self.sendLevelSendCommand(opt.srcChannel, opt.destChannel, opt.level, 0, 4);
		}
	}

	return actions
}

function muteActionBuilder(
	name: string,
	choice: Choice,
	callback: (action: CompanionActionEvent, context: CompanionActionContext) => Promise<void> | void
): CompanionActionDefinition {
	return {
		name: name,
		options: [
			{
				type: 'dropdown',
				label: choice.name,
				id: 'channel',
				default: 1 + choice.offset,
				choices: choice.values,
				minChoicesForSearch: 0,
			},
			{
				type: 'checkbox',
				label: 'Mute',
				id: 'mute',
				default: true,
			},
		],
		callback: callback,
	}
}

function faderActionBuilder(
	name: string,
	choice: Choice,
	fdrChoice: Choice,
	callback: (action: CompanionActionEvent, context: CompanionActionContext) => Promise<void> | void
): CompanionActionDefinition {
	return {
		name: name,
		options: [
			{
				type: 'dropdown',
				label: choice.name,
				id: 'channel',
				default: 1 + choice.offset,
				choices: choice.values,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: fdrChoice.name,
				id: 'level',
				default: 1 + fdrChoice.offset,
				choices: fdrChoice.values,
				minChoicesForSearch: 0,
			},
		],
		callback: callback,
	}
}

function sendLevelActionBuilder(
	name: string,
	srcChoice: Choice,
	destChoice: Choice,
	fdrChoice: Choice,
	callback: (action: CompanionActionEvent, context: CompanionActionContext) => Promise<void> | void
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
				default: 1 + destChoice.offset,
				choices: destChoice.values,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: fdrChoice.name,
				id: 'level',
				default: 1 + fdrChoice.offset,
				choices: fdrChoice.values,
				minChoicesForSearch: 0,
			},
		],
		callback: callback,
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
				default: 1 + srcChoice.offset,
				choices: srcChoice.values,
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
