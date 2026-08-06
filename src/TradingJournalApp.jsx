import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { loginWithTelegram, fetchTrades, fetchProfiles, createProfile, updateProfile, createTrade, updateTrade, closeTrade, deleteTrade, deleteProfile, duplicateTrade, fetchStockSnapshot } from "./api";
import {
  Plus, Search, SlidersHorizontal, Settings, X, Edit2, Trash2, Copy, Camera,
  ChevronRight, Home, BookOpen, BarChart2, Download, Eye,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";

const StatsCharts = lazy(() => import("./StatsCharts"));

const STORAGE = typeof window !== "undefined" && window.storage
  ? window.storage
  : {
      get: async (key) => {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
        return raw == null ? null : { value: raw };
      },
      set: async (key, value) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, value);
        }
        return true;
      },
    };

const STANDARD_PROFILE_ID = "__standard__";

const LANGUAGE_LABELS = {
  ru: {
    journal: "Журнал",
    dashboard: "Панель",
    statistics: "Статистика",
    watchlist: "Список наблюдения",
    todayPnL: "Профит/убыток сегодня",
    winRate: "Win rate",
    profitFactor: "Профит фактор",
    openTrades: "Открытые сделки",
    totalIncome: "Общий доход",
    recentTrades: "Последние сделки",
    commentAfterTrade: "Комментарий после сделки",
    exitReasonPlaceholder: "TP hit, SL hit…",
    rMultipleLabel: "R-мультипликатор",
    tradeDetails: "Детали сделки",
    commentAfterTrade: "Комментарий после сделки",
    exitReasonPlaceholder: "TP hit, SL hit…",
    rMultipleLabel: "R-мультипликатор",
    tradeDetails: "Детали сделки",
    edit: "Редактировать",
    delete: "Удалить",
    duplicate: "Дублировать",
    closeTrade: "Закрыть сделку",
    addTrade: "Добавить сделку",
    newTrade: "Новая сделка",
    editTrade: "Редактировать сделку",
    basicInfo: "Основная информация",
    ticker: "Тикер",
    type: "Тип",
    date: "Дата",
    timeIn: "Время входа",
    entry: "Вход",
    additional: "Дополнительно",
    entryPrice: "Цена входа",
    stopLoss: "Стоп-лосс",
    takeProfit: "Тейк-профит",
    riskDollar: "Риск ($)",
    positionNotional: "Позиционный нотионал",
    positionSize: "Размер позиции",
    positionSizing: "Размер позиции",
    risk: "Риск",
    riskPerShare: "Риск на акцию",
    share: "акция",
    shares: "акций",
    enterEntryStopRisk: "Введите вход, стоп и сумму риска для расчёта размера позиции.",
    addNewSetup: "Добавить новую стратегию…",
    tags: "Теги",
    addNewTag: "Добавить новый тег…",
    notes: "Заметки",
    tradeThesisContextPlan: "Тезис сделки, контекст, план…",
    entryScreenshot: "Скриншот входа",
    attachScreenshot: "Прикрепить скриншот",
    replaceImage: "Заменить изображение",
    saveTrade: "Сохранить сделку",
    saveChanges: "Сохранить изменения",
    saveLabel: "Сохранить",
    cancelLabel: "Отмена",
    editLabel: "Редактировать",
    deleteLabel: "Удалить",
    addLabel: "Добавить",
    buy: "Купить",
    sell: "Продать",
    language: "Язык",
    english: "English",
    ukrainian: "Українська",
    russian: "Русский",
    apply: "Применить",
    clearAll: "Очистить всё",
    tag: "Тег",
    long: "Long",
    short: "Short",
    profitable: "Прибыльные",
    losing: "Убыточные",
    openShort: "Открыто",
    closedShort: "Закрыто",
    all: "Все",
    riskCountByDay: "Количество рисков по дням",
    cumulativePnlByDay: "Накопительный P&L по дням",
    equityCurve: "Кривая капитала",
    pnlByDay: "P&L по дням",
    statisticsTitle: "Статистика",
    watchlistTitle: "Список наблюдения",
    screener: "Скринер",
    screenerTitle: "Скринер рынка",
    screenerSubtitle: "Ищите инструменты по сектору, росту, объему и другим критериям.",
    premarketLabel: "Премаркет",
    screenerSearchPlaceholder: "Поиск по тикеру, названию или сектору",
    screenerAllSectors: "Все секторы",
    screenerAllInstruments: "Все инструменты",
    screenerMinChange: "Мин. % роста",
    screenerMinVolume: "Мин. объем",
    screenerMinPrice: "Мин. цена",
    screenerSortGrowth: "% роста",
    screenerSortVolume: "Объем",
    screenerSortPrice: "Цена",
    screenerSortMarketCap: "Рыночная капитализация",
    screenerSortDesc: "По убыванию",
    screenerSortAsc: "По возрастанию",
    screenerSaveFilter: "Сохранить фильтр",
    screenerFilterName: "Название фильтра",
    screenerLoading: "Загрузка данных скринера…",
    screenerVol: "Объем",
    screenerAlert: "Оповещение",
    screenerAlertPrice: "Целевая цена",
    screenerAlertAbove: "Выше",
    screenerAlertBelow: "Ниже",
    screenerAlertSave: "Сохранить",
    screenerAlerts: "Оповещения",
    screenerAlertPlaceholder: "Введите цену",
    screenerAlertEmpty: "Оповещений пока нет",
  },
  uk: {
    journal: "Журнал",
    dashboard: "Дашборд",
    statistics: "Статистика",
    watchlist: "Список спостереження",
    todayPnL: "Профіт/збиток сьогодні",
    winRate: "Win rate",
    profitFactor: "Профіт фактор",
    openTrades: "Відкриті угоди",
    totalIncome: "Загальний дохід",
    recentTrades: "Останні угоди",
    viewAll: "Переглянути всі",
    noTrades: "Немає угод за цим фільтром.",
    searchPlaceholder: "Пошук по тикеру, нотатках, тегах…",
    filters: "Фільтри",
    allTime: "За весь час",
    last7Days: "Останні 7 днів",
    last30Days: "Останні 30 днів",
    last90Days: "Останні 90 днів",
    thisMonth: "Цей місяць",
    closedTrades: "закриті угоди",
    closed: "Закрито",
    open: "Відкрито",
    allTrades: "Усі угоди",
    export: "Експорт",
    newestFirst: "Найновіші",
    oldestFirst: "Найстаріші",
    loading: "Завантаження журналу…",
    loadingStats: "Завантаження статистики…",
    saving: "Зберігаємо...",
    savingTrade: "Збереження угоди...",
    dashboardSubtitle: "Ваш торговий стіл одним поглядом",
    watchlistIntro: "Відстежуйте улюблені тикери в одному місці.",
    watchlistAddTickerPlaceholder: "Додати тікер (AAPL)",
    watchlistCommentPlaceholder: "Коментар до тікера",
    watchlistEmpty: "Тікери ще не додані.",
    watchlistRemove: "Видалити",
    watchlistAddButton: "Додати тікер",
    inLabel: "В",
    exitLabel: "Вихід",
    entryDateLabel: "Дата входу",
    exitDateLabel: "Дата виходу",
    entryPriceLabel: "Ціна входу",
    exitPriceLabel: "Ціна виходу",
    stopLossLabel: "Стоп-лосс",
    takeProfitLabel: "Тейк-профіт",
    positionSizeLabel: "Розмір позиції",
    riskDollarLabel: "Ризик $",
    riskPercentLabel: "Ризик %",
    defaultRiskLabel: "Стандартний ризик за угоду ($)",
    defaultRiskHint: "Використовується для статистики та нових угод, якщо ризик не вказано",
    riskCountLabel: "Кількість ризиків",
    exitReasonLabel: "Причина виходу",
    tickerToday: "СЬОГОДНІ",
    tickerWinRate: "WIN RATE",
    tickerOpen: "ВІДКРИТО",
    tickerTrades: "УГОД",
    tickerPf: "PF",
    tickerAvgR: "СЕР. R",
    tradeAdded: "Угоду додано",
    tradeUpdated: "Угоду оновлено",
    tradeDeleted: "Угоду видалено",
    tradeClosed: "Угоду закрито",
    tradeDuplicated: "Угоду продубльовано",
    failedAddTrade: "Не вдалося додати угоду",
    failedUpdateTrade: "Не вдалося оновити угоду",
    failedDeleteTrade: "Не вдалося видалити угоду",
    failedCloseTrade: "Не вдалося закрити угоду",
    failedDuplicateTrade: "Не вдалося продублювати угоду",
    exportCsv: "CSV експортовано",
    exportXlsx: "Excel експортовано",
    exportPdf: "PDF експорт незабаром — використовуйте CSV/Excel",
    pnlLabel: "P&L",
    tagsLabel: "Теги",
    notesLabel: "Нотатки",
    postTradeCommentLabel: "Коментар після угоди",
    avgWin: "Середній виграш",
    avgLoss: "Середній програш",
    longShort: "Long / Short",
    avgR: "Середнє R",
    bestTrade: "Найкраща угода",
    worstTrade: "Найгірша угода",
    winStreak: "Серія перемог",
    lossStreak: "Серія програшів",
    exitScreenshotLabel: "Скріншот виходу",
    commentAfterTrade: "Коментар після угоди",
    exitReasonPlaceholder: "TP hit, SL hit…",
    rMultipleLabel: "R-мультиплікатор",
    tradeDetails: "Деталі угоди",
    edit: "Редагувати",
    delete: "Видалити",
    duplicate: "Дублювати",
    closeTrade: "Закрити угоду",
    addTrade: "Додати угоду",
    newTrade: "Нова угода",
    editTrade: "Редагувати угоду",
    basicInfo: "Основна інформація",
    ticker: "Тікер",
    type: "Тип",
    date: "Дата",
    timeIn: "Час входу",
    entry: "Вхід",
    additional: "Додатково",
    entryPrice: "Ціна входу",
    stopLoss: "Стоп-лосс",
    takeProfit: "Тейк-профіт",
    riskDollar: "Ризик ($)",
    positionNotional: "Позиційний нотіонал",
    positionSize: "Розмір позиції",
    positionSizing: "Розмір позиції",
    risk: "Ризик",
    riskPerShare: "Ризик на акцію",
    share: "акція",
    shares: "акцій",
    enterEntryStopRisk: "Введіть вхід, стоп і розмір ризику для розрахунку позиції.",
    addNewSetup: "Додати нову стратегію…",
    tags: "Теги",
    addNewTag: "Додати новий тег…",
    notes: "Нотатки",
    tradeThesisContextPlan: "Теза, контекст, план…",
    entryScreenshot: "Скріншот входу",
    attachScreenshot: "Прикріпити скріншот",
    replaceImage: "Замінити зображення",
    saveTrade: "Зберегти угоду",
    saveChanges: "Зберегти зміни",
    saveLabel: "Зберегти",
    cancelLabel: "Скасувати",
    editLabel: "Редагувати",
    deleteLabel: "Видалити",
    addLabel: "Додати",
    buy: "Купити",
    sell: "Продати",
    language: "Мова",
    english: "English",
    ukrainian: "Українська",
    russian: "Русский",
    apply: "Застосувати",
    clearAll: "Очистити все",
    status: "Статус",
    direction: "Напрямок",
    result: "Результат",
    setup: "Стратегія",
    tag: "Тег",
    long: "Long",
    short: "Short",
    profitable: "Прибуткові",
    losing: "Збиткові",
    openShort: "Відкрито",
    closedShort: "Закрито",
    all: "Усі",
    riskCountByDay: "Кількість ризиків по днях",
    cumulativePnlByDay: "Накопичувальний P&L по днях",
    equityCurve: "Крива капіталу",
    pnlByDay: "P&L по днях",
    currentDeposit: "Поточний депозит",
    standardProfile: "Стандарт",
    statisticsTitle: "Статистика",
    watchlistTitle: "Список спостереження",
    screener: "Скрінер",
    screenerTitle: "Скрінер ринку",
    screenerSubtitle: "Шукайте інструменти за сектором, зростанням, обсягом та іншими критеріями.",
    premarketLabel: "Премаркет",
    screenerSearchPlaceholder: "Пошук за тикером, назвою або сектором",
    screenerAllSectors: "Усі сектори",
    screenerAllInstruments: "Усі інструменти",
    screenerMinChange: "Мін. % росту",
    screenerMinVolume: "Мін. обсяг",
    screenerMinPrice: "Мін. ціна",
    screenerSortGrowth: "% росту",
    screenerSortVolume: "Обсяг",
    screenerSortPrice: "Ціна",
    screenerSortMarketCap: "Ринкова капіталізація",
    screenerSortDesc: "За спаданням",
    screenerSortAsc: "За зростанням",
    screenerSaveFilter: "Зберегти фільтр",
    screenerFilterName: "Назва фільтра",
    screenerLoading: "Завантаження даних скрінера…",
    screenerVol: "Обсяг",
    screenerAlert: "Сповіщення",
    screenerAlertPrice: "Цільова ціна",
    screenerAlertAbove: "Вище",
    screenerAlertBelow: "Нижче",
    screenerAlertSave: "Зберегти",
    screenerAlerts: "Сповіщення",
    screenerAlertPlaceholder: "Введіть ціну",
    screenerAlertEmpty: "Поки немає сповіщень",
  },
  en: {
    journal: "Journal",
    dashboard: "Dashboard",
    statistics: "Statistics",
    watchlist: "Watchlist",
    todayPnL: "Today P&L",
    winRate: "Win rate",
    profitFactor: "Profit factor",
    openTrades: "Open trades",
    totalIncome: "Total income",
    recentTrades: "Recent trades",
    viewAll: "View all",
    noTrades: "No trades match.",
    searchPlaceholder: "Search ticker, notes, tags…",
    filters: "Filters",
    allTime: "All time",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    last90Days: "Last 90 days",
    thisMonth: "This month",
    closedTrades: "closed trades",
    closed: "Closed",
    open: "Open",
    allTrades: "All trades",
    export: "Export",
    newestFirst: "Newest first",
    oldestFirst: "Oldest first",
    loading: "Loading journal…",
    loadingStats: "Loading stats…",
    saving: "Saving...",
    savingTrade: "Saving trade...",
    dashboardSubtitle: "Your trading desk at a glance",
    watchlistIntro: "Track your favorite tickers in one place.",
    watchlistAddTickerPlaceholder: "Add ticker (AAPL)",
    watchlistCommentPlaceholder: "Ticker comment",
    watchlistEmpty: "No tickers yet.",
    watchlistRemove: "Remove",
    watchlistAddButton: "Add ticker",
    inLabel: "In",
    exitLabel: "Exit",
    entryDateLabel: "Entry date",
    exitDateLabel: "Exit date",
    entryPriceLabel: "Entry price",
    exitPriceLabel: "Exit price",
    stopLossLabel: "Stop loss",
    takeProfitLabel: "Take profit",
    positionSizeLabel: "Position size",
    riskDollarLabel: "Risk $",
    riskPercentLabel: "Risk %",
    defaultRiskLabel: "Default risk per trade ($)",
    defaultRiskHint: "Used for stats and new trades when risk is not provided",
    riskCountLabel: "Risk count",
    exitReasonLabel: "Exit reason",
    tickerToday: "TODAY",
    tickerWinRate: "WIN RATE",
    tickerOpen: "OPEN",
    tickerTrades: "TRADES",
    tickerPf: "PF",
    tickerAvgR: "AVG R",
    tradeAdded: "Trade added",
    tradeUpdated: "Trade updated",
    tradeDeleted: "Trade deleted",
    tradeClosed: "Trade closed",
    tradeDuplicated: "Trade duplicated",
    failedAddTrade: "Failed to add trade",
    failedUpdateTrade: "Failed to update trade",
    failedDeleteTrade: "Failed to delete trade",
    failedCloseTrade: "Failed to close trade",
    failedDuplicateTrade: "Failed to duplicate trade",
    exportCsv: "CSV exported",
    exportXlsx: "Excel exported",
    exportPdf: "PDF export coming soon — use CSV/Excel for now",
    pnlLabel: "P&L",
    tagsLabel: "Tags",
    notesLabel: "Notes",
    postTradeCommentLabel: "Post-trade comment",
    avgWin: "Avg win",
    avgLoss: "Avg loss",
    longShort: "Long / Short",
    avgR: "Avg R",
    bestTrade: "Best trade",
    worstTrade: "Worst trade",
    winStreak: "Win streak",
    lossStreak: "Loss streak",
    exitScreenshotLabel: "Exit screenshot",
    commentAfterTrade: "Comment after trade",
    exitReasonPlaceholder: "TP hit, SL hit…",
    rMultipleLabel: "R-multiple",
    tradeDetails: "Trade details",
    edit: "Edit",
    delete: "Delete",
    duplicate: "Duplicate",
    closeTrade: "Close trade",
    addTrade: "Add trade",
    newTrade: "New trade",
    editTrade: "Edit trade",
    basicInfo: "Basic info",
    ticker: "Ticker",
    type: "Type",
    date: "Date",
    timeIn: "Time in",
    entry: "Entry",
    additional: "Additional",
    entryPrice: "Entry price",
    stopLoss: "Stop loss",
    takeProfit: "Take profit",
    riskDollar: "Risk ($)",
    positionNotional: "Position notional",
    positionSize: "Position size",
    positionSizing: "Position sizing",
    risk: "Risk",
    riskPerShare: "Risk per share",
    share: "share",
    shares: "shares",
    enterEntryStopRisk: "Enter entry, stop, and risk amount to calculate size.",
    addNewSetup: "Add new setup…",
    tags: "Tags",
    addNewTag: "Add new tag…",
    notes: "Notes",
    tradeThesisContextPlan: "Trade thesis, context, plan…",
    entryScreenshot: "Entry screenshot",
    attachScreenshot: "Attach screenshot",
    replaceImage: "Replace image",
    saveTrade: "Save trade",
    saveChanges: "Save changes",
    saveLabel: "Save",
    cancelLabel: "Cancel",
    editLabel: "Edit",
    deleteLabel: "Delete",
    addLabel: "Add",
    buy: "Buy",
    sell: "Sell",
    language: "Language",
    english: "English",
    ukrainian: "Ukrainian",
    russian: "Russian",
    apply: "Apply",
    clearAll: "Clear all",
    status: "Status",
    direction: "Direction",
    result: "Result",
    setup: "Setup",
    tag: "Tag",
    long: "Long",
    short: "Short",
    profitable: "Profitable",
    losing: "Losing",
    openShort: "Open",
    closedShort: "Closed",
    all: "All",
    riskCountByDay: "Risk count by day",
    cumulativePnlByDay: "Cumulative P&L by day",
    equityCurve: "Equity curve",
    pnlByDay: "P&L by day",
    currentDeposit: "Current deposit",
    standardProfile: "Standard",
    statisticsTitle: "Statistics",
    watchlistTitle: "Watchlist",
    screener: "Screener",
    screenerTitle: "Market Screener",
    screenerSubtitle: "Screen instruments by sector, growth, volume and other criteria.",
    premarketLabel: "Premarket",
    screenerSearchPlaceholder: "Search by symbol, name or sector",
    screenerAllSectors: "All sectors",
    screenerAllInstruments: "All instruments",
    screenerMinChange: "Min % change",
    screenerMinVolume: "Min volume",
    screenerMinPrice: "Min price",
    screenerSortGrowth: "% growth",
    screenerSortVolume: "Volume",
    screenerSortPrice: "Price",
    screenerSortMarketCap: "Market cap",
    screenerSortDesc: "Descending",
    screenerSortAsc: "Ascending",
    screenerSaveFilter: "Save filter",
    screenerFilterName: "Filter name",
    screenerLoading: "Loading screener data…",
    screenerVol: "Volume",
    screenerAlert: "Alert",
    screenerAlertPrice: "Target price",
    screenerAlertAbove: "Above",
    screenerAlertBelow: "Below",
    screenerAlertSave: "Save",
    screenerAlerts: "Alerts",
    screenerAlertPlaceholder: "Enter target price",
    screenerAlertEmpty: "No alerts yet",
  },
};

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.tj-root {
  --bg: #0B0D10;
  --surface: #14181D;
  --surface-2: #1B2129;
  --surface-3: #232B34;
  --border: #262E38;
  --text: #ECEEF1;
  --text-dim: #8A93A1;
  --text-faint: #5B6472;
  --accent: #E8A33D;
  --accent-dim: #4A3A22;
  --profit: #3DDC97;
  --profit-dim: #16382C;
  --loss: #F0556B;
  --loss-dim: #3A1D24;
  --long: #5EC8D8;
  --short: #C97BE0;
  font-family: 'Inter', sans-serif;
  color: var(--text);
  background: var(--bg);
}
.tj-display { font-family: 'Space Grotesk', sans-serif; }
.tj-mono { font-family: 'IBM Plex Mono', monospace; }

.tj-phone {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: var(--bg);
  min-height: 100vh;
  position: relative;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
  overflow-x: hidden;
  padding-bottom: 112px;
  box-sizing: border-box;
}

.tj-ticker-wrap {
  overflow: hidden;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  padding: 7px 0;
}
.tj-ticker-track {
  display: inline-flex;
  animation: tj-scroll 22s linear infinite;
}
.tj-ticker-item { padding: 0 18px; font-size: 12px; color: #FFFFFF; }
@keyframes tj-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tj-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.tj-input {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  padding: 10px 12px;
  font-size: 14px;
  width: 100%;
  outline: none;
}
.tj-input-compact {
  padding: 7px 9px;
  font-size: 12.5px;
  border-radius: 8px;
  min-height: 34px;
  box-sizing: border-box;
}
.tj-input:focus { border-color: var(--accent); }
.tj-input::placeholder { color: var(--text-faint); }
.tj-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  margin-bottom: 6px;
  display: block;
}
.tj-btn-primary {
  background: var(--accent);
  color: #1A1305;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 16px;
  border: none;
}
.tj-btn-primary:active { transform: scale(0.98); }
.tj-btn-ghost {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-weight: 500;
  font-size: 14px;
  padding: 12px 16px;
}
.tj-fab {
  position: fixed;
  bottom: 84px;
  right: calc(50% - 210px + 18px);
  background: var(--accent);
  color: #1A1305;
  border-radius: 999px;
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(232,163,61,0.35);
  z-index: 40;
}
@media (max-width: 460px) { .tj-fab { right: 18px; } }

.tj-navbar {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 36px);
  max-width: 380px;
  z-index: 40;
  box-sizing: border-box;
  padding: 10px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(20,24,29,0.75), rgba(11,13,16,0.85));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(3,6,12,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
}
.tj-navitem {
  flex: 0 1 70px;
  min-width: 64px;
  max-width: 84px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--text-dim);
  font-size: 10px;
  padding: 4px 6px;
  border-radius: 10px;
  background: linear-gradient(180deg,#ffffff,#f5f5f5);
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.tj-navitem span { font-size: 10px; color: var(--text-faint); }
.tj-navitem.active {
  color: var(--accent);
  background: linear-gradient(180deg,#fff,#fff7ee);
  border-color: rgba(232,163,61,0.15);
  box-shadow: 0 10px 26px rgba(0,0,0,0.18);
}

/* removed .tj-navicon per user request */

.tj-badge {
  font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 999px;
  display: inline-flex; align-items: center; gap: 3px;
}
.tj-sheet-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 50; display: flex; align-items: flex-end; justify-content: center;
}
.tj-sheet {
  background: var(--bg);
  width: 100%; max-width: 420px;
  border-radius: 20px 20px 0 0;
  max-height: 92vh;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-bottom: none;
}
.tj-scroll-hide::-webkit-scrollbar { display: none; }
.tj-chip {
  font-size: 12.5px; padding: 6px 12px; border-radius: 999px;
  border: 1px solid var(--border); background: var(--surface-2); color: var(--text-dim);
}
.tj-chip.on { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
.tj-toast {
  position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
  background: var(--surface-3); border: 1px solid var(--border);
  padding: 10px 16px; border-radius: 10px; font-size: 13px; z-index: 100;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
/* removed stat-icon: reverting last icon-related changes */
`;

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const fmt2 = (n) => {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return (Math.round((Number(n) + Number.EPSILON) * 100) / 100).toLocaleString();
};
const cls = (...a) => a.filter(Boolean).join(" ");
const formatStockPrice = (value, currency = "USD") => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const normalizedCurrency = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  const numericValue = Number(value);

  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    });
    return formatter.format(numericValue);
  } catch {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(numericValue);
  }
};
const normalizeTicker = (value) => (value || "").trim().toUpperCase();
function resolveTradeMetrics(trade, snapshot) {
  if (!trade || trade.status !== "open") {
    return {
      pnl: trade?.pnl ?? null,
      pnlPercent: trade?.pnlPercent ?? null,
      rMultiple: trade?.rMultiple ?? null,
    };
  }

  const currentPrice = snapshot?.price ?? trade?.currentPrice ?? null;
  if (currentPrice == null || trade.entryPrice == null || trade.positionSize == null || trade.positionSize === "") {
    return {
      pnl: trade?.pnl ?? null,
      pnlPercent: trade?.pnlPercent ?? null,
      rMultiple: trade?.rMultiple ?? null,
    };
  }

  const { pnl, pnlPct, r } = calcPnl({ ...trade, exitPrice: currentPrice });
  return {
    pnl: pnl != null ? +pnl.toFixed(2) : null,
    pnlPercent: pnlPct != null ? +pnlPct.toFixed(2) : null,
    rMultiple: r != null ? +r.toFixed(2) : null,
  };
}

function calcPnl(t) {
  if (t.exitPrice == null || t.exitPrice === "" || !t.entryPrice || !t.positionSize) return { pnl: null, pnlPct: null, r: null };
  const dir = t.side === "long" ? 1 : -1;
  const pnl = (Number(t.exitPrice) - Number(t.entryPrice)) * Number(t.positionSize) * dir;
  const cost = Number(t.entryPrice) * Number(t.positionSize);
  const pnlPct = cost ? (pnl / cost) * 100 : 0;
  let r = null;
  if (t.stopLoss && Number(t.entryPrice) !== Number(t.stopLoss)) {
    const riskPerUnit = Math.abs(Number(t.entryPrice) - Number(t.stopLoss));
    r = riskPerUnit ? ((Number(t.exitPrice) - Number(t.entryPrice)) * dir) / riskPerUnit : null;
  }
  return { pnl, pnlPct, r };
}

function createTradeChartScreenshot(trade, closeData = {}) {
  if (typeof window === "undefined") return null;
  const entryPrice = Number(trade?.entryPrice);
  const exitPrice = Number(closeData?.exitPrice ?? trade?.exitPrice ?? entryPrice);
  const stopLoss = Number(closeData?.stopLoss ?? trade?.stopLoss ?? 0);
  const takeProfit = Number(closeData?.takeProfit ?? trade?.takeProfit ?? 0);
  const pnl = Number(closeData?.pnl ?? trade?.pnl ?? 0);
  const width = 760;
  const height = 320;
  const paddingX = 48;
  const paddingY = 32;
  const values = [entryPrice, exitPrice].filter((value) => Number.isFinite(value));
  if (Number.isFinite(stopLoss) && stopLoss > 0) values.push(stopLoss);
  if (Number.isFinite(takeProfit) && takeProfit > 0) values.push(takeProfit);
  if (!values.length || !Number.isFinite(entryPrice) || !Number.isFinite(exitPrice)) return null;

  const minValue = Math.min(...values) - Math.max((Math.max(...values) - Math.min(...values)) * 0.15, 1);
  const maxValue = Math.max(...values) + Math.max((Math.max(...values) - Math.min(...values)) * 0.15, 1);
  const mapPrice = (value) => paddingY + ((maxValue - value) / (maxValue - minValue)) * (height - paddingY * 2);
  const entryY = mapPrice(entryPrice);
  const exitY = mapPrice(exitPrice);
  const points = [
    `${paddingX},${entryY}`,
    `${width / 2},${exitY}`,
    `${width - paddingX},${exitY}`,
  ].join(" ");
  const stopLineY = Number.isFinite(stopLoss) && stopLoss > 0 ? mapPrice(stopLoss) : null;
  const takeLineY = Number.isFinite(takeProfit) && takeProfit > 0 ? mapPrice(takeProfit) : null;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" rx="24" fill="#0B0D10" />
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="18" fill="#14181D" stroke="#262E38" />
      <text x="40" y="58" fill="#ECEEF1" font-size="26" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${(trade?.ticker || "TRADE").toUpperCase()}</text>
      <text x="40" y="86" fill="#8A93A1" font-size="14" font-family="Segoe UI, Arial, sans-serif">${trade?.side === "short" ? "Short" : "Long"} • ${closeData?.exitDate || trade?.exitDate || "Closed"}</text>
      <polyline points="${points}" fill="none" stroke="#E8A33D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${paddingX}" cy="${entryY}" r="6" fill="#3DDC97" />
      <circle cx="${width - paddingX}" cy="${exitY}" r="6" fill="#F0556B" />
      ${stopLineY != null ? `<line x1="${paddingX}" y1="${stopLineY}" x2="${width - paddingX}" y2="${stopLineY}" stroke="#F0556B" stroke-dasharray="8 6" stroke-width="2" />` : ""}
      ${takeLineY != null ? `<line x1="${paddingX}" y1="${takeLineY}" x2="${width - paddingX}" y2="${takeLineY}" stroke="#3DDC97" stroke-dasharray="8 6" stroke-width="2" />` : ""}
      <text x="40" y="${height - 48}" fill="#ECEEF1" font-size="18" font-family="Segoe UI, Arial, sans-serif" font-weight="600">Entry ${entryPrice.toFixed(2)} • Exit ${exitPrice.toFixed(2)}</text>
      <text x="40" y="${height - 20}" fill="${pnl >= 0 ? "#3DDC97" : "#F0556B"}" font-size="20" font-family="Segoe UI, Arial, sans-serif" font-weight="700">P&L ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seedTrades() {
  const out = [];
  let day = new Date();
  day.setDate(day.getDate() - 30);
  const tickers = ["AAPL", "TSLA", "NVDA", "EURUSD", "BTCUSD", "SPY"];
  for (let i = 0; i < 2; i++) {
    day = new Date(day.getTime() + 1000 * 60 * 60 * 24 * (1 + Math.random() * 1.5));
    const side = Math.random() > 0.5 ? "long" : "short";
    const entry = +(50 + Math.random() * 200).toFixed(2);
    const dir = side === "long" ? 1 : -1;
    const stop = +(entry - dir * (entry * 0.01)).toFixed(2);
    const take = +(entry + dir * (entry * 0.025)).toFixed(2);
    const size = Math.round(10 + Math.random() * 90);
    const closed = i < 11;
    const win = Math.random() > 0.42;
    const exit = closed ? +(entry + dir * (win ? entry * (0.008 + Math.random() * 0.02) : -entry * (0.005 + Math.random() * 0.012))).toFixed(2) : null;
    const t = {
      id: uid(),
      ticker: tickers[Math.floor(Math.random() * tickers.length)],
      side,
      entryDate: day.toISOString().slice(0, 10),
      entryTime: `${String(9 + Math.floor(Math.random() * 6)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      entryPrice: entry,
      stopLoss: stop,
      takeProfit: take,
      positionSize: size,
      riskDollar: +(Math.abs(entry - stop) * size).toFixed(2),
      riskPercent: 1,
      setup: "",
      tags: [],
      notes: "Demo trade generated for preview purposes.",
      entryScreenshot: null,
      exitScreenshot: null,
      status: closed ? "closed" : "open",
      exitPrice: exit,
      exitDate: closed ? day.toISOString().slice(0, 10) : null,
      exitTime: closed ? nowTime() : null,
      exitReason: closed ? (win ? "Take profit hit" : "Stop loss hit") : null,
      postComment: "",
      createdAt: Date.now() - (14 - i) * 1000 * 60 * 60,
    };
    if (closed) {
      const { pnl, pnlPct, r } = calcPnl(t);
      t.pnl = +pnl.toFixed(2);
      t.pnlPercent = +pnlPct.toFixed(2);
      t.rMultiple = r != null ? +r.toFixed(2) : null;
    } else {
      t.pnl = null; t.pnlPercent = null; t.rMultiple = null;
    }
    out.push(t);
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

const DEFAULT_SETUPS = ["Pumpt", "Visual", "News"];
const DEFAULT_TAGS = ["Pumpt", "Visual", "News"];

function normalizeWatchlist(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return { symbol: item, comment: "" };
      if (item && typeof item === "object") {
        return {
          symbol: item.symbol || item.ticker || "",
          comment: item.comment || "",
          price: item.price ?? item.currentPrice ?? null,
          logo: item.logo || "",
          exchange: item.exchange || "",
          currency: item.currency || "",
          name: item.name || "",
        };
      }
      return null;
    })
    .filter((item) => item && item.symbol);
}

const DEFAULT_SCREENER_UNIVERSE = [
  { symbol: "AAPL", name: "Apple", sector: "Technology", instrumentType: "stock", volume: 84_000_000, marketCap: 3.2e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft", sector: "Technology", instrumentType: "stock", volume: 34_000_000, marketCap: 3.0e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA", sector: "Technology", instrumentType: "stock", volume: 61_000_000, marketCap: 2.9e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla", sector: "Automotive", instrumentType: "stock", volume: 95_000_000, marketCap: 0.7e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon", sector: "Consumer", instrumentType: "stock", volume: 39_000_000, marketCap: 1.9e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms", sector: "Technology", instrumentType: "stock", volume: 22_000_000, marketCap: 1.3e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet", sector: "Technology", instrumentType: "stock", volume: 28_000_000, marketCap: 2.1e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix", sector: "Technology", instrumentType: "stock", volume: 13_000_000, marketCap: 0.3e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", instrumentType: "stock", volume: 27_000_000, marketCap: 0.25e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "ORCL", name: "Oracle", sector: "Technology", instrumentType: "stock", volume: 9_000_000, marketCap: 0.35e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financial", instrumentType: "stock", volume: 12_000_000, marketCap: 0.65e12, currency: "USD", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America", sector: "Financial", instrumentType: "stock", volume: 18_000_000, marketCap: 0.28e12, currency: "USD", exchange: "NYSE" },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", instrumentType: "stock", volume: 15_000_000, marketCap: 0.45e12, currency: "USD", exchange: "NYSE" },
  { symbol: "CVX", name: "Chevron", sector: "Energy", instrumentType: "stock", volume: 10_000_000, marketCap: 0.3e12, currency: "USD", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart", sector: "Consumer", instrumentType: "stock", volume: 7_000_000, marketCap: 0.6e12, currency: "USD", exchange: "NYSE" },
  { symbol: "COST", name: "Costco", sector: "Consumer", instrumentType: "stock", volume: 3_000_000, marketCap: 0.4e12, currency: "USD", exchange: "NASDAQ" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", sector: "ETF", instrumentType: "etf", volume: 65_000_000, marketCap: 0.4e12, currency: "USD", exchange: "ARCA" },
  { symbol: "QQQ", name: "Invesco NASDAQ 100 ETF", sector: "ETF", instrumentType: "etf", volume: 42_000_000, marketCap: 0.25e12, currency: "USD", exchange: "ARCA" },
  { symbol: "DIA", name: "SPDR Dow Jones ETF", sector: "ETF", instrumentType: "etf", volume: 4_000_000, marketCap: 0.18e12, currency: "USD", exchange: "ARCA" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", sector: "ETF", instrumentType: "etf", volume: 8_000_000, marketCap: 0.22e12, currency: "USD", exchange: "ARCA" },
  { symbol: "EURUSD", name: "EUR/USD", sector: "FX", instrumentType: "forex", volume: 1_800_000_000, marketCap: null, currency: "EUR/USD", exchange: "FX" },
  { symbol: "USDJPY", name: "USD/JPY", sector: "FX", instrumentType: "forex", volume: 1_400_000_000, marketCap: null, currency: "USD/JPY", exchange: "FX" },
  { symbol: "BTCUSD", name: "Bitcoin", sector: "Crypto", instrumentType: "crypto", volume: 32_000_000, marketCap: 1.3e12, currency: "USD", exchange: "CRYPTO" },
  { symbol: "ETHUSD", name: "Ethereum", sector: "Crypto", instrumentType: "crypto", volume: 19_000_000, marketCap: 0.45e12, currency: "USD", exchange: "CRYPTO" },
  { symbol: "SOLUSD", name: "Solana", sector: "Crypto", instrumentType: "crypto", volume: 8_000_000, marketCap: 0.08e12, currency: "USD", exchange: "CRYPTO" },
];

function inferScreenerInstrumentType(symbol) {
  const normalized = (symbol || "").toUpperCase();
  if (/^(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|TRX|AVAX|LINK|DOT|LTC|NEAR|TON|SHIB|BCH|MATIC|UNI|ATOM|ICP|APT|SUI|XMR|FIL|ARB|OP|WIF|PEPE)/.test(normalized)) return "crypto";
  if (/^(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|CNY|SEK|NOK|MXN|ZAR|TRY|INR|KRW)/.test(normalized) && normalized.includes("USD")) return "forex";
  return "stock";
}

function inferScreenerSector(symbol) {
  const normalized = (symbol || "").toUpperCase();
  if (/^(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|TRX|AVAX|LINK|DOT|LTC|NEAR|TON|SHIB|BCH|MATIC|UNI|ATOM|ICP|APT|SUI|XMR|FIL|ARB|OP|WIF|PEPE)/.test(normalized)) return "Crypto";
  if (/^(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|CNY|SEK|NOK|MXN|ZAR|TRY|INR|KRW)/.test(normalized) && normalized.includes("USD")) return "FX";
  return "Custom";
}

function inferInstrumentType(symbol, entryPrice) {
  const normalized = (symbol || "").toUpperCase().trim();
  const price = Number(entryPrice);
  const cryptoPrefix = /^(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|TRX|AVAX|LINK|DOT|LTC|NEAR|TON|SHIB|BCH|MATIC|UNI|ATOM|ICP|APT|SUI|XMR|FIL|ARB|OP|WIF|PEPE)/;
  const forexPrefix = /^(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|CNY|SEK|NOK|MXN|ZAR|TRY|INR|KRW)/;

  if (cryptoPrefix.test(normalized)) return "crypto";
  if (normalized.endsWith("USD") && !forexPrefix.test(normalized.replace(/USD$/, ""))) return "crypto";
  if (/^[A-Z]{3,5}$/.test(normalized) && normalized.includes("USD") && normalized.length > 5) return "crypto";
  if (forexPrefix.test(normalized) && normalized.includes("USD")) return "forex";

  if (Number.isFinite(price)) {
    if (price <= 0) return "stock";
    if (price < 10) return "crypto";
    if (price > 5000) return "crypto";
    if (normalized.length > 5 && price < 1000) return "crypto";
  }

  return "stock";
}

function readSavedScreenerFilters() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("tj-screener-filters") || "[]");
  } catch {
    return [];
  }
}

function writeSavedScreenerFilters(filters) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("tj-screener-filters", JSON.stringify(filters));
}

function readSavedScreenerAlerts() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("tj-screener-alerts") || "[]");
  } catch {
    return [];
  }
}

function writeSavedScreenerAlerts(alerts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("tj-screener-alerts", JSON.stringify(alerts));
}

export default function TradingJournalApp() {
  const [watchlistInput, setWatchlistInput] = useState("");
  const [watchlistComment, setWatchlistComment] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [closeId, setCloseId] = useState(null);
  const [editTrade, setEditTrade] = useState(null);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "all", side: "all", result: "all", setup: "all", tag: "all" });
  const [incomePeriod, setIncomePeriod] = useState("30d");
  const [defaultRiskPerTrade, setDefaultRiskPerTrade] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem("tj-default-risk") || "";
    } catch {
      return "";
    }
  });
  const [isSavingTrade, setIsSavingTrade] = useState(false);
  const saveInFlightRef = useRef(false);
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem("tj-language") || "en";
  });


  const [trades, setTrades] = useState(() => {
    if (typeof window === "undefined") return seedTrades();
    try {
      const raw = window.localStorage.getItem("tj-trades");
      return raw ? JSON.parse(raw) : seedTrades();
    } catch {
      return seedTrades();
    }
  });
  const [tags, setTags] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_TAGS;
    try {
      const raw = window.localStorage.getItem("tj-tags");
      return raw ? JSON.parse(raw) : DEFAULT_TAGS;
    } catch {
      return DEFAULT_TAGS;
    }
  });
  const [setups, setSetups] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SETUPS;
    try {
      const raw = window.localStorage.getItem("tj-setups");
      return raw ? JSON.parse(raw) : DEFAULT_SETUPS;
    } catch {
      return DEFAULT_SETUPS;
    }
  });
  const [watchlist, setWatchlist] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("tj-watchlist");
      return normalizeWatchlist(raw ? JSON.parse(raw) : []);
    } catch {
      return [];
    }
  });
  const [screenerRows, setScreenerRows] = useState([]);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const screenerDisabled = true;
  const [screenerFilters, setScreenerFilters] = useState({
    query: "",
    sector: "all",
    instrument: "all",
    minChange: "",
    minVolume: "",
    minPrice: "",
    sortBy: "changePercent",
    sortDir: "desc",
  });
  const [savedScreenerFilters, setSavedScreenerFilters] = useState(() => readSavedScreenerFilters());
  const [screenerAlerts, setScreenerAlerts] = useState(() => readSavedScreenerAlerts());
  const [screenerFilterName, setScreenerFilterName] = useState("");
  const [activeScreenerFilterId, setActiveScreenerFilterId] = useState("");
  const lastManualScreenerSymbol = useRef("");
  const screenerInitialLoadDoneRef = useRef(false);
  const screenerSeedSymbols = useMemo(() => {
    const query = (screenerFilters.query || "").trim().toLowerCase();
    const sector = screenerFilters.sector === "all" ? "" : screenerFilters.sector;
    const instrument = screenerFilters.instrument === "all" ? "" : screenerFilters.instrument;

    const symbols = new Set();
    const addSymbol = (symbol) => {
      const normalized = (symbol || "").trim().toUpperCase();
      if (!normalized || !/^[A-Z0-9.\-]+$/.test(normalized)) return;
      if (query && !`${normalized} `.includes(query.toUpperCase())) return;
      symbols.add(normalized);
    };

    DEFAULT_SCREENER_UNIVERSE.forEach((item) => {
      if (sector && item.sector !== sector) return;
      if (instrument && item.instrumentType !== instrument) return;
      addSymbol(item.symbol);
    });

    watchlist.forEach((item) => {
      const symbol = item?.symbol || item?.ticker || "";
      if (sector && item?.sector && item.sector !== sector) return;
      if (instrument && item?.instrumentType && item.instrumentType !== instrument) return;
      addSymbol(symbol);
    });

    trades.forEach((trade) => {
      const symbol = trade?.ticker || trade?.symbol || "";
      if (sector && trade?.sector && trade.sector !== sector) return;
      if (instrument && trade?.instrumentType && trade.instrumentType !== instrument) return;
      addSymbol(symbol);
    });

    return Array.from(symbols).slice(0, 24);
  }, [screenerFilters.query, screenerFilters.sector, screenerFilters.instrument, watchlist, trades]);
  const [profiles, setProfiles] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("tj-profiles");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [standardProfile, setStandardProfile] = useState(() => {
    if (typeof window === "undefined") return { name: "", defaultRiskPerTrade: "", accountSize: "" };
    try {
      const raw = window.localStorage.getItem("tj-standard-profile");
      return raw ? JSON.parse(raw) : { name: "", defaultRiskPerTrade: "", accountSize: "" };
    } catch {
      return { name: "", defaultRiskPerTrade: "", accountSize: "" };
    }
  });
  const [activeProfileId, setActiveProfileId] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("tj-active-profile") || "";
  });
  const [profileName, setProfileName] = useState("");
  const [profileRisk, setProfileRisk] = useState("");
  const [profileAccountSize, setProfileAccountSize] = useState("");
  const [profileTickerSource, setProfileTickerSource] = useState("auto");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const telegramApp = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
        const initData = telegramApp?.initData || params.get("tgWebAppData") || params.get("initData") || "";
        const hasStoredToken = Boolean(typeof window !== "undefined" ? window.localStorage.getItem("tj_token") : "");

        if (initData) {
          await loginWithTelegram(initData);
        }

        if (telegramApp) {
          telegramApp.ready();
          telegramApp.expand();
        }

        if (initData || hasStoredToken) {
          const [remoteTrades, remoteProfiles] = await Promise.all([fetchTrades(activeProfileId), fetchProfiles()]);
          const items = remoteTrades?.items || remoteTrades || [];
          if (Array.isArray(items)) {
            setTrades(items);
          } else {
            setTrades([]);
          }
          if (Array.isArray(remoteProfiles)) {
            setProfiles(remoteProfiles);
          }
        } else {
          throw new Error("Offline mode");
        }
      } catch (e) {
        const storedTrades = typeof window !== "undefined" ? window.localStorage.getItem("tj-trades") : null;
        const storedTags = typeof window !== "undefined" ? window.localStorage.getItem("tj-tags") : null;
        const storedSetups = typeof window !== "undefined" ? window.localStorage.getItem("tj-setups") : null;
        const storedWatchlist = typeof window !== "undefined" ? window.localStorage.getItem("tj-watchlist") : null;

        if (storedTrades) {
          try { setTrades(JSON.parse(storedTrades)); } catch { setTrades(seedTrades()); }
        } else {
          setTrades(seedTrades());
        }
        if (storedTags) {
          try { setTags(JSON.parse(storedTags)); } catch { setTags(DEFAULT_TAGS); }
        } else {
          setTags(DEFAULT_TAGS);
        }
        if (storedSetups) {
          try { setSetups(JSON.parse(storedSetups)); } catch { setSetups(DEFAULT_SETUPS); }
        } else {
          setSetups(DEFAULT_SETUPS);
        }
        if (storedWatchlist) {
          try { setWatchlist(normalizeWatchlist(JSON.parse(storedWatchlist))); } catch { setWatchlist([]); }
        } else {
          setWatchlist([]);
        }
      }
    })();
  }, []);

  useEffect(() => {
    STORAGE.set("tj-trades", JSON.stringify(trades)).catch(() => {});
  }, [trades]);
  useEffect(() => {
    STORAGE.set("tj-tags", JSON.stringify(tags)).catch(() => {});
  }, [tags]);
  useEffect(() => {
    STORAGE.set("tj-setups", JSON.stringify(setups)).catch(() => {});
  }, [setups]);
  useEffect(() => {
    STORAGE.set("tj-watchlist", JSON.stringify(watchlist)).catch(() => {});
  }, [watchlist]);

  useEffect(() => {
    let cancelled = false;
    const loadScreenerRows = async () => {
      if (screenerDisabled) {
        if (!cancelled) {
          setScreenerRows([]);
          setScreenerLoading(false);
          screenerInitialLoadDoneRef.current = true;
        }
        return;
      }

      const shouldShowInitialLoading = !screenerInitialLoadDoneRef.current;
      if (shouldShowInitialLoading) {
        setScreenerLoading(true);
      }

      const candidateSymbols = screenerSeedSymbols;
      if (!candidateSymbols.length) {
        if (!cancelled) {
          setScreenerRows([]);
          screenerInitialLoadDoneRef.current = true;
          setScreenerLoading(false);
        }
        return;
      }

      const nextRows = (await Promise.allSettled(
        candidateSymbols.map(async (symbol) => {
          const fallback = DEFAULT_SCREENER_UNIVERSE.find((item) => item.symbol === symbol) || null;
          try {
            const snapshot = await fetchStockSnapshot(symbol, { source: (activeProfile?.settings?.tickerDataSource || standardProfile?.settings?.tickerDataSource || 'auto') });
            if (!snapshot) {
              return fallback ? { ...fallback } : { symbol, name: symbol, sector: "Custom", instrumentType: inferScreenerInstrumentType(symbol), volume: null, marketCap: null, currency: "USD", exchange: "" };
            }
            return {
              ...(fallback || {}),
              symbol,
              name: snapshot.name || fallback?.name || symbol,
              sector: fallback?.sector || inferScreenerSector(symbol),
              instrumentType: fallback?.instrumentType || inferScreenerInstrumentType(symbol),
              volume: fallback?.volume ?? null,
              marketCap: fallback?.marketCap ?? null,
              currency: snapshot.currency || fallback?.currency || "USD",
              exchange: snapshot.exchange || fallback?.exchange || "",
              price: snapshot.price ?? fallback?.price ?? null,
              change: snapshot.change ?? null,
              changePercent: snapshot.changePercent ?? null,
              preMarketPrice: snapshot.preMarketPrice ?? null,
              preMarketChange: snapshot.preMarketChange ?? null,
              preMarketChangePercent: snapshot.preMarketChangePercent ?? null,
              logo: snapshot.logo || fallback?.logo || "",
            };
          } catch {
            return fallback ? { ...fallback } : { symbol, name: symbol, sector: "Custom", instrumentType: inferScreenerInstrumentType(symbol), volume: null, marketCap: null, currency: "USD", exchange: "" };
          }
        }),
      )).map((result) => (result.status === "fulfilled" ? result.value : null)).filter(Boolean);

      if (!cancelled) {
        setScreenerRows((prev) => {
          const merged = [...prev];
          nextRows.forEach((row) => {
            const key = String(row.symbol || "").toUpperCase();
            const index = merged.findIndex((item) => String(item.symbol || "").toUpperCase() === key);
            if (index >= 0) {
              merged[index] = row;
            } else {
              merged.push(row);
            }
          });
          return merged;
        });
      }
      if (!cancelled) {
        screenerInitialLoadDoneRef.current = true;
        setScreenerLoading(false);
      }
    };

    loadScreenerRows();
    return () => {
      cancelled = true;
    };
  }, [screenerSeedSymbols]);

  useEffect(() => {
    if (screenerDisabled) {
      return;
    }

    const query = (screenerFilters.query || "").trim();
    if (!query) {
      lastManualScreenerSymbol.current = "";
      return;
    }

    const normalizedQuery = query.toUpperCase();
    const looksLikeTicker = /^[A-Z0-9.\-]{1,10}$/.test(normalizedQuery);
    if (!looksLikeTicker) return;
    if (lastManualScreenerSymbol.current === normalizedQuery) return;

    lastManualScreenerSymbol.current = normalizedQuery;
    let cancelled = false;
    (async () => {
      const snapshot = await fetchStockSnapshot(normalizedQuery, { source: (activeProfile?.settings?.tickerDataSource || standardProfile?.settings?.tickerDataSource || 'auto') });
      if (cancelled) return;
      const newRow = {
        symbol: normalizedQuery,
        name: snapshot?.name || normalizedQuery,
        sector: inferScreenerSector(normalizedQuery),
        instrumentType: inferScreenerInstrumentType(normalizedQuery),
        volume: null,
        marketCap: null,
        currency: snapshot?.currency || "USD",
        exchange: snapshot?.exchange || "",
        price: snapshot?.price ?? null,
        change: snapshot?.change ?? null,
        changePercent: snapshot?.changePercent ?? null,
        preMarketPrice: snapshot?.preMarketPrice ?? null,
        preMarketChange: snapshot?.preMarketChange ?? null,
        preMarketChangePercent: snapshot?.preMarketChangePercent ?? null,
        logo: snapshot?.logo || "",
      };
      setScreenerRows((prev) => {
        if (prev.some((row) => (row.symbol || "").toUpperCase() === normalizedQuery)) {
          return prev;
        }
        return [newRow, ...prev];
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [screenerFilters.query]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const symbolsToLoad = new Set();
    const needsMetadata = (item, fallbackKey) => {
      const symbol = normalizeTicker(item?.symbol || item?.ticker || fallbackKey || "");
      if (!symbol || !/^[A-Z0-9.\-]+$/.test(symbol)) return false;
      return true;
    };

    watchlist.forEach((item) => {
      const symbol = normalizeTicker(item?.symbol || "");
      if (!symbol || !/^[A-Z0-9.\-]+$/.test(symbol)) return;
      const hasPrice = item.price != null;
      const hasLogo = Boolean(item.logo);
      const hasExchange = Boolean(item.exchange);
      if (!hasPrice || !hasLogo || !hasExchange) {
        symbolsToLoad.add(symbol);
      }
    });

    trades.forEach((trade) => {
      const symbol = normalizeTicker(trade?.ticker || trade?.symbol || "");
      if (!symbol || !/^[A-Z0-9.\-]+$/.test(symbol)) return;
      const hasPrice = trade.status === "open" ? trade.currentPrice != null : true;
      const hasLogo = Boolean(trade.logo);
      const hasExchange = Boolean(trade.exchange);
      if (trade.status === "open" && (!hasPrice || !hasLogo || !hasExchange)) {
        symbolsToLoad.add(symbol);
      } else if (!hasLogo || !hasExchange) {
        symbolsToLoad.add(symbol);
      }
    });

    if (!symbolsToLoad.size) return;

    let cancelled = false;

    const loadWatchlistMetadata = async () => {
      for (const symbol of Array.from(symbolsToLoad)) {
        if (cancelled) break;
        try {
          const snapshot = await fetchStockSnapshot(symbol, { source: (activeProfile?.settings?.tickerDataSource || standardProfile?.settings?.tickerDataSource || 'auto') });
          if (!cancelled && snapshot) {
            const payload = {
              price: snapshot.price ?? null,
              preMarketPrice: snapshot.preMarketPrice ?? null,
              preMarketChange: snapshot.preMarketChange ?? null,
              preMarketChangePercent: snapshot.preMarketChangePercent ?? null,
              logo: snapshot.logo || "",
              exchange: snapshot.exchange || "",
              currency: snapshot.currency || "",
              name: snapshot.name || "",
              currentPrice: snapshot.price ?? null,
            };

            setWatchlist((prev) =>
              normalizeWatchlist(prev).map((entry) =>
                normalizeTicker(entry.symbol) === symbol ? { ...entry, ...payload } : entry,
              ),
            );

            setTrades((prev) =>
              prev.map((trade) => {
                const tradeSymbol = normalizeTicker(trade?.ticker || trade?.symbol || "");
                if (tradeSymbol !== symbol) return trade;
                const metrics = resolveTradeMetrics({ ...trade, currentPrice: snapshot.price ?? trade.currentPrice ?? null }, snapshot);
                return {
                  ...trade,
                  ...payload,
                  currentPrice: snapshot.price ?? trade.currentPrice ?? null,
                  ...metrics,
                };
              }),
            );
          }
        } catch (error) {
          if (!cancelled) {
            setWatchlist((prev) =>
              normalizeWatchlist(prev).map((entry) =>
                normalizeTicker(entry.symbol) === symbol ? { ...entry, exchange: entry.exchange || "N/A" } : entry,
              ),
            );
          }
        }
      }
    };

    loadWatchlistMetadata();

    return () => {
      cancelled = true;
    };
  }, [watchlist, trades]);
  useEffect(() => {
    if (screenerAlerts.length) {
      writeSavedScreenerAlerts(screenerAlerts);
    } else {
      writeSavedScreenerAlerts([]);
    }
  }, [screenerAlerts]);

  useEffect(() => {
    STORAGE.set("tj-profiles", JSON.stringify(profiles)).catch(() => {});
  }, [profiles]);
  useEffect(() => {
    STORAGE.set("tj-standard-profile", JSON.stringify(standardProfile)).catch(() => {});
  }, [standardProfile]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tj-active-profile", activeProfileId);
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tj-language", language);
    }
  }, [language]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tj-default-risk", defaultRiskPerTrade);
    }
  }, [defaultRiskPerTrade]);

  // Keep global dark background to match app
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.body.style.background = '#0B0D10';
        document.body.style.color = '#ECEEF1';
        // ensure CSS variables for dark theme are set on first load
        const root = document.documentElement;
        root.style.setProperty('--bg', '#0B0D10');
        root.style.setProperty('--surface', '#14181D');
        root.style.setProperty('--surface-2', '#1B2129');
        root.style.setProperty('--surface-3', '#232B34');
        root.style.setProperty('--border', '#262E38');
        root.style.setProperty('--text', '#ECEEF1');
        root.style.setProperty('--text-dim', '#8A93A1');
        root.style.setProperty('--text-faint', '#5B6472');
        root.style.setProperty('--accent', '#E8A33D');
        root.style.setProperty('--accent-dim', '#4A3A22');
        root.style.setProperty('--profit', '#3DDC97');
        root.style.setProperty('--loss', '#F0556B');
        root.style.setProperty('--long', '#5EC8D8');
        root.style.setProperty('--short', '#C97BE0');
      }
    } catch (e) {}
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function addTicker() {
    const symbol = watchlistInput.trim().toUpperCase();
    const comment = watchlistComment.trim();
    if (!symbol) return;
    setWatchlist((prev) => {
      const items = normalizeWatchlist(prev);
      const existingIndex = items.findIndex((item) => item.symbol === symbol);
      if (existingIndex >= 0) {
        const next = [...items];
        next[existingIndex] = { ...next[existingIndex], comment: comment || next[existingIndex].comment };
        return next;
      }
      return [...items, { symbol, comment }];
    });
    setWatchlistInput("");
    setWatchlistComment("");
  }

  function removeTicker(symbol) {
    setWatchlist((prev) => normalizeWatchlist(prev).filter((item) => item.symbol !== symbol));
  }

  function updateWatchlistComment(symbol, comment) {
    setWatchlist((prev) => normalizeWatchlist(prev).map((item) => item.symbol === symbol ? { ...item, comment } : item));
  }

  function saveScreenerFilter() {
    const name = screenerFilterName.trim();
    if (!name) return;
    const nextFilter = {
      id: `${Date.now()}`,
      name,
      values: screenerFilters,
    };
    const nextFilters = [nextFilter, ...savedScreenerFilters.filter((item) => item.id !== nextFilter.id)];
    setSavedScreenerFilters(nextFilters);
    writeSavedScreenerFilters(nextFilters);
    setActiveScreenerFilterId(nextFilter.id);
    setScreenerFilterName("");
  }

  function applyScreenerFilter(filter) {
    setScreenerFilters(filter.values);
    setActiveScreenerFilterId(filter.id);
  }

  function removeScreenerFilter(id) {
    const nextFilters = savedScreenerFilters.filter((item) => item.id !== id);
    setSavedScreenerFilters(nextFilters);
    writeSavedScreenerFilters(nextFilters);
    if (activeScreenerFilterId === id) {
      setActiveScreenerFilterId("");
    }
  }

  function addScreenerAlert(alert) {
    const nextAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...alert,
      createdAt: Date.now(),
    };
    setScreenerAlerts((prev) => [nextAlert, ...prev]);
    showToast(`${alert.symbol} alert saved`);

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission().catch(() => {});
    }
  }

  function removeScreenerAlert(id) {
    setScreenerAlerts((prev) => prev.filter((item) => item.id !== id));
  }

  useEffect(() => {
    if (!screenerRows.length || !screenerAlerts.length) return;

    let shouldPersist = false;
    const nextAlerts = screenerAlerts.map((alert) => {
      if (alert.triggered) return alert;
      const row = screenerRows.find((item) => item.symbol === alert.symbol);
      const price = row?.price != null ? Number(row.price) : null;
      if (price == null || Number.isNaN(price)) return alert;
      const target = Number(alert.targetPrice);
      if (Number.isNaN(target)) return alert;
      const shouldFire = alert.condition === "above" ? price >= target : price <= target;
      if (!shouldFire) return alert;

      shouldPersist = true;
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(`${alert.symbol} alert`, {
          body: `${alert.symbol} ${alert.condition === "above" ? "is above" : "is below"} ${formatStockPrice(target, row?.currency || "USD")}`,
        });
      }
      showToast(`${alert.symbol} alert triggered`);
      return { ...alert, triggered: true, triggeredAt: Date.now() };
    });

    if (shouldPersist) {
      setScreenerAlerts(nextAlerts);
    }
  }, [screenerRows, screenerAlerts]);

  async function addTrade(t) {
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setIsSavingTrade(true);

    const riskDollar = resolveRiskValue(t.riskDollar) ?? resolveRiskValue(defaultRiskPerTrade);
    const optimisticTrade = {
      ...t,
      instrumentType: inferInstrumentType(t.ticker, t.entryPrice),
      id: uid(),
      status: "open",
      createdAt: Date.now(),
      pnl: null,
      pnlPercent: null,
      rMultiple: null,
      profileId: activeProfileId || undefined,
      tags: t.tags || [],
    };

    setTrades((prev) => [optimisticTrade, ...prev]);
    setNewOpen(false);
    showToast(t.savingTrade);

    try {
      const created = await createTrade({
        ticker: t.ticker,
        side: t.side,
        entryDate: t.entryDate,
        entryTime: t.entryTime,
        entryPrice: Number(t.entryPrice),
        stopLoss: t.stopLoss ? Number(t.stopLoss) : undefined,
        takeProfit: t.takeProfit ? Number(t.takeProfit) : undefined,
        positionSize: t.positionSize ? Number(t.positionSize) : undefined,
        riskDollar: t.riskDollar ? Number(t.riskDollar) : undefined,
        riskPercent: t.riskPercent ? Number(t.riskPercent) : undefined,
        timeframe: t.timeframe,
        setup: t.setup,
        notes: t.notes,
        instrumentType: inferInstrumentType(t.ticker, t.entryPrice),
        profileId: activeProfileId || undefined,
        tags: t.tags || [],
      });

      if (created && typeof created === "object" && created.id) {
        setTrades((prev) => prev.map((trade) => trade.id === optimisticTrade.id ? { ...optimisticTrade, ...created } : trade));
      }
        showToast(t.tradeAdded);
    } catch (err) {
      showToast(err.message || t.failedAddTrade);
    } finally {
      saveInFlightRef.current = false;
      setIsSavingTrade(false);
    }
  }
  async function updateTradeById(id, patch) {
    const trade = trades.find((item) => item.id === id) || {};
    const normalizedPatch = {
      ...patch,
      riskDollar: resolveRiskValue(patch.riskDollar) ?? resolveRiskValue(defaultRiskPerTrade) ?? patch.riskDollar,
    };
    normalizedPatch.instrumentType = inferInstrumentType(
      normalizedPatch.ticker ?? trade.ticker,
      normalizedPatch.entryPrice ?? trade.entryPrice,
    );
    try {
      const updated = await updateTrade(id, normalizedPatch);
      if (updated && typeof updated === "object" && updated.id) {
        setTrades((prev) => prev.map((trade) => (trade.id === id ? updated : trade)));
      } else {
        setTrades((prev) => prev.map((trade) => (trade.id === id ? { ...trade, ...normalizedPatch } : trade)));
      }
      showToast(t.tradeUpdated);
    } catch (err) {
      setTrades((prev) => prev.map((trade) => (trade.id === id ? { ...trade, ...normalizedPatch } : trade)));
      showToast(err.message || t.failedUpdateTrade);
    }
  }
  // Ensure existing trades have correct instrumentType inferred from ticker + entryPrice.
  useEffect(() => {
    if (!trades || !trades.length) return;
    (async () => {
      const toFix = [];
      for (const trade of trades) {
        try {
          const inferred = inferInstrumentType(trade.ticker, trade.entryPrice);
          if (!trade.instrumentType || trade.instrumentType !== inferred) {
            toFix.push({ id: trade.id, instrumentType: inferred });
          }
        } catch (e) {
          // ignore
        }
      }
      if (!toFix.length) return;
      for (const item of toFix) {
        try {
          // reuse update flow which also updates local state
          await updateTradeById(item.id, { instrumentType: item.instrumentType });
        } catch (e) {
          // ignore individual failures
        }
      }
    })();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function deleteTradeById(id) {
    try {
      await deleteTrade(id);
      setTrades((prev) => prev.filter((trade) => trade.id !== id));
      setDetailId(null);
      showToast(t.tradeDeleted);
    } catch (err) {
      setTrades((prev) => prev.filter((trade) => trade.id !== id));
      setDetailId(null);
      showToast(err.message || t.failedDeleteTrade);
    }
  }
  async function duplicateTradeById(trade) {
    try {
      const created = await duplicateTrade(trade.id);
      if (created && typeof created === "object" && created.id) {
        setTrades((prev) => [created, ...prev]);
      } else {
        const copy = { ...trade, id: uid(), status: "open", createdAt: Date.now(), exitPrice: null, exitDate: null, exitTime: null, exitReason: null, pnl: null, pnlPercent: null, rMultiple: null, postComment: "" };
        setTrades((prev) => [copy, ...prev]);
      }
      showToast(t.tradeDuplicated);
    } catch (err) {
      const copy = { ...trade, id: uid(), status: "open", createdAt: Date.now(), exitPrice: null, exitDate: null, exitTime: null, exitReason: null, pnl: null, pnlPercent: null, rMultiple: null, postComment: "" };
      setTrades((prev) => [copy, ...prev]);
      showToast(err.message || t.failedDuplicateTrade);
    }
  }
  async function closeTradeById(id, data) {
    try {
      const trade = trades.find((item) => item.id === id);
      const merged = { ...trade, ...data };
      const { pnl, pnlPct, r } = calcPnl(merged);
      const payload = {
        ...data,
        exitScreenshot: data.exitScreenshot || null,
        pnl: data.pnl !== "" && data.pnl != null ? Number(data.pnl) : (pnl != null ? +pnl.toFixed(2) : null),
        pnlPercent: data.pnlPercent !== "" && data.pnlPercent != null ? Number(data.pnlPercent) : (pnlPct != null ? +pnlPct.toFixed(2) : null),
        rMultiple: data.rMultiple !== "" && data.rMultiple != null ? Number(data.rMultiple) : (r != null ? +r.toFixed(2) : null),
      };
      const updated = await closeTrade(id, payload);
      if (updated && typeof updated === "object" && updated.id) {
        setTrades((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } else {
        setTrades((prev) => prev.map((item) => (item.id === id ? { ...item, ...payload, status: "closed" } : item)));
      }
      setCloseId(null);
      setDetailId(null);
      showToast(t.tradeClosed);
    } catch (err) {
      const trade = trades.find((item) => item.id === id);
      const merged = { ...trade, ...data };
      const { pnl, pnlPct, r } = calcPnl(merged);
      updateTradeById(id, {
        ...data,
        status: "closed",
        pnl: data.pnl !== "" && data.pnl != null ? Number(data.pnl) : (pnl != null ? +pnl.toFixed(2) : null),
        pnlPercent: data.pnlPercent !== "" && data.pnlPercent != null ? Number(data.pnlPercent) : (pnlPct != null ? +pnlPct.toFixed(2) : null),
        rMultiple: data.rMultiple !== "" && data.rMultiple != null ? Number(data.rMultiple) : (r != null ? +r.toFixed(2) : null),
      });
      setCloseId(null);
      setDetailId(null);
      showToast(err.message || t.failedCloseTrade);
    }
  }

  const filtered = useMemo(() => {
    let out = trades;
    if (activeProfileId) {
      out = out.filter((trade) => trade.profileId === activeProfileId);
    } else {
      out = out.filter((trade) => !trade.profileId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((trade) =>
        trade.ticker.toLowerCase().includes(q) ||
        (trade.notes || "").toLowerCase().includes(q) ||
        (trade.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (filters.status !== "all") out = out.filter((trade) => trade.status === filters.status);
    if (filters.side !== "all") out = out.filter((trade) => trade.side === filters.side);
    if (filters.result !== "all") out = out.filter((trade) => trade.status === "closed" && (filters.result === "profit" ? trade.pnl > 0 : trade.pnl <= 0));
    if (filters.setup !== "all") out = out.filter((trade) => trade.setup === filters.setup);
    if (filters.tag !== "all") out = out.filter((trade) => (trade.tags || []).includes(filters.tag));
    return out;
  }, [trades, activeProfileId, search, filters]);

  const activeProfile = useMemo(() => profiles.find((item) => item.id === activeProfileId), [profiles, activeProfileId]);
  const stats = useMemo(() => computeStats(filtered, defaultRiskPerTrade, activeProfile ? activeProfile.accountSize : standardProfile.accountSize), [filtered, defaultRiskPerTrade, activeProfile?.accountSize, standardProfile.accountSize]);
  const periodPnlStats = useMemo(() => computePeriodPnl(filtered, incomePeriod, defaultRiskPerTrade), [filtered, incomePeriod, defaultRiskPerTrade]);
  const detailTrade = trades.find((trade) => trade.id === detailId) || null;
  const closingTrade = trades.find((trade) => trade.id === closeId) || null;

  const t = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;

  async function saveProfile() {
    const name = profileName.trim();
    if (!name) return;
    setProfileSaving(true);
    try {
      if (editingProfileId === STANDARD_PROFILE_ID) {
        const nextProfile = {
          name,
          defaultRiskPerTrade: profileRisk ? Number(profileRisk) : undefined,
          accountSize: profileAccountSize ? Number(profileAccountSize) : undefined,
          settings: { tickerDataSource: profileTickerSource },
        };
        setStandardProfile(nextProfile);
        setActiveProfileId("");
        if (nextProfile.defaultRiskPerTrade != null) {
          setDefaultRiskPerTrade(String(nextProfile.defaultRiskPerTrade));
        }
      } else {
        let profile;
        if (editingProfileId) {
          profile = await updateProfile(editingProfileId, {
            name,
            defaultRiskPerTrade: profileRisk ? Number(profileRisk) : undefined,
            accountSize: profileAccountSize ? Number(profileAccountSize) : undefined,
            settings: { tickerDataSource: profileTickerSource },
          });
        } else {
          profile = await createProfile({
            name,
            defaultRiskPerTrade: profileRisk ? Number(profileRisk) : undefined,
            accountSize: profileAccountSize ? Number(profileAccountSize) : undefined,
            settings: { tickerDataSource: profileTickerSource },
          });
        }
        if (!profile || !profile.id) {
          throw new Error('Failed to save profile');
        }
        setProfiles((prev) => {
          if (editingProfileId) {
            return prev.map((item) => (item.id === profile.id ? profile : item));
          }
          return [...prev, profile];
        });
        setActiveProfileId(profile.id);
      }
      setProfileName("");
      setProfileRisk("");
      setProfileAccountSize("");
      setEditingProfileId("");
    } catch (error) {
      console.error(error);
      showToast(error?.message || 'Could not save profile');
    } finally {
      setProfileSaving(false);
    }
  }

  function editProfile(profile) {
    setProfileName(profile.name ?? "");
    setProfileRisk(profile.defaultRiskPerTrade != null ? String(profile.defaultRiskPerTrade) : "");
    setProfileAccountSize(profile.accountSize != null ? String(profile.accountSize) : "");
    setProfileTickerSource(profile?.settings?.tickerDataSource || "auto");
    setEditingProfileId(profile.id);
    setProfileModalOpen(true);
  }

  function resetProfileForm() {
    setProfileName("");
    setProfileRisk("");
    setProfileAccountSize("");
    setEditingProfileId("");
    setProfileTickerSource("auto");
  }

  async function removeProfile(id) {
    try {
      await deleteProfile(id);
      setProfiles((prev) => {
        const next = prev.filter((item) => item.id !== id);
        if (activeProfileId === id) {
          setActiveProfileId(next.length ? next[0].id : '');
        }
        return next;
      });
      showToast('Profile removed');
    } catch (error) {
      console.error(error);
      showToast(error?.message || 'Could not delete profile');
    }
  }

  useEffect(() => {
    const profile = activeProfileId ? profiles.find((item) => item.id === activeProfileId) : null;
    if (activeProfileId && !profile) {
      setActiveProfileId("");
      return;
    }

    if (profile) {
      if (profile.defaultRiskPerTrade != null) {
        setDefaultRiskPerTrade(String(profile.defaultRiskPerTrade));
      }
    } else {
      if (standardProfile.defaultRiskPerTrade != null && standardProfile.defaultRiskPerTrade !== "") {
        setDefaultRiskPerTrade(String(standardProfile.defaultRiskPerTrade));
      }
    }
  }, [activeProfileId, profiles, standardProfile]);

  return (
    <div className="tj-root">
      <style>{STYLE}</style>
      <div className="tj-phone tj-scroll-hide">
        <TickerTape stats={stats} />

        <div style={{ padding: "10px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div className="tj-mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>{t.language}: {language === "uk" ? t.ukrainian : t.english}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className={cls("tj-chip", language === "en" && "on")} onClick={() => setLanguage("en")}>EN</button>
              <button className={cls("tj-chip", language === "uk" && "on")} onClick={() => setLanguage("uk")}>UA</button>
              <button className={cls("tj-chip", language === "ru" && "on")} onClick={() => setLanguage("ru")}>RU</button>
              
            </div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                key="settings"
                type="button"
                className={cls("tj-chip")}
                onClick={() => setProfileModalOpen(true)}
                aria-label="Profile settings"
              >
                <Settings size={16} />
              </button>
              <button
                key="standard"
                className={cls("tj-chip", !activeProfileId && "on")}
                onClick={() => setActiveProfileId("")}
              >
                {standardProfile.name || t.standardProfile}
              </button>
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className={cls("tj-chip", activeProfileId === profile.id && "on")}
                  onClick={() => setActiveProfileId(profile.id)}
                >
                  {profile.name}
                </button>
              ))}
            </div>
          </div>
          {profileModalOpen && (
            <div className="tj-sheet-backdrop" onClick={() => setProfileModalOpen(false)}>
              <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
                <SheetHeader title="Profile settings" onClose={() => setProfileModalOpen(false)} />
                <div style={{ padding: "0 18px 20px" }}>
                  <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div className="tj-subtitle">Existing profiles</div>
                        <div className="tj-mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          Select one to use it for trades
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                        {profiles.length > 0 || standardProfile ? (
                          <>
                            <div key="standard-profile" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: 12, background: !activeProfileId ? "var(--surface-emphasis)" : "transparent" }}>
                              <button
                                type="button"
                                className="tj-chip"
                                style={{ flex: 1, justifyContent: "flex-start", border: "none", background: "transparent", padding: 0 }}
                                onClick={() => setActiveProfileId("")}
                              >
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                  <div>{standardProfile.name || t.standardProfile}</div>
                                  <div className="tj-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                    {standardProfile.accountSize ? `Account: ${standardProfile.accountSize}` : "No account size"}
                                    {standardProfile.defaultRiskPerTrade ? ` • Risk: $${standardProfile.defaultRiskPerTrade}` : ""}
                                  </div>
                                </div>
                              </button>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button type="button" className="tj-btn-ghost" onClick={() => editProfile({ id: STANDARD_PROFILE_ID, ...standardProfile })}>
                                  <Edit2 size={16} />
                                </button>
                              </div>
                            </div>
                            {profiles.map((profile) => (
                              <div key={profile.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: 12, background: activeProfileId === profile.id ? "var(--surface-emphasis)" : "transparent" }}>
                                <button
                                  type="button"
                                  className="tj-chip"
                                  style={{ flex: 1, justifyContent: "flex-start", border: "none", background: "transparent", padding: 0 }}
                                  onClick={() => setActiveProfileId(profile.id)}
                                >
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                    <div>{profile.name}</div>
                                    <div className="tj-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                      {profile.accountSize ? `Account: ${profile.accountSize}` : "No account size"}
                                      {profile.defaultRiskPerTrade ? ` • Risk: $${profile.defaultRiskPerTrade}` : ""}
                                    </div>
                                  </div>
                                </button>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button type="button" className="tj-btn-ghost" onClick={() => editProfile(profile)}>
                                    <Edit2 size={16} />
                                  </button>
                                  <button type="button" className="tj-btn-ghost" onClick={() => removeProfile(profile.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="tj-mono" style={{ color: "var(--text-dim)" }}>
                            No profiles yet. Create one below.
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="tj-subtitle">Create new profile</div>
                      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                        <div>
                          <label className="tj-label">Profile name</label>
                          <input
                            className="tj-input tj-input-compact"
                            placeholder="Profile name"
                            value={profileName}
                            onChange={(event) => setProfileName(event.target.value)}
                          />
                        </div>
                        <div>
                          <label className="tj-label">Default risk per trade</label>
                          <input
                            className="tj-input tj-input-compact"
                            placeholder="e.g. 50"
                            value={profileRisk}
                            onChange={(event) => setProfileRisk(event.target.value)}
                          />
                        </div>
                        <div>
                          <label className="tj-label">Account size</label>
                          <input
                            className="tj-input tj-input-compact"
                            placeholder="e.g. 10000"
                            value={profileAccountSize}
                            onChange={(event) => setProfileAccountSize(event.target.value)}
                          />
                        </div>
                        <div>
                          <label className="tj-label">Ticker data source</label>
                          <select className="tj-input tj-input-compact" value={profileTickerSource} onChange={(e) => setProfileTickerSource(e.target.value)}>
                            <option value="auto">Auto (detect by ticker)</option>
                            <option value="finnhub">Finnhub (stocks)</option>
                            <option value="binance">Binance (crypto)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
                    <button className="tj-btn-ghost" onClick={() => { resetProfileForm(); setProfileModalOpen(false); }}>{t.cancelLabel}</button>
                    <button className="tj-btn-primary" onClick={saveProfile} disabled={profileSaving}>
                      {profileSaving ? "Saving..." : editingProfileId ? "Save changes" : "Create profile"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {tab === "dashboard" && (
          <Dashboard
            stats={stats}
            trades={trades}
            search={search}
            setSearch={setSearch}
            onOpenFilter={() => setFilterOpen(true)}
            onOpenDetail={setDetailId}
            filtersActive={Object.values(filters).some((value) => value !== "all")}
            filtered={filtered}
            goJournal={() => setTab("journal")}
            incomePeriod={incomePeriod}
            setIncomePeriod={setIncomePeriod}
            periodPnlStats={periodPnlStats}
            t={t}
            defaultRiskPerTrade={defaultRiskPerTrade}
            setDefaultRiskPerTrade={setDefaultRiskPerTrade}
            language={language}
            setLanguage={setLanguage}
          />
        )}
        {tab === "journal" && (
          <Journal
            trades={filtered}
            search={search}
            setSearch={setSearch}
            onOpenFilter={() => setFilterOpen(true)}
            onOpenDetail={setDetailId}
            filtersActive={Object.values(filters).some((value) => value !== "all")}
            onExport={(type) => exportTrades(trades, type, showToast, t)}
            t={t}
            language={language}
            setLanguage={setLanguage}
          />
        )}
        {tab === "stats" && <StatsScreen stats={stats} trades={filtered} onOpenFilter={() => setFilterOpen(true)} filtersActive={Object.values(filters).some((value) => value !== "all")} t={t} language={language} setLanguage={setLanguage} />}
        {tab === "watchlist" && (
          <div style={{ padding: 18 }}>
            <div className="tj-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t.watchlistTitle}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 12 }}>{t.watchlistIntro}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input className="tj-input tj-input-compact" placeholder={t.watchlistAddTickerPlaceholder} value={watchlistInput} onChange={(event) => setWatchlistInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTicker(); } }} />
              <button className="tj-btn-primary" onClick={addTicker}>{t.watchlistAddButton}</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <input className="tj-input tj-input-compact" placeholder={t.watchlistCommentPlaceholder} value={watchlistComment} onChange={(event) => setWatchlistComment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTicker(); } }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {watchlist.length === 0 ? (
                <div className="tj-card" style={{ padding: 16, color: "var(--text-dim)", fontSize: 13 }}>{t.watchlistEmpty}</div>
              ) : watchlist.map((item) => (
                <div key={item.symbol} className="tj-card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    {item.logo ? (
                      <img src={item.logo} alt={item.symbol} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", background: "var(--surface-2)" }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>
                        {item.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div className="tj-display" style={{ fontSize: 16, fontWeight: 700 }}>{item.symbol}</div>
                        {item.price != null ? (
                          <span style={{ fontSize: 13, color: item.price < 0 ? "var(--loss)" : "var(--profit)" }}>{formatStockPrice(item.price, item.currency || "USD")}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Loading…</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                        {item.exchange ? `${item.exchange}${item.name ? ` • ${item.name}` : ""}` : (item.name ? item.name : "Finnhub data")}
                      </div>
                      {item.preMarketPrice != null && (
                        <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 4 }}>
                          {t.premarketLabel}: {formatStockPrice(item.preMarketPrice, item.currency || "USD")}
                          {item.preMarketChangePercent != null ? ` (${item.preMarketChangePercent >= 0 ? "+" : ""}${fmt2(item.preMarketChangePercent)}%)` : ""}
                        </div>
                      )}
                      <input className="tj-input tj-input-compact" style={{ marginTop: 8 }} placeholder="Ticker comment" value={item.comment || ""} onChange={(event) => updateWatchlistComment(item.symbol, event.target.value)} />
                    </div>
                  </div>
                  <button className="tj-btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => removeTicker(item.symbol)}>{t.watchlistRemove}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "screener" && (
          <ScreenerPanel
            rows={screenerRows}
            loading={screenerLoading}
            filters={screenerFilters}
            setFilters={setScreenerFilters}
            savedFilters={savedScreenerFilters}
            onSaveFilter={saveScreenerFilter}
            onApplyFilter={applyScreenerFilter}
            onRemoveFilter={removeScreenerFilter}
            onAddAlert={addScreenerAlert}
            onRemoveAlert={removeScreenerAlert}
            alerts={screenerAlerts}
            filterName={screenerFilterName}
            setFilterName={setScreenerFilterName}
            activeFilterId={activeScreenerFilterId}
            t={t}
          />
        )}

        <button className="tj-fab" onClick={() => setNewOpen(true)} aria-label="New trade">
          <Plus size={22} strokeWidth={2.2} />
        </button>

        <nav className="tj-navbar">
          <NavItem icon={Home} label={t.dashboard} active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <NavItem icon={BookOpen} label={t.journal} active={tab === "journal"} onClick={() => setTab("journal")} />
          <NavItem icon={Eye} label={t.watchlist} active={tab === "watchlist"} onClick={() => setTab("watchlist")} />
          <NavItem icon={BarChart2} label={t.screener} active={tab === "screener"} onClick={() => setTab("screener")} />
          <NavItem icon={BarChart2} label={t.statistics} active={tab === "stats"} onClick={() => setTab("stats")} />
        </nav>
      </div>

      {newOpen && (
        <TradeForm
          mode="new"
          setups={setups}
          setSetups={setSetups}
          tags={tags}
          setTags={setTags}
          onClose={() => setNewOpen(false)}
          onSubmit={addTrade}
          t={t}
          isSubmitting={isSavingTrade}
          defaultRiskPerTrade={defaultRiskPerTrade}
        />
      )}

      {editTrade && (
        <TradeForm
          mode="edit"
          initial={editTrade}
          setups={setups}
          setSetups={setSetups}
          tags={tags}
          setTags={setTags}
          onClose={() => setEditTrade(null)}
          onSubmit={(data) => {
            updateTradeById(editTrade.id, data);
            setEditTrade(null);
          }}
          t={t}
        />
      )}

      {detailTrade && (
        <TradeDetail
          trade={detailTrade}
          onClose={() => setDetailId(null)}
          t={t}
          onEdit={() => {
            setEditTrade(detailTrade);
            setDetailId(null);
          }}
          onDelete={() => deleteTradeById(detailTrade.id)}
          onDuplicate={() => {
            duplicateTradeById(detailTrade);
            setDetailId(null);
          }}
          onCloseTrade={() => {
            setCloseId(detailTrade.id);
            setDetailId(null);
          }}
        />
      )}

      {closingTrade && (
        <CloseTradeForm
          trade={closingTrade}
          onClose={() => setCloseId(null)}
          onSubmit={(data) => closeTradeById(closingTrade.id, data)}
          t={t}
        />
      )}

      {filterOpen && (
        <FilterSheet
          filters={filters}
          setFilters={setFilters}
          setups={setups}
          tags={tags}
          onClose={() => setFilterOpen(false)}
          t={t}
        />
      )}

      {toast && <div className="tj-toast">{toast}</div>}
    </div>
  );
}

function getTodayKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveRiskValue(value) {
  if (value === "" || value == null) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function computePeriodPnl(trades, period, defaultRiskPerTrade) {
  const closed = trades.filter((trade) => trade.status === "closed" && trade.pnl != null && trade.exitDate);
  const now = new Date();
  let startDate = null;

  if (period === "7d") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === "30d") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);
  } else if (period === "90d") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 90);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const filtered = closed.filter((trade) => {
    if (!startDate) return true;
    const tradeDate = new Date(`${trade.exitDate}T00:00:00`);
    return tradeDate >= startDate && tradeDate <= now;
  });

  const adjustedPnls = filtered.map((trade) => getRiskAdjustedPnl(trade, defaultRiskPerTrade));
  const totalIncome = adjustedPnls.reduce((sum, value) => sum + value, 0);
  const riskCount = filtered.reduce((sum, trade) => sum + getTradeRiskCount(trade, defaultRiskPerTrade), 0);
  const wins = adjustedPnls.filter((value) => value > 0);
  const losses = adjustedPnls.filter((value) => value <= 0);
  const winRate = filtered.length ? (wins.length / filtered.length) * 100 : 0;
  const grossWin = wins.reduce((sum, value) => sum + value, 0);
  const grossLoss = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const profitFactor = grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;

  return {
    totalIncome,
    tradeCount: filtered.length,
    riskCount,
    winRate,
    profitFactor,
    label: period === "7d" ? "last 7 days" : period === "30d" ? "last 30 days" : period === "90d" ? "last 90 days" : period === "month" ? "this month" : "all time",
  };
}

function getTradeRiskCount(trade, defaultRiskPerTrade) {
  const defaultRisk = resolveRiskValue(defaultRiskPerTrade);
  const explicitRisk = resolveTradeRisk(trade, defaultRiskPerTrade);

  if (defaultRisk) {
    const tradeRisk = trade.riskDollar != null && trade.riskDollar !== "" ? Number(trade.riskDollar) : defaultRisk;
    return defaultRisk > 0 ? tradeRisk / defaultRisk : 0;
  }

  if (!explicitRisk || explicitRisk <= 0) return 0;
  return trade.riskDollar != null && trade.riskDollar !== "" ? Number(trade.riskDollar) / explicitRisk : 0;
}

function resolveTradeRisk(trade, defaultRiskPerTrade) {
  const raw = trade.riskDollar != null && trade.riskDollar !== "" ? Number(trade.riskDollar) : null;
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}

function getRiskAdjustedPnl(trade, defaultRiskPerTrade) {
  if (trade.pnl == null || trade.pnl === "") return 0;
  const defaultRisk = resolveRiskValue(defaultRiskPerTrade);
  if (defaultRisk && defaultRisk > 0) {
    return Number(trade.pnl) / defaultRisk;
  }
  const risk = resolveTradeRisk(trade, defaultRiskPerTrade);
  return risk && risk > 0 ? Number(trade.pnl) / risk : Number(trade.pnl) || 0;
}

function computeStats(trades, defaultRiskPerTrade, accountSize) {
  const closed = trades.filter((trade) => trade.status === "closed" && trade.pnl != null);
  const open = trades.filter((trade) => trade.status === "open");
  const adjustedPnls = closed.map((trade) => getRiskAdjustedPnl(trade, defaultRiskPerTrade));
  const totalPnl = adjustedPnls.reduce((sum, value) => sum + value, 0);
  const totalPnlDollar = closed.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const currentDeposit = accountSize != null && Number.isFinite(Number(accountSize))
    ? Number(accountSize) + totalPnlDollar
    : undefined;
  const riskCount = closed.reduce((sum, trade) => sum + getTradeRiskCount(trade, defaultRiskPerTrade), 0);
  const now = new Date();
  const todayKey = getTodayKey();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayPnl = closed.reduce((sum, trade) => (trade.exitDate === todayKey ? sum + trade.pnl : sum), 0);
  const monthPnl = closed.reduce((sum, trade) => {
    if (!trade.exitDate) return sum;
    const exitDate = new Date(`${trade.exitDate}T00:00:00`);
    return exitDate >= monthStart && exitDate <= now ? sum + trade.pnl : sum;
  }, 0);
  const totalPnlPct = closed.reduce((sum, trade) => sum + (trade.pnlPercent || 0), 0);
  const wins = adjustedPnls.filter((value) => value > 0);
  const losses = adjustedPnls.filter((value) => value <= 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length ? wins.reduce((sum, value) => sum + value, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((sum, value) => sum + value, 0) / losses.length : 0;
  const grossWin = wins.reduce((sum, value) => sum + value, 0);
  const grossLoss = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const profitFactor = grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const expectancy = closed.length ? totalPnl / closed.length : 0;
  const rTrades = closed.filter((trade) => trade.rMultiple != null);
  const avgR = rTrades.length ? rTrades.reduce((sum, trade) => sum + trade.rMultiple, 0) / rTrades.length : 0;
  const best = closed.length ? closed.reduce((a, b) => (b.pnl > a.pnl ? b : a)) : null;
  const worst = closed.length ? closed.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : null;

  const chrono = [...closed].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
  let curStreak = 0, maxWinStreak = 0, maxLossStreak = 0, curType = null;
  chrono.forEach((trade) => {
    const isWin = trade.pnl > 0;
    if (curType === isWin) curStreak++; else { curStreak = 1; curType = isWin; }
    if (isWin) maxWinStreak = Math.max(maxWinStreak, curStreak);
    else maxLossStreak = Math.max(maxLossStreak, curStreak);
  });

  let equity = 0;
  const equityCurve = chrono.map((trade) => { equity += trade.pnl; return { date: trade.exitDate, equity: +equity.toFixed(2) }; });

  const byDayMap = {};
  chrono.forEach((trade) => { byDayMap[trade.exitDate] = (byDayMap[trade.exitDate] || 0) + trade.pnl; });
  const byDay = Object.entries(byDayMap).map(([date, pnl]) => ({ date, pnl: +pnl.toFixed(2) }));

  const byDayPnlMap = {};
  chrono.forEach((trade) => {
    const day = trade.exitDate || "";
    if (!byDayPnlMap[day]) byDayPnlMap[day] = { date: day, pnl: 0 };
    byDayPnlMap[day].pnl += trade.pnl;
  });
  const byDayEquity = Object.values(byDayPnlMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce((acc, item) => {
      const last = acc[acc.length - 1];
      const equity = last ? +(last.equity + item.pnl).toFixed(2) : +(item.pnl).toFixed(2);
      acc.push({ date: item.date, equity });
      return acc;
    }, []);

  return {
    totalPnl, totalPnlDollar, currentDeposit, todayPnl, monthPnl, totalPnlPct, winRate, tradeCount: trades.length, closedCount: closed.length,
    riskCount,
    openCount: open.length, longCount: trades.filter((trade) => trade.side === "long").length,
    shortCount: trades.filter((trade) => trade.side === "short").length,
    avgWin, avgLoss, profitFactor, expectancy, avgR, best, worst, maxWinStreak, maxLossStreak,
    equityCurve, byDay, byDayEquity,
  };
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button className={cls("tj-navitem", active && "active")} onClick={onClick}>
      <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
      <span>{label}</span>
    </button>
  );
}

function TickerTape({ stats }) {
  const items = [
    { label: "TODAY", value: `${stats.todayPnl >= 0 ? "+" : ""}${fmt2(stats.todayPnl)}`, color: stats.todayPnl >= 0 ? "var(--profit)" : "var(--loss)" },
    { label: "WIN RATE", value: `${fmt2(stats.winRate)}%`, color: "var(--text)" },
    { label: "OPEN", value: `${stats.openCount}`, color: "var(--long)" },
    { label: "TRADES", value: `${stats.tradeCount}`, color: "var(--text)" },
    { label: "PF", value: stats.profitFactor === Infinity ? "∞" : fmt2(stats.profitFactor), color: "var(--text)" },
    { label: "AVG R", value: `${fmt2(stats.avgR)}R`, color: "var(--text)" },
  ];
  const doubled = [...items, ...items];
  return (
    <div className="tj-ticker-wrap">
      <div className="tj-ticker-track">
        {doubled.map((item, index) => (
          <span key={index} className="tj-ticker-item tj-mono">
            <span style={{ color: "var(--text-faint)" }}>{item.label}</span>{" "}
            <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SearchBar({ search, setSearch, onOpenFilter, filtersActive, t }) {
  const searchPlaceholder = t?.searchPlaceholder || "Search trades";

  return (
    <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-faint)" }} />
        <input className="tj-input" style={{ paddingLeft: 34 }} placeholder={searchPlaceholder} value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <button className="tj-btn-ghost" style={{ padding: "0 14px", position: "relative" }} onClick={onOpenFilter}>
        <SlidersHorizontal size={16} />
        {filtersActive && <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />}
      </button>
    </div>
  );
}

function PnlText({ value, size = 14 }) {
  if (value == null) return <span className="tj-mono" style={{ color: "var(--text-faint)", fontSize: size }}>—</span>;
  const positive = value >= 0;
  return (
    <span className="tj-mono" style={{ color: positive ? "var(--profit)" : "var(--loss)", fontWeight: 600, fontSize: size }}>
      {positive ? "+" : ""}{fmt2(value)}
    </span>
  );
}

function SideBadge({ side }) {
  const isLong = side === "long";
  return (
    <span className="tj-badge" style={{ background: isLong ? "rgba(94,200,216,0.12)" : "rgba(201,123,224,0.12)", color: isLong ? "var(--long)" : "var(--short)" }}>
      {isLong ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {isLong ? "LONG" : "SHORT"}
    </span>
  );
}

function StatusBadge({ status }) {
  const open = status === "open";
  return (
    <span className="tj-badge" style={{ background: open ? "rgba(232,163,61,0.12)" : "rgba(138,147,161,0.12)", color: open ? "var(--accent)" : "var(--text-dim)" }}>
      {open ? "OPEN" : "CLOSED"}
    </span>
  );
}

function TradeRow({ trade, onClick, t }) {
  const entryStamp = trade.entryDate ? `${trade.entryDate}${trade.entryTime ? ` ${trade.entryTime}` : ""}` : "—";
  const exitStamp = trade.status === "closed" && trade.exitDate ? `${trade.exitDate}${trade.exitTime ? ` ${trade.exitTime}` : ""}` : null;

  return (
    <button onClick={onClick} className="tj-card" style={{ display: "flex", width: "100%", textAlign: "left", padding: 13, marginBottom: 10, alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {trade.logo ? (
          <img src={trade.logo} alt={trade.ticker} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", background: "var(--surface-2)" }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>
            {String(trade.ticker || "?").slice(0, 2)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
          <span className="tj-display" style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{trade.ticker}</span>
          <SideBadge side={trade.side} />
          <StatusBadge status={trade.status} />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span>{t.inLabel} {entryStamp}</span>
          {exitStamp && <span>{t.exitLabel} {exitStamp}</span>}
          {trade.exchange ? <span>· {trade.exchange}</span> : null}
          {trade.setup && <span>· {trade.setup}</span>}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <PnlText value={trade.pnl} size={15} />
        {trade.rMultiple != null && <div className="tj-mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{trade.rMultiple >= 0 ? "+" : ""}{fmt2(trade.rMultiple)}R</div>}
      </div>
      <ChevronRight size={16} color="var(--text-faint)" />
    </button>
  );
}

function Dashboard({ stats, search, setSearch, onOpenFilter, onOpenDetail, filtersActive, filtered, goJournal, incomePeriod, setIncomePeriod, periodPnlStats, t, defaultRiskPerTrade, setDefaultRiskPerTrade }) {
  const recent = filtered.slice(0, 6);
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 4px" }}>
        <div className="tj-display" style={{ fontSize: 22, fontWeight: 700 }}>{t.journal}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{t.dashboardSubtitle}</div>
      </div>

      <div style={{ padding: "14px 16px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="tj-card" style={{ padding: 14, position: 'relative' }}>
            <div className="stat-icon"><BarChart2 size={18} strokeWidth={1.6} /></div>
            <div className="tj-label" style={{ marginBottom: 8 }}>{t.todayPnL}</div>
            <PnlText value={stats.todayPnl} size={20} />
          </div>
        <div className="tj-card" style={{ padding: 14, position: 'relative' }}>
          <div className="stat-icon"><Eye size={18} strokeWidth={1.6} /></div>
          <div className="tj-label" style={{ marginBottom: 8 }}>{t.winRate}</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600 }}>{fmt2(periodPnlStats.winRate)}%</div>
        </div>
        <div className="tj-card" style={{ padding: 14, position: 'relative' }}>
          <div className="stat-icon"><BarChart2 size={18} strokeWidth={1.6} /></div>
          <div className="tj-label" style={{ marginBottom: 8 }}>{t.profitFactor}</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600 }}>{periodPnlStats.profitFactor === Infinity ? "∞" : fmt2(periodPnlStats.profitFactor)}</div>
        </div>
        <div className="tj-card" style={{ padding: 14, position: 'relative' }}>
          <div className="stat-icon"><ArrowUpRight size={18} strokeWidth={1.6} /></div>
          <div className="tj-label" style={{ marginBottom: 8 }}>{t.openTrades}</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--accent)" }}>{stats.openCount}</div>
        </div>
      </div>

      <div style={{ padding: "8px 16px 0" }}>
        <div className="tj-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div className="tj-label" style={{ marginBottom: 0 }}>{t.totalIncome}</div>
            <select
              className="tj-input tj-input-compact"
              style={{ width: "auto", minWidth: 120, padding: "7px 10px" }}
              value={incomePeriod}
              onChange={(event) => setIncomePeriod(event.target.value)}
            >
              <option value="all">{t.allTime}</option>
              <option value="7d">{t.last7Days}</option>
              <option value="30d">{t.last30Days}</option>
              <option value="90d">{t.last90Days}</option>
              <option value="month">{t.thisMonth}</option>
            </select>
          </div>
          <div className="tj-mono" style={{ fontSize: 22, fontWeight: 700, color: periodPnlStats.totalIncome >= 0 ? "var(--profit)" : "var(--loss)" }}>
            {periodPnlStats.totalIncome >= 0 ? "+" : ""}{fmt2(periodPnlStats.totalIncome)} R
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-dim)" }}>
            {periodPnlStats.tradeCount} {t.closedTrades} · {periodPnlStats.label}
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12, color: "var(--text-dim)" }}>
            <span>{t.defaultRiskHint}</span>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>{t.defaultRiskLabel}</span>
              <input
                className="tj-input tj-input-compact"
                style={{ width: 84, minHeight: 30, padding: "6px 8px", fontSize: 12 }}
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={defaultRiskPerTrade ?? ""}
                onChange={(event) => setDefaultRiskPerTrade(event.target.value)}
                placeholder="0"
              />
            </label>
          </div>
        </div>
      </div>

      <SearchBar search={search} setSearch={setSearch} onOpenFilter={onOpenFilter} filtersActive={filtersActive} t={t} />

      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}>{t.recentTrades}</div>
          <button onClick={goJournal} className="tj-chip" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8 }}>{t.viewAll}</button>
        </div>
        {recent.length === 0 && <EmptyState text={t.noTrades} />}
        {recent.map((trade) => <TradeRow key={trade.id} trade={trade} onClick={() => onOpenDetail(trade.id)} t={t} />)}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="tj-card" style={{ padding: 24, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
      {text}
    </div>
  );
}

function Journal({ trades, search, setSearch, onOpenFilter, onOpenDetail, filtersActive, onExport, t }) {
  const [exportOpen, setExportOpen] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      const dateA = a.entryDate ? new Date(`${a.entryDate}T${a.entryTime || "00:00"}:00`).getTime() : 0;
      const dateB = b.entryDate ? new Date(`${b.entryDate}T${b.entryTime || "00:00"}:00`).getTime() : 0;
      return sortNewest ? dateB - dateA : dateA - dateB;
    });
  }, [trades, sortNewest]);

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div className="tj-display" style={{ fontSize: 20, fontWeight: 700 }}>{t.allTrades}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="tj-btn-ghost" style={{ padding: "8px 10px", fontSize: 12.5 }} onClick={() => setSortNewest((value) => !value)}>
            {sortNewest ? t.newestFirst : t.oldestFirst}
          </button>
          <button className="tj-btn-ghost" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }} onClick={() => setExportOpen((value) => !value)}>
            <Download size={14} /> {t.export}
          </button>
        </div>
      </div>
      {exportOpen && (
        <div style={{ padding: "8px 16px 0", display: "flex", gap: 8 }}>
          {['csv', 'xlsx', 'pdf'].map((format) => (
            <button key={format} className="tj-chip" onClick={() => { onExport(format); setExportOpen(false); }}>{format.toUpperCase()}</button>
          ))}
        </div>
      )}
      <SearchBar search={search} setSearch={setSearch} onOpenFilter={onOpenFilter} filtersActive={filtersActive} t={t} />
      <div style={{ padding: "0 16px" }}>
        {sortedTrades.length === 0 && <EmptyState text={t.noTrades} />}
        {sortedTrades.map((trade) => <TradeRow key={trade.id} trade={trade} onClick={() => onOpenDetail(trade.id)} t={t} />)}
      </div>
    </div>
  );
}

function ScreenerPanel({ rows, loading, filters, setFilters, savedFilters, onSaveFilter, onApplyFilter, onRemoveFilter, onAddAlert, onRemoveAlert, alerts, filterName, setFilterName, activeFilterId, t }) {
  return (
    <div style={{ padding: "24px 16px 100px" }}>
      <div className="tj-card" style={{ padding: 20, textAlign: "center", color: "var(--text-dim)" }}>
        <div className="tj-display" style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>Незабаром</div>
        <div style={{ marginTop: 8, fontSize: 14 }}>Скрінер тимчасово недоступний.</div>
      </div>
    </div>
  );
}

function StatsScreen({ stats, trades, onOpenFilter, filtersActive, t }) {
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div className="tj-display" style={{ fontSize: 20, fontWeight: 700 }}>{t.statisticsTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{stats.closedCount} {t.closed} · {stats.openCount} {t.open}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 6 }}>
            {t.currentDeposit}: {stats.currentDeposit != null ? `$${fmt2(stats.currentDeposit)}` : "—"}
            {stats.monthPnl != null && (
              <span style={{ marginLeft: 6, color: stats.monthPnl >= 0 ? "var(--profit)" : "var(--loss)" }}>( {stats.monthPnl >= 0 ? "+" : ""}{fmt2(stats.monthPnl)}$ • this month )</span>
            )}
          </div>
        </div>
        <button className="tj-btn-ghost" style={{ padding: "8px 12px", position: "relative" }} onClick={onOpenFilter}>
          <SlidersHorizontal size={16} />
          {filtersActive && <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />}
        </button>
      </div>

      <Suspense fallback={<div className="tj-card" style={{ margin: "14px 16px 0", padding: 16, color: "var(--text-dim)" }}>{t.loadingStats}</div>}>
        <StatsCharts stats={stats} t={t} />
      </Suspense>
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div className="tj-card" style={{ padding: 14 }}>
      <div className="tj-label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="tj-mono" style={{ fontSize: 16, fontWeight: 600, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

function Field({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <div className="tj-label" style={{ marginBottom: 3 }}>{label}</div>
      <div className="tj-mono" style={{ fontSize: 13.5 }}>{value}</div>
    </div>
  );
}

function TradeDetail({ trade, onClose, onEdit, onDelete, onDuplicate, onCloseTrade, t }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fullImg, setFullImg] = useState(null);
  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={`${trade.ticker}`} onClose={onClose} />
        <div style={{ padding: "0 18px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {trade.logo ? (
              <img src={trade.logo} alt={trade.ticker} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", background: "var(--surface-2)" }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>
                {String(trade.ticker || "?").slice(0, 2)}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <SideBadge side={trade.side} />
              <StatusBadge status={trade.status} />
              {trade.setup && <span className="tj-badge" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}>{trade.setup}</span>}
            </div>
          </div>
          {trade.exchange ? (
            <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 12 }}>{trade.exchange}{trade.name ? ` • ${trade.name}` : ""}</div>
          ) : null}

          <div className="tj-card" style={{ padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div className="tj-label">{t.pnlLabel}</div>
            <PnlText value={trade.pnl} size={28} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <Field label={t.entryDateLabel} value={trade.entryDate ? `${trade.entryDate} ${trade.entryTime || ""}`.trim() : "—"} />
            <Field label={t.entryPriceLabel} value={trade.entryPrice} />
            <Field label={t.exitDateLabel} value={trade.exitDate ? `${trade.exitDate} ${trade.exitTime || ""}`.trim() : "—"} />
            <Field label={t.exitPriceLabel} value={trade.exitPrice} />
            <Field label={t.stopLossLabel} value={trade.stopLoss} />
            <Field label={t.takeProfitLabel} value={trade.takeProfit} />
            <Field label={t.positionSizeLabel} value={trade.positionSize} />
            <Field label={t.riskDollarLabel} value={trade.riskDollar} />
            <Field label={t.riskPercentLabel} value={trade.riskPercent} />
            <Field label={t.exitReasonLabel} value={trade.exitReason} />
          </div>

          {trade.tags && trade.tags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>{t.tagsLabel}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {trade.tags.map((tag) => <span key={tag} className="tj-chip">{tag}</span>)}
              </div>
            </div>
          )}

          {trade.notes && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>{t.notesLabel}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{trade.notes}</div>
            </div>
          )}
          {trade.postComment && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>{t.postTradeCommentLabel}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{trade.postComment}</div>
            </div>
          )}

          {(trade.entryScreenshot || trade.exitScreenshot) && (
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              {trade.entryScreenshot && (
                <img src={trade.entryScreenshot} alt="entry" onClick={() => setFullImg(trade.entryScreenshot)} style={{ width: "50%", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer" }} />
              )}
              {trade.exitScreenshot && (
                <img src={trade.exitScreenshot} alt="exit" onClick={() => setFullImg(trade.exitScreenshot)} style={{ width: "50%", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer" }} />
              )}
            </div>
          )}

          {trade.status === "open" && (
            <button className="tj-btn-primary" style={{ width: "100%", marginBottom: 10 }} onClick={onCloseTrade}>{t.closeTrade}</button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={onEdit}><Edit2 size={14} /> {t.editLabel}</button>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={onDuplicate}><Copy size={14} /> {t.duplicate}</button>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--loss)" }} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> {t.deleteLabel}</button>
          </div>

          {confirmDelete && (
            <div className="tj-card" style={{ padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 10 }}>{t.deleteLabel} this trade permanently?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="tj-btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>{t.cancelLabel}</button>
                <button className="tj-btn-primary" style={{ flex: 1, background: "var(--loss)", color: "#fff" }} onClick={onDelete}>{t.deleteLabel}</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {fullImg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(event) => { event.stopPropagation(); setFullImg(null); }}>
          <img src={fullImg} alt="full" style={{ maxWidth: "94%", maxHeight: "94%", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

function SheetHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 8px", background: "var(--bg)", zIndex: 5 }}>
      <div className="tj-display" style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      <button onClick={onClose} style={{ color: "var(--text-dim)" }}><X size={20} /></button>
    </div>
  );
}

function TradeForm({ mode, initial, setups, setSetups, tags, setTags, onClose, onSubmit, t, isSubmitting = false, defaultRiskPerTrade = "" }) {
  const [form, setForm] = useState(() => ({
    ...(initial || {
      ticker: "", side: "long", entryDate: todayISO(), entryTime: nowTime(),
      entryPrice: "", stopLoss: "", takeProfit: "", positionSize: "",
      riskDollar: "", riskPercent: "", setup: "",
      tags: [], notes: "", entryScreenshot: null,
    }),
    riskDollar: initial?.riskDollar ?? defaultRiskPerTrade ?? "",
  }));
  const [newSetup, setNewSetup] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editingSetup, setEditingSetup] = useState(null);
  const [editingSetupValue, setEditingSetupValue] = useState("");
  const [editingTag, setEditingTag] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const fileRef = useRef();

  function setValue(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }
  function toggleTag(tag) { setForm((prev) => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag] })); }

  function getRiskPerShare(entryPrice, stopLoss, side) {
    if (!Number.isFinite(entryPrice) || !Number.isFinite(stopLoss)) return null;
    if (side === "short") {
      return Math.abs(stopLoss - entryPrice);
    }
    return Math.abs(entryPrice - stopLoss);
  }

  useEffect(() => {
    const entryPrice = Number(form.entryPrice);
    const stopLoss = Number(form.stopLoss);
    const riskDollar = Number(form.riskDollar);
    if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !Number.isFinite(stopLoss) || stopLoss <= 0 || !Number.isFinite(riskDollar) || riskDollar <= 0) {
      return;
    }
    const riskPerShare = getRiskPerShare(entryPrice, stopLoss, form.side);
    if (!Number.isFinite(riskPerShare) || riskPerShare <= 0) {
      return;
    }
    const positionSize = Math.max(1, Math.round(riskDollar / riskPerShare));
    if (String(form.positionSize) !== String(positionSize)) {
      setValue("positionSize", positionSize);
    }
  }, [form.entryPrice, form.stopLoss, form.riskDollar, form.side]);

  const computedRisk = (() => {
    const entryPrice = Number(form.entryPrice);
    const stopLoss = Number(form.stopLoss);
    const riskDollar = Number(form.riskDollar);
    const positionSize = Number(form.positionSize);
    if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !Number.isFinite(stopLoss) || stopLoss <= 0 || !Number.isFinite(riskDollar) || riskDollar <= 0) {
      return null;
    }
    const riskPerShare = getRiskPerShare(entryPrice, stopLoss, form.side);
    if (!Number.isFinite(riskPerShare) || riskPerShare <= 0) {
      return null;
    }
    const normalizedPositionSize = Math.max(1, Math.round(riskDollar / riskPerShare));
    const effectivePositionSize = Number.isFinite(positionSize) && positionSize > 0 ? positionSize : normalizedPositionSize;
    const notional = effectivePositionSize * entryPrice;
    return {
      riskDollar: +riskDollar.toFixed(2),
      riskPerShare: +riskPerShare.toFixed(2),
      positionSize: normalizedPositionSize,
      notional: +notional.toFixed(2),
      direction: form.side === "long" ? "Buy" : "Sell",
    };
  })();

  function addSetup() {
    const value = newSetup.trim();
    if (!value) return;
    const normalized = value.replace(/\s+/g, " ");
    const exists = setups.some((setup) => setup.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      setValue("setup", normalized);
      setNewSetup("");
      return;
    }
    setSetups((prev) => [...prev, normalized]);
    setValue("setup", normalized);
    setNewSetup("");
  }

  function saveSetupEdit() {
    const value = editingSetupValue.trim().replace(/\s+/g, " ");
    if (!value || !editingSetup) return;
    const exists = setups.some((setup) => setup.toLowerCase() === value.toLowerCase() && setup !== editingSetup);
    if (exists) return;
    setSetups((prev) => prev.map((setup) => (setup === editingSetup ? value : setup)));
    if (form.setup === editingSetup) {
      setValue("setup", value);
    }
    setEditingSetup(null);
    setEditingSetupValue("");
  }

  function deleteSetup(setupToDelete) {
    if (!setupToDelete) return;
    const shouldRemoveCurrent = form.setup === setupToDelete;
    setSetups((prev) => prev.filter((setup) => setup !== setupToDelete));
    if (shouldRemoveCurrent) {
      setValue("setup", "");
    }
  }

  function saveTagEdit() {
    const value = editingTagValue.trim().replace(/\s+/g, " ");
    if (!value || !editingTag) return;
    const exists = tags.some((tag) => tag.toLowerCase() === value.toLowerCase() && tag !== editingTag);
    if (exists) return;
    setTags((prev) => prev.map((tag) => (tag === editingTag ? value : tag)));
    if (form.tags.includes(editingTag)) {
      setForm((prev) => ({ ...prev, tags: prev.tags.map((tag) => (tag === editingTag ? value : tag)) }));
    }
    setEditingTag(null);
    setEditingTagValue("");
  }

  function deleteTag(tagToDelete) {
    if (!tagToDelete) return;
    setTags((prev) => prev.filter((tag) => tag !== tagToDelete));
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToDelete) }));
  }

  function addTag() {
    const value = newTag.trim();
    if (!value) return;
    const normalized = value.replace(/\s+/g, " ");
    if (!tags.includes(normalized)) {
      setTags((prev) => [...prev, normalized]);
    }
    toggleTag(normalized);
    setNewTag("");
  }

  function onImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue("entryScreenshot", reader.result);
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!form.ticker || !form.entryPrice) return;
    const payload = {
      ...form,
      ticker: form.ticker.toUpperCase(),
      instrumentType: inferInstrumentType(form.ticker, form.entryPrice),
    };
    if ((payload.riskDollar === "" || payload.riskDollar == null) && defaultRiskPerTrade !== "") {
      payload.riskDollar = defaultRiskPerTrade;
    }
    onSubmit(payload);
  }

  const labels = t || LANGUAGE_LABELS.en;

  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={mode === "new" ? labels.newTrade : labels.editTrade} onClose={onClose} />
        <div style={{ padding: "0 18px 100px" }}>
          <SectionLabel text={labels.basicInfo} />
          <Row2>
            <div>
              <label className="tj-label">{labels.ticker}</label>
              <input className="tj-input tj-input-compact" placeholder="AAPL" value={form.ticker} onChange={(event) => setValue("ticker", event.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="tj-label">{labels.type}</label>
              <div style={{ display: "flex", gap: 6 }}>
                <button className={cls("tj-chip", form.side === "long" && "on")} style={{ flex: 1 }} onClick={() => setValue("side", "long")}>{labels.long}</button>
                <button className={cls("tj-chip", form.side === "short" && "on")} style={{ flex: 1 }} onClick={() => setValue("side", "short")}>{labels.short}</button>
              </div>
            </div>
          </Row2>
          <Row2>
            <div>
              <label className="tj-label">{labels.date}</label>
              <input type="date" className="tj-input tj-input-compact" value={form.entryDate} onChange={(event) => setValue("entryDate", event.target.value)} />
            </div>
            <div>
              <label className="tj-label">{labels.timeIn}</label>
              <input type="time" className="tj-input tj-input-compact" value={form.entryTime} onChange={(event) => setValue("entryTime", event.target.value)} />
            </div>
          </Row2>

          <SectionLabel text={labels.entry} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <NumField label={labels.entryPrice} value={form.entryPrice} onChange={(value) => setValue("entryPrice", value)} />
            <NumField label={labels.stopLoss} value={form.stopLoss} onChange={(value) => setValue("stopLoss", value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <NumField label={labels.takeProfit} value={form.takeProfit} onChange={(value) => setValue("takeProfit", value)} />
            <NumField label={labels.riskDollar} value={form.riskDollar} onChange={(value) => setValue("riskDollar", value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <label className="tj-label">{labels.positionNotional}</label>
              <div className="tj-input tj-input-compact tj-mono" style={{ display: "flex", alignItems: "center", minHeight: 34, color: "var(--text-dim)" }}>
                {computedRisk ? `$${computedRisk.notional}` : "—"}
              </div>
            </div>
            <NumField label={labels.positionSize} value={form.positionSize} onChange={(value) => setValue("positionSize", value)} />
          </div>
          <div className="tj-card" style={{ padding: 10, marginBottom: 12, borderColor: "var(--accent-dim)" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-dim)", marginBottom: 6 }}>{labels.positionSizing}</div>
            {computedRisk ? (
              <div style={{ display: "grid", gap: 4, fontSize: 13, color: "var(--text)" }}>
                <div>{labels.risk}: <span className="tj-mono" style={{ color: "var(--accent)" }}>${computedRisk.riskDollar}</span></div>
                <div>{labels.riskPerShare}: <span className="tj-mono" style={{ color: "var(--text-dim)" }}>${computedRisk.riskPerShare}</span></div>
                <div>{computedRisk.direction === "Buy" ? labels.buy : labels.sell}: <span className="tj-mono" style={{ color: "var(--profit)" }}>{computedRisk.positionSize} {computedRisk.positionSize === 1 ? labels.share : labels.shares}</span></div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{labels.enterEntryStopRisk}</div>
            )}
          </div>
          <SectionLabel text={labels.additional} />
          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">{labels.setup}</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {setups.map((setup) => (
                <div key={setup} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className={cls("tj-chip", form.setup === setup && "on")} onClick={() => setValue("setup", setup)}>{setup}</button>
                  <button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => { setEditingSetup(setup); setEditingSetupValue(setup); }}>{labels.editLabel}</button>
                  <button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--loss)" }} onClick={() => deleteSetup(setup)}>{labels.deleteLabel}</button>
                </div>
              ))}
            </div>
            {editingSetup && (
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input className="tj-input tj-input-compact" value={editingSetupValue} onChange={(event) => setEditingSetupValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveSetupEdit(); } }} />
                <button className="tj-btn-ghost" onClick={saveSetupEdit}>{labels.saveLabel}</button>
                <button className="tj-btn-ghost" onClick={() => { setEditingSetup(null); setEditingSetupValue(""); }}>{labels.cancelLabel}</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <input className="tj-input tj-input-compact" placeholder={labels.addNewSetup} value={newSetup} onChange={(event) => setNewSetup(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSetup(); } }} />
              <button className="tj-btn-ghost" onClick={addSetup}>{labels.addLabel}</button>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">{labels.tags}</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {tags.map((tag) => (
                <div key={tag} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className={cls("tj-chip", form.tags.includes(tag) && "on")} onClick={() => toggleTag(tag)}>{tag}</button>
                  <button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => { setEditingTag(tag); setEditingTagValue(tag); }}>{labels.editLabel}</button>
                  <button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--loss)" }} onClick={() => deleteTag(tag)}>{labels.deleteLabel}</button>
                </div>
              ))}
            </div>
            {editingTag && (
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input className="tj-input tj-input-compact" value={editingTagValue} onChange={(event) => setEditingTagValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveTagEdit(); } }} />
                <button className="tj-btn-ghost" onClick={saveTagEdit}>{labels.saveLabel}</button>
                <button className="tj-btn-ghost" onClick={() => { setEditingTag(null); setEditingTagValue(""); }}>{labels.cancelLabel}</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <input className="tj-input tj-input-compact" placeholder={labels.addNewTag} value={newTag} onChange={(event) => setNewTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} />
              <button className="tj-btn-ghost" onClick={addTag}>{labels.addLabel}</button>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">{labels.notes}</label>
            <textarea className="tj-input tj-input-compact" rows={3} placeholder={labels.tradeThesisContextPlan} value={form.notes} onChange={(event) => setValue("notes", event.target.value)} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="tj-label">{labels.entryScreenshot}</label>
            <input type="file" accept="image/*" ref={fileRef} onChange={onImage} style={{ display: "none" }} />
            {form.entryScreenshot ? (
              <div style={{ position: "relative" }}>
                <img src={form.entryScreenshot} alt="entry" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }} />
                <button className="tj-btn-ghost" style={{ marginTop: 8, width: "100%" }} onClick={() => fileRef.current.click()}>{labels.replaceImage}</button>
              </div>
            ) : (
              <button className="tj-btn-ghost" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => fileRef.current.click()}>
                <Camera size={15} /> {labels.attachScreenshot}
              </button>
            )}
          </div>

          <button className="tj-btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={submit} disabled={!form.ticker || !form.entryPrice || isSubmitting}>
            {isSubmitting ? (
              <>
                <span style={{ width: 12, height: 12, border: "2px solid rgba(0,0,0,0.25)", borderTopColor: "currentColor", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                <span>{labels.saving}</span>
              </>
            ) : (
              mode === "new" ? labels.saveTrade : labels.saveChanges
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "18px 0 10px" }}>{text}</div>;
}
function Row2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>{children}</div>;
}
function NumField({ label, value, onChange, onBlur }) {
  return (
    <div>
      <label className="tj-label">{label}</label>
      <input className="tj-input tj-input-compact tj-mono" type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} placeholder="0.00" style={{ minHeight: 30, padding: "6px 8px", fontSize: 12.5 }} />
    </div>
  );
}

function CloseTradeForm({ trade, onClose, onSubmit, t }) {
  const [form, setForm] = useState({
    exitPrice: "", exitDate: todayISO(), exitTime: nowTime(),
    exitReason: "", pnl: "", pnlPercent: "", rMultiple: "",
    exitScreenshot: null, postComment: "",
  });
  const fileRef = useRef();
  function setValue(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  useEffect(() => {
    if (!form.exitPrice) return;
    const { pnl, pnlPct, r } = calcPnl({ ...trade, exitPrice: form.exitPrice });
    setForm((prev) => ({ ...prev, pnl: pnl != null ? +pnl.toFixed(2) : "", pnlPercent: pnlPct != null ? +pnlPct.toFixed(2) : "", rMultiple: r != null ? +r.toFixed(2) : "" }));
  }, [form.exitPrice]);

  function onImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue("exitScreenshot", reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={`${t.closeTrade} ${trade.ticker}`} onClose={onClose} />
        <div style={{ padding: "0 18px 40px" }}>
          <Row2>
            <NumField label={t.exitPriceLabel} value={form.exitPrice} onChange={(value) => setValue("exitPrice", value)} />
            <div>
              <label className="tj-label">{t.exitReasonLabel}</label>
              <input className="tj-input tj-input-compact" placeholder={t.exitReasonPlaceholder} value={form.exitReason} onChange={(event) => setValue("exitReason", event.target.value)} />
            </div>
          </Row2>
          <Row2>
            <div>
              <label className="tj-label">{t.exitDateLabel}</label>
              <input type="date" className="tj-input tj-input-compact" value={form.exitDate} onChange={(event) => setValue("exitDate", event.target.value)} />
            </div>
            <div>
              <label className="tj-label">{t.timeIn}</label>
              <input type="time" className="tj-input tj-input-compact" value={form.exitTime} onChange={(event) => setValue("exitTime", event.target.value)} />
            </div>
          </Row2>
          <Row2>
            <NumField label="PnL ($)" value={form.pnl} onChange={(value) => setValue("pnl", value)} />
          </Row2>
          <div style={{ marginBottom: 14, width: "calc(50% - 5px)" }}>
            <NumField label={t.rMultipleLabel} value={form.rMultiple} onChange={(value) => setValue("rMultiple", value)} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">{t.commentAfterTrade}</label>
            <textarea className="tj-input" rows={3} placeholder={t.commentAfterTrade} value={form.postComment} onChange={(event) => setValue("postComment", event.target.value)} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="tj-label">{t.exitScreenshotLabel}</label>
            <input type="file" accept="image/*" ref={fileRef} onChange={onImage} style={{ display: "none" }} />
            {form.exitScreenshot ? (
              <img src={form.exitScreenshot} alt="exit" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }} />
            ) : (
              <button className="tj-btn-ghost" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => fileRef.current.click()}>
                <Camera size={15} /> {t.attachScreenshot}
              </button>
            )}
          </div>

          <button className="tj-btn-primary" style={{ width: "100%" }} onClick={() => {
            onSubmit({ ...form, exitScreenshot: form.exitScreenshot || null });
          }} disabled={!form.exitPrice}>{t.closeTrade}</button>
        </div>
      </div>
    </div>
  );
}

function FilterSheet({ filters, setFilters, setups, tags, onClose, t }) {
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    setLocal((prev) => ({
      ...prev,
      tag: prev.tag && tags.includes(prev.tag) ? prev.tag : "all",
    }));
  }, [tags]);

  function group(label, key, options) {
    return (
      <div style={{ marginBottom: 18 }}>
        <div className="tj-label" style={{ marginBottom: 8 }}>{label}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {options.map((option) => (
            <button key={option.value} className={cls("tj-chip", local[key] === option.value && "on")} onClick={() => setLocal((prev) => ({ ...prev, [key]: option.value }))}>{option.label}</button>
          ))}
        </div>
      </div>
    );
  }

  const tagOptions = [{ value: "all", label: "All" }, ...tags.map((tag) => ({ value: tag, label: tag }))];

  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title="Filters" onClose={onClose} />
        <div style={{ padding: "0 18px 30px" }}>
          {group(t.status, "status", [{ value: "all", label: t.all }, { value: "open", label: t.open }, { value: "closed", label: t.closed }])}
          {group(t.direction, "side", [{ value: "all", label: t.all }, { value: "long", label: t.long }, { value: "short", label: t.short }])}
          {group(t.result, "result", [{ value: "all", label: t.all }, { value: "profit", label: t.profitable }, { value: "loss", label: t.losing }])}
          {group(t.setup, "setup", [{ value: "all", label: t.all }, ...setups.map((setup) => ({ value: setup, label: setup }))])}
          {group(t.tag, "tag", tagOptions)}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="tj-btn-ghost" style={{ flex: 1 }} onClick={() => { const cleared = { status: "all", side: "all", result: "all", setup: "all", tag: "all" }; setLocal(cleared); setFilters(cleared); }}>{t.clearAll}</button>
            <button className="tj-btn-primary" style={{ flex: 1 }} onClick={() => { setFilters(local); onClose(); }}>{t.apply}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function exportTrades(trades, type, showToast, t) {
  const rows = trades.map((trade) => ({
    Ticker: trade.ticker, Side: trade.side, Status: trade.status,
    EntryDate: trade.entryDate, EntryTime: trade.entryTime, EntryPrice: trade.entryPrice,
    StopLoss: trade.stopLoss, TakeProfit: trade.takeProfit, PositionSize: trade.positionSize,
    RiskDollar: trade.riskDollar, RiskPercent: trade.riskPercent, Setup: trade.setup,
    Tags: (trade.tags || []).join("|"), ExitDate: trade.exitDate, ExitTime: trade.exitTime,
    ExitPrice: trade.exitPrice, ExitReason: trade.exitReason, PnL: trade.pnl, PnLPercent: trade.pnlPercent,
    RMultiple: trade.rMultiple, Notes: trade.notes, PostComment: trade.postComment,
  }));

  const XLSX = await import("xlsx");

  if (type === "csv") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    downloadBlob(csv, "trading-journal.csv", "text/csv");
    showToast(t.exportCsv);
  } else if (type === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trades");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(out, "trading-journal.xlsx", "application/octet-stream", true);
    showToast(t.exportXlsx);
  } else {
    showToast(t.exportPdf);
  }
}

function downloadBlob(data, filename, mime, isArray) {
  const blob = isArray ? new Blob([data], { type: mime }) : new Blob([data], { type: mime + ";charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
