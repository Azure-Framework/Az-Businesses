Config = {}

Config.Debug = true

-- Single KVP blob where all dynamic businesses are stored as JSON
Config.KvpKey = "azbiz:all"

-- Command for creating a player business at current XYZH
Config.BizCreation = {
    Enabled       = true,
    Command       = "biz",           -- /biz
    Cost          = 250000,          -- cash price
    DefaultType   = "custom",
    LabelTemplate = "%s's Business" -- %s = character full name
}

-- Blip + marker visual settings
Config.DrawDistance     = 25.0
Config.InteractDistance = 2.0

Config.Blips = {
    DefaultSprite = 605, -- store
    DefaultColor  = 5,
    DefaultScale  = 0.8
}

-- Preconfigured, purchasable business slots
Config.BusinessSlots = {
    larry_rv = {
        id       = "larry_rv",
        label    = "Larry's RV & Performance",
        type     = "autos",
        buyPrice = 500000,

        coords   = vector4(1215.23, 2728.45, 38.0, 180.0),

        blip = {
            sprite = 225,
            color  = 1,
            scale  = 0.9
        }
    }
}
