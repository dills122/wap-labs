import crypto from 'node:crypto';

const safeSlug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function createAuthenticationTestData(
  scenarioId,
  {
    nonceFactory = () => crypto.randomBytes(5).toString('hex'),
    pinFactory = () => String(crypto.randomInt(1_000, 10_000))
  } = {}
) {
  const nonce = nonceFactory();
  if (!/^[a-z0-9]{5,16}$/.test(nonce)) {
    throw new Error('authentication nonce must be bounded lowercase ASCII');
  }
  const pin = pinFactory();
  if (!/^[0-9]{4,6}$/.test(pin)) {
    throw new Error('authentication PIN must contain 4 through 6 digits');
  }
  const scenario = safeSlug(scenarioId).slice(0, 11);
  const username = `e2e_${scenario}_${nonce}`.slice(0, 32);
  const actionBase = `${scenario}-${nonce}`.slice(0, 55).replace(/-$/, '');
  const actionID = `${actionBase}-a1`;
  const seedActionID = `seed-${nonce}-a1`;
  return Object.freeze({
    username,
    pin,
    actionID,
    seedActionID,
    safe: Object.freeze({ username })
  });
}
