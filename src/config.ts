import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export function GetConfigFields(): SomeCompanionConfigField[] {
    return [
        {
            type: 'textinput',
            id: 'host',
            label: 'Mixer IP',
            width: 8,
            regex: Regex.IP,
        },
        {
            type: 'number',
            id: 'port',
            label: 'TCP Port',
            width: 4,
            min: 1,
            max: 65535,
            default: 51325, // Avantis default TCP port
        },
        {
            type: 'number',
            id: 'baseChannel',
            label: 'Base MIDI Channel',
            width: 4,
            min: 1,
            max: 12,
            default: 12,
            tooltip: 'Base MIDI channel (1-12). Default is 12, which uses channels 12-16.'
        }
    ]
}