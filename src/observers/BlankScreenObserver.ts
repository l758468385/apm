import { BatchReporter } from '../reporters/BatchReporter';
import { BaseObserver } from './BaseObserver';
import { Event } from '../types/event';

export class BlankScreenObserver extends BaseObserver {
  private timer: number | null = null;
  private checkPoints: { x: number; y: number }[] = [];
  private wrapperElements = ['html', 'body', '#app', '#root', '.container', '.content'];
  private emptyPoints = 0;

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
        y: window.innerHeight / 2
      });
      // 纵向采样点
      this.checkPoints.push({
        x: window.innerWidth / 2,
        y: (window.innerHeight * i) / 10
      });
    }
  }

  private getSelector(element: Element): string {
    if (element.id) {
      return '#' + element.id;
    } else if (element.className) {
      return '.' + element.className.split(' ').filter(item => !!item).join('.');
    }
    return element.tagName.toLowerCase();
  }

  private isWrapper(element: Element): boolean {
    const selector = this.getSelector(element);
    return this.wrapperElements.includes(selector);
  }

  private check() {
    this.timer = window.setTimeout(() => {
      this.emptyPoints = 0;
      let hasValidContent = false;

      // 遍历采样点
      for (const point of this.checkPoints) {
        const elements = document.elementsFromPoint(point.x, point.y);
        if (elements.length === 0) continue;

        const element = elements[0];
        // 改进检测逻辑
        if (this.isWrapper(element)) {
          this.emptyPoints++;
        } else if (this.isValidContent(element)) {
          hasValidContent = true;
          break;
        }
      }

      // 只有在没有有效内容且空点数超过阈值时才报告白屏
      if (!hasValidContent && this.emptyPoints > 16) {
        this.reportBlankScreen();
      }
    }, 1000); // 缩短到1秒
  }

  public observe(): void {
    const startObserve = () => {
      if (document.body) {
        const observer = new MutationObserver(() => {
          if (this.timer) {
            window.clearTimeout(this.timer);
          }
          this.check();
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });

        // 初始检测
        this.check();
      }
    };

    // 如果 body 已经存在，直接开始观察
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      startObserve();
    } else {
      // 否则等待 DOM 加载完成
      window.addEventListener('DOMContentLoaded', startObserve);
    }
  }

  public disconnect(): void {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // 新增：判断是否为有效内容
  private isValidContent(element: Element): boolean {
    const styles = window.getComputedStyle(element);
    const hasText = element.textContent ? element.textContent.trim().length > 0 : false;
    
    return (
      element.tagName !== 'SCRIPT' &&
      element.tagName !== 'STYLE' &&
      styles.display !== 'none' &&
      styles.visibility !== 'hidden' &&
      styles.opacity !== '0' &&
      (hasText || 
       element.tagName === 'IMG' || 
       element.tagName === 'CANVAS' ||
       element.tagName === 'SVG')
    );
  }

  private reportBlankScreen() {
    const centerElements = document.elementsFromPoint(
      window.innerWidth / 2,
      window.innerHeight / 2
    );

    const event: Event = {
      type: 'blank_screen',
      payload: {
        url: window.location.href,
        emptyPoints: this.emptyPoints,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        selector: centerElements.length ? this.getSelector(centerElements[0]) : null
      },
      sample_rate: this.config.sampleRate.blankScreen,
      ts: Date.now()
    };
    this.reporter.push(event);
  }
} 