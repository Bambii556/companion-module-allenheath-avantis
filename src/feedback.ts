import { CompanionFeedbackDefinition, CompanionFeedbackDefinitions, combineRgb } from '@companion-module/base'
import { Choice, Choices } from './choices'
import AvantisInstance from './index'
import { MainCache } from './types'

type CacheTypes =
	| 'input'
	| 'main'
	| 'monoGroup'
	| 'stereoGroup'
	| 'monoAux'
	| 'stereoAux'
	| 'monoMatrix'
	| 'stereoMatrix'
	| 'monoFXSend'
	| 'stereoFXSend'
	| 'FXReturn'
	| 'group'
	| 'dca'

export function getFeedbackDefinitions(self: AvantisInstance, choices: Choices): CompanionFeedbackDefinitions {
	const feedbacks: { [id: string]: CompanionFeedbackDefinition | undefined } = {}

	feedbacks['mute_input'] = buildMuteFeedback(self, choices.inputChannel, 'Input Channel', 'input')
	feedbacks['mute_main'] = buildMuteFeedback(self, choices.mainMix, 'Main Channel', 'main')
	feedbacks['mute_monoGroup'] = buildMuteFeedback(self, choices.monoGroup, 'Mono Group', 'monoGroup')
	feedbacks['mute_stereoGroup'] = buildMuteFeedback(self, choices.stereoGroup, 'Stereo Group', 'stereoGroup')
	feedbacks['mute_monoAux'] = buildMuteFeedback(self, choices.monoAux, 'Mono Aux', 'monoAux')
	feedbacks['mute_stereoAux'] = buildMuteFeedback(self, choices.stereoAux, 'Stereo Aux', 'stereoAux')
	feedbacks['mute_monoMatrix'] = buildMuteFeedback(self, choices.monoMatrix, 'Mono Matrix', 'monoMatrix')
	feedbacks['mute_stereoMatrix'] = buildMuteFeedback(self, choices.stereoMatrix, 'Stereo Matrix', 'stereoMatrix')
	feedbacks['mute_monoFXSend'] = buildMuteFeedback(self, choices.monoFXSend, 'Mono FX Send', 'monoFXSend')
	feedbacks['mute_stereoFXSend'] = buildMuteFeedback(self, choices.stereoFXSend, 'Stereo FX Send', 'stereoFXSend')
	feedbacks['mute_FXReturn'] = buildMuteFeedback(self, choices.FXReturn, 'FX Return', 'FXReturn')
	feedbacks['mute_group'] = buildMuteFeedback(self, choices.muteGroup, 'Mute Group', 'group')
	feedbacks['mute_dca'] = buildMuteFeedback(self, choices.dca, 'DCA', 'dca')

	return feedbacks
}

function buildMuteFeedback(
	self: AvantisInstance,
	choice: Choice,
	name: string,
	type: CacheTypes
): CompanionFeedbackDefinition {
	return {
		type: 'boolean',
		name: `${name} Mute State`,
		description: 'Check the mute state of the selected channels',
		defaultStyle: {
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(255, 0, 0),
		},
		options: [
			{
				type: 'dropdown',
				label: choice.name,
				id: 'channel',
				choices: choice.values,
				default: choice.values[0].id,
				minChoicesForSearch: 0,
			},
		],
		callback: (feedback) => {
			return getMuteCacheValue(self.cache, type, feedback.options.channel as string)
		},
	}
}

function getMuteCacheValue(cache: MainCache, type: CacheTypes, channel: string) {
	if (!cache || !cache.mute || !cache.mute[type]) {
		console.log(`Feedback Error: ${JSON.stringify({ type, cahce: cache.mute })}`)
		return false
	}
	const value = cache.mute[type][`${channel}`]
	console.log(
		`Feedback data: ${JSON.stringify({
			type,
			channel,
			value,
			cache: cache.mute[type],
		})}`
	)
	if (value === undefined) {
		return false
	}

	return value
}
