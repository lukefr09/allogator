import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const row = (page: Page, symbol = 'VOO') =>
  page.locator('tr[data-asset="' + symbol + '"]');
const trade = (page: Page, symbol = 'VOO') =>
  page.locator('[data-trade="' + symbol + '"]');
const tradePlan = (page: Page) =>
  page.getByRole('region', { name: 'Trade plan' });

async function details(page: Page, symbol = 'VOO') {
  await row(page, symbol)
    .getByRole('button', { name: `Edit ${symbol}` })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('shows an offline plan, stays within viewport, and has no automated accessibility violations', async ({
  page,
}) => {
  await expect(trade(page).getByText('Buy $400.00')).toBeVisible();
  await expect(tradePlan(page).getByText('$2,000.00')).toBeVisible();
  const mix = page.getByRole('region', { name: 'Allocation mix' });
  const voo = mix.getByRole('row', { name: 'VOO 60.00% 50.00%' });
  await expect(voo).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test('accepts zero contribution and rebalances by selling', async ({
  page,
}) => {
  await page.getByLabel('New contribution', { exact: true }).fill('0');
  await page.getByRole('checkbox', { name: 'Allow selling' }).check();
  await expect(
    page.getByLabel('New contribution', { exact: true }),
  ).toHaveValue('0');
  await expect(trade(page).getByText('Sell $100.00')).toBeVisible();
  await expect(trade(page, 'NVDA').getByText('Buy $100.00')).toBeVisible();
  await expect(tradePlan(page).getByText('$1,000.00')).toBeVisible();
});

test('pauses results for invalid field drafts and mismatched targets', async ({
  page,
}) => {
  await page.getByLabel('VOO current value', { exact: true }).fill('');
  await expect(
    page.getByText('Check the highlighted fields.', { exact: false }),
  ).toBeVisible();
  await expect(trade(page).getByText('Buy $400.00')).toHaveCount(0);
  await page.getByLabel('VOO current value', { exact: true }).fill('600');
  await page.getByLabel('VOO target weight', { exact: true }).fill('49.95');
  await expect(page.getByText('Allocate the remaining 0.05%.')).toBeVisible();
  await page.getByLabel('VOO target weight', { exact: true }).fill('50');
  await expect(trade(page).getByText('Buy $400.00')).toBeVisible();
});

test('manual price entry works before any quote and quantity valuation is explicit', async ({
  page,
}) => {
  await details(page);
  await page.getByLabel('VOO USD price', { exact: true }).fill('100');
  await page
    .getByRole('combobox', { name: 'Holding entered as' })
    .selectOption('shares');
  await expect(page.getByLabel('VOO quantity', { exact: true })).toHaveValue(
    '6',
  );
  await page.getByLabel('VOO quantity', { exact: true }).fill('7');
  await expect(
    row(page).locator('.holding-value').getByText('$700.00'),
  ).toBeVisible();
  await page.getByLabel('VOO USD price', { exact: true }).fill('200');
  await expect(
    row(page).locator('.holding-value').getByText('$1,400.00'),
  ).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);

  await page.getByLabel('VOO USD price', { exact: true }).fill('');
  const mix = page.getByRole('region', { name: 'Allocation mix' });
  await expect(mix.getByRole('row', { name: 'VOO — —' })).toBeVisible();
  await expect(page.locator('.total-current')).toHaveText('—');
});

test('failed quotes keep manual fallback usable and successful quotes do not change dollar holdings', async ({
  page,
}) => {
  let fail = true;
  await page.route('**/api/quote?*', (route) =>
    route.fulfill({
      status: fail ? 503 : 200,
      json: fail
        ? {
            error:
              'Automatic quotes are not configured. Enter a price manually.',
          }
        : {
            price: 200,
            quoteTime: '2026-09-17T20:00:00Z',
            fetchedAt: '2026-09-18T01:00:00Z',
          },
    }),
  );
  await details(page);
  await page.getByRole('button', { name: 'Fetch quote' }).click();
  await expect(
    page.getByText('Automatic quotes are not configured.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel('VOO USD price', { exact: true })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Fetch quote' }).click();
  await expect(page.getByLabel('VOO USD price', { exact: true })).toHaveValue(
    '200',
  );
  await expect(
    page.getByLabel('VOO current value', { exact: true }),
  ).toHaveValue('600');
});

test('a pending quote cannot restore a deleted holding', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/quote?*', async (route) => {
    await gate;
    await route
      .fulfill({
        json: {
          price: 200,
          quoteTime: '2026-09-17T20:00:00Z',
          fetchedAt: '2026-09-18T01:00:00Z',
        },
      })
      .catch(() => {});
  });
  await details(page);
  await page.getByRole('button', { name: 'Fetch quote' }).click();
  await expect(page.getByRole('button', { name: 'Fetching…' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove VOO' }).click();
  release();
  await expect(row(page)).toHaveCount(0);
  await expect(page.locator('.holding-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(row(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fetching…' })).toHaveCount(0);
});

test('pending quote results preserve an edit and cannot replace a manual price', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/quote?*', async (route) => {
    await gate;
    await route
      .fulfill({
        json: {
          price: 200,
          quoteTime: '2026-09-17T20:00:00Z',
          fetchedAt: '2026-09-18T01:00:00Z',
        },
      })
      .catch(() => {});
  });
  await details(page);
  await page.getByRole('button', { name: 'Fetch quote' }).click();
  await page.getByLabel('VOO current value', { exact: true }).fill('987');
  await page.getByLabel('VOO USD price', { exact: true }).fill('55');
  release();
  await expect(
    page.getByLabel('VOO current value', { exact: true }),
  ).toHaveValue('987');
  await expect(page.getByLabel('VOO USD price', { exact: true })).toHaveValue(
    '55',
  );
  await expect(
    page.getByRole('button', { name: 'Replace with quote' }),
  ).toBeEnabled();
});

test('times out a pending quote and restores the retry control', async ({
  page,
}) => {
  await page.clock.install();
  await page.route('**/api/quote?*', () => {});
  await details(page);
  await page.getByRole('button', { name: 'Fetch quote' }).click();
  await page.clock.fastForward(8500);
  await expect(
    page.getByText('Quote timed out. Enter a price or try again.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fetch quote' })).toBeEnabled();
});

test('native add dialog manages focus, supports Escape, and adds explicit crypto types', async ({
  page,
}) => {
  const add = page.getByRole('button', { name: 'Add holding', exact: true });
  await add.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('dialog').getByLabel('Symbol', { exact: true }),
  ).toBeFocused();
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(add).toBeFocused();
  await add.click();
  await page
    .getByRole('dialog')
    .getByLabel('Symbol', { exact: true })
    .fill('SOL');
  await page
    .getByRole('combobox', { name: 'Asset type' })
    .selectOption('crypto');
  await page.getByLabel('New holding current value').fill('125.55');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add holding', exact: true })
    .click();
  await expect(row(page, 'SOL')).toBeVisible();
  await expect(row(page, 'SOL').getByLabel('SOL current value')).toHaveValue(
    '125.55',
  );
  await details(page, 'SOL');
  await expect(page.getByRole('combobox', { name: 'Asset type' })).toHaveValue(
    'crypto',
  );
  await expect(row(page, 'SOL').getByLabel('SOL target weight')).toHaveValue(
    '0',
  );
});

test('shares a fragment snapshot and explains clipboard failure', async ({
  page,
  isMobile,
}) => {
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    }),
  );
  await page.getByLabel('New contribution', { exact: true }).fill('123');
  await page.getByRole('button', { name: 'Share portfolio' }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByText('Anyone with the link can read them.', { exact: false }),
  ).toBeVisible();
  const url = await page.getByLabel('Portfolio link').inputValue();
  expect(new URL(url).hash).toMatch(/^#p=/);
  expect(new URL(url).search).toBe('');
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(
    page.getByText('Select the link above and copy it manually.'),
  ).toBeVisible();
  await page.goto(url);
  await expect(
    page.getByLabel('New contribution', { exact: true }),
  ).toHaveValue('123');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  if (isMobile) {
    await page.getByRole('link', { name: 'View trade plan' }).click();
    await expect(page.locator('#trade-plan')).toBeFocused();
    await expect(page).toHaveURL(url);
  }
});

test('optional saving persists and unchecking erases the saved draft', async ({
  page,
}) => {
  await page.getByRole('checkbox', { name: 'Save on this device' }).check();
  await page.getByLabel('New contribution', { exact: true }).fill('234');
  await page.reload();
  await expect(
    page.getByLabel('New contribution', { exact: true }),
  ).toHaveValue('234');
  await page.getByRole('checkbox', { name: 'Save on this device' }).uncheck();
  await page.reload();
  await expect(
    page.getByLabel('New contribution', { exact: true }),
  ).toHaveValue('1000');
});

test('invalid shared links report failure and reset can be undone', async ({
  page,
}) => {
  await page.goto('/#p=invalid');
  await expect(
    page.getByText('This portfolio could not be opened.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('.holding-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.locator('.holding-row')).toHaveCount(3);
  await page.getByRole('button', { name: 'Start from scratch' }).click();
  await expect(
    page.getByRole('heading', { name: 'Add your first holding' }),
  ).toBeVisible();
  await expect(page.locator('.holding-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.holding-row')).toHaveCount(3);
});

test('locked holdings remain unsold and the result does not claim perfect balance', async ({
  page,
}) => {
  await page.getByLabel('New contribution', { exact: true }).fill('0');
  await page.getByRole('checkbox', { name: 'Allow selling' }).check();
  await details(page);
  await page.getByRole('checkbox', { name: 'Do not sell VOO' }).check();
  await expect(
    trade(page).getByText('No trade', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Targets limited by selling settings.'),
  ).toBeVisible();
});

test('explains allocation drift caused by rounding to whole cents', async ({
  page,
}) => {
  await page.getByLabel('New contribution', { exact: true }).fill('0');
  await page.getByRole('checkbox', { name: 'Allow selling' }).check();
  await page.getByLabel('VOO current value', { exact: true }).fill('0.01');
  await page.getByLabel('QQQ current value', { exact: true }).fill('0');
  await page.getByLabel('NVDA current value', { exact: true }).fill('0');
  await expect(
    tradePlan(page).getByText(
      'Trades use whole cents, which can affect final weights.',
    ),
  ).toBeVisible();
  await expect(tradePlan(page).getByText('On target')).toHaveCount(0);
});

test('undo restores a removed holding and keeps later edits', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Remove QQQ' }).click();
  await page.getByLabel('New contribution', { exact: true }).fill('1234');
  await page.getByLabel('VOO current value', { exact: true }).fill('650');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(row(page, 'QQQ')).toBeVisible();
  await expect(
    page.getByLabel('New contribution', { exact: true }),
  ).toHaveValue('1234');
  await expect(
    page.getByLabel('VOO current value', { exact: true }),
  ).toHaveValue('650');
});

test('a saved draft with a duplicate ticker can be reopened and corrected', async ({
  page,
}) => {
  await page.getByRole('checkbox', { name: 'Save on this device' }).check();
  await page.getByLabel('New contribution', { exact: true }).fill('777');
  await details(page, 'QQQ');
  await page.getByRole('textbox', { name: 'Symbol', exact: true }).fill('VOO');
  await expect(
    page.getByText('Each asset can appear only once.'),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel('New contribution', { exact: true }),
  ).toHaveValue('777');
  await expect(
    page.getByText('Each asset can appear only once.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Edit VOO' }).last().click();
  await page
    .locator('.details-row:visible')
    .getByLabel('Symbol', { exact: true })
    .fill('QQQ');
  await expect(row(page, 'QQQ')).toHaveCount(1);
  await expect(tradePlan(page).getByText('On target')).toBeVisible();
});

test('a fetched price is shown after leaving the field that was focused', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/quote?*', async (route) => {
    await gate;
    await route.fulfill({
      json: {
        price: 200,
        quoteTime: '2026-09-17T20:00:00Z',
        fetchedAt: '2026-09-18T01:00:00Z',
      },
    });
  });
  await details(page);
  await page.getByRole('button', { name: 'Fetch quote' }).click();
  const price = page.getByLabel('VOO USD price', { exact: true });
  await price.focus();
  release();
  await expect(page.getByText(/^Quote ·/)).toBeVisible();
  await price.press('Tab');
  await expect(price).toHaveValue('200');
});

test('invalid prices stay visible until corrected, and importing does not overwrite saved data', async ({
  page,
}) => {
  await details(page);
  await page.getByLabel('VOO USD price', { exact: true }).fill('-1');
  await expect(
    row(page).getByRole('button', { name: 'Close VOO details' }),
  ).toBeDisabled();
  await page.getByLabel('VOO USD price', { exact: true }).fill('100');
  await expect(
    row(page).getByRole('button', { name: 'Close VOO details' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Share portfolio' }).click();
  const shared = await page.getByLabel('Portfolio link').inputValue();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Save on this device' }).check();
  await page.getByLabel('New contribution', { exact: true }).fill('321');
  await page.goto(shared);
  await expect(
    page.getByLabel('New contribution', { exact: true }),
  ).toHaveValue('1000');
  await expect(
    page.getByRole('checkbox', { name: 'Save on this device' }),
  ).not.toBeChecked();
  await page.goto('/');
  await page.reload();
  await expect(
    page.getByLabel('New contribution', { exact: true }),
  ).toHaveValue('321');
});

test('small manual prices keep decimal notation after leaving the field', async ({
  page,
}) => {
  await details(page);
  const price = page.getByLabel('VOO USD price', { exact: true });
  await price.fill('0.00000001');
  await price.press('Tab');
  await expect(price).toHaveValue('0.00000001');
});
