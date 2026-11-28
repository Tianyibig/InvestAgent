import { expect, test } from "@playwright/test";

const BASE = process.env.INVEST_BASE_PATH ?? "/invest";

test.describe("投资工作台", () => {
  test("双轨切换：一级显示项目绑定，二级显示标的与股票列", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByTestId("project-input")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "公司" })).toBeVisible();

    await page.getByTestId("mode-secondary").click();
    await expect(page.getByTestId("project-input")).toHaveCount(0);
    await expect(page.getByTestId("ticker-hint")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "代码" })).toBeVisible();
  });

  test("大纲审批：打回重规划，通过后进入分析并跑完", async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId("start-run").click();
    await expect(page.getByTestId("outline-approve")).toBeEnabled({ timeout: 15_000 });

    await page.getByTestId("outline-reject").click();
    await expect(page.getByTestId("outline-attempts")).toContainText("第 2 版");
    await expect(page.getByTestId("outline-approve")).toBeEnabled({ timeout: 15_000 });

    await page.getByTestId("outline-approve").click();
    await expect(page.getByTestId("analyst-count")).toHaveText("4/4", { timeout: 20_000 });
    await expect(page.getByTestId("debate-count")).toHaveText("4/4", { timeout: 20_000 });
    await expect(page.getByTestId("verdict")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("phase")).toHaveText("已完成");
  });

  test("矩阵导出 xlsx", async ({ page }) => {
    await page.goto(BASE);
    const download = page.waitForEvent("download");
    await page.getByTestId("export-xlsx").click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^invest-matrix-primary_pe_vc\.xlsx$/);
  });

  test("证据抽屉：PDF 渲染与 bbox 高亮", async ({ page }) => {
    await page.goto(BASE);
    await page.getByTestId("citation-c_001").click();
    await expect(page.getByTestId("pdf-drawer")).toBeVisible();
    await expect(page.getByTestId("pdf-highlight")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("pdf-close").click();
    await expect(page.getByTestId("pdf-drawer")).toHaveCount(0);
  });

  test("无控制台错误", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(BASE);
    await page.getByTestId("citation-c_010").click();
    await expect(page.getByTestId("pdf-highlight")).toBeVisible({ timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  test("复盘归档：填写教训后提交并回显", async ({ page }) => {
    await page.route("**/api/invest/reflections", async (route) => {
      const body = route.request().postDataJSON() as { lesson_learned?: string };
      expect(body.lesson_learned).toContain("份额");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ reflection_id: "r-1" }),
      });
    });

    await page.goto(BASE);
    await page.getByTestId("start-run").click();
    await expect(page.getByTestId("outline-approve")).toBeEnabled({ timeout: 15_000 });
    await page.getByTestId("outline-approve").click();
    await expect(page.getByTestId("phase")).toHaveText("已完成", { timeout: 20_000 });

    await page.getByTestId("archive-lesson").fill("份额假设超出历史极值，下次先做反推");
    await page.getByTestId("archive-reflection").click();
    await expect(page.getByTestId("archive-status")).toContainText("已归档");
  });

  test("SSE 实时流：大纲与分析事件来自服务端", async ({ page }) => {
    await page.route("**/api/invest/stream", async (route) => {
      const body = route.request().postDataJSON() as { mode: string };
      const sse =
        body.mode === "start"
          ? 'data: {"type":"outline","skill":"pe-vc-dd","outline":[{"section":"SSE 大纲一","why":"来自流"}]}\n\n'
          : 'data: {"type":"analyst","key":"tech_bom","status":"done"}\n\ndata: {"type":"debate","side":"bull","round":1,"text":"流里的正方"}\n\ndata: {"type":"phase","phase":"done"}\n\n';
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body: sse,
      });
    });

    await page.goto(BASE);
    await page.getByTestId("start-run").click();
    await expect(page.getByTestId("stream-mode")).toHaveText("SSE 实时流", { timeout: 15_000 });
    await expect(page.getByTestId("outline-list")).toContainText("SSE 大纲一", { timeout: 15_000 });

    await page.getByTestId("outline-approve").click();
    await expect(page.getByTestId("debate-count")).toHaveText("1/4", { timeout: 15_000 });
    await expect(page.getByTestId("phase")).toHaveText("已完成");
  });
});