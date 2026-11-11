/**
 * E2E HU-02 / HU-03 (+ HU-04 y HU-05 encadenadas): flujo crítico de reservas.
 * Estudiante filtra y reserva -> regla de simultaneidad -> encargado aprueba -> equipo "Prestado"
 * -> encargado registra la devolución -> equipo "Disponible".
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { By } from 'selenium-webdriver';
import {
  ADMIN,
  STUDENT,
  buildDriver,
  byTestId,
  futureDate,
  loginAs,
  logout,
  selectOption,
  setReactInputValue,
  waitForText,
  waitVisible,
} from './helpers.mjs';

const RESERVATION_DATE = futureDate(20);

async function filterCategory(driver, category) {
  const select = await waitVisible(driver, byTestId('filter-category'));
  await selectOption(select, category);
  await driver.wait(async () => (await driver.findElements(byTestId('catalog-loading'))).length === 0, 10_000);
}

async function visibleInventoryCodes(driver) {
  const cells = await driver.findElements(byTestId('equipment-code'));
  return Promise.all(cells.map((cell) => cell.getText()));
}

async function openReservationFor(driver, inventoryCode) {
  const row = await waitVisible(driver, byTestId(`equipment-row-${inventoryCode}`));
  await row.findElement(byTestId('btn-reserve')).click();
  return waitVisible(driver, byTestId('reservation-modal'));
}

async function fillReservation(driver, modal, { date, startTime, endTime }) {
  await setReactInputValue(driver, await modal.findElement(byTestId('input-reservation-date')), date);
  await selectOption(await modal.findElement(byTestId('input-start-time')), startTime);
  await selectOption(await modal.findElement(byTestId('input-end-time')), endTime);
  await modal.findElement(byTestId('btn-confirm-reservation')).click();
}

async function equipmentStatus(driver, inventoryCode) {
  const row = await waitVisible(driver, byTestId(`equipment-row-${inventoryCode}`));
  return row.findElement(byTestId('equipment-status')).getText();
}

describe('HU-03 Reserva de equipos (E2E)', { timeout: 180_000 }, () => {
  let driver;

  before(async () => {
    driver = await buildDriver();
    await loginAs(driver, STUDENT, '/catalog');
  });

  after(async () => {
    await driver?.quit();
  });

  it('HU-02: el filtro "Cómputo" muestra solo equipos de cómputo con su estado', async () => {
    await filterCategory(driver, 'Cómputo');
    const codes = await visibleInventoryCodes(driver);
    assert.deepEqual(codes, ['INV-COMP-001', 'INV-COMP-002']);
    assert.equal(await equipmentStatus(driver, 'INV-COMP-001'), 'Disponible');
  });

  it(`CP-014: reservar Laptop HP-001 el ${RESERVATION_DATE} de 09:00 a 11:00 -> queda "Pendiente"`, async () => {
    const modal = await openReservationFor(driver, 'INV-COMP-001');
    await fillReservation(driver, modal, { date: RESERVATION_DATE, startTime: '09:00', endTime: '11:00' });
    await waitForText(driver, byTestId('alert-message'), 'Pendiente');
  });

  it('CP-018: reservar Proyector PR-002 de 10:00 a 12:00 el mismo día -> impide reserva simultánea', async () => {
    const modal = await openReservationFor(driver, 'INV-COMP-002');
    await fillReservation(driver, modal, { date: RESERVATION_DATE, startTime: '10:00', endTime: '12:00' });
    const text = await waitForText(driver, By.css('#reservation-alert-message'), 'simultánea');
    assert.match(text, /No puede reservar más de un equipo/);
    await modal.findElement(byTestId('btn-cancel-reservation')).click();
  });

  it('la reserva aparece en "Mis reservas" con estado Pendiente', async () => {
    await (await waitVisible(driver, byTestId('nav-my-reservations'))).click();
    const table = await waitVisible(driver, byTestId('my-reservations-table'));
    await waitForText(driver, byTestId('reservation-status'), 'Pendiente');
    assert.match(await table.getText(), /Laptop HP-001/);
  });

  it('HU-04 (CP-021/CP-024): el encargado aprueba y la Laptop pasa a "Prestado"', async () => {
    await logout(driver);
    await loginAs(driver, ADMIN, '/admin/requests');
    await waitForText(driver, byTestId('pending-student-name'), STUDENT.name);
    await (await waitVisible(driver, byTestId('btn-approve'))).click();
    await waitForText(driver, byTestId('alert-message'), 'aprobada');

    await logout(driver);
    await loginAs(driver, STUDENT, '/catalog');
    await driver.wait(async () => (await equipmentStatus(driver, 'INV-COMP-001')) === 'Prestado', 10_000);
  });

  it('HU-05 (CP-026/CP-027): el encargado registra la devolución y la Laptop vuelve a "Disponible"', async () => {
    await logout(driver);
    await loginAs(driver, ADMIN, '/admin/requests');
    await (await waitVisible(driver, byTestId('nav-admin-returns'))).click();
    const search = await waitVisible(driver, byTestId('input-search-student'));
    await search.sendKeys(STUDENT.code);
    await driver.findElement(byTestId('btn-search')).click();
    await (await waitVisible(driver, byTestId('btn-mark-return'))).click();
    await waitForText(driver, byTestId('alert-message'), 'Disponible');

    await logout(driver);
    await loginAs(driver, STUDENT, '/catalog');
    await driver.wait(async () => (await equipmentStatus(driver, 'INV-COMP-001')) === 'Disponible', 10_000);
  });
});
