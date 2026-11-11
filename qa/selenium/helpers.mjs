/**
 * Utilidades compartidas para las pruebas E2E con Selenium WebDriver.
 * Todas las interacciones usan los atributos data-testid del frontend React.
 * Credenciales: variables de entorno con fallback a los datos semilla de la matriz de pruebas.
 */
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
export const TIMEOUT = Number(process.env.E2E_TIMEOUT ?? 10_000);

export const STUDENT = {
  name: 'Juan Pérez',
  code: process.env.E2E_STUDENT_CODE ?? '20261001',
  password: process.env.E2E_STUDENT_PASSWORD ?? 'Estudiante123',
};
export const ADMIN = {
  code: process.env.E2E_ADMIN_CODE ?? 'ADMIN001',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'Admin123',
};
export const WRONG_PASSWORD = process.env.E2E_WRONG_PASSWORD ?? 'Incorrecta123';

export const byTestId = (testId) => By.css(`[data-testid="${testId}"]`);

export async function buildDriver() {
  const options = new chrome.Options();
  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }
  options.addArguments('--window-size=1366,900', '--no-sandbox', '--lang=es-CO');
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

export async function waitVisible(driver, locator, timeout = TIMEOUT) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

/** Espera hasta que algún elemento del locator contenga el texto esperado y devuelve ese texto. */
export async function waitForText(driver, locator, expected, timeout = TIMEOUT) {
  let lastText = '';
  try {
    await driver.wait(async () => {
      const elements = await driver.findElements(locator);
      for (const element of elements) {
        lastText = await element.getText();
        if (lastText.includes(expected)) return true;
      }
      return false;
    }, timeout);
  } catch {
    throw new Error(`No apareció el texto "${expected}". Último texto leído: "${lastText}"`);
  }
  return lastText;
}

export async function waitForUrl(driver, fragment) {
  await driver.wait(until.urlContains(fragment), TIMEOUT);
  return driver.getCurrentUrl();
}

/** Abre el login con la sesión limpia. */
export async function openLogin(driver) {
  await driver.get(`${BASE_URL}/login`);
  await driver.executeScript('window.localStorage.clear();');
  await driver.get(`${BASE_URL}/login`);
  await waitVisible(driver, byTestId('btn-login'));
}

export async function submitLogin(driver, studentCode, password) {
  const codeInput = await waitVisible(driver, byTestId('input-student-code'));
  const passwordInput = await waitVisible(driver, byTestId('input-password'));
  await codeInput.clear();
  await passwordInput.clear();
  if (studentCode) await codeInput.sendKeys(studentCode);
  if (password) await passwordInput.sendKeys(password);
  const previousAlerts = await driver.findElements(byTestId('alert-message'));
  await driver.findElement(byTestId('btn-login')).click();
  // El formulario limpia la alerta anterior al enviar: esperar a que desaparezca evita leer un mensaje viejo.
  for (const alert of previousAlerts) {
    await driver.wait(until.stalenessOf(alert), TIMEOUT);
  }
}

export async function loginAs(driver, user, expectedPath) {
  await openLogin(driver);
  await submitLogin(driver, user.code, user.password);
  await waitForUrl(driver, expectedPath);
}

export async function logout(driver) {
  const button = await waitVisible(driver, byTestId('btn-logout'));
  await button.click();
  await waitForUrl(driver, '/login');
}

/**
 * Asigna el valor a un input controlado por React (útil para <input type="date">,
 * cuyo formato de teclado depende del idioma del navegador).
 */
export async function setReactInputValue(driver, element, value) {
  await driver.executeScript(
    `const [el, value] = arguments;
     const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
     setter.call(el, value);
     el.dispatchEvent(new Event('input', { bubbles: true }));
     el.dispatchEvent(new Event('change', { bubbles: true }));`,
    element,
    value,
  );
}

export async function selectOption(selectElement, value) {
  await selectElement.findElement(By.css(`option[value="${value}"]`)).click();
}

/** Fecha futura YYYY-MM-DD (evita reservar en el pasado según el reloj real del servidor). */
export function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
