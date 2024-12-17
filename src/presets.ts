// presets.ts

import { CompanionPresetDefinitions, combineRgb } from '@companion-module/base'

export function getPresets(): CompanionPresetDefinitions {
    const presets: CompanionPresetDefinitions = {}

    // Input channel presets
    for (let ch = 1; ch <= 8; ch++) {
        // Mute button for each channel
        presets[`input_mute_${ch}`] = {
            type: 'button',
            category: 'Input Mutes',
            name: `Input ${ch} Mute`,
            style: {
                text: `IN ${ch}\\nMUTE`,
                size: '14',
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(0, 0, 0)
            },
            feedbacks: [
                {
                    feedbackId: 'channelMute',
                    options: {
                        channelType: 'input',
                        channel: ch
                    },
                    style: {
                        bgcolor: combineRgb(255, 0, 0),
                        color: combineRgb(255, 255, 255)
                    }
                }
            ],
            steps: [
                {
                    down: [
                        {
                            actionId: 'channel_mute',
                            options: {
                                channelType: 'input',
                                channel: ch,
                                muteState: 'toggle'
                            }
                        }
                    ],
                    up: []
                }
            ]
        }

        // Fader level indicator
        presets[`input_level_${ch}`] = {
            type: 'button',
            category: 'Input Levels',
            name: `Input ${ch} Level`,
            style: {
                text: `IN ${ch}\\n$(avantis:input_${ch}_level)`,
                size: '14',
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(0, 0, 0)
            },
            feedbacks: [
                {
                    feedbackId: 'faderLevel',
                    options: {
                        channelType: 'input',
                        channel: ch,
                        style: 'text'
                    }
                }
            ],
            steps: [
                {
                    down: [
                        {
                            actionId: 'fader_level',
                            options: {
                                channelType: 'input',
                                channel: ch,
                                level: 0
                            }
                        }
                    ],
                    up: []
                }
            ]
        }
    }

    // Scene recall presets for first 8 scenes
    for (let scene = 1; scene <= 8; scene++) {
        presets[`recall_scene_${scene}`] = {
            type: 'button',
            category: 'Scenes',
            name: `Recall Scene ${scene}`,
            style: {
                text: `SCENE\\n${scene}`,
                size: '14',
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(0, 0, 0)
            },
            feedbacks: [
                {
                    feedbackId: 'currentScene',
                    options: {
                        displayType: 'highlight',
                        scene: scene
                    },
                    style: {
                        bgcolor: combineRgb(0, 255, 0),
                        color: combineRgb(0, 0, 0)
                    }
                }
            ],
            steps: [
                {
                    down: [
                        {
                            actionId: 'recall_scene',
                            options: {
                                scene: scene
                            }
                        }
                    ],
                    up: []
                }
            ]
        }
    }

    // Main mix controls
    presets['main_lr_mute'] = {
        type: 'button',
        category: 'Main Mix',
        name: 'Main L/R Mute',
        style: {
            text: 'MAIN\\nMUTE',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0)
        },
        feedbacks: [
            {
                feedbackId: 'channelMute',
                options: {
                    channelType: 'mains',
                    channel: 1
                },
                style: {
                    bgcolor: combineRgb(255, 0, 0),
                    color: combineRgb(255, 255, 255)
                }
            }
        ],
        steps: [
            {
                down: [
                    {
                        actionId: 'channel_mute',
                        options: {
                            channelType: 'mains',
                            channel: 1,
                            muteState: 'toggle'
                        }
                    }
                ],
                up: []
            }
        ]
    }

    const transportControls = {
        stop: { name: 'STOP', color: combineRgb(255, 0, 0) },
        play: { name: 'PLAY', color: combineRgb(0, 255, 0) },
        ff: { name: 'FF', color: combineRgb(255, 255, 0) },
        rw: { name: 'RW', color: combineRgb(255, 255, 0) },
        record: { name: 'REC', color: combineRgb(255, 0, 0) },
        pause: { name: 'PAUSE', color: combineRgb(255, 165, 0) }
    }

    for (const [command, settings] of Object.entries(transportControls)) {
        presets[`transport_${command}`] = {
            type: 'button',
            category: 'Transport',
            name: `Transport ${settings.name}`,
            style: {
                text: settings.name,
                size: '18',
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(0, 0, 0)
            },
            feedbacks: [],
            steps: [
                {
                    down: [
                        {
                            actionId: 'transport_control',
                            options: {
                                command: command
                            }
                        }
                    ],
                    up: []
                }
            ]
        }
    }

    // MIDI Strips - First 8 strips with common controls
    for (let strip = 1; strip <= 8; strip++) {
        // Mute button
        presets[`midi_strip_${strip}_mute`] = {
            type: 'button',
            category: 'MIDI Strips',
            name: `Strip ${strip} Mute`,
            style: {
                text: `STRIP ${strip}\\nMUTE`,
                size: '14',
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(0, 0, 0)
            },
            feedbacks: [
                {
                    feedbackId: 'midiStrip',
                    options: {
                        strip: strip,
                        controlType: 'mute'
                    },
                    style: {
                        bgcolor: combineRgb(255, 0, 0),
                        color: combineRgb(255, 255, 255)
                    }
                }
            ],
            steps: [
                {
                    down: [
                        {
                            actionId: 'midi_strip_control',
                            options: {
                                strip: strip,
                                controlType: 'mute',
                                switchState: 'on'
                            }
                        }
                    ],
                    up: [
                        {
                            actionId: 'midi_strip_control',
                            options: {
                                strip: strip,
                                controlType: 'mute',
                                switchState: 'off'
                            }
                        }
                    ]
                }
            ]
        }

        // Level display
        presets[`midi_strip_${strip}_level`] = {
            type: 'button',
            category: 'MIDI Strips',
            name: `Strip ${strip} Level`,
            style: {
                text: `STRIP ${strip}\\n$(avantis:midi_strip_${strip}_fader)`,
                size: '14',
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(0, 0, 0)
            },
            feedbacks: [
                {
                    feedbackId: 'midiStrip',
                    options: {
                        strip: strip,
                        controlType: 'fader'
                    }
                }
            ],
            steps: [
                {
                    down: [
                        {
                            actionId: 'midi_strip_control',
                            options: {
                                strip: strip,
                                controlType: 'fader',
                                value: 100
                            }
                        }
                    ],
                    up: []
                }
            ]
        }
    }

    // SoftKeys
    for (let key = 1; key <= 16; key++) {
        presets[`softkey_${key}`] = {
            type: 'button',
            category: 'SoftKeys',
            name: `SoftKey ${key}`,
            style: {
                text: `SK\\n${key}`,
                size: '18',
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(0, 0, 0)
            },
            feedbacks: [
                {
                    feedbackId: 'softkey',
                    options: {
                        key: key
                    },
                    style: {
                        bgcolor: combineRgb(0, 255, 0),
                        color: combineRgb(0, 0, 0)
                    }
                }
            ],
            steps: [
                {
                    down: [
                        {
                            actionId: 'softkey',
                            options: {
                                key: key,
                                keyState: 'press'
                            }
                        }
                    ],
                    up: [
                        {
                            actionId: 'softkey',
                            options: {
                                key: key,
                                keyState: 'release'
                            }
                        }
                    ]
                }
            ]
        }
    }

    return presets
}