import { CHANNEL_TYPE, Cache, ChannelType } from './types'

export function determineChannelType(channelNumber: number, midiOffset: number): ChannelType {
	switch (midiOffset) {
		case 0:
			return CHANNEL_TYPE.Input
		case 1:
			if (channelNumber <= 39) {
				return CHANNEL_TYPE.MonoGroup
			}
			return CHANNEL_TYPE.StereoGroup
		case 2:
			if (channelNumber <= 39) {
				return CHANNEL_TYPE.MonoAux
			}
			return CHANNEL_TYPE.StereoAux
		case 3:
			if (channelNumber <= 39) {
				return CHANNEL_TYPE.MonoMatrix
			}
			return CHANNEL_TYPE.StereoMatrix
		case 4:
			if (channelNumber <= 11) {
				return CHANNEL_TYPE.MonoFXSend
			} else if (channelNumber <= 27) {
				return CHANNEL_TYPE.StereoFXSend
			} else if (channelNumber <= 43) {
				return CHANNEL_TYPE.FXReturn
			} else if (channelNumber <= 50) {
				return CHANNEL_TYPE.Main
			} else if (channelNumber <= 69) {
				return CHANNEL_TYPE.DCA
			}
			return CHANNEL_TYPE.MuteGroup
	}

	return CHANNEL_TYPE.Scene
}

export function getCacheName(cache: Cache | undefined, type: ChannelType, channelNumber: number): string {
	if (
		cache &&
		cache.channel &&
		cache.channel[type] &&
		cache.channel[type].name &&
		cache.channel[type].name[`${channelNumber}`]
	) {
		return ` (${cache.channel[type].name[`${channelNumber}`]})`
	}
	return ''
}
