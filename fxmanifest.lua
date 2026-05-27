fx_version 'cerulean'
game 'gta5'

name 'Az-Businesses'
author 'MadebyAzure'
description 'Player-owned businesses with Az-Framework integration'
version '1.0.0'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js'
}

shared_script 'config.lua'

client_scripts {
    'client.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server.lua'
}
