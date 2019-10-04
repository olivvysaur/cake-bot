import moment from 'moment';
import { pluralise } from './strings';

const SLASH_FORMAT = /([0-9]{1,2})(\/|\s)([0-9]{1,2})/;

export const parseDate = (date: string) => {
  const slashMatch = date.match(SLASH_FORMAT);
  if (slashMatch) {
    const firstNumber = parseInt(slashMatch[1]);
    const secondNumber = parseInt(slashMatch[3]);

    if (firstNumber <= 12 && secondNumber <= 12) {
      if (firstNumber === secondNumber) {
        return moment(date, 'D/M');
      } else {
        return [moment(date, 'D/M'), moment(date, 'M/D')];
      }
    } else if (firstNumber > 12 && secondNumber <= 12) {
      return moment(date, 'D/M');
    } else if (firstNumber <= 12 && secondNumber > 12) {
      return moment(date, 'M/D');
    } else {
      return null;
    }
  }

  const parsed = moment(date);
  if (parsed.isValid) {
    return parsed;
  }

  return null;
};

export const formatDate = (date: moment.Moment) => date.format('D MMMM');

export const timeSince = (date: Date) => {
  const now = moment();
  const diff = moment.duration(now.diff(date));

  const components = {
    years: diff.years(),
    months: diff.months(),
    days: diff.days(),
    hours: diff.hours(),
    minutes: diff.minutes(),
    seconds: diff.seconds()
  };

  const pluralised = Object.entries(components).map(([key, value]) => {
    const unit = key.slice(0, -1);
    return pluralise(value, unit);
  });

  const firstNonZeroIndex = Object.values(components).findIndex(
    value => value !== 0
  );

  const asString = pluralised.slice(firstNonZeroIndex).join(', ');

  return {
    ...components,
    asString
  };
};
