export const PRODUCTION_HOST = 'tle.ivanstanojevic.me';

export const isProduction = (): boolean => {
  return window.location.host === PRODUCTION_HOST;
}
