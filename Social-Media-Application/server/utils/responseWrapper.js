export const success = (statusCode, result) => {
    return {
        status: 'ok',
        statusCode,
        result
    }
}

export const error = (statusCode, message) => {
    return {
        status: 'error',
        statusCode,
        message
    }
}