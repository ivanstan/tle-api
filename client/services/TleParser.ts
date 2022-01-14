import { Tle } from "tle-client"

export enum LineNumber {
  LINE1 = 1,
  LINE2 = 2,
}

export class TleParser extends Tle {

  getLine(lineNumber: LineNumber): string {
    if (lineNumber === LineNumber.LINE1) {
      return this.line1
    } else if (lineNumber === LineNumber.LINE2) {
      return this.line2
    }

    return ''
  }

  getLineNumberRaw(lineNumber: LineNumber): string {
    const line = this.getLine(lineNumber)

    return line.substring(0, 1).trim()
  }

  getLineChecksumRaw(lineNumber: LineNumber): string {
    const line = this.getLine(lineNumber)

    return line.substring(68, 69).trim()
  }

  getSatelliteIdRaw(lineNumber: LineNumber): string {
    const line = this.getLine(lineNumber)

    return line.substring(2, 7).trim()
  }

  /**
   * Line 1 Data
   */
  getClassificationRaw(): string {
    return this.line1.substring(7, 8).trim()
  }

  getLaunchYearRaw(fourDigits: boolean = false): string {
    return this.line1.substring(9, 11).trim()
  }

  getLaunchNumberOfTheYearRaw(): string {
    return this.line1.substring(11, 14).trim()
  }

  getLaunchPieceRaw(): string {
    return this.line1.substring(14, 17).trim()
  }

  getEpochYearRaw(): string {
    return this.line1.substring(18, 20).trim()
  }

  getEpochDayRaw(): string {
    return this.line1.substring(20, 32).trim()
  }

  getFirstTimeDerivativeOfMeanMotionRaw(): string {
    return this.line1.substring(33, 43).trim()
  }

  getSecondTimeDerivativeOfMeanMotionRaw(): string {
    return this.line1.substring(44, 52).trim()
  }

  getBstarDragTermRaw(): string {
    return this.line1.substring(53, 61).trim()
  }

  getEphemerisTypeRaw(): string {
    return this.line1.substring(62, 63).trim()
  }

  getElementNumberRaw(): string {
    return this.line1.substring(64, 68).trim()
  }

  /**
   * Line 2 Data
   */
  getInclinationRaw(): string {
    return this.line2.substring(8, 16).trim()
  }

  getRightAscensionOfAscendingNodeRaw(): string {
    return this.line2.substring(17, 25).trim()
  }

  getEccentricityRaw(): string {
    return this.line2.substring(26, 33).trim()
  }

  getArgumentOfPerigeeRaw(): string {
    return this.line2.substring(34, 42).trim()
  }

  getMeanAnomalyRaw(): string {
    return this.line2.substring(43, 51).trim()
  }

  getMeanMotionRaw(): string {
    return this.line2.substring(52, 63).trim()
  }

  getPeriod(): number {
    return 86400 / parseFloat(this.getMeanMotionRaw())
  }

  getRevolutionNumberRaw(): string {
    return this.line2.substring(63, 68).trim()
  }
}
