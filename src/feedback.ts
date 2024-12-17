import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { CHANNEL_RANGES } from './helpers.js'
import { ChannelType } from './types.js'

export function getFeedbacks(instance: ModuleInstance): CompanionFeedbackDefinitions {
    const feedbacks: CompanionFeedbackDefinitions = {
        // Channel Mute State Feedback
        channelMute: {
            type: 'boolean',
            name: 'Channel Mute State',
            description: 'Changes button color based on channel mute state',
            defaultStyle: {
                bgcolor: combineRgb(255, 0, 0),
                color: combineRgb(255, 255, 255),
            },
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id, _range]) => ({
                        id,
                        label: id.replace(/_/g, ' ').toUpperCase()
                    }))
                },
                {
                    type: 'number',
                    label: 'Channel Number',
                    id: 'channel',
                    default: 1,
                    min: 1,
                    max: 64
                }
            ],
            callback: (feedback) => {
                const channelType = feedback.options.channelType as ChannelType
                const channel = Number(feedback.options.channel)
                return instance.getMuteState(channelType, channel)
            }
        },

        // Fader Level Feedback
        faderLevel: {
            type: 'advanced',
            name: 'Fader Level',
            description: 'Shows fader level value or changes color based on threshold',
            options: [
                {
                    type: 'dropdown',
                    label: 'Channel Type',
                    id: 'channelType',
                    default: 'input',
                    choices: Object.entries(CHANNEL_RANGES).map(([id, _range]) => ({
                        id,
                        label: id.replace(/_/g, ' ').toUpperCase()
                    }))
                },
                {
                    type: 'number',
                    label: 'Channel Number',
                    id: 'channel',
                    default: 1,
                    min: 1,
                    max: 64
                },
                {
                    type: 'dropdown',
                    label: 'Display Style',
                    id: 'style',
                    default: 'text',
                    choices: [
                        { id: 'text', label: 'Show Level Value' },
                        { id: 'threshold', label: 'Color Based on Threshold' }
                    ]
                },
                {
                    type: 'number',
                    label: 'Threshold (dB)',
                    id: 'threshold',
                    default: 0,
                    min: -90,
                    max: 10,
                    isVisible: (options) => options.style === 'threshold'
                }
            ],
            callback: (feedback) => {
                const channelType = feedback.options.channelType as ChannelType
                const channel = Number(feedback.options.channel)
                const level = instance.getFaderLevel(channelType, channel)
                
                if (feedback.options.style === 'text') {
                    return {
                        text: `${level.toFixed(1)} dB`
                    }
                } else {
                    // Threshold-based color
                    const threshold = Number(feedback.options.threshold)
                    const isAboveThreshold = level >= threshold
                    
                    return {
                        bgcolor: isAboveThreshold ? combineRgb(0, 255, 0) : combineRgb(255, 255, 0),
                        color: combineRgb(0, 0, 0)
                    }
                }
            }
        },

        // Current Scene Feedback
        currentScene: {
            type: 'advanced',
            name: 'Current Scene',
            description: 'Shows current scene number/name or indicates if this is the active scene',
            options: [
                {
                    type: 'dropdown',
                    label: 'Display Type',
                    id: 'displayType',
                    default: 'number',
                    choices: [
                        { id: 'number', label: 'Scene Number' },
                        { id: 'name', label: 'Scene Name' },
                        { id: 'both', label: 'Number & Name' },
                        { id: 'highlight', label: 'Highlight if Active' }
                    ]
                },
                {
                    type: 'number',
                    label: 'Scene Number',
                    id: 'scene',
                    default: 1,
                    min: 1,
                    max: 500,
                    isVisible: (options) => options.displayType === 'highlight'
                }
            ],
            callback: (feedback, _context) => {
                let sceneNumber = instance.getVariableValue('current_scene') as number
                let sceneName = instance.getVariableValue('current_scene_name') as string

                if (!sceneNumber) sceneNumber = 0
                if (!sceneName) sceneName = ''

                switch (feedback.options.displayType) {
                    case 'number':
                        return { text: sceneNumber.toString() }
                    case 'name':
                        return { text: sceneName }
                    case 'both':
                        return { text: `${sceneNumber}: ${sceneName}` }
                    case 'highlight': {
                        const isActive = sceneNumber === Number(feedback.options.scene)
                        return {
                            bgcolor: isActive ? combineRgb(0, 255, 0) : combineRgb(0, 0, 0),
                            color: isActive ? combineRgb(0, 0, 0) : combineRgb(255, 255, 255)
                        }
                    }
                    default:
                        return { text: sceneNumber.toString() } // Default fallback
                }
            }
        }
    }

    return feedbacks
}