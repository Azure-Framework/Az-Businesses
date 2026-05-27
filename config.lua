Config = {}

Config.Debug = true


Config.KvpKey = "azbiz:all"


Config.BizCreation = {
    Enabled       = true,
    Command       = "biz",           
    Cost          = 250000,          
    DefaultType   = "custom",
    LabelTemplate = "%s's Business" 
}


Config.DrawDistance     = 25.0
Config.InteractDistance = 2.0

Config.Blips = {
    DefaultSprite = 605, 
    DefaultColor  = 5,
    DefaultScale  = 0.8
}


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
