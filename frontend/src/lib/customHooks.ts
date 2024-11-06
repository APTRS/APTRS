import { getAuthUser } from '../lib/data/api';
import { LoginUser } from './data/definitions';

// returns color code for a vulnerability score
// score can be a number (e.g. 4.2) or a string (.e.g Medium)
// returns array with [meaning (capitalized), hex color]
export function useVulnerabilityColor(scoreOrText: string | number | null){
    let meaning: string

    let retVals = []
    if(typeof(scoreOrText) === 'string'){
        let meaning = scoreOrText.charAt(0).toUpperCase() + scoreOrText.slice(1)
        retVals[0] = meaning
    } else if (scoreOrText == null){
        meaning = 'None'
    }
    const scoreColors: { [key: string]: string } = {
      'None': '#3399FF',
      'Low' : '#20B803',
      'Medium': '#FBBC02',
      'High': '#F66E09',
      'Critical': '#FF491C'
    }
    if(scoreColors[String(scoreOrText)]){
      retVals[1] = scoreColors[String(scoreOrText)]
      return retVals
    }
    meaning = 'None'
    let score = Number(scoreOrText)
    if(score > 0.1 && score <= 3.9){
      meaning = 'Low'
    } else if(score > 3.9 && score <= 6.9) {
      meaning = 'Medium'
    } else if(score > 6.9 && score <= 8.9) {
      meaning = 'High'
    } else if(score > 8.9) {
      meaning = 'Critical'
    }
    retVals[0] = meaning
    retVals[1] = scoreColors[meaning]
    return retVals
    
}

export function useCurrentUser(): LoginUser | null {
  return getAuthUser()
}

