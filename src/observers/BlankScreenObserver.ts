import { BatchReporter } from "../reporters/BatchReporter";
import { BaseObserver } from "./BaseObserver";
import { ReportData } from "../types/report";

export class BlankScreenObserver extends BaseObserver {
  private timer: number | null = null;
  private mutationObserver: MutationObserver | null = null;
  private checkPoints: { x: number; y: number }[] = [];
  private wrapperElements = [
    "html",
    "body",
    "#app",
    "#root",
    ".container",
    ".content",
  ];
  private emptyPoints = 0;
  private hasReported = false;
  private checkCount = 0;
  private readonly MAX_CHECK_TIMES = 5; // 最多检测5次

  constructor(reporter: BatchReporter) {
    super(reporter);
    this.generateCheckPoints();
  }

  private generateCheckPoints() {
    // 生成更多的采样点（横向和纵向各9个点）
    for (let i = 1; i <= 9; i++) {
      // 横向采样点
      this.checkPoints.push({
        x: (window.innerWidth * i) / 10,
        y: window.innerHeight / 2,
      });
      // 纵向采样点
      this.checkPoints.push({
        x: window.innerWidth / 2,
        y: (window.innerHeight * i) / 10,
      });
    }
  }

  private getSelector(element: Element): string {
    if (element.id) {
      return "#" + element.id;
    } else if (element.className) {
      return (
        "." +
        element.className
          .split(" ")
          .filter((item) => !!item)
          .join(".")
      );
    }
    return element.tagName.toLowerCase();
  }

  private isWrapper(element: Element): boolean {
    const selector = this.getSelector(element);
    return this.wrapperElements.includes(selector);
  }

  private check() {
    // 如果已经报告过或者超过最大检测次数，就不再检测
    if (this.hasReported || this.checkCount >= this.MAX_CHECK_TIMES) {
      this.disconnect();
      return;
    }

    this.checkCount++;
    this.timer = window.setTimeout(() => {
      this.emptyPoints = 0;
      let hasValidContent = false;

      // 遍历采样点
      for (const point of this.checkPoints) {
        const elements = document.elementsFromPoint(point.x, point.y);
        if (elements.length === 0) continue;

        const element = elements[0];
        if (this.isWrapper(element)) {
          this.emptyPoints++;
        } else if (this.isValidContent(element)) {
          hasValidContent = true;
          break;
        }
      }

      if (!hasValidContent && this.emptyPoints > 16) {
        this.reportBlankScreen();
        this.hasReported = true;
        this.disconnect();
      } else if (this.checkCount < this.MAX_CHECK_TIMES) {
        // 如果还没到最大检测次数，继续检测
        this.check();
      }
    }, 1000 * this.checkCount); // 逐渐增加检测间隔
  }

  public observe(): void {
    const startObserve = () => {
      if (document.body) {
        // 等待资源加载完成后再开始检测
        window.addEventListener("load", () => {
          this.mutationObserver = new MutationObserver(() => {
            // 使用防抖，避免频繁触发
            if (this.timer) {
              window.clearTimeout(this.timer);
            }
            // 延迟 500ms 再检测，避免瞬态变化
            this.timer = window.setTimeout(() => this.check(), 500);
          });

          this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
          });

          // 初始检测
          this.check();
        });
      }
    };

    if (document.readyState === "complete") {
      startObserve();
    } else {
      window.addEventListener("load", startObserve);
    }
  }

  public disconnect(): void {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  // 新增：判断是否为有效内容
  private isValidContent(element: Element): boolean {
    const styles = window.getComputedStyle(element);
    const hasText = element.textContent
      ? element.textContent.trim().length > 0
      : false;

    return (
      element.tagName !== "SCRIPT" &&
      element.tagName !== "STYLE" &&
      styles.display !== "none" &&
      styles.visibility !== "hidden" &&
      styles.opacity !== "0" &&
      (hasText ||
        element.tagName === "IMG" ||
        element.tagName === "CANVAS" ||
        element.tagName === "SVG")
    );
  }

  private reportBlankScreen() {
    const centerElements = document.elementsFromPoint(
      window.innerWidth / 2,
      window.innerHeight / 2
    );

    const reportData: ReportData = {
      type: "blank_screen",
      payload: {
        url: window.location.href,
        emptyPoints: this.emptyPoints,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        selector: centerElements.length
          ? this.getSelector(centerElements[0])
          : null,
      },
      sample_rate: this.config.sampleRate.blank_screen,
      ts: Date.now(),
    };
    this.reporter.push(reportData);
  }
}
