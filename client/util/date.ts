import { DateTime } from "luxon";
import { Duration } from "luxon/src/duration";

export const toAtom = (date: Date): string => {
  // @ts-ignore
  const luxon: any = new DateTime.fromJSDate(date);
  let format = luxon.toFormat('yyyy-MM-dd');
  format += 'T' + luxon.toFormat('TTZZ');

  return format;
}

export const fromAtom = (date: string|null): DateTime => {

  if (!date) {
    return new DateTime();
  }

  return DateTime.fromFormat(date, "yyyy-MM-dd'T'HH:mm:ssZZ")
}

export const formatDiff = (difference: Duration): string => {
  const diff = difference.toObject();

  let result = '';

  if (diff.days) {
    result += diff.days + (diff.days > 1 ? ' days,' : ' day,');
  }

  return `${result} ${diff.hours} hours, ${diff.minutes} minutes, ${diff.seconds?.toFixed()} seconds`;
}
