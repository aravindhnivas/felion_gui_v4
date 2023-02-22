import { create_logger_store } from '$src/Pages/settings/utils/stores'

export const statusReport = create_logger_store([])
export const showlogs = writable(false)
