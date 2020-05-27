import Big from 'big.js';
import { Unit, Units } from './constants';

interface FormatSatsOptions {
  /** the units to convert the sats to (defaults to `sats`) */
  unit?: Unit;
  /** if true, return the units abbreviation as a suffix after the amount */
  withSuffix?: boolean;
  /** the language to use to determine the format of the number */
  lang?: string;
}

/** the default values to use for the formatSats function */
const defaultFormatSatsOptions = {
  unit: Unit.sats,
  withSuffix: true,
  lang: 'en-US',
};

/**
 * Converts a number representing an amount of satoshis to a string
 * @param sats the numeric value in satoshis
 * @param options the format options
 */
export const formatSats = (sats: Big, options?: FormatSatsOptions) => {
  const { unit, withSuffix, lang } = Object.assign({}, defaultFormatSatsOptions, options);
  const { suffix, denominator, decimals } = Units[unit];
  const formatter = Intl.NumberFormat(lang, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  let text = formatter.format(+sats.div(denominator));
  if (withSuffix) text = `${text} ${suffix}`;
  return text;
};

/**
 * Formats a specific unit to display the name and amount in BTC
 * ex: Satoshis (0.00000001 BTC)
 * @param unit the unit to describe
 */
export const formatUnit = (unit: Unit) => {
  const { name, denominator } = Units[unit];
  const btcValue = formatSats(Big(denominator), { unit: Unit.btc });
  return `${name} (${btcValue})`;
};
