/**
 * E2E HU-01: bloqueo por intentos fallidos (CP-005 y CP-006).
 * Se ejecuta al final porque deja la cuenta 20261001 bloqueada; "npm run e2e" (raíz)
 * vuelve a aplicar el seed al terminar para desbloquearla.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import {
  STUDENT,
  WRONG_PASSWORD,
  buildDriver,
  byTestId,
  openLogin,
  submitLogin,
  waitForText,
  waitVisible,
} from './helpers.mjs';

describe('HU-01 Bloqueo de cuenta (E2E)', { timeout: 120_000 }, () => {
  let driver;

  before(async () => {
    driver = await buildDriver();
    await openLogin(driver);
  });

  after(async () => {
    await driver?.quit();
  });

  it('CP-005: tres intentos fallidos consecutivos -> bloquea la cuenta con alerta de seguridad', async () => {
    await submitLogin(driver, STUDENT.code, WRONG_PASSWORD);
    await waitForText(driver, byTestId('alert-message'), 'Credenciales inválidas');
    await submitLogin(driver, STUDENT.code, WRONG_PASSWORD);
    await waitForText(driver, byTestId('alert-message'), 'Credenciales inválidas');
    await submitLogin(driver, STUDENT.code, WRONG_PASSWORD);

    const text = await waitForText(driver, byTestId('alert-message'), 'límite de 3 intentos fallidos');
    assert.match(text, /Alerta de seguridad/);
    const alert = await waitVisible(driver, byTestId('alert-message'));
    assert.equal(await alert.getAttribute('data-variant'), 'security');
  });

  it('CP-006: cuenta bloqueada con credenciales correctas -> impide el acceso', async () => {
    await submitLogin(driver, STUDENT.code, STUDENT.password);
    const text = await waitForText(driver, byTestId('alert-message'), 'temporalmente bloqueada');
    assert.match(text, /Alerta de seguridad/);
    assert.match(await driver.getCurrentUrl(), /\/login$/);
  });
});
