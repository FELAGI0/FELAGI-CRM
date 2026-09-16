class AppError(Exception):
    status_code = 500

    def __init__(self, detail: str, code: str | None = None) -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class AuthenticationError(AppError):
    status_code = 401


class AuthorizationError(AppError):
    status_code = 403


class ValidationError(AppError):
    status_code = 422
