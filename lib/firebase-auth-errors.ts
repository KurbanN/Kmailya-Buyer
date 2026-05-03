import { FirebaseError } from "firebase/app"

/** Человекочитаемые сообщения для UI (Firebase Auth + Firestore client). */
export function mapFirebaseClientError(err: unknown): string {
  if (err instanceof Error && err.message.includes("Firebase client env vars")) {
    return "Сайт собран без ключей Firebase. Для GitHub Pages добавьте секреты NEXT_PUBLIC_FIREBASE_* в Actions или используйте хостинг с .env."
  }

  const code =
    err instanceof FirebaseError
      ? err.code
      : typeof err === "object" &&
          err !== null &&
          "code" in err &&
          typeof (err as { code: unknown }).code === "string"
        ? (err as { code: string }).code
        : null

  if (!code) {
    return "Не удалось выполнить действие. Попробуйте ещё раз."
  }

  switch (code) {
    case "auth/email-already-in-use":
      return "Этот email уже зарегистрирован."
    case "auth/invalid-email":
      return "Некорректный адрес почты."
    case "auth/weak-password":
      return "Пароль слишком простой. Используйте не менее 8 символов."
    case "auth/network-request-failed":
      return "Нет соединения с сервером. Проверьте интернет и блокировщики."
    case "auth/popup-blocked":
      return "Браузер заблокировал окно входа. Разрешите всплывающие окна для этого сайта."
    case "auth/popup-closed-by-user":
      return "Вход через Google отменён."
    case "auth/cancelled-popup-request":
      return "Подождите завершения входа или закройте лишние окна и попробуйте снова."
    case "auth/unauthorized-domain":
      return "Этот домен не добавлен в Firebase → Authentication → Authorized domains."
    case "auth/operation-not-allowed":
      return "Этот способ входа отключён в консоли Firebase."
    case "auth/too-many-requests":
      return "Слишком много попыток. Подождите несколько минут."
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Неверный email или пароль."
    case "permission-denied":
      return "Нет доступа к базе данных. Проверьте правила Firestore и авторизацию."
    case "unavailable":
      return "Сервис временно недоступен. Попробуйте позже."
    default:
      return "Не удалось выполнить действие. Попробуйте ещё раз."
  }
}
