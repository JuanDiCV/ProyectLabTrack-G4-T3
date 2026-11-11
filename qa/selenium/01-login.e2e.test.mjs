/**
 * E2E HU-01: Autenticación (CP-001 a CP-004) con Selenium WebDriver.
 * Requiere frontend (5173) y backend (4000) levantados y la BD con el seed aplicado.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { until } from 'selenium-webdriver';
import {
  ADMIN,
  STUDENT,
  WRONG_PASSWORD,
  buildDriver,
  byTestId,
  logout,
  openLogin,
  submitLogin,
  waitForText,
  waitForUrl,
  waitVisible,
} from './helpers.mjs';

describe('HU-01 Login (E2E)', { timeout: 120_000 }, () => {
  let driver;

  before(async () => {
    driver = await buildDriver();
  });

  after(async () => {
    await driver?.quit();
  });

  it('el canvas 3D es decorativo y no bloquea el formulario', async () => {
    await openLogin(driver);
    // El fondo 3D se carga de forma diferida (lazy), por eso se espera a que exista.
    const canvasWrapper = await driver.wait(until.elementLocated(byTestId('bg-canvas')), 15_000);
    assert.equal(await canvasWrapper.getAttribute('aria-hidden'), 'true');
    assert.equal(await canvasWrapper.getCssValue('pointer-events'), 'none');
    assert.ok(await (await driver.findElement(byTestId('input-student-code'))).isEnabled());
  });

  it('CP-004: campos vacíos -> solicita completar los campos obligatorios', async () => {
    await openLogin(driver);
    await submitLogin(driver, '', '');
    const text = await waitForText(driver, byTestId('alert-message'), 'Complete los campos obligatorios');
    assert.match(text, /código de estudiante y contraseña/);
  });

  it('CP-002: código de estudiante inexistente (99999999) -> "Credenciales inválidas"', async () => {
    await openLogin(driver);
    await submitLogin(driver, '99999999', STUDENT.password);
    await waitForText(driver, byTestId('alert-message'), 'Credenciales inválidas');
  });

  it('CP-003: contraseña incorrecta -> "Credenciales inválidas"', async () => {
    await openLogin(driver);
    await submitLogin(driver, STUDENT.code, WRONG_PASSWORD);
    await waitForText(driver, byTestId('alert-message'), 'Credenciales inválidas');
  });

  it('CP-001: credenciales válidas (20261001 / Estudiante123) -> ingresa al catálogo', async () => {
    await openLogin(driver);
    await submitLogin(driver, STUDENT.code, STUDENT.password);
    const url = await waitForUrl(driver, '/catalog');
    assert.match(url, /\/catalog$/);
    const currentUser = await waitVisible(driver, byTestId('current-user'));
    assert.match(await currentUser.getText(), /Juan Pérez/);
    await logout(driver);
  });

  it('el encargado (ADMIN001) ingresa al panel de solicitudes', async () => {
    await openLogin(driver);
    await submitLogin(driver, ADMIN.code, ADMIN.password);
    await waitForUrl(driver, '/admin/requests');
    await waitVisible(driver, byTestId('pending-table'));
    await logout(driver);
  });
});
