import PocketBase from 'pocketbase'

const PB_URL = import.meta.env.DEV
  ? 'http://localhost:8090'
  : 'https://portal.diplomadosassii.site'

export const pb = new PocketBase(PB_URL)

pb.autoCancellation(false)
