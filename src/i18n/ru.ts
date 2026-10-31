import type { FloorStep } from '../lib/floorRoute';

/** Неразрывный пробел: число и единица не переносятся на разные строки. */
const NBSP = '\u00A0';

/** Все тексты интерфейса. Для кыргызского создать ky.ts с теми же ключами. */
export const ru = {
  appTitle: 'Университет им. Арабаева',
  searchLabel: 'Куда идём?',
  searchPlaceholder: 'Кабинет, отдел или здание',
  searchClear: 'Очистить поиск',
  searchEmpty: 'Ничего не нашлось. Попробуй номер кабинета или другое слово.',
  searchFloor: (building: string, level: number) => `${building}, ${level} этаж`,
  searchApproximate: 'место уточняется',
  quickTitle: 'Быстрый выбор',
  quickLibraries: 'Библиотеки',
  quickLibrariesQuery: 'библиотека',

  gatesLabel: 'У каких ворот ты стоишь?',
  locate: 'Где я?',
  locating: 'Определяю…',
  chooseGate: 'Выбери ворота или нажми «Где я?».',
  geoUnsupported: 'Браузер не умеет определять место. Выбери ворота кнопкой.',
  geoError: (msg: string) => `Не получилось определить место (${msg}). Выбери ворота кнопкой.`,
  farTitle: (km: string) => `Ты в ${km} км от универа`,
  farText: (gate: string) => `Ближайшие ворота: ${gate}. У ворот нажми «Где я?» ещё раз.`,
  farLink: 'Маршрут в 2ГИС',
  close: 'Закрыть',

  roomTarget: (building: string, room: string) => `${building}, кабинет ${room}`,
  routeFrom: 'От',
  routeTo: 'До',
  routeSummary: (m: number, min: number) => `Около ${m}${NBSP}м · ${min}${NBSP}мин пешком`,
  routeNotFound: 'Маршрут не найден.',
  changeTarget: 'Другое место',

  entranceLabel: 'Через какой вход заходишь в корпус',
  nextToRoom: (room: string) => `Дальше: путь до кабинета ${room}`,
  openFloor: (level: number) => `Открыть план ${level} этажа`,

  floorTitle: (building: string, level: number) => `${building}, ${level} этаж`,
  backToMap: 'К карте',
  zoomIn: 'Приблизить',
  zoomOut: 'Отдалить',
  zoomFit: 'Показать весь этаж',
  north: 'С',
  entranceMark: (n: string) => `Вход ${n}`,
  floorHint: 'Нажми на кабинет на плане или найди его в поиске — здесь появится путь от входа.',
  serviceRoom: 'Это служебное помещение без номера. Выбери кабинет с номером.',
  routeHere: 'Проложить путь сюда',
  roomMeters: (m: number) => `около ${m}${NBSP}м`,
  approximateNote: (room: string, near: string) =>
    `Место кабинета ${room} уточняется, кабинет рядом с ${near}. Путь ведёт к ${near}.`,
  floorPlanAria: (title: string) => `План: ${title}`,

  foreignHint: 'Стоит на территории, но к университету не относится',
  gymHint: 'Спортзал корпуса 1 — не проход',
  doorTitle: (building: string) => `Вход: ${building}`,
  mapNorth: 'Повернуть карту на север',
  sheetToggle: 'Развернуть или свернуть панель',

  noKeyTitle: 'Карта не подключена',
  noKeyText:
    'Нет ключа 2ГИС. Добавь VITE_DGIS_KEY в файл .env и перезапусти сайт. Поиск и план этажа работают и без карты.',
  mapErrorTitle: 'Карта не загрузилась',
  mapScriptError:
    'Не удалось скачать карту с сервера 2ГИС (mapgl.2gis.com). Проверь интернет, выключи блокировщик рекламы и «экономию трафика» в браузере.',
  mapUnsupported: (reason: string) =>
    `Этот браузер не умеет показывать карту 2ГИС${reason ? `: ${reason}` : ''}. Попробуй Chrome или Safari.`,
  mapCreateError: (msg: string) => `Карта 2ГИС выдала ошибку: ${msg}`,
  mapRetry: 'Попробовать снова',
};

export function stepText(step: FloorStep): string {
  switch (step.kind) {
    case 'enter':
      return `Зайди через вход ${step.entranceN} и пройди к коридору.`;
    case 'turn': {
      const dir =
        step.direction === 'straight'
          ? 'Иди прямо'
          : step.direction === 'right'
            ? 'Поверни направо'
            : 'Поверни налево';
      return `${dir} и пройди около ${step.meters}${NBSP}м.`;
    }
    case 'arrive':
      return `Кабинет ${step.room} будет ${step.side === 'right' ? 'справа' : 'слева'}.`;
  }
}
