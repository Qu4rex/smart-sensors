from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User


class UserCRUD:
    """Операции с пользователями в базе данных."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session


    async def get_by_id(self, user_id: int) -> User | None:
        """Получить пользователя по id."""

        return await self.session.get(User, user_id)


    async def get_by_login(self, login: str) -> User | None:
        """Получить пользователя по login."""

        result = await self.session.execute(select(User).where(User.login == login))
        return result.scalar_one_or_none()


    async def create(self, *, login: str, hashed_password: str) -> User:
        """Создать нового пользователя в базе данных."""

        new_user = User(login=login, hashed_password=hashed_password)
        self.session.add(new_user)
        await self.session.flush()
        await self.session.refresh(new_user)
        return new_user
    
    
    async def update_profile(
        self,
        user: User,
        *,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> User:
        """Обновляет переданные поля профиля пользователя."""

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        await self.session.flush()
        await self.session.refresh(user)
        return user