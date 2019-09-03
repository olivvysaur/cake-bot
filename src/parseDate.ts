import moment from 'moment';

const SLASH_FORMAT = /([0-9]{1,2})\/([0-9]{1,2})/;

export const parseDate = (date: string) => {
  console.log(date);

  const slashMatch = date.match(SLASH_FORMAT);
  if (slashMatch) {
    const firstNumber = parseInt(slashMatch[1]);
    const secondNumber = parseInt(slashMatch[2]);

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
