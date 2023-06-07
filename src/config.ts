import { SomeCompanionConfigField, Regex } from '@companion-module/base'

export interface Config {
	host: string
	midiBase: number
}

export const getConfigDefinitions = (): SomeCompanionConfigField[] => {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module is for the Allen & Heath Avantis mixer',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: Regex.IP,
			required: true,
		},
		{
			type: 'number',
			id: 'midiBase',
			label: 'MIDI Base Channel',
			tooltip: 'The base channel selected in Utility / Control / MIDI and cannot exceed 12',
			width: 6,
			min: 1,
			max: 12,
			default: 1,
			step: 1,
			required: true,
			range: false,
		},
	]
}
