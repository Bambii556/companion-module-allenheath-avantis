import { AvantisConfig, Color, Fader } from './avantisConfig'
import { ChannelType, Cache, CHANNEL_TYPE } from './types'
import { getCacheName } from './utils'

export interface Choice {
	name: string
	midiOffset: number
	hexOffset: number
	values: ChoiceValue[]
}

export interface ChoiceValue {
	label: string
	id: number
	hexOffset?: number
}

export type Choices = {
	input: Choice
	scene: Choice
	dca: Choice
	muteGroup: Choice
	main: Choice
	monoGroup: Choice
	stereoGroup: Choice
	monoAux: Choice
	stereoAux: Choice
	monoMatrix: Choice
	stereoMatrix: Choice
	monoFXSend: Choice
	stereoFXSend: Choice
	fxReturn: Choice
	fader: Choice
	color: Choice
}

export function getChoices(avantisData: AvantisConfig, cache?: Cache): Choices {
	/*
        DCA Assign ON/Off
        Name
        Mute Group Assing ON/Off
        Midi Channel
    */

	const input = buildChoices(avantisData, CHANNEL_TYPE.Input, cache)
	const scene = buildChoices(avantisData, CHANNEL_TYPE.Scene, cache)
	const dca = buildChoices(avantisData, CHANNEL_TYPE.DCA, cache)
	const muteGroup = buildChoices(avantisData, CHANNEL_TYPE.MuteGroup, cache)
	const main = buildChoices(avantisData, CHANNEL_TYPE.Main, cache)
	const monoGroup = buildChoices(avantisData, CHANNEL_TYPE.MonoGroup, cache)
	const stereoGroup = buildChoices(avantisData, CHANNEL_TYPE.StereoGroup, cache)
	const monoAux = buildChoices(avantisData, CHANNEL_TYPE.MonoAux, cache)
	const stereoAux = buildChoices(avantisData, CHANNEL_TYPE.StereoAux, cache)
	const monoMatrix = buildChoices(avantisData, CHANNEL_TYPE.MonoMatrix, cache)
	const stereoMatrix = buildChoices(avantisData, CHANNEL_TYPE.StereoMatrix, cache)
	const monoFXSend = buildChoices(avantisData, CHANNEL_TYPE.MonoFXSend, cache)
	const stereoFXSend = buildChoices(avantisData, CHANNEL_TYPE.StereoFXSend, cache)
	const fxReturn = buildChoices(avantisData, CHANNEL_TYPE.FXReturn, cache)

	const color = buildColorChoices(avantisData.colors)
	const fader = buildFaderChoices(avantisData.faders)

	return {
		input,
		scene,
		dca,
		muteGroup,
		main,
		monoGroup,
		stereoGroup,
		monoAux,
		stereoAux,
		monoMatrix,
		stereoMatrix,
		monoFXSend,
		stereoFXSend,
		fxReturn,
		fader,
		color,
	}
}

function buildChoices(config: AvantisConfig, type: ChannelType, cache?: Cache): Choice {
	const detail = config.channel[type]
	const choice: Choice = {
		name: detail.name,
		midiOffset: detail.offset.midi,
		hexOffset: detail.offset.hex,
		values: [],
	}
	for (let id = 1; id <= detail.count; id++) {
		const name = getCacheName(cache, type, id)
		choice.values.push({
			id: id + detail.offset.hex,
			label: `${detail.key} ${id}${name}`,
			hexOffset: detail.offset.hex,
		})
	}
	return choice
}

function buildColorChoices(colorOptions: Color[]): Choice {
	return {
		name: `Color`,
		midiOffset: 0,
		hexOffset: 0,
		values: colorOptions.map((c) => ({
			label: c.key,
			id: c.value,
			hexOffset: 0,
		})),
	}
}

function buildFaderChoices(faderOptions: Fader[]): Choice {
	return {
		name: `Fader Level`,
		midiOffset: 0,
		hexOffset: 0,
		values: faderOptions.map((fdr) => ({
			label: `${fdr.db} dB`,
			id: fdr.hex,
			hexOffset: 0,
		})),
	}
}
