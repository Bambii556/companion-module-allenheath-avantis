import { CompanionFeedbackDefinition, CompanionFeedbackDefinitions, combineRgb } from '@companion-module/base'
import AvantisInstance from './index'
import { Cache, CHANNEL_TYPE, ChannelType } from './types'

export function getFeedbackDefinitions(self: AvantisInstance): CompanionFeedbackDefinitions {
	const feedbacks: { [id: string]: CompanionFeedbackDefinition | undefined } = {}

	feedbacks[`mute_${CHANNEL_TYPE.Input}`] = buildMuteFeedback(self, CHANNEL_TYPE.Input)
	feedbacks[`mute_${CHANNEL_TYPE.Main}`] = buildMuteFeedback(self, CHANNEL_TYPE.Main)
	feedbacks[`mute_${CHANNEL_TYPE.MonoGroup}`] = buildMuteFeedback(self, CHANNEL_TYPE.MonoGroup)
	feedbacks[`mute_${CHANNEL_TYPE.StereoGroup}`] = buildMuteFeedback(self, CHANNEL_TYPE.StereoGroup)
	feedbacks[`mute_${CHANNEL_TYPE.MonoAux}`] = buildMuteFeedback(self, CHANNEL_TYPE.MonoAux)
	feedbacks[`mute_${CHANNEL_TYPE.StereoAux}`] = buildMuteFeedback(self, CHANNEL_TYPE.StereoAux)
	feedbacks[`mute_${CHANNEL_TYPE.MonoMatrix}`] = buildMuteFeedback(self, CHANNEL_TYPE.MonoMatrix)
	feedbacks[`mute_${CHANNEL_TYPE.StereoMatrix}`] = buildMuteFeedback(self, CHANNEL_TYPE.StereoMatrix)
	feedbacks[`mute_${CHANNEL_TYPE.MonoFXSend}`] = buildMuteFeedback(self, CHANNEL_TYPE.MonoFXSend)
	feedbacks[`mute_${CHANNEL_TYPE.StereoFXSend}`] = buildMuteFeedback(self, CHANNEL_TYPE.StereoFXSend)
	feedbacks[`mute_${CHANNEL_TYPE.FXReturn}`] = buildMuteFeedback(self, CHANNEL_TYPE.FXReturn)
	feedbacks[`mute_${CHANNEL_TYPE.MuteGroup}`] = buildMuteFeedback(self, CHANNEL_TYPE.MuteGroup)
	feedbacks[`mute_${CHANNEL_TYPE.DCA}`] = buildMuteFeedback(self, CHANNEL_TYPE.DCA)

	return feedbacks
}

function buildMuteFeedback(self: AvantisInstance, type: ChannelType): CompanionFeedbackDefinition {
	const choice = self.choices[type]
	const config = self.avantisConfig.channel[type]
	return {
		type: 'boolean',
		name: `${config.name} Mute State`,
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
			return getMuteCachedValue(self.cache, type, feedback.options.channel as string)
		},
	}
}

function getMuteCachedValue(cache: Cache, type: ChannelType, channel: string) {
	if (!cache || !cache.channel || !cache.channel[type] || !cache.channel[type].mute) {
		return false
	}
	const value = cache.channel[type].mute[`${channel}`]
	console.log(
		`Feedback data: ${JSON.stringify({
			type,
			channel,
			value,
			cache: cache.channel[type].mute,
		})}`
	)
	if (value === undefined) {
		return false
	}

	return value
}
