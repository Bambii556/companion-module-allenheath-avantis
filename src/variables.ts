import { CHANNEL_RANGES } from './helpers.js'
import type { ModuleInstance } from './main.js'
import type { CompanionVariableDefinition } from '@companion-module/base'

export function getVariables(_instance: ModuleInstance): CompanionVariableDefinition[] {
    const variables: CompanionVariableDefinition[] = []

    // Generate variables for each channel type
    Object.entries(CHANNEL_RANGES).forEach(([type, range]) => {
        for (let i = range.min; i <= range.max; i++) {
            // Mute state variable
            variables.push({
                variableId: `${type}_${i}_mute`,
                name: `${type.replace(/_/g, ' ').toUpperCase()} ${i} Mute State`
            })

            // Fader level variable
            variables.push({
                variableId: `${type}_${i}_level`,
                name: `${type.replace(/_/g, ' ').toUpperCase()} ${i} Fader Level`
            })

            // Name variable (if supported by the console)
            variables.push({
                variableId: `${type}_${i}_name`,
                name: `${type.replace(/_/g, ' ').toUpperCase()} ${i} Name`
            })
        }
    })

    // Scene variables
    variables.push(
        {
            variableId: 'current_scene',
            name: 'Current Scene Number'
        },
        {
            variableId: 'current_scene_name',
            name: 'Current Scene Name'
        },
        {
            variableId: 'last_recalled_scene',
            name: 'Last Recalled Scene Number'
        }
    )

    // Add MIDI Strip variables
    for (let strip = 1; strip <= 32; strip++) {
        variables.push(
            {
                variableId: `midi_strip_${strip}_fader`,
                name: `MIDI Strip ${strip} Fader Level`
            },
            {
                variableId: `midi_strip_${strip}_mute`,
                name: `MIDI Strip ${strip} Mute State`
            },
            {
                variableId: `midi_strip_${strip}_mix`,
                name: `MIDI Strip ${strip} Mix State`
            },
            {
                variableId: `midi_strip_${strip}_pafl`,
                name: `MIDI Strip ${strip} PAFL State`
            }
        )
    }

    // Add SoftKey variables
    for (let key = 1; key <= 16; key++) {
        variables.push({
            variableId: `softkey_${key}_state`,
            name: `SoftKey ${key} State`
        })
    }

    return variables
}