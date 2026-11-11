import { expect, test, type Page } from '@playwright/test';

const NEW_HIRE_NAME = 'Мария Попова';
const PRIVATE_COMMENT = 'Хочу обсудить график, с директором говорить неудобно';

test.beforeEach(async ({ request }) => {
  const response = await request.post('/api/demo/reset');
  expect(response.ok()).toBe(true);
});

const acceptHireTask = async (page: Page): Promise<string> => {
  await page.goto('/hr/b24');
  const task = page.getByRole('article').filter({ hasText: NEW_HIRE_NAME });
  await task.getByRole('button', { name: 'Завести в «Первые 90»' }).click();
  await expect(page.getByText('Новичок заведён')).toBeVisible();

  const newcomerLink = page.getByRole('link', { name: /Страница новичка/ });
  const href = await newcomerLink.getAttribute('href');
  if (!href) throw new Error('Ссылка на страницу новичка не найдена');
  return href;
};

const submitBadCheckin = async (page: Page, newcomerPath: string) => {
  await page.goto(newcomerPath);
  await expect(page.getByRole('heading', { level: 1, name: /Мария/ })).toBeVisible();

  await page
    .getByRole('group', { name: 'Как вы себя чувствуете на работе на этой неделе?' })
    .getByText('Плохо', { exact: true })
    .click();
  await page
    .getByRole('group', { name: 'Понятно, что от вас ждут?' })
    .getByText('Да', { exact: true })
    .click();
  await page
    .getByRole('group', { name: 'Хватает помощи от наставника и коллег?' })
    .getByText('Частично', { exact: true })
    .click();
  await page.getByRole('textbox', { name: /Хотите что-то добавить/ }).fill(PRIVATE_COMMENT);
  await page.getByRole('checkbox', { name: /Хочу поговорить с HR/ }).check();
  await page.getByRole('button', { name: 'Отправить ответы' }).click();

  await expect(page.getByText('Спасибо, ответы получены!')).toBeVisible();
};

test('новичок из Битрикс24 жалуется в чек-ине — HR видит риск, руководитель видит только сигнал', async ({
  page,
}) => {
  const newcomerPath = await acceptHireTask(page);
  await submitBadCheckin(page, newcomerPath);

  await page.goto('/hr');
  const firstRow = page.getByRole('row').nth(1);
  await expect(firstRow).toContainText(NEW_HIRE_NAME);
  await expect(firstRow).toContainText('Высокий риск');
  await expect(firstRow).toContainText('Просит связаться с HR');

  await page.goto('/manager');
  const managerCard = page.getByRole('article').filter({ hasText: NEW_HIRE_NAME });
  await expect(managerCard).toContainText('Есть сигнал для HR');
  await expect(managerCard).not.toContainText('Просит связаться с HR');

  await managerCard.getByRole('link', { name: NEW_HIRE_NAME }).click();
  await expect(page.getByRole('heading', { level: 1, name: NEW_HIRE_NAME })).toBeVisible();
  await expect(page.getByText('Самочувствие').first()).toBeVisible();
  await expect(page.getByText(PRIVATE_COMMENT)).toHaveCount(0);

  await page.getByRole('link', { name: 'HR', exact: true }).click();
  await page.getByRole('link', { name: NEW_HIRE_NAME }).click();
  await expect(page.getByText(PRIVATE_COMMENT)).toBeVisible();
  await page.getByRole('button', { name: 'Отметить: HR связался' }).click();
  await expect(page.getByText(/HR связывался/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Риск и что сделать' })).not.toContainText(
    'Просит связаться с HR',
  );
});

test('руководитель отмечает встречу — просрочка уходит из причин риска', async ({ page }) => {
  await page.goto('/manager');
  const managerSelect = page.getByRole('combobox', { name: /Вы смотрите как/ });
  const managerValue = await managerSelect
    .locator('option', { hasText: 'Руслан Хабибуллин' })
    .getAttribute('value');
  if (!managerValue) throw new Error('Руководитель не найден');
  await managerSelect.selectOption(managerValue);

  const card = page.getByRole('article').filter({ hasText: 'Просрочена встреча' }).first();
  const name = (await card.getByRole('link').textContent()) ?? '';
  await card.getByRole('link').click();

  const riskRegion = page.getByRole('region', { name: 'Риск и что сделать' });
  await expect(riskRegion).toContainText('Просрочена встреча');

  const overdueItem = page
    .getByRole('listitem')
    .filter({ hasText: 'Просрочена' })
    .filter({
      has: page.getByRole('button', { name: 'Отметить проведённой' }),
    });
  const overdueCount = await overdueItem.count();
  for (let index = 0; index < overdueCount; index += 1) {
    await overdueItem.first().getByRole('button', { name: 'Отметить проведённой' }).click();
    await page
      .getByRole('textbox', { name: /Итоги встречи/ })
      .fill('Поговорили, договорились о плане');
    await page.getByRole('button', { name: 'Сохранить', exact: true }).first().click();
    await expect(page.getByRole('textbox', { name: /Итоги встречи/ })).toHaveCount(0);
  }

  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await expect(riskRegion).not.toContainText('Просрочена встреча');
});

test('фильтр радара по риску хранится в адресе страницы', async ({ page }) => {
  await page.goto('/hr?risk=high');
  const rows = page.getByRole('row').filter({ has: page.getByRole('rowheader') });
  await expect(rows.first()).toBeVisible();

  const rowCount = await rows.count();
  for (let index = 0; index < rowCount; index += 1) {
    await expect(rows.nth(index)).toContainText('Высокий риск');
  }

  await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
  await expect(page).toHaveURL(/\/hr$/);
});

test('несуществующая ссылка новичка показывает понятную ошибку', async ({ page }) => {
  await page.goto('/n/unknown-token');
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
});
