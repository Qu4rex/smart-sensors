class AppError(Exception):
    """Базовое исключение приложения.

    Единый обработчик в main.py превращает его в JSON-ответ
    {"detail": ..., "code": ...} со статусом status_code.
    """

    status_code: int = 500

    code: str = "internal_error"

    default_detail: str = "Внутренняя ошибка сервера"

    headers: dict[str, str] | None = None

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.default_detail
        super().__init__(self.detail)


class LoginAlreadyExistsError(AppError):
    """Пользователь с таким login уже существует."""

    status_code = 409
    code = "user_already_exists"
    default_detail = "Пользователь с таким login уже существует"


class LoginTakenError(LoginAlreadyExistsError):
    """login уже занят другим пользователем."""

    code = "login_taken"
    default_detail = "login уже занят"


class InvalidCredentialsError(AppError):
    """Неверный логин или пароль."""

    status_code = 401
    code = "invalid_credentials"
    default_detail = "Неверный логин или пароль"
    headers = {"WWW-Authenticate": "Bearer"}


class InvalidTokenError(AppError):
    """JWT-токен отсутствует, невалиден, просрочен или принадлежит неактивному пользователю."""

    status_code = 401
    code = "invalid_token"
    default_detail = "Не удалось проверить токен"
    headers = {"WWW-Authenticate": "Bearer"}


class InactiveUserError(AppError):
    """Пользователь заблокирован (is_active = False)."""

    status_code = 403
    code = "user_inactive"
    default_detail = "Пользователь заблокирован"