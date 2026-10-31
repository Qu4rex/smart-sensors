from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from src.api.deps import AuthServiceDep, CurrentUserDep, TokenPayloadDep
from src.schemas.token import Token
from src.schemas.user import LoginRequest, UserCreate, UserRead

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, service: AuthServiceDep):
    """Создаёт нового пользователя."""

    return await service.register_user(data)


@router.post("/login", response_model=Token)
async def login(data: LoginRequest, service: AuthServiceDep):
    """Вход по логину и паролю (JSON). remember=true выдаёт токен на 30 дней."""

    user = await service.authenticate_user(data.login, data.password)
    return service.create_access_token_for_user(user, remember=data.remember)


@router.post("/token", response_model=Token)
async def login_form(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], service: AuthServiceDep
):
    """Вход через форму (OAuth2). Нужен для кнопки Authorize в Swagger, фронтенд шлёт /login."""

    user = await service.authenticate_user(form.login, form.password)
    return service.create_access_token_for_user(user)


@router.get("/me", response_model=UserRead)
async def read_me(current_user: CurrentUserDep):
    """Возвращает данные пользователя, которому принадлежит токен."""

    return current_user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: TokenPayloadDep, service: AuthServiceDep):
    """Отзывает текущий токен: после выхода он больше не принимается сервером."""

    await service.logout(payload)