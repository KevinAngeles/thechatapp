export const authentication = {
    "login": {
        "errorMessages": {
            "userId": {
                "invalid": "Invalid user id",
            },
            "password": {
                "invalid": "Password must contain at least 8 characters, including letters and numbers",
            },
            "general": {
                "credentials": "Invalid credentials",
                "internal": "Login: Internal server error",
            }
        },
        "successMessages": {
            "login": "Login successful",
        }
    },
    "registration": {
        "errorMessages": {
            "userId": {
                "invalid": "Invalid user id",
                "exist": "User id already exists",
            },
            "password": {
                "invalid": "Password must contain at least 8 characters, including letters and numbers"
            },
            "nickname": {
                "invalid": "Nickname must contain at least 3 alphanumeric characters without spaces",
                "exist": "Nickname already exists",
            },
            "general": {
                "invalid": "There was an error with the registration data",
                "internal": "Register: Internal server error"
            }
        },
        "successMessages": {
            "register": "Register successful",
        }
    },
    "accessToken": {
        "errorMessages": {
            "internal": "Access Token: Internal server error",
            "invalid": "Access Token: Invalid token"
        }
    },
    "refreshToken": {
        "errorMessages": {
            "internal": "Refresh Token: Internal server error",
            "invalid": "Refresh Token: Invalid token",
            "notoken": "Refresh Token: No token provided"
        }
    },
    "logout": {
        "errorMessages": {
            "internal": "Logout: Internal server error",
            "invalid": "Logout: Invalid token"
        }
    }
}