import { CompanionFeedbackDefinition, CompanionFeedbackDefinitions, combineRgb } from '@companion-module/base'
import { Choices } from './choices'
import AvantisInstance from './index'


export function getFeedbackDefinitions(self: AvantisInstance, choices: Choices): CompanionFeedbackDefinitions {
    const feedbacks: { [id: string]: CompanionFeedbackDefinition | undefined } = {}

    feedbacks['someFeedbackName'] = {
        type: 'boolean',
        name: 'Change color from timer state running',
        description: 'Change the colors of a bank according if the timer is running',
        defaultStyle: {
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 204, 0),
        },
        options: [],
        callback: (feedback) => {
            if (feedback) {
                return true
            } else {
                return false
            }
        },
    }

    return feedbacks;
}