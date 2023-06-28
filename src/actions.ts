import {
	CompanionActionContext,
	CompanionActionDefinition,
	CompanionActionDefinitions,
	CompanionActionEvent,
} from '@companion-module/base'
import AvantisInstance from './index'
import { Choice } from './choices'
import { CHANNEL_TYPE, ChannelType } from './types'

/**
 * Returns all implemented actions.
 * @param self reference to the BaseInstance
 * @constructor
 * @returns CompanionActions
 */
export function getActionDefinitions(self: AvantisInstance): CompanionActionDefinitions {
	const actions: CompanionActionDefinitions = {}
	const { choices } = self

	// Mute Actions
	actions['mute_input'] = muteActionBuilder(self, 'Mute Input', CHANNEL_TYPE.Input)
	actions['mute_main'] = muteActionBuilder(self, 'Mute Main', CHANNEL_TYPE.Main)
	actions['mute_mono_group'] = muteActionBuilder(self, 'Mute Mono Group', CHANNEL_TYPE.MonoGroup)
	actions['mute_stereo_group'] = muteActionBuilder(self, 'Mute Stereo Group', CHANNEL_TYPE.StereoGroup)
	actions['mute_mono_aux'] = muteActionBuilder(self, 'Mute Mono Aux', CHANNEL_TYPE.MonoAux)
	actions['mute_stereo_aux'] = muteActionBuilder(self, 'Mute Stereo Aux', CHANNEL_TYPE.StereoAux)
	actions['mute_mono_matrix'] = muteActionBuilder(self, 'Mute Mono Matrix', CHANNEL_TYPE.MonoMatrix)
	actions['mute_stereo_matrix'] = muteActionBuilder(self, 'Mute Stereo Matrix', CHANNEL_TYPE.StereoMatrix)
	actions['mute_mono_fx_send'] = muteActionBuilder(self, 'Mute Mono FX Send', CHANNEL_TYPE.MonoFXSend)
	actions['mute_stereo_fx_send'] = muteActionBuilder(self, 'Mute Stereo FX Send', CHANNEL_TYPE.StereoFXSend)
	actions['mute_fx_return'] = muteActionBuilder(self, 'Mute FX Return', CHANNEL_TYPE.FXReturn)
	actions['mute_group'] = muteActionBuilder(self, 'Mute Group', CHANNEL_TYPE.MuteGroup)
	actions['mute_dca'] = muteActionBuilder(self, 'Mute DCA', CHANNEL_TYPE.DCA)

	// Fader Actions
	actions['fader_input'] = faderActionBuilder(self, 'Set Input Fader', CHANNEL_TYPE.Input)
	actions['fader_mono_group'] = faderActionBuilder(self, 'Set Mono Group Fader', CHANNEL_TYPE.MonoGroup)
	actions['fader_stereo_group'] = faderActionBuilder(self, 'Set Stereo Group Fader', CHANNEL_TYPE.StereoGroup)
	actions['fader_mono_aux'] = faderActionBuilder(self, 'Set Mono Aux Fader', CHANNEL_TYPE.MonoAux)
	actions['fader_stereo_aux'] = faderActionBuilder(self, 'Set Stereo Aux Fader', CHANNEL_TYPE.StereoAux)
	actions['fader_mono_matrix'] = faderActionBuilder(self, 'Set Mono Matrix Fader', CHANNEL_TYPE.MonoMatrix)
	actions['fader_stereo_matrix'] = faderActionBuilder(self, 'Set Stereo Matrix Fader', CHANNEL_TYPE.StereoMatrix)
	actions['fader_mono_fx_send'] = faderActionBuilder(self, 'Set Mono FX Send Fader', CHANNEL_TYPE.MonoFXSend)
	actions['fader_stereo_fx_send'] = faderActionBuilder(self, 'Set Stereo FXSend Fader', CHANNEL_TYPE.StereoFXSend)
	actions['fader_main'] = faderActionBuilder(self, 'Set Main Fader', CHANNEL_TYPE.Main)
	actions['fader_fx_return'] = faderActionBuilder(self, 'Set FX Fader', CHANNEL_TYPE.FXReturn)
	actions['fader_dca'] = faderActionBuilder(self, 'Set DCA Fader', CHANNEL_TYPE.DCA)

	// Assign Actions
	actions['dca_assign'] = assignActionBuilder(
		'Assign DCA Groups for channel',
		choices.input,
		'dcaGroups',
		choices.dca,
		async (action: CompanionActionEvent) => {
			const { channel, dcaGroups, assign } = action.options as { channel: number; dcaGroups: number[]; assign: boolean }
			await self.sendAssignCommands(channel, dcaGroups, assign, true, choices.dca.midiOffset)
		}
	)
	actions['mute_group_assign'] = assignActionBuilder(
		'Assign Mute Groups for channel',
		choices.input,
		'muteGroups',
		choices.muteGroup,
		async (action: CompanionActionEvent) => {
			const { channel, muteGroups, assign } = action.options as {
				channel: number
				muteGroups: number[]
				assign: boolean
			}
			await self.sendAssignCommands(channel, muteGroups, assign, false, choices.muteGroup.midiOffset)
		}
	)
	actions['channel_main_assign'] = assignActionBuilder(
		'Assign Channel to Main Mix',
		choices.input,
		'mainMix',
		choices.main,
		async (action: CompanionActionEvent) => {
			const { channel, assign } = action.options as { channel: number; assign: boolean }
			await self.sendChannelAssignCommand(channel, assign, choices.main.midiOffset)
		}
	)

	// Name Actions
	actions['name_input'] = nameActionBuilder(self, 'Set Input Name', CHANNEL_TYPE.Input)
	actions['name_mono_group'] = nameActionBuilder(self, 'Set Mono Group Name', CHANNEL_TYPE.MonoGroup)
	actions['name_stereo_group'] = nameActionBuilder(self, 'Set Stereo Group Name', CHANNEL_TYPE.StereoGroup)
	actions['name_mono_aux'] = nameActionBuilder(self, 'Set Mono Aux Name', CHANNEL_TYPE.MonoAux)
	actions['name_stereo_aux'] = nameActionBuilder(self, 'Set Stereo Aux Name', CHANNEL_TYPE.StereoAux)
	actions['name_mono_matrix'] = nameActionBuilder(self, 'Set Mono Matrix Name', CHANNEL_TYPE.MonoMatrix)
	actions['name_stereo_matrix'] = nameActionBuilder(self, 'Set Stereo Matrix Name', CHANNEL_TYPE.StereoMatrix)
	actions['name_mono_fx_send'] = nameActionBuilder(self, 'Set Mono FXSend Name', CHANNEL_TYPE.MonoFXSend)
	actions['name_stereo_fx_send'] = nameActionBuilder(self, 'Set Stereo FXSend Name', CHANNEL_TYPE.StereoFXSend)
	actions['name_main'] = nameActionBuilder(self, 'Set Main Name', CHANNEL_TYPE.Main)
	actions['name_fx_return'] = nameActionBuilder(self, 'Set FXReturn Name', CHANNEL_TYPE.FXReturn)
	actions['name_dca'] = nameActionBuilder(self, 'Set DCA Name', CHANNEL_TYPE.DCA)
	// TODO: Test if we can set and get a Name for a Scene
	actions['name_scene'] = nameActionBuilder(self, 'Set Scene Name', CHANNEL_TYPE.Scene)

	// Color Actions
	actions['color_input'] = colorActionBuilder(self, 'Set Input Color', CHANNEL_TYPE.Input)
	actions['color_mono_group'] = colorActionBuilder(self, 'Set Mono Group Color', CHANNEL_TYPE.MonoGroup)
	actions['color_stereo_group'] = colorActionBuilder(self, 'Set Stereo Group Color', CHANNEL_TYPE.StereoGroup)
	actions['color_mono_aux'] = colorActionBuilder(self, 'Set Mono Aux Color', CHANNEL_TYPE.MonoAux)
	actions['color_stereo_aux'] = colorActionBuilder(self, 'Set Stereo Aux Color', CHANNEL_TYPE.StereoAux)
	actions['color_mono_matrix'] = colorActionBuilder(self, 'Set Mono Matrix Color', CHANNEL_TYPE.MonoMatrix)
	actions['color_stereo_matrix'] = colorActionBuilder(self, 'Set Stereo Matrix Color', CHANNEL_TYPE.StereoMatrix)
	actions['color_mono_fx_send'] = colorActionBuilder(self, 'Set Mono FXSend Color', CHANNEL_TYPE.MonoFXSend)
	actions['color_stereo_fx_send'] = colorActionBuilder(self, 'Set Stereo FXSend Color', CHANNEL_TYPE.StereoFXSend)
	actions['color_main'] = colorActionBuilder(self, 'Set Main Color', CHANNEL_TYPE.Main)
	actions['color_fx_return'] = colorActionBuilder(self, 'Set FXReturn Color', CHANNEL_TYPE.FXReturn)
	actions['color_dca'] = colorActionBuilder(self, 'Set DCA Color', CHANNEL_TYPE.DCA)
	// TODO: Test if we can set and get a Color for a Scene
	actions['color_scene'] = colorActionBuilder(self, 'Set Scene Color', CHANNEL_TYPE.Scene)

	// Scene Actions
	actions['scene_recall'] = {
		name: 'Scene recall',
		options: [
			{
				type: 'dropdown',
				label: choices.scene.name,
				id: 'sceneId',
				choices: choices.scene.values,
				default: choices.scene.values[0].id,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { sceneId } = action.options as { sceneId: string }
			await self.sendSceneCommand(sceneId, choices.scene.midiOffset)
		},
	}

	// Send Actions
	actions['send_input_to_mono_group'] = sendLevelActionBuilder(
		self,
		'Send Input to Mono Group',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.MonoGroup
	)
	actions['send_input_to_stereo_group'] = sendLevelActionBuilder(
		self,
		'Send Input to Stereo Group',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.StereoGroup
	)
	actions['send_input_to_mono_aux'] = sendLevelActionBuilder(
		self,
		'Send Input to Mono Aux',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.MonoAux
	)
	actions['send_input_to_stereo_aux'] = sendLevelActionBuilder(
		self,
		'Send Input to Stereo Aux',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.StereoAux
	)
	actions['send_input_to_mono_matrix'] = sendLevelActionBuilder(
		self,
		'Send Input to Mono Matrix',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.MonoMatrix
	)
	actions['send_input_to_stereo_matrix'] = sendLevelActionBuilder(
		self,
		'Send Input to Stereo Matrix',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.StereoMatrix
	)
	actions['send_input_to_mono_fx_send'] = sendLevelActionBuilder(
		self,
		'Send Input to Mono FX Return',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.MonoFXSend
	)
	actions['send_input_to_stereo_fx_send'] = sendLevelActionBuilder(
		self,
		'Send Input to Stereo FX Return',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.StereoFXSend
	)
	actions['send_input_to_fx_return'] = sendLevelActionBuilder(
		self,
		'Send Input to FX Return',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.FXReturn
	)
	actions['send_input_to_main'] = sendLevelActionBuilder(
		self,
		'Send Input to Main',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.Main
	)
	actions['send_input_to_dca'] = sendLevelActionBuilder(
		self,
		'Send Input to Main',
		CHANNEL_TYPE.Input,
		CHANNEL_TYPE.DCA
	)

	return actions
}

function muteActionBuilder(self: AvantisInstance, name: string, type: ChannelType): CompanionActionDefinition {
	const choice = self.choices[type]
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
			const { channel, mute } = action.options as { channel: number; mute: boolean }
			await self.sendMuteCommand(channel, mute, choice.midiOffset)
			self.setMuteValueInCache(type, channel, mute)
		},
	}
}

function nameActionBuilder(self: AvantisInstance, name: string, type: ChannelType): CompanionActionDefinition {
	const choice = self.choices[type]
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
				type: 'textinput',
				label: 'Name of the Channel',
				id: 'channelName',
				tooltip: 'Enter a name for the channel to a Max of 8 Characters',
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { channel, channelName } = action.options as { channel: number; channelName: string }
			await self.sendChannelNameCommand(channel, channelName, choice.midiOffset)
			self.setNameValueInCache(type, channel, channelName, true)
		},
	}
}

function colorActionBuilder(self: AvantisInstance, name: string, type: ChannelType): CompanionActionDefinition {
	const choice = self.choices[type]
	const clrChoice = self.choices.color
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
				label: clrChoice.name,
				id: 'color',
				choices: clrChoice.values,
				default: clrChoice.values[0].id,
				minChoicesForSearch: 0,
			},
		],
		callback: async (action: CompanionActionEvent) => {
			const { channel, color } = action.options as { channel: number; color: string }
			await self.sendChannelColorCommand(channel, color, choice.midiOffset)
			self.setColorValueInCache(type, channel, color, true)
		},
	}
}

function faderActionBuilder(self: AvantisInstance, name: string, type: ChannelType): CompanionActionDefinition {
	const choice = self.choices[type]
	const fdrChoice = self.choices.fader
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
			const { channel, level } = action.options as { channel: number; level: number }
			await self.sendFaderCommand(channel, level, choice.midiOffset)
		},
	}
}

function sendLevelActionBuilder(
	self: AvantisInstance,
	name: string,
	srcType: ChannelType,
	destType: ChannelType
): CompanionActionDefinition {
	const fdrChoice = self.choices.fader
	const srcChoice = self.choices[srcType]
	const destChoice = self.choices[destType]

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
			const { srcChannel, destChannel, level } = action.options as {
				srcChannel: number
				destChannel: number
				level: string
			}
			const src = {
				channel: srcChannel,
				midiOffset: srcChoice.midiOffset,
			}
			const dest = {
				channel: destChannel,
				midiOffset: destChoice.midiOffset,
			}
			await self.sendLevelSendCommand(src, dest, level)
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
