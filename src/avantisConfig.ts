export interface AvantisConfig {
	config: ConfigDetail
	name: NameDetails
	faders: Fader[]
	colors: Color[]
}

export interface Fader {
	db: string
	hex: number
	dec: number
}

export interface Color {
	key: string
	value: number
}

export interface NameDetails {
	char: NameChars
	hex: NameChars
}

export interface NameChars {
	[key: string]: string
}

export interface ConfigDetail {
	mono: {
		groupCount: number
		auxCount: number
		matrixCount: number
		fxSendCount: number
	}
	stereo: {
		groupCount: number
		auxCount: number
		matrixCount: number
		fxSendCount: number
	}
	inputCount: number
	mainsCount: number
	fxReturnCount: number
	muteGroupCount: number
	dcaCount: number
	dcaAssignCount: number
	sceneCount: number
}

export function getAvantisConfig(): AvantisConfig {
	const config: AvantisConfig = {
		config: {
			mono: {
				groupCount: 40,
				auxCount: 40,
				matrixCount: 40,
				fxSendCount: 12,
			},
			stereo: {
				groupCount: 20,
				auxCount: 20,
				matrixCount: 20,
				fxSendCount: 12,
			},
			inputCount: 64,
			mainsCount: 3,
			fxReturnCount: 12,
			muteGroupCount: 8,
			dcaCount: 16,
			dcaAssignCount: 16,
			sceneCount: 500,
		},
		name: {
			char: {
				' ': '0x20',
				'0': '0x30',
				'1': '0x31',
				'2': '0x32',
				'3': '0x33',
				'4': '0x34',
				'5': '0x35',
				'6': '0x36',
				'7': '0x37',
				'8': '0x38',
				'9': '0x39',
				A: '0x41',
				B: '0x42',
				C: '0x43',
				D: '0x44',
				E: '0x45',
				F: '0x46',
				G: '0x47',
				H: '0x48',
				I: '0x49',
				J: '0x4a',
				K: '0x4b',
				L: '0x4c',
				M: '0x4d',
				N: '0x4e',
				O: '0x4f',
				P: '0x50',
				Q: '0x51',
				R: '0x52',
				S: '0x53',
				T: '0x54',
				U: '0x55',
				V: '0x56',
				W: '0x57',
				X: '0x58',
				Y: '0x59',
				Z: '0x5a',
				a: '0x61',
				b: '0x62',
				c: '0x63',
				d: '0x64',
				e: '0x65',
				f: '0x66',
				g: '0x67',
				h: '0x68',
				i: '0x69',
				j: '0x6a',
				k: '0x6b',
				l: '0x6c',
				m: '0x6d',
				n: '0x6e',
				o: '0x6f',
				p: '0x70',
				q: '0x71',
				r: '0x72',
				s: '0x73',
				t: '0x74',
				u: '0x75',
				v: '0x76',
				w: '0x77',
				x: '0x78',
				y: '0x79',
				z: '0x7a',
				'!': '0x21',
				'"': '0x22',
				'#': '0x23',
				'%': '0x25',
				'&': '0x26',
				"'": '0x27',
				'(': '0x28',
				')': '0x29',
				'*': '0x2a',
				'+': '0x2b',
				',': '0x2c',
				'-': '0x2d',
				'.': '0x2e',
				'/': '0x2f',
				':': '0x3a',
				';': '0x3b',
				'<': '0x3c',
				'=': '0x3d',
				'>': '0x3e',
				'?': '0x3f',
				'@': '0x40',
				'[': '0x5b',
				'\\': '0x5c',
				']': '0x5d',
				'^': '0x5e',
				_: '0x5f',
				'`': '0x60',
				'{': '0x7b',
				'|': '0x7c',
				'}': '0x7d',
				'~': '0x7e',
			},
			hex: {},
		},
		faders: [
			{ db: '+10', hex: 0x7f, dec: 127 },
			{ db: '+5', hex: 0x74, dec: 117 },
			{ db: '0', hex: 0x6b, dec: 107 },
			{ db: '-5', hex: 0x61, dec: 97 },
			{ db: '-10', hex: 0x57, dec: 87 },
			{ db: '-15', hex: 0x4d, dec: 77 },
			{ db: '-20', hex: 0x43, dec: 67 },
			{ db: '-25', hex: 0x39, dec: 58 },
			{ db: '-30', hex: 0x2f, dec: 48 },
			{ db: '-35', hex: 0x25, dec: 38 },
			{ db: '-40', hex: 0x1b, dec: 28 },
			{ db: '-45', hex: 0x11, dec: 18 },
			{ db: '-inf', hex: 0x00, dec: 0 },

			// { key: "+9.5", value: "0x7e" },
			// { key: "+9", value: "0x7d" },
			// { key: "+8.5", value: "0x7c" },
			// { key: "+8", value: "0x7b" },
			// { key: "+7.5", value: "0x7a" },
			// { key: "+7", value: "0x79" },
			// { key: "+6.5", value: "0x78" },
			// { key: "+6", value: "0x77" },
			// { key: "+5.5", value: "0x76" },
			// { key: "+4", value: "0x73" },
			// { key: "+3.5", value: "0x72" },
			// { key: "+3", value: "0x71" },
			// { key: "+2.5", value: "0x70" },
			// { key: "+2", value: "0x6f" },
			// { key: "+1.5", value: "0x6e" },
			// { key: "+1", value: "0x6d" },
			// { key: "+0.5", value: "0x6c" },
			// { key: "-0.5", value: "0x6a" },
			// { key: "-1", value: "0x69" },
			// { key: "-1.5", value: "0x68" },
			// { key: "-2", value: "0x67" },
			// { key: "-2.5", value: "0x66" },
			// { key: "-3", value: "0x65" },
			// { key: "-3.5", value: "0x64" },
			// { key: "-4", value: "0x63" },
			// { key: "-4.5", value: "0x62" },
			// { key: "-5.5", value: "0x60" },
			// { key: "-6", value: "0x5f" },
			// { key: "-6.5", value: "0x5e" },
			// { key: "-7", value: "0x5d" },
			// { key: "-7.5", value: "0x5c" },
			// { key: "-8", value: "0x5b" },
			// { key: "-8.5", value: "0x5a" },
			// { key: "-9", value: "0x59" },
			// { key: "-9.5", value: "0x58" },
			// { key: "-11", value: "0x55" },
			// { key: "-12", value: "0x53" },
			// { key: "-13", value: "0x51" },
			// { key: "-14", value: "0x4f" },
			// { key: "-16", value: "0x4b" },
			// { key: "-17", value: "0x49" },
			// { key: "-18", value: "0x47" },
			// { key: "-19", value: "0x45" },
			// { key: "-21", value: "0x41" },
			// { key: "-22", value: "0x3f" },
			// { key: "-23", value: "0x3d" },
			// { key: "-24", value: "0x3b" },
			// { key: "-26", value: "0x47" },
			// { key: "-27", value: "0x35" },
			// { key: "-28", value: "0x33" },
			// { key: "-29", value: "0x31" },
			// { key: "-31", value: "0x2d" },
			// { key: "-32", value: "0x2b" },
			// { key: "-33", value: "0x29" },
			// { key: "-34", value: "0x27" },
			// { key: "-36", value: "0x23" },
			// { key: "-37", value: "0x21" },
			// { key: "-38", value: "0x1f" },
			// { key: "-39", value: "0x1d" },
			// { key: "-50", value: "0x07" },
		],
		colors: [
			{ key: `Off`, value: 0x00 },
			{ key: `Red`, value: 0x01 },
			{ key: `Green`, value: 0x02 },
			{ key: `Yellow`, value: 0x03 },
			{ key: `Blue`, value: 0x04 },
			{ key: `Purple`, value: 0x05 },
			{ key: `Lt Blue`, value: 0x06 },
			{ key: `White`, value: 0x07 },
		],
	}

	for (const key in config.name.char) {
		if (Object.prototype.hasOwnProperty.call(config.name.char, key)) {
			const value = config.name.char[key]
			config.name.hex[value] = key
		}
	}

	return config
}

export function getNameByHex(nameDetails: NameDetails, values: number[]): string {
	const chars: string[] = []
	for (const value of values) {
		if (chars.length >= 8) {
			break
		}

		const hex = value.toString(16)
		const char = nameDetails.hex[`0x${hex}`]

		if (char) {
			chars.push(char)
		}
	}
	return chars.join('')
}

export function getNameHexByName(nameDetails: NameDetails, name: string): number[] {
	const chars: number[] = []
	for (let i = 0; i < name.length; i++) {
		// Max 8 characters allowed
		if (i >= 8) {
			break
		}
		const char = name[i]
		const hex = nameDetails.char[char]
		if (hex) {
			chars.push(parseInt(hex, 16))
		}
	}
	return chars
}

export function getColorByKey(config: AvantisConfig, key: string): number | undefined {
	const item = config.colors.find((x) => x.key === key)

	return item ? item.value : undefined
}

export function getColorByNumber(config: AvantisConfig, value: number): string | undefined {
	const item = config.colors.find((x) => x.value === value)

	return item ? item.key : undefined
}
