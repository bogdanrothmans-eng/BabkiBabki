import path from "node:path"

import { type Browser, expect, type Page, test } from "@playwright/test"

// One budget, two people: the owner imports the spreadsheet and invites a
// partner; both add, comment, attach a receipt and edit the same entry.

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
)

async function register(page: Page, name: string, email: string, path = "/register") {
  await page.goto(path)
  if (!page.url().includes("/register")) await page.getByRole("link", { name: /Создать аккаунт/ }).click()
  await page.getByLabel("Имя").fill(name)
  await page.getByLabel("Почта").fill(email)
  await page.getByLabel("Пароль", { exact: true }).fill("secret123")
  await page.getByRole("button", { name: "Создать аккаунт" }).click()
  await expect(page.getByText(/Потрачено в/)).toBeVisible()
}

async function openAddDialog(page: Page) {
  const fab = page.getByRole("button", { name: "Добавить запись" })
  if (await fab.isVisible()) await fab.click()
  else await page.getByRole("button", { name: "Добавить", exact: true }).click()
}

async function newPage(browser: Browser) {
  const context = await browser.newContext(test.info().project.use)
  return context.newPage()
}

test("a couple shares one budget", async ({ page, browser }, info) => {
  const run = `${Date.now()}-${info.project.name}`
  await register(page, "Аня", `anya-${run}@example.com`)

  // Import the anonymized copy of the couple's spreadsheet.
  await page.goto("/settings")
  await page.getByLabel("CSV-файл").setInputFiles(path.join(__dirname, "../seed/sheet-sample.csv"))
  await page.getByLabel("Год").fill("2026")
  await page.getByRole("button", { name: "Импортировать" }).click()
  await expect(page.getByText(/Перенесли 55 сумм/)).toBeVisible()
  await expect(page.getByText(/записано с пробелом/)).toBeVisible()

  // 51 089 in the sheet + the 4 603 typed as text. Phones get a month list
  // instead of the wide table.
  await page.goto("/table?y=2026")
  const total =
    info.project.name === "mobile"
      ? page.getByRole("link", { name: /январь/i })
      : page.getByRole("row", { name: /Итог месяца/ })
  await expect(total).toContainText("55 692")

  // Invite the partner: the overview nudges a single-member budget to do it.
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Пригласите партнёра" })).toBeVisible()
  await page.getByRole("button", { name: "Отправить ссылку" }).click()
  await expect(page.getByText(/Ссылка скопирована/)).toBeVisible()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toContain("/invite/")

  const partner = await newPage(browser)
  await partner.goto(new URL(link).pathname)
  await expect(partner.getByText(/Аня зовёт вас/)).toBeVisible()
  await register(partner, "Миша", `misha-${run}@example.com`, new URL(link).pathname)

  // Partner adds an expense with a receipt.
  await openAddDialog(partner)
  await partner.getByLabel("Сумма").fill("1250")
  await expect(partner.getByLabel("Сумма")).toHaveValue("1 250")
  await partner.getByRole("button", { name: /Все категории/ }).click()
  await partner.getByRole("button", { name: /Продукты питания/ }).click()
  await partner.getByLabel("Комментарий").fill("Пятёрочка на неделю")
  await partner.locator('input[type="file"]').setInputFiles({ name: "check.png", mimeType: "image/png", buffer: PNG })
  await partner.getByRole("button", { name: /Добавить 1\s250/ }).click()
  await expect(partner.getByText("Добавлено")).toBeVisible()

  await partner.getByRole("link", { name: /Пятёрочка на неделю/ }).first().click()
  await expect(partner.getByRole("definition").filter({ hasText: "Миша" })).toBeVisible()
  await partner.getByLabel("Комментарий").fill("Взял на всю неделю")
  await partner.getByRole("button", { name: "Отправить" }).click()
  await expect(partner.getByText("Взял на всю неделю")).toBeVisible()
  const photo = partner.getByRole("img", { name: "check.png" })
  await expect(photo).toBeVisible()
  const fileUrl = await photo.getAttribute("src")

  // The owner sees it, can open the receipt and fixes the amount.
  await page.goto("/transactions")
  await page.getByRole("link", { name: /Пятёрочка на неделю/ }).first().click()
  await expect(page.getByText("Взял на всю неделю")).toBeVisible()
  expect((await page.request.get(fileUrl!)).status()).toBe(200)
  await page.getByRole("button", { name: "Изменить" }).click()
  await page.getByLabel("Сумма").fill("1300")
  await page.getByRole("button", { name: /Сохранить 1\s300/ }).click()
  await expect(page.getByText("Сохранено")).toBeVisible()
  await expect(page.getByRole("paragraph").filter({ hasText: /^1\s300 ₽$/ })).toBeVisible()

  // The banner is gone once the partner has joined.
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Пригласите партнёра" })).toHaveCount(0)

  // Someone outside the budget cannot fetch the receipt.
  const stranger = await newPage(browser)
  await register(stranger, "Чужой", `stranger-${run}@example.com`)
  expect((await stranger.request.get(fileUrl!)).status()).toBe(404)
})

test("add form explains what is missing next to the field", async ({ page }, info) => {
  await register(page, "Лена", `lena-${Date.now()}-${info.project.name}@example.com`)
  await openAddDialog(page)
  await page.getByRole("button", { name: /^Добавить$/ }).last().click()
  await expect(page.getByText("Введите сумму больше нуля")).toBeVisible()
  await expect(page.getByLabel("Сумма")).toBeFocused()
  await page.getByLabel("Сумма").fill("300")
  await page.getByRole("button", { name: /Добавить 300/ }).click()
  await expect(page.getByText("Выберите категорию")).toBeVisible()
})

test("categories get a vector icon and colour", async ({ page }, info) => {
  await register(page, "Катя", `katya-${Date.now()}-${info.project.name}@example.com`)
  await page.goto("/categories")
  await page.getByRole("button", { name: "Новая категория" }).click()
  await page.getByLabel("Название").fill("Цветы")
  await page.getByRole("radio", { name: "росток" }).click()
  await page.getByRole("radio", { name: "розовый" }).click()
  await page.getByRole("button", { name: "Добавить", exact: true }).last().click()
  await expect(page.getByText("Категория добавлена")).toBeVisible()
  await expect(page.getByRole("button", { name: "Изменить «Цветы»" })).toBeVisible()

  await page.getByRole("button", { name: "Убрать «Цветы»" }).click()
  await expect(page.getByRole("alertdialog")).toContainText("Записей в ней нет")
  await page.getByRole("button", { name: "Удалить", exact: true }).click()
  await expect(page.getByRole("button", { name: "Изменить «Цветы»" })).toHaveCount(0)
})

test("period picker switches months and years", async ({ page }, info) => {
  await register(page, "Оля", `olya-${Date.now()}-${info.project.name}@example.com`)
  await page.goto("/?p=2026-07")
  await expect(page.getByRole("button", { name: "Июль 2026" })).toBeVisible()
  await page.getByRole("link", { name: "Предыдущий период" }).click()
  await expect(page.getByRole("button", { name: "Июнь 2026" })).toBeVisible()
  await page.getByRole("button", { name: "Июнь 2026" }).click()
  await page.getByRole("tab", { name: "Год" }).click()
  await page.getByRole("button", { name: "2026", exact: true }).click()
  await expect(page.getByRole("button", { name: "2026 год" })).toBeVisible()
  await expect(page.getByText("Потрачено в 2026 году")).toBeVisible()
})
