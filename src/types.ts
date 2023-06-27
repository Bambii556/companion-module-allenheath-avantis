export const CHANNEL_TYPE = {
	Input: 'input',
	MonoGroup: 'monoGroup',
	StereoGroup: 'stereoGroup',
	MonoAux: 'monoAux',
	StereoAux: 'stereoAux',
	MonoMatrix: 'monoMatrix',
	StereoMatrix: 'stereoMatrix',
	MonoFXSend: 'monoFXSend',
	StereoFXSend: 'stereoFXSend',
	FXReturn: 'fxReturn',
	Main: 'main',
	DCA: 'dca',
	MuteGroup: 'muteGroup',
	Scene: 'scene',
} as const

export const EXTRA_TYPE = {
	Color: 'color',
	Name: 'name',
	Fader: 'fader',
} as const

type ObjectValues<T> = T[keyof T]

export type ChannelType = ObjectValues<typeof CHANNEL_TYPE>
export type ExtraType = ObjectValues<typeof EXTRA_TYPE>

export type Cache = {
	channel: CacheType<ChannelType, CacheOptions>
}

export type MainCache = {
	channel: CacheType<ChannelType, CacheOptions>
}

export type CacheOptions = {
	mute: MuteCache
	name: NameCache
	color: ColorCache
}

export type CacheType<T extends ChannelType, TData> = {
	[key in T]: TData
}

export interface MuteCache {
	[key: string]: boolean
}
export interface NameCache {
	[key: string]: string
}
export interface ColorCache {
	[key: string]: string
}
