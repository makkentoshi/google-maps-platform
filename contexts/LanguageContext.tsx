import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'ru';

interface Translations {
  [key: string]: {
    en: string;
    ru: string;
  };
}

const translations: Translations = {
  // Navigation
  camera: { en: 'Camera', ru: 'Камера' },
  explore: { en: 'Explore', ru: 'Исследовать' },
  quests: { en: 'Quests', ru: 'Квесты' },
  profile: { en: 'Profile', ru: 'Профиль' },
  settings: { en: 'Settings', ru: 'Настройки' },
  search: { en: 'Search', ru: 'Найти' },
  leaderboard: { en: 'Leaderboard', ru: 'Таблица лидеров' },
  map: { en: 'Map', ru: 'Карта' },

  // Camera Screen
  cameraAccess: { en: 'Camera Access', ru: 'Доступ к камере' },
  cameraPermissionText: {
    en: 'We need camera access to recognize places and create stories',
    ru: 'Для распознавания мест и создания историй нужен доступ к камере',
  },
  grantAccess: { en: 'Grant Access', ru: 'Предоставить доступ' },
  pointAtLandmark: {
    en: 'Point camera at a landmark',
    ru: 'Наведите камеру на достопримечательность',
  },
  recognizingLocation: {
    en: 'Recognizing location...',
    ru: 'Распознаю локацию...',
  },
  generatingStory: {
    en: 'Generating story with AI',
    ru: 'Генерирую историю с помощью AI',
  },
  attachPhoto: { en: 'Attach Photo', ru: 'Прикрепить фото' },

  // Explore Screen
  exploreSubtitle: {
    en: 'Discover stories around you',
    ru: 'Откройте истории вокруг вас',
  },
  all: { en: 'All', ru: 'Все' },
  architecture: { en: 'Architecture', ru: 'Архитектура' },
  parks: { en: 'Parks', ru: 'Парки' },
  museums: { en: 'Museums', ru: 'Музеи' },
  temples: { en: 'Temples', ru: 'Храмы' },
  placesNearby: { en: 'Places nearby', ru: 'Места рядом' },
  stories: { en: 'Stories', ru: 'Историй' },
  travelers: { en: 'Travelers', ru: 'Путешественников' },
  popularPlaces: { en: 'Popular Places', ru: 'Популярные места' },
  route: { en: 'Route', ru: 'Маршрут' },
  learnStory: { en: 'Learn Story', ru: 'Узнать историю' },

  // Quests Screen
  questsSubtitle: {
    en: 'Explore and earn rewards',
    ru: 'Исследуйте и зарабатывайте',
  },
  level: { en: 'Level', ru: 'Уровень' },
  questsLabel: { en: 'Quests', ru: 'Квестов' },
  places: { en: 'Places', ru: 'Места' },
  points: { en: 'Points', ru: 'Очков' },
  achievements: { en: 'Achievements', ru: 'Достижения' },
  active: { en: 'Active', ru: 'Активные' },
  available: { en: 'Available', ru: 'Доступные' },
  completed: { en: 'Completed', ru: 'Завершенные' },
  easy: { en: 'Easy', ru: 'Легкий' },
  medium: { en: 'Medium', ru: 'Средний' },
  hard: { en: 'Hard', ru: 'Сложный' },
  participants: { en: 'participants', ru: 'участников' },
  progress: { en: 'Progress', ru: 'Прогресс' },
  continue: { en: 'Continue', ru: 'Продолжить' },
  startQuest: { en: 'Start Quest', ru: 'Начать квест' },
  completed_status: { en: 'Completed', ru: 'Завершено' },

  // Profile Screen
  joinedIn: { en: 'Joined in', ru: 'Присоединился в' },
  nextLevel: { en: 'To next level', ru: 'До следующего уровня' },
  topAchievements: { en: 'Top Achievements', ru: 'Топ достижения' },
  recentActivity: { en: 'Recent Activity', ru: 'Недавняя активность' },
  myQuests: { en: 'My Quests', ru: 'Мои квесты' },
  visitedPlaces: { en: 'Visited Places', ru: 'Посещенные места' },

  // Settings Screen
  settingsTitle: { en: 'Settings', ru: 'Настройки' },
  appearance: { en: 'Appearance', ru: 'Внешний вид' },
  darkMode: { en: 'Dark Mode', ru: 'Темная тема' },
  language: { en: 'Language', ru: 'Язык' },
  english: { en: 'English', ru: 'Английский' },
  russian: { en: 'Russian', ru: 'Русский' },
  notifications: { en: 'Notifications', ru: 'Уведомления' },
  pushNotifications: { en: 'Push Notifications', ru: 'Push-уведомления' },
  questReminders: { en: 'Quest Reminders', ru: 'Напоминания о квестах' },
  account: { en: 'Account', ru: 'Аккаунт' },
  editProfile: { en: 'Edit Profile', ru: 'Редактировать профиль' },
  privacy: { en: 'Privacy', ru: 'Конфиденциальность' },
  about: { en: 'About', ru: 'О приложении' },
  version: { en: 'Version', ru: 'Версия' },
  support: { en: 'Support', ru: 'Поддержка' },

  // --- Story Screen (Additions) ---
  story: { en: 'Full Story', ru: 'Полная история' },
  summary: { en: 'Summary', ru: 'Краткое содержание' },
  share: { en: 'Share', ru: 'Поделиться' },
  interestingFacts: { en: 'Interesting Facts', ru: 'Интересные факты' },
  relatedQuests: { en: 'Related Quests', ru: 'Связанные квесты' },
  start: { en: 'Start', ru: 'Начать' },
  enhanceCta: { en: 'Generate Full Story', ru: 'Создать полную историю' },
  commentsTitle: { en: 'Leave a Comment', ru: 'Оставить комментарий' },
  commentsPlaceholder: {
    en: 'Share your thoughts...',
    ru: 'Поделитесь мыслями...',
  },
  commentsPost: { en: 'Post', ru: 'Опубликовать' },

  // Error Messages
  errorTitle: { en: 'Error', ru: 'Ошибка' },
  errorLoadStory: {
    en: 'Failed to load story data.',
    ru: 'Не удалось загрузить историю.',
  },
  errorEnhanceStory: {
    en: 'Failed to generate story.',
    ru: 'Не удалось сгенерировать историю.',
  },
  errorSharing: { en: 'Sharing failed.', ru: 'Не удалось поделиться.' },
  errorLikeUpdate: {
    en: 'Failed to update like status.',
    ru: 'Не удалось обновить статус лайка.',
  },
  errorCommentPost: {
    en: 'Failed to post comment.',
    ru: 'Не удалось опубликовать комментарий.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string, fallback?: string, options?: any): string => {
    let translation = translations[key]?.[language] || fallback || key;
    if (options) {
      Object.keys(options).forEach((optKey) => {
        translation = translation.replace(`{{${optKey}}}`, options[optKey]);
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
