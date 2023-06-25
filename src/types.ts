import { ChannelType } from './utils'

export type MainCache = {
	mute: CacheOption<MuteOption>
	name: CacheOption<NameOption>
	color: CacheOption<ColorOption>
}

export type CacheOption<TData> = {
	[id in ChannelType]: TData
}

export interface MuteOption {
	[id: string]: boolean
}
export interface NameOption {
	[id: string]: string
}
export interface ColorOption {
	[id: string]: string
}
