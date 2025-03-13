import Datastore from 'nedb-promises'

export const users = new Datastore({filename:"users.db",autoload:true})

export const publicKeyCredentials = new Datastore({filename:"publicKeyCredentials.db",autoload:true})