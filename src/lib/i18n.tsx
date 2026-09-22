"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

export const locales = ["en", "ru", "zh"] as const;
export type Locale = (typeof locales)[number];

const LOCALE_STORAGE_KEY = "prediction-markets-locale";

const messages = {
  en: {
    language: "Language",
    dashboardTitle: "Prediction markets data",
    dashboardTitleData: "data",
    updated: "Updated: {{date}}",
    loadingDashboard: "Loading dashboard...",
    loadingData: "Loading data from both platforms...",
    unableToLoad: "Unable to load data",
    apiAvailability: "Check the availability of the public APIs and browser CORS settings.",
    retryRequest: "Retry request",
    unableToUpdate: "Unable to update data",
    showingRecent: "Showing the most recently loaded data.",
    dataIncomplete: "Data is incomplete",
    retryLoading: "Retry loading",
    sentFailed: "{{platform}}: sent {{sent}}, failed {{failed}}",
    range: "Range",
    allTime: "All",
    categories: "Categories",
    all: "All",
    noCategories: "No categories selected",
    selectCategory: "Select at least one category to display volume.",
    loadingCategory: "Loading category data...",
    noPeriodData: "No data for this period",
    noPeriodDataDescription: "The selected categories have no volume points in this range.",
    periodDelta: "Period delta",
    periodDeltaFormula: "(Second half − first half) / first half × 100%",
    categoryShare: "Category share",
    categoryShareDescription: "Selected-period volume by category.",
    noCategoryVolume: "No category volume.",
    historicalVolume: "Historical volume",
    volumeDescription:
      "UTC buckets. Kalshi contract-notional proxy and Polymarket trade notional are shown separately.",
    chartExportActions: "Chart export actions",
    noHistoricalPoints: "No historical points returned.",
    updatingChart: "Updating chart data...",
    noData: "No data",
    marketVolumeShare: "Market volume share by category",
    historicalVolumeChart: "Historical volume chart for Kalshi and Polymarket",
    kalshiUsd: "Kalshi USD",
    polymarketUsd: "Polymarket USD",
    categoryShareSeries: "Category share",
    politics: "Politics",
    weather: "Weather",
    sports: "Sports",
    platforms: "Platforms",
    bothPlatforms: "Both platforms",
    metric: "Metric",
    totalVolume: "Total volume",
    averageDailyVolume: "Average daily volume",
    marketCount: "Market count",
    markets: "Markets",
    searchMarkets: "Search markets or events",
    sortBy: "Sort by",
    title: "Market",
    volume: "Volume",
    category: "Category",
    noMarkets: "No markets match the current filters.",
    sourceMetric: "Source metric",
    refreshStatus: "Data status",
    freshData: "Fresh data",
    cachedData: "Cached data",
    refreshing: "Refreshing...",
    dataThrough: "Data through {{date}}",
    lastUpdated: "Updated {{time}} ago",
    categoryScope: "Apply category to",
    scopeBoth: "Both",
    scopeKalshi: "Kalshi",
    scopePolymarket: "Polymarket",
    chartMode: "Chart type",
    chartView: "Chart view",
    chartViewFull: "Full chart",
    chartViewLightweight: "Lightweight chart",
    chartPie: "Pie",
    chartLine: "Line",
    chartArea: "Area",
    chartBars: "Bars",
    platformVolume: "{{platform}} volume",
    loadedMarkets: "{{count}} loaded markets",
    svgExportUnavailable: "SVG export is not available for the lightweight chart",
  },
  ru: {
    language: "Язык",
    dashboardTitle: "Данные рынков прогнозов",
    dashboardTitleData: "данные",
    updated: "Обновлено: {{date}}",
    loadingDashboard: "Загрузка панели...",
    loadingData: "Загрузка данных обеих платформ...",
    unableToLoad: "Не удалось загрузить данные",
    apiAvailability: "Проверьте доступность публичных API и настройки CORS браузера.",
    retryRequest: "Повторить запрос",
    unableToUpdate: "Не удалось обновить данные",
    showingRecent: "Показаны последние успешно загруженные данные.",
    dataIncomplete: "Данные неполные",
    retryLoading: "Повторить загрузку",
    sentFailed: "{{platform}}: отправлено {{sent}}, ошибок {{failed}}",
    range: "Период",
    allTime: "Всё",
    categories: "Категории",
    all: "Все",
    noCategories: "Категории не выбраны",
    selectCategory: "Выберите хотя бы одну категорию, чтобы показать объём.",
    loadingCategory: "Загрузка данных категорий...",
    noPeriodData: "Нет данных за этот период",
    noPeriodDataDescription: "В выбранных категориях нет точек объёма за этот период.",
    periodDelta: "Изменение за период",
    periodDeltaFormula: "(Вторая половина − первая половина) / первая половина × 100%",
    categoryShare: "Доли категорий",
    categoryShareDescription: "Объём выбранного периода по категориям.",
    noCategoryVolume: "Нет объёма по категориям.",
    historicalVolume: "Исторический объём",
    volumeDescription:
      "Дневные интервалы UTC. Прокси контрактного номинала Kalshi и торговый номинал Polymarket показаны отдельно.",
    chartExportActions: "Действия экспорта графика",
    noHistoricalPoints: "Исторические точки не получены.",
    updatingChart: "Обновление данных графика...",
    noData: "Нет данных",
    marketVolumeShare: "Доли объёма рынков по категориям",
    historicalVolumeChart: "График исторического объёма Kalshi и Polymarket",
    kalshiUsd: "Kalshi, USD",
    polymarketUsd: "Polymarket, USD",
    categoryShareSeries: "Доли категорий",
    politics: "Политика",
    weather: "Погода",
    sports: "Спорт",
    platforms: "Платформы",
    bothPlatforms: "Обе платформы",
    metric: "Метрика",
    totalVolume: "Общий объём",
    averageDailyVolume: "Средний дневной объём",
    marketCount: "Количество рынков",
    markets: "Рынки",
    searchMarkets: "Поиск по рынкам или событиям",
    sortBy: "Сортировка",
    title: "Рынок",
    volume: "Объём",
    category: "Категория",
    noMarkets: "Нет рынков, соответствующих текущим фильтрам.",
    sourceMetric: "Метрика источника",
    refreshStatus: "Статус данных",
    freshData: "Свежие данные",
    cachedData: "Кэшированные данные",
    refreshing: "Обновление...",
    dataThrough: "Данные по {{date}}",
    lastUpdated: "Обновлено {{time}} назад",
    categoryScope: "Применять фильтр к",
    scopeBoth: "Обе",
    scopeKalshi: "Kalshi",
    scopePolymarket: "Polymarket",
    chartMode: "Тип графика",
    chartView: "Вид графика",
    chartViewFull: "Полный график",
    chartViewLightweight: "Лайтвэйт график",
    chartPie: "Круговая",
    chartLine: "Линия",
    chartArea: "Область",
    chartBars: "Столбцы",
    platformVolume: "Объём {{platform}}",
    loadedMarkets: "Загружено рынков: {{count}}",
    svgExportUnavailable: "Экспорт в SVG недоступен для лайтвэйт графика",
  },
  zh: {
    language: "语言",
    dashboardTitle: "预测市场数据",
    dashboardTitleData: "数据",
    updated: "更新时间：{{date}}",
    loadingDashboard: "正在加载面板...",
    loadingData: "正在加载两个平台的数据...",
    unableToLoad: "无法加载数据",
    apiAvailability: "请检查公共 API 是否可用以及浏览器的 CORS 设置。",
    retryRequest: "重试请求",
    unableToUpdate: "无法更新数据",
    showingRecent: "正在显示最近一次成功加载的数据。",
    dataIncomplete: "数据不完整",
    retryLoading: "重试加载",
    sentFailed: "{{platform}}：已发送 {{sent}}，失败 {{failed}}",
    range: "范围",
    allTime: "全部时间",
    categories: "类别",
    all: "全部",
    noCategories: "未选择类别",
    selectCategory: "至少选择一个类别以显示交易量。",
    loadingCategory: "正在加载类别数据...",
    noPeriodData: "此时间段没有数据",
    noPeriodDataDescription: "所选类别在此范围内没有交易量数据点。",
    periodDelta: "期间变化",
    periodDeltaFormula: "（后半段 − 前半段）/ 前半段 × 100%",
    categoryShare: "类别占比",
    categoryShareDescription: "所选时间段按类别划分的交易量。",
    noCategoryVolume: "没有类别交易量。",
    historicalVolume: "历史交易量",
    volumeDescription:
      "使用 UTC 时间段。Kalshi 合约名义金额代理值和 Polymarket 交易名义金额分开显示。",
    chartExportActions: "图表导出操作",
    noHistoricalPoints: "没有返回历史数据点。",
    updatingChart: "正在更新图表数据...",
    noData: "无数据",
    marketVolumeShare: "按类别划分的市场交易量占比",
    historicalVolumeChart: "Kalshi 和 Polymarket 历史交易量图表",
    kalshiUsd: "Kalshi 美元",
    polymarketUsd: "Polymarket 美元",
    categoryShareSeries: "类别占比",
    politics: "政治",
    weather: "天气",
    sports: "体育",
    platforms: "平台",
    bothPlatforms: "两个平台",
    metric: "指标",
    totalVolume: "总交易量",
    averageDailyVolume: "日均交易量",
    marketCount: "市场数量",
    markets: "市场",
    searchMarkets: "搜索市场或事件",
    sortBy: "排序",
    title: "市场",
    volume: "交易量",
    category: "类别",
    noMarkets: "没有符合当前筛选条件的市场。",
    sourceMetric: "来源指标",
    refreshStatus: "数据状态",
    freshData: "最新数据",
    cachedData: "缓存数据",
    refreshing: "正在更新...",
    dataThrough: "数据截至 {{date}}",
    lastUpdated: "{{time}} 前更新",
    categoryScope: "将类别应用于",
    scopeBoth: "两个",
    scopeKalshi: "Kalshi",
    scopePolymarket: "Polymarket",
    chartMode: "图表类型",
    chartView: "图表视图",
    chartViewFull: "完整图表",
    chartViewLightweight: "轻量图表",
    chartPie: "饼图",
    chartLine: "折线",
    chartArea: "面积",
    chartBars: "柱状",
    platformVolume: "{{platform}} 交易量",
    loadedMarkets: "已加载市场：{{count}}",
    svgExportUnavailable: "轻量图表不支持导出 SVG",
  },
} as const;

export type TranslationKey = keyof typeof messages.en;
type Listener = () => void;
const listeners = new Set<Listener>();

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "ru" || value === "zh";
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(storedLocale) ? storedLocale : "en";
}

function subscribeLocale(listener: Listener): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function setStoredLocale(locale: Locale): void {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  listeners.forEach((listener) => listener());
}

const I18nContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  categoryLabel: (id: string, fallback: string) => string;
  formatDate: (timestamp: number) => string;
  formatValue: (value: number | null) => string;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getStoredLocale, (): Locale => "en");

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;
  }, [locale]);

  const t = (key: TranslationKey, values: Record<string, string | number> = {}): string => {
    const localeMessages = messages[locale] as Record<TranslationKey, string>;
    let message = localeMessages[key];
    Object.entries(values).forEach(([name, value]) => {
      message = message.replaceAll(`{{${name}}}`, String(value));
    });
    return message;
  };

  const categoryLabel = (id: string, fallback: string): string => {
    const key = id as TranslationKey;
    const localeMessages = messages[locale] as Record<TranslationKey, string>;
    return key in localeMessages ? t(key) : fallback;
  };

  const valueFormatter = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact",
  });

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale: setStoredLocale,
        t,
        categoryLabel,
        formatDate: (timestamp) =>
          new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale, {
            dateStyle: "medium",
            timeStyle: "medium",
          }).format(timestamp),
        formatValue: (value) => (value === null ? t("noData") : valueFormatter.format(value)),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
